# Documentação de Arquitetura LangChain

## Visão Geral

Este projeto constrói um sistema inteligente de assistente AI Node-RED baseado no framework LangChain.js, adotando um design de arquitetura modular que suporta funcionalidades de conversação inteligente multi-idioma, multi-cenário e multi-ferramenta. O sistema fornece suporte profissional para desenvolvimento Node-RED através de detecção de palavras-chave no frontend, chamadas de ferramentas no backend e processamento de resposta em streaming.

## Diagrama de Arquitetura Geral

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Serviços      │
│       UI        │    │   Processamento  │    │   Externos      │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Entrada     │ │    │ │ Rotas HTTP   │ │    │ │ Provedores  │ │
│ │ Usuário     │ │    │ └──────────────┘ │    │ │ LLM         │ │
│ └─────────────┘ │    │        │         │    │ │ (OpenAI,etc)│ │
│        │        │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ Detecção    │ │    │ │ Manager      │ │    │ │ Servidor    │ │
│ │ Palavras-   │ │    │ └──────────────┘ │    │ │ Ferramentas │ │
│ │ chave       │ │    │        │         │    │ │ MCP         │ │
│ └─────────────┘ │    │        │         │    │ └─────────────┘ │
│        │        │    │        │         │    │                 │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ Construção  │ │────┼────────┼─────────┼────┤                 │
│ │ Mensagens   │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Gerenciador  │ │    │                 │
│ │ Processamento│ │    │ │ Ferramentas  │ │    │                 │
│ │ Resposta    │ │    │ └──────────────┘ │    │                 │
│ │ Streaming   │ │    │        │         │    │                 │
│ └─────────────┘ │    │ ┌──────────────┐ │    │                 │
└─────────────────┘    │ │ Gerenciador  │ │    │                 │
                       │ │ Memória      │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Visão Geral do Processo End-to-End

### Diagrama de Fluxo do Processo

```
Entrada de Texto do Usuário
     │
     ▼
Detecção Palavras-chave Frontend ──────┐
     │                                  │
     ▼                                  ▼
Construção Prompt Humano Oculto        Obter Configuração Cenário
     │                                  │
     ▼                                  │
Envio Solicitação HTTP ◄───────────────┘
     │
     ▼
Gerenciador LangChain
     │
     ▼
Detecção Trigger Ferramentas ──────┐
     │                              │
     ▼                              ▼
Seleção Modo Execução              Determinação Tipo Ferramenta
     │                              │
     ├──────────────────────────────┼─── Ferramentas Integradas
     │                              │
     │                              └─── Ferramentas MCP
     ▼
Execução Ferramentas e Fusão Resultados
     │
     ▼
Composição Novo Prompt Humano
     │
     ▼
Chamada LLM (Idioma Especificado)
     │
     ▼
Retorno Resposta Streaming
```

## Detalhes dos Componentes Principais

### 1. Sistema de Detecção de Palavras-chave Frontend

#### Fonte de Configuração
O frontend obtém a configuração de palavras-chave através da seguinte API:
```javascript
// Obter configuração de cenário para o idioma atual
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### Lógica de Detecção
Localizada na função `detectKeywords` em `ai-sidebar.html`:

```javascript
async function detectKeywords(message) {
    // 1. Obter configuração de idioma atual
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. Iterar todas as configurações de palavras-chave de cenários
    const scenarios = data.scenarios || data;
    const lowerMessage = message.toLowerCase();
    
    for (const [scenarioKey, scenarioConfig] of Object.entries(scenarios)) {
        if (scenarioConfig.keywords) {
            for (const keywordConfig of scenarioConfig.keywords) {
                for (const keyword of keywordConfig.key) {
                    if (lowerMessage.includes(keyword.toLowerCase())) {
                        return {
                            scenario: keywordConfig.scenario,
                            newHumanPrompt: keywordConfig.newHumanPrompt,
                            matchedKeyword: keyword
                        };
                    }
                }
            }
        }
    }
    return null;
}
```

#### Tratamento de Palavras-chave Especiais
O sistema realiza tratamento especial para palavras-chave específicas:

1. **"current flow" / "fluxo atual"**:
   - Muda automaticamente para o cenário `development`
   - Constrói prompt para chamar ferramenta `get-flow`
   - Passa o ID do fluxo atualmente selecionado

2. **"current node" / "nó atual"**:
   - Muda automaticamente para o cenário `development`
   - Constrói prompt para chamar ferramenta `get-node-info`
   - Passa informações detalhadas do nó selecionado

### 2. Gerenciador LangChain (`lib/langchain-manager.js`)

#### Responsabilidades Principais
- Gerenciamento de provedores LLM (OpenAI, DeepSeek, Anthropic, Google)
- Coordenação de chamadas de ferramentas
- Gerenciamento de cenários
- Processamento de resposta streaming
- Integração de gerenciamento de memória

#### Métodos Principais

```javascript
class LangChainManager {
    constructor() {
        this.memoryManager = null;
        this.mcpClient = null;
        this.llmInstances = new Map();
        this.tools = new Map();
        this.scenarios = {};
        this.agents = new Map();
        this.language = 'zh-CN';
    }
    
    // Detecção de triggers de ferramentas
    detectToolTrigger(message)
    
    // Determinação de modo forçado de ferramentas
    shouldForceToolMode(message, scenario, dynamicData)
    
    // Chat streaming LLM puro
    executePureLLMChatStream(message, options, onChunk)
    
    // Chat streaming baseado em cenários
    executeScenarioChatStream(message, options, onChunk)
}
```

#### Mecanismo de Detecção de Triggers de Ferramentas

1. **Formato de chamada direta de ferramentas**:
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **Trigger por palavras-chave**:
   - Detecção através do método `shouldForceToolMode`
   - Baseado em mapeamento de palavras-chave de configuração multi-idioma
   - Suporte para extração de parâmetros e inferência de ferramentas

### 3. Sistema de Gerenciamento de Ferramentas

#### Classificação de Ferramentas

**Ferramentas Integradas**:
- `search_memory`: Busca em memória
- `get_user_preferences`: Obter preferências do usuário
- `get_flow_templates`: Obter modelos de fluxo
- `get-flow`: Obter dados de fluxo Node-RED (acesso direto a `global.RED`)
- `get-node-info`: Obter informações de nó Node-RED (acesso direto a `global.RED`)

**Ferramentas MCP**:
- `get-settings`: Obter configuração Node-RED
- `get-diagnostics`: Obter informações de diagnóstico
- Outras ferramentas fornecidas através do protocolo MCP

#### Lógica de Seleção de Ferramentas

```javascript
// Execução direta de ferramentas especiais
if (toolName === 'get-node-info') {
    // Uso direto de API Node-RED
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // Construção de parâmetros MCP
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // Outras ferramentas usam parâmetros fornecidos
    mcpArgs = toolTrigger.args;
}
```

### 4. Sistema de Gerenciamento de Memória (`lib/memory-manager.js`)

#### Estrutura do Banco de Dados

```sql
-- Memória de curto prazo (histórico de sessão)
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Memória de longo prazo (preferências do usuário, base de conhecimento)
CREATE TABLE long_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Mecanismo de Recuperação de Memória
- Recuperação de contexto baseada em ID de sessão
- Busca por similaridade semântica
- Limpeza automática por expiração

### 5. Sistema de Suporte Multi-idioma

#### Estrutura de Configuração
Os arquivos de configuração de cenários estão localizados em `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "development": {
      "name": "Desenvolvimento",
      "description": "Desenvolvimento e depuração de fluxos Node-RED",
      "systemPrompt": "Você é um assistente profissional de desenvolvimento Node-RED...",
      "keywords": [
        {
          "key": ["current config", "configuração atual"],
          "scenario": "development",
          "newHumanPrompt": "Use a ferramenta get-settings para obter as informações de configuração atual do Node-RED, depois analise o estado da configuração.\n\nSolicitação original do usuário: "
        }
      ]
    }
  }
}
```

#### Mecanismo de Especificação de Idioma
Após a execução de ferramentas, o sistema especifica o idioma de resposta do LLM da seguinte forma:

```javascript
const explanationPrompt = `Por favor responda à pergunta do usuário com base nas seguintes informações:

Solicitação do usuário: ${userMessage}

Resultado da execução da ferramenta:
${result}

Por favor forneça análise e explicação profissional em ${this.getLanguageMapping(this.language)} sobre os dados de fluxo Node-RED acima...`;
```

Tabela de mapeamento de idiomas:
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': 'chinês',
        'en-US': 'inglês',
        'ja': 'japonês',
        'ko': 'coreano',
        'es-ES': 'espanhol',
        'pt-BR': 'português',
        'fr': 'francês'
    };
    return mapping[lang] || 'inglês';
}
```

## Detalhes do Fluxo de Chat do Usuário

### Processo End-to-End Completo

#### 1. Etapa de Envio de Mensagem Frontend

**Processamento de Entrada do Usuário**:
- Usuário insere mensagem na barra lateral AI
- Sistema obtém informações de fluxo e nó atualmente selecionados
- Verifica estado do nó de configuração e estado de implantação

**Detecção de Palavras-chave e Pré-processamento de Mensagem**:
```javascript
// Tratamento de palavras-chave especiais
if (sendMessage.includes('current flow') || sendMessage.includes('fluxo atual')) {
    // Mudança automática para cenário de desenvolvimento
    currentScenario = 'development';
    
    // Construção de prompt para chamada de ferramenta get-flow
    const promptTemplate = "Use a ferramenta get-flow para obter os dados do fluxo com parâmetros:{\"id\":\"{flowId}\"}, depois analise e explique a funcionalidade, conexões de nós e princípios de operação deste fluxo.\n\nSolicitação original do usuário: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// Detecção geral de palavras-chave
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. Composição de Solicitação HTTP

```javascript
const requestBody = {
    message: sendMessage,
    scenario: currentScenario,
    sessionId: sessionId,
    nodeId: nodeId,
    selectedFlow: selectedFlow,
    selectedNodes: selectedNodes,
    flowData: flowData,
    history: history,
    silent: silent,
    dynamicData: dynamicData,
    language: getCurrentLanguage()
};
```

#### 3. Processamento de Rota Backend

**Recepção de Solicitação** (`make-iot-smart.js`):
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // Configuração de cabeçalhos de resposta SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**Obtenção de Nó de Configuração**:
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'Não foi possível encontrar o nó de configuração' });
}
```

**Preparação de Idioma e Dados**:
```javascript
if (language) {
    langchainManager.setLanguage(language);
}

const options = {
    scenario: scenario || 'general',
    sessionId: sessionId || 'default',
    config: configNode.config || {},
    selectedFlow,
    selectedNodes,
    flowData,
    history: history || [],
    dynamicData: dynamicData || {}
};
```

#### 4. Etapa de Processamento do Gerenciador LangChain

**Detecção de Cenário**:
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Determinação de Chamada de Ferramentas**:

1. **Detecção de Trigger Direto de Ferramentas**:
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // Execução direta de ferramenta
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **Modo Forçado de Ferramentas por Palavras-chave**:
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // Entrada em modo de chamada de ferramentas
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

#### 5. Seleção de Modo de Execução

**Modo LLM Puro**:
- Obter contexto de sessão
- Construir prompt de cenário
- Chamada direta ao LLM para gerar resposta

**Modo de Chamada de Ferramentas**:
- Determinar tipo de ferramenta (integrada vs MCP)
- Executar chamada de ferramenta
- Fundir resultados de ferramenta
- Construir prompt de explicação
- Chamar LLM para explicação em linguagem natural

#### 6. Etapa de Execução de Chamada de Ferramentas

**Tipos de Ferramentas Disponíveis**:

1. **Ferramentas Integradas**:
   - `get-flow`: Acesso direto a `global.RED.nodes.getFlows()`
   - `get-node-info`: Acesso direto a `global.RED.nodes`
   - `search_memory`: Busca em memória
   - `get_user_preferences`: Preferências do usuário

2. **Ferramentas MCP**:
   - `get-settings`: Configuração Node-RED
   - `get-diagnostics`: Informações de diagnóstico
   - Outras ferramentas de extensão

**Fluxo de Execução de Ferramentas**:
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // Ferramenta integrada: execução direta
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // Ferramenta MCP: execução através de cliente MCP
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // Envio de resultado de ferramenta
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // Construção de prompt de explicação
    const explanationPrompt = `Por favor responda à pergunta do usuário com base nas seguintes informações:\n\nSolicitação do usuário: ${userMessage}\n\nResultado da execução da ferramenta:\n${result}\n\nPor favor forneça análise e explicação profissional em ${this.getLanguageMapping(this.language)} sobre os dados de fluxo Node-RED acima...`;
    
    // Chamada ao LLM para explicação
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**Tratamento de Ferramentas Especiais**:

1. **Ferramenta get-flow**:
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **Ferramentas get-settings e get-diagnostics**:
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // Sem parâmetros necessários
}
```

#### 7. Etapa de Processamento de Resposta Streaming

**Tipos de Eventos**:
- `token`: Fragmento de conteúdo de texto
- `tool_call`: Informações de chamada de ferramenta
- `tool_result`: Resultado de execução de ferramenta
- `error`: Informações de erro
- `done`: Resposta completada

**Fluxo de Dados**:
```javascript
// Envio backend
onChunk({ type: 'token', content: 'Conteúdo de resposta parcial' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// Recepção frontend
eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'token':
            appendToCurrentMessage(data.content);
            break;
        case 'tool_call':
            showToolCall(data.tool, data.params);
            break;
        case 'tool_result':
            showToolResult(data.tool, data.result);
            break;
        case 'done':
            finalizeMessage();
            break;
    }
};
```

**Processamento Streaming Frontend**:
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // Rolar para baixo
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. Gerenciamento de Memória

**Salvamento de Conversa**:
```javascript
// Salvar mensagem do usuário
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// Salvar resposta AI
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**Gerenciamento de Contexto de Sessão**:
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**Busca em Memória**:
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. Tratamento de Erros e Tolerância a Falhas

**Erros de Autenticação API**:
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'Chave API inválida. Por favor verifique a configuração' });
    }
}
```

**Erros de Rede**:
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `Falha na chamada de ferramenta: ${error.message}` });
    // Fallback para modo LLM puro
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Erros de Chamada de Ferramentas**:
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `Falha na execução da ferramenta ${toolName}: ${result?.error || 'Erro desconhecido'}` 
    });
    return;
}
```

#### 10. Otimização de Performance

**Mecanismo de Cache**:
```javascript
// Cache de instâncias LLM
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // Criar e cachear nova instância
}
```

**Processamento Streaming**:
```javascript
// Usar API streaming para reduzir latência
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**Processamento Assíncrono**:
```javascript
// Processamento paralelo de múltiplas chamadas de ferramentas
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. Suporte Multi-idioma

**Configuração de Cenários**:
- Cada idioma tem seu arquivo de configuração `scenarios.json` independente
- Suporte para palavras-chave e prompts específicos por idioma
- Detecção e mudança automática de idioma

**Localização de Interface**:
```javascript
// Obter texto localizado
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. Considerações de Segurança

**Validação de Entrada**:
```javascript
// Limite de comprimento de mensagem
if (message.length > 10000) {
    return res.status(400).json({ error: 'Mensagem muito longa' });
}

// Filtragem de informações sensíveis
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[EDITADO]');
```

**Proteção de Chaves API**:
```javascript
// Armazenamento de chaves criptografadas no nó de configuração
const encryptedKey = RED.util.encryptCredentials(apiKey);

// Descriptografia em tempo de execução
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**Controle de Acesso**:
```javascript
// Verificação de permissões do usuário
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: 'Permissões insuficientes' });
}
```

### Resumo

Todo o processo end-to-end implementa um pipeline completo desde a entrada do usuário até a resposta AI, fornecendo suporte inteligente para desenvolvimento Node-RED através de detecção de palavras-chave no frontend, chamadas de ferramentas no backend e processamento de resposta streaming. Características do sistema:

1. **Inteligência**: Detecção automática de intenção do usuário, seleção apropriada de ferramentas e cenários
2. **Multi-idioma**: Suporte para detecção de palavras-chave e geração de resposta em múltiplos idiomas
3. **Escalabilidade**: Design modular, fácil adição de novas ferramentas e cenários
4. **Alto Desempenho**: Processamento streaming, mecanismos de cache, execução assíncrona
5. **Segurança**: Validação de entrada, proteção de chaves, controle de permissões
6. **Amigável ao Usuário**: Respostas em tempo real, tratamento de erros, reconhecimento de contexto

## Documentação de Interface API

### Endpoints API RESTful

```
POST /ai-sidebar/stream-chat       # Chat streaming
GET  /ai-sidebar/scenarios         # Obter configuração de cenários
POST /ai-sidebar/execute-tool      # Executar ferramenta
GET  /ai-sidebar/memory-stats      # Estatísticas de memória
GET  /ai-sidebar/history/:sessionId # Histórico de sessão
POST /ai-sidebar/search            # Busca em memória
GET  /ai-sidebar/templates         # Modelos de fluxo
```

### Formatos de Solicitação/Resposta

**Solicitação de Chat Streaming**:
```json
{
  "message": "Mensagem do usuário",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "Nome do fluxo"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "Nome do nó"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "pt-BR"
}
```

**Formato de Resposta Streaming**:
```
data: {"type": "token", "content": "Resposta"}
data: {"type": "token", "content": "parcial"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## Gerenciamento de Configuração

### Variáveis de Ambiente

```bash
# Configuração de provedores AI
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# Configuração de banco de dados
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# Configuração MCP
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Nó de Configuração Node-RED

```javascript
{
  "provider": "openai",
  "model": "gpt-4",
  "apiKey": "encrypted_key",
  "temperature": 0.7,
  "maxTokens": 4000,
  "enableMemory": true,
  "enableTools": true,
  "scenarios": ["learning", "solution", "development"]
}
```

## Desenvolvimento de Extensões

### Adicionar Novo Provedor LLM

```javascript
// Adicionar em langchain-manager.js
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### Adicionar Nova Ferramenta Integrada

```javascript
// Adicionar no método initializeTools
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "Descrição da ferramenta personalizada",
    func: async (input) => {
        // Lógica de implementação da ferramenta
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### Adicionar Nova Configuração de Cenário

Adicionar em `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "Cenário Personalizado",
      "description": "Descrição do cenário",
      "systemPrompt": "Você é um profissional...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "Por favor use a ferramenta...\n\nSolicitação original do usuário: "
        }
      ]
    }
  }
}
```

## Solução de Problemas

### Problemas Comuns

1. **Falha na Chamada de Ferramentas**
   - Verificar estado do servidor MCP
   - Validar formato de parâmetros da ferramenta
   - Revisar logs de erro

2. **Detecção de Palavras-chave Não Funciona**
   - Confirmar existência do arquivo de configuração de cenário
   - Verificar sensibilidade a maiúsculas/minúsculas das palavras-chave
   - Confirmar configuração de idioma

3. **Interrupção de Resposta Streaming**
   - Verificar conexão de rede
   - Validar chave API
   - Revisar erros no console do navegador

### Modo de Depuração

```bash
# Habilitar logging detalhado
DEBUG=langchain:*,mcp:* node-red

# Habilitar logging de chamadas de ferramentas
TOOL_DEBUG=true node-red
```

## Recomendações de Otimização de Performance

1. **Estratégias de Cache**
   - Cache de instâncias LLM
   - Cache de configuração de cenários
   - Cache de resultados de ferramentas

2. **Controle de Concorrência**
   - Limitar número de conversas simultâneas
   - Gerenciamento de fila de chamadas de ferramentas
   - Monitoramento de uso de recursos

3. **Gerenciamento de Memória**
   - Limpeza periódica de sessões expiradas
   - Limitação de comprimento de registros de histórico
   - Monitoramento de uso de memória

---

*Esta documentação é baseada na implementação de código real e é mantida continuamente atualizada com as atualizações do projeto*