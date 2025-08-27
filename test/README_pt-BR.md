# Testes End-to-End do LangChain

Este diretório contém scripts completos de testes end-to-end da arquitetura LangChain para verificar todo o processo desde a entrada do usuário no frontend até a resposta do LLM.

## 📁 Estrutura de Arquivos

```
test/
├── end-to-end-langchain-test.js    # Script principal de testes
├── run-e2e-test.js                 # Script de execução de testes
├── .env.example                    # Exemplo de configuração de ambiente
├── .env                           # Configuração real do ambiente (precisa ser criado)
├── test-results/                  # Diretório de resultados de testes
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # Este documento
```

## 🚀 Início Rápido

### 1. Configuração do Ambiente

Antes da primeira execução, você precisa configurar as variáveis de ambiente:

```bash
# Copiar o exemplo de configuração do ambiente
cp .env.example .env

# Editar o arquivo .env para realizar as configurações necessárias
# Especialmente OPENAI_API_KEY (se for testar chamadas reais ao LLM)
```

### 2. Executar Testes

```bash
# Executar testes completos end-to-end
node run-e2e-test.js

# Apenas verificar a configuração do ambiente
node run-e2e-test.js --check

# Habilitar chamadas reais ao LLM (requer chave API válida)
node run-e2e-test.js --real-llm

# Especificar porta do servidor web
node run-e2e-test.js --port 8080

# Modo de saída detalhada
node run-e2e-test.js --verbose
```

### 3. Visualizar Relatório de Testes

Após completar os testes, um servidor web será iniciado automaticamente para exibir o relatório de testes:

- URL de acesso padrão: http://localhost:3001
- Endpoint da API: http://localhost:3001/api/test-results

## 📊 Conteúdo dos Testes

### Idiomas de Teste

Os testes cobrem os seguintes 7 idiomas:
- Chinês (zh-CN)
- Inglês (en-US) 
- Japonês (ja)
- Coreano (ko)
- Espanhol (es-ES)
- Português (pt-BR)
- Francês (fr)

### Casos de Teste

Cada idioma inclui 5 casos de teste:

1. **Acionador de ferramenta get-flow** - Teste da palavra-chave "fluxo atual"
2. **Acionador de ferramenta get-node-info** - Teste da palavra-chave "nó atual"
3. **Acionador de ferramenta get-settings** - Teste da palavra-chave "configuração atual"
4. **Acionador de ferramenta get-diagnostics** - Teste da palavra-chave "diagnóstico atual"
5. **Conversa em linguagem natural** - Teste "Introduzir Node-RED" (sem acionador de ferramenta)

### Informações Importantes Registradas

Cada caso de teste registra as seguintes informações:

- **a. Texto de entrada do usuário** - Texto original simulado que o usuário inseriu na página
- **b. Palavra-chave detectada** - Palavra-chave que o LangChain recebeu e identificou
- **c. Determinação de chamada de ferramenta** - Decisão do sistema sobre chamar uma ferramenta
- **d. Tipo de ferramenta e conteúdo de retorno** - Ferramenta específica chamada e seu resultado de retorno
- **e. Prompt newHuman concatenado enviado ao LLM** - Prompt final do usuário enviado ao LLM
- **f. Prompt do sistema enviado ao LLM** - Prompt em nível do sistema
- **g. Resposta do LLM** - Resultado de resposta do modelo de linguagem grande

## 🔧 Explicação das Variáveis de Ambiente

### Configuração Obrigatória

```bash
# Chave API do OpenAI (para chamadas reais ao LLM)
OPENAI_API_KEY=your_openai_api_key_here

# Simulação do ambiente Node-RED
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### Configuração Opcional

```bash
# Configuração do provedor LLM
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# Porta do servidor web
TEST_WEB_PORT=3001

# Se habilitar chamadas reais ao LLM
ENABLE_REAL_LLM_CALLS=false

# Configuração de depuração
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 Relatório de Testes

### Relatório Web

O relatório HTML gerado após completar os testes inclui:

- **Resumo dos testes** - Informações estatísticas gerais
- **Tabelas por idioma** - Resultados detalhados de testes para cada idioma
- **Exibição de status** - Status de sucesso/falha
- **Design responsivo** - Adaptação a diferentes tamanhos de tela

### Dados JSON

Os dados de teste brutos são salvos em formato JSON e podem ser usados para:

- Análise automatizada
- Integração em pipelines CI/CD
- Geração de relatórios personalizados

## 🛠️ Arquitetura Técnica

### Processo de Teste

1. **Inicialização do ambiente** - Verificação de configuração, dependências e variáveis de ambiente
2. **Simulação do frontend** - Simulação de entrada do usuário e detecção de palavras-chave
3. **Processamento do backend** - Chamada ao LangChain Manager para processar solicitações
4. **Execução de ferramentas** - Simulação ou execução real de ferramentas relacionadas
5. **Interação com LLM** - Construção de prompts e obtenção de respostas do LLM
6. **Registro de resultados** - Salvamento de informações completas da cadeia de processamento
7. **Geração de relatórios** - Geração de relatórios web e dados JSON

### Componentes de Simulação

- **Mock Node-RED** - Simulação do ambiente de execução do Node-RED
- **Mock Tools** - Simulação de resultados de execução de ferramentas
- **Mock LLM** - Simulação opcional de respostas do LLM

## 🔍 Solução de Problemas

### Problemas Comuns

1. **Variáveis de ambiente não configuradas**
   ```bash
   # Verificar se o arquivo .env existe e está configurado corretamente
   node run-e2e-test.js --check
   ```

2. **Dependências ausentes**
   ```bash
   # Instalar dependências necessárias
   npm install express dotenv
   ```

3. **Chave API inválida**
   ```bash
   # Testar em modo simulação
   node run-e2e-test.js
   # Ou configurar ENABLE_REAL_LLM_CALLS=false
   ```

4. **Porta em uso**
   ```bash
   # Especificar outra porta
   node run-e2e-test.js --port 8080
   ```

### Modo de Depuração

```bash
# Habilitar saída detalhada
node run-e2e-test.js --verbose

# Ou configurar no .env
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 Desenvolvimento de Extensões

### Adicionar Novo Idioma

1. Adicionar código do idioma ao `TEST_CONFIG.languages`
2. Adicionar casos de teste correspondentes ao `TEST_CONFIG.testCases`
3. Verificar se existe o arquivo de configuração do idioma correspondente

### Adicionar Novo Caso de Teste

```javascript
// Adicionar aos casos de teste do idioma correspondente
{ 
    keyword: 'nova palavra-chave', 
    expectedTool: 'new-tool', 
    description: 'descrição do novo caso de teste' 
}
```

### Simulação de Ferramentas Personalizadas

Adicionar resultados de simulação de novas ferramentas ao objeto `mockToolResults` na função `executeTestCase`.

## 📄 Licença

Este script de teste segue a mesma licença do projeto principal.

## 🤝 Contribuição

Damos as boas-vindas a Issues e Pull Requests para melhorar o script de teste!

---

**Nota**: Este script de teste é baseado no design de arquitetura descrito no documento `LANGCHAIN_ARCHITECTURE.md` e garante a cobertura de testes do processo completo de interação do usuário.