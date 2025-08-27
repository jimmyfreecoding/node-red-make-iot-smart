# Documentación de Arquitectura LangChain

## Resumen

Este proyecto construye un sistema inteligente de asistente AI Node-RED basado en el framework LangChain.js, adoptando un diseño de arquitectura modular que soporta funcionalidades de conversación inteligente multiidioma, multiescenario y multiherramienta. El sistema proporciona soporte profesional para el desarrollo de Node-RED a través de detección de palabras clave en el frontend, llamadas a herramientas en el backend y procesamiento de respuestas en streaming.

## Diagrama de Arquitectura General

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Servicios     │
│       UI        │    │   Procesamiento  │    │   Externos      │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Entrada     │ │    │ │ Rutas HTTP   │ │    │ │ Proveedores │ │
│ │ Usuario     │ │    │ └──────────────┘ │    │ │ LLM         │ │
│ └─────────────┘ │    │        │         │    │ │ (OpenAI,etc)│ │
│        │        │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ Detección   │ │    │ │ Manager      │ │    │ │ Servidor    │ │
│ │ Palabras    │ │    │ └──────────────┘ │    │ │ Herramientas│ │
│ │ Clave       │ │    │        │         │    │ │ MCP         │ │
│ └─────────────┘ │    │        │         │    │ └─────────────┘ │
│        │        │    │        │         │    │                 │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ Construcción│ │────┼────────┼─────────┼────┤                 │
│ │ Mensajes    │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Gestor       │ │    │                 │
│ │ Procesamiento│ │    │ │ Herramientas │ │    │                 │
│ │ Respuesta   │ │    │ └──────────────┘ │    │                 │
│ │ Streaming   │ │    │        │         │    │                 │
│ └─────────────┘ │    │ ┌──────────────┐ │    │                 │
└─────────────────┘    │ │ Gestor       │ │    │                 │
                       │ │ Memoria      │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Resumen del Proceso End-to-End

### Diagrama de Flujo del Proceso

```
Entrada de Texto del Usuario
     │
     ▼
Detección Palabras Clave Frontend ──────┐
     │                                   │
     ▼                                   ▼
Construcción Prompt Humano Oculto       Obtener Configuración Escenario
     │                                   │
     ▼                                   │
Envío Solicitud HTTP ◄──────────────────┘
     │
     ▼
Gestor LangChain
     │
     ▼
Detección Trigger Herramientas ──────┐
     │                                │
     ▼                                ▼
Selección Modo Ejecución             Determinación Tipo Herramienta
     │                                │
     ├────────────────────────────────┼─── Herramientas Integradas
     │                                │
     │                                └─── Herramientas MCP
     ▼
Ejecución Herramientas y Fusión Resultados
     │
     ▼
Composición Nuevo Prompt Humano
     │
     ▼
Llamada LLM (Idioma Especificado)
     │
     ▼
Retorno Respuesta Streaming
```

## Detalles de Componentes Principales

### 1. Sistema de Detección de Palabras Clave Frontend

#### Fuente de Configuración
El frontend obtiene la configuración de palabras clave a través de la siguiente API:
```javascript
// Obtener configuración de escenario para el idioma actual
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### Lógica de Detección
Ubicada en la función `detectKeywords` en `ai-sidebar.html`:

```javascript
async function detectKeywords(message) {
    // 1. Obtener configuración de idioma actual
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. Iterar todas las configuraciones de palabras clave de escenarios
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

#### Manejo de Palabras Clave Especiales
El sistema realiza manejo especial para palabras clave específicas:

1. **"current flow" / "flujo actual"**:
   - Cambia automáticamente al escenario `development`
   - Construye prompt para llamar herramienta `get-flow`
   - Pasa el ID del flujo actualmente seleccionado

2. **"current node" / "nodo actual"**:
   - Cambia automáticamente al escenario `development`
   - Construye prompt para llamar herramienta `get-node-info`
   - Pasa información detallada del nodo seleccionado

### 2. Gestor LangChain (`lib/langchain-manager.js`)

#### Responsabilidades Principales
- Gestión de proveedores LLM (OpenAI, DeepSeek, Anthropic, Google)
- Coordinación de llamadas a herramientas
- Gestión de escenarios
- Procesamiento de respuestas streaming
- Integración de gestión de memoria

#### Métodos Principales

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
    
    // Detección de triggers de herramientas
    detectToolTrigger(message)
    
    // Determinación de modo forzado de herramientas
    shouldForceToolMode(message, scenario, dynamicData)
    
    // Chat streaming LLM puro
    executePureLLMChatStream(message, options, onChunk)
    
    // Chat streaming basado en escenarios
    executeScenarioChatStream(message, options, onChunk)
}
```

#### Mecanismo de Detección de Triggers de Herramientas

1. **Formato de llamada directa a herramientas**:
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **Trigger por palabras clave**:
   - Detección a través del método `shouldForceToolMode`
   - Basado en mapeo de palabras clave de configuración multiidioma
   - Soporte para extracción de parámetros e inferencia de herramientas

### 3. Sistema de Gestión de Herramientas

#### Clasificación de Herramientas

**Herramientas Integradas**:
- `search_memory`: Búsqueda en memoria
- `get_user_preferences`: Obtener preferencias de usuario
- `get_flow_templates`: Obtener plantillas de flujo
- `get-flow`: Obtener datos de flujo Node-RED (acceso directo a `global.RED`)
- `get-node-info`: Obtener información de nodo Node-RED (acceso directo a `global.RED`)

**Herramientas MCP**:
- `get-settings`: Obtener configuración Node-RED
- `get-diagnostics`: Obtener información de diagnóstico
- Otras herramientas proporcionadas a través del protocolo MCP

#### Lógica de Selección de Herramientas

```javascript
// Ejecución directa de herramientas especiales
if (toolName === 'get-node-info') {
    // Uso directo de API Node-RED
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // Construcción de parámetros MCP
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // Otras herramientas usan parámetros proporcionados
    mcpArgs = toolTrigger.args;
}
```

### 4. Sistema de Gestión de Memoria (`lib/memory-manager.js`)

#### Estructura de Base de Datos

```sql
-- Memoria a corto plazo (historial de sesión)
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Memoria a largo plazo (preferencias de usuario, base de conocimiento)
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

#### Mecanismo de Recuperación de Memoria
- Recuperación de contexto basada en ID de sesión
- Búsqueda por similitud semántica
- Limpieza automática por expiración

### 5. Sistema de Soporte Multiidioma

#### Estructura de Configuración
Los archivos de configuración de escenarios se ubican en `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "development": {
      "name": "Desarrollo",
      "description": "Desarrollo y depuración de flujos Node-RED",
      "systemPrompt": "Eres un asistente profesional de desarrollo Node-RED...",
      "keywords": [
        {
          "key": ["current config", "configuración actual"],
          "scenario": "development",
          "newHumanPrompt": "Usa la herramienta get-settings para obtener la información de configuración actual de Node-RED, luego analiza el estado de la configuración.\n\nSolicitud original del usuario: "
        }
      ]
    }
  }
}
```

#### Mecanismo de Especificación de Idioma
Después de la ejecución de herramientas, el sistema especifica el idioma de respuesta del LLM de la siguiente manera:

```javascript
const explanationPrompt = `Por favor responde a la pregunta del usuario basándote en la siguiente información:

Solicitud del usuario: ${userMessage}

Resultado de ejecución de herramienta:
${result}

Por favor proporciona análisis y explicación profesional en ${this.getLanguageMapping(this.language)} sobre los datos de flujo Node-RED anteriores...`;
```

Tabla de mapeo de idiomas:
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': 'chino',
        'en-US': 'inglés',
        'ja': 'japonés',
        'ko': 'coreano',
        'es-ES': 'español',
        'pt-BR': 'portugués',
        'fr': 'francés'
    };
    return mapping[lang] || 'inglés';
}
```

## Detalles del Flujo de Chat del Usuario

### Proceso End-to-End Completo

#### 1. Etapa de Envío de Mensaje Frontend

**Procesamiento de Entrada del Usuario**:
- Usuario ingresa mensaje en la barra lateral AI
- Sistema obtiene información de flujo y nodo actualmente seleccionados
- Verifica estado del nodo de configuración y estado de despliegue

**Detección de Palabras Clave y Preprocesamiento de Mensaje**:
```javascript
// Manejo de palabras clave especiales
if (sendMessage.includes('current flow') || sendMessage.includes('flujo actual')) {
    // Cambio automático a escenario de desarrollo
    currentScenario = 'development';
    
    // Construcción de prompt para llamada a herramienta get-flow
    const promptTemplate = "Usa la herramienta get-flow para obtener los datos del flujo con parámetros:{\"id\":\"{flowId}\"}, luego analiza y explica la funcionalidad, conexiones de nodos y principios de operación de este flujo.\n\nSolicitud original del usuario: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// Detección general de palabras clave
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. Composición de Solicitud HTTP

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

#### 3. Procesamiento de Ruta Backend

**Recepción de Solicitud** (`make-iot-smart.js`):
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // Configuración de headers de respuesta SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**Obtención de Nodo de Configuración**:
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'No se pudo encontrar el nodo de configuración' });
}
```

**Preparación de Idioma y Datos**:
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

#### 4. Etapa de Procesamiento del Gestor LangChain

**Detección de Escenario**:
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Determinación de Llamada a Herramientas**:

1. **Detección de Trigger Directo de Herramientas**:
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // Ejecución directa de herramienta
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **Modo Forzado de Herramientas por Palabras Clave**:
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // Entrada a modo de llamada a herramientas
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

#### 5. Selección de Modo de Ejecución

**Modo LLM Puro**:
- Obtener contexto de sesión
- Construir prompt de escenario
- Llamada directa a LLM para generar respuesta

**Modo de Llamada a Herramientas**:
- Determinar tipo de herramienta (integrada vs MCP)
- Ejecutar llamada a herramienta
- Fusionar resultados de herramienta
- Construir prompt de explicación
- Llamar LLM para explicación en lenguaje natural

#### 6. Etapa de Ejecución de Llamada a Herramientas

**Tipos de Herramientas Disponibles**:

1. **Herramientas Integradas**:
   - `get-flow`: Acceso directo a `global.RED.nodes.getFlows()`
   - `get-node-info`: Acceso directo a `global.RED.nodes`
   - `search_memory`: Búsqueda en memoria
   - `get_user_preferences`: Preferencias de usuario

2. **Herramientas MCP**:
   - `get-settings`: Configuración Node-RED
   - `get-diagnostics`: Información de diagnóstico
   - Otras herramientas de extensión

**Flujo de Ejecución de Herramientas**:
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // Herramienta integrada: ejecución directa
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // Herramienta MCP: ejecución a través de cliente MCP
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // Envío de resultado de herramienta
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // Construcción de prompt de explicación
    const explanationPrompt = `Por favor responde a la pregunta del usuario basándote en la siguiente información:\n\nSolicitud del usuario: ${userMessage}\n\nResultado de ejecución de herramienta:\n${result}\n\nPor favor proporciona análisis y explicación profesional en ${this.getLanguageMapping(this.language)} sobre los datos de flujo Node-RED anteriores...`;
    
    // Llamada a LLM para explicación
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**Manejo de Herramientas Especiales**:

1. **Herramienta get-flow**:
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **Herramientas get-settings y get-diagnostics**:
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // Sin parámetros necesarios
}
```

#### 7. Etapa de Procesamiento de Respuesta Streaming

**Tipos de Eventos**:
- `token`: Fragmento de contenido de texto
- `tool_call`: Información de llamada a herramienta
- `tool_result`: Resultado de ejecución de herramienta
- `error`: Información de error
- `done`: Respuesta completada

**Flujo de Datos**:
```javascript
// Envío backend
onChunk({ type: 'token', content: 'Contenido de respuesta parcial' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// Recepción frontend
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

**Procesamiento Streaming Frontend**:
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // Desplazar hacia abajo
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. Gestión de Memoria

**Guardado de Conversación**:
```javascript
// Guardar mensaje de usuario
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// Guardar respuesta AI
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**Gestión de Contexto de Sesión**:
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**Búsqueda en Memoria**:
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. Manejo de Errores y Tolerancia a Fallos

**Errores de Autenticación API**:
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'Clave API inválida. Por favor verifica la configuración' });
    }
}
```

**Errores de Red**:
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `Fallo en llamada a herramienta: ${error.message}` });
    // Fallback a modo LLM puro
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Errores de Llamada a Herramientas**:
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `Fallo en ejecución de herramienta ${toolName}: ${result?.error || 'Error desconocido'}` 
    });
    return;
}
```

#### 10. Optimización de Rendimiento

**Mecanismo de Caché**:
```javascript
// Caché de instancias LLM
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // Crear y cachear nueva instancia
}
```

**Procesamiento Streaming**:
```javascript
// Usar API streaming para reducir latencia
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**Procesamiento Asíncrono**:
```javascript
// Procesamiento paralelo de múltiples llamadas a herramientas
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. Soporte Multiidioma

**Configuración de Escenarios**:
- Cada idioma tiene su archivo de configuración `scenarios.json` independiente
- Soporte para palabras clave y prompts específicos por idioma
- Detección y cambio automático de idioma

**Localización de Interfaz**:
```javascript
// Obtener texto localizado
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. Consideraciones de Seguridad

**Validación de Entrada**:
```javascript
// Límite de longitud de mensaje
if (message.length > 10000) {
    return res.status(400).json({ error: 'Mensaje demasiado largo' });
}

// Filtrado de información sensible
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[EDITADO]');
```

**Protección de Claves API**:
```javascript
// Almacenamiento de claves encriptadas en nodo de configuración
const encryptedKey = RED.util.encryptCredentials(apiKey);

// Desencriptación en tiempo de ejecución
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**Control de Acceso**:
```javascript
// Verificación de permisos de usuario
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: 'Permisos insuficientes' });
}
```

### Resumen

Todo el proceso end-to-end implementa un pipeline completo desde la entrada del usuario hasta la respuesta AI, proporcionando soporte inteligente para el desarrollo Node-RED a través de detección de palabras clave en frontend, llamadas a herramientas en backend y procesamiento de respuestas streaming. Características del sistema:

1. **Inteligencia**: Detección automática de intención del usuario, selección apropiada de herramientas y escenarios
2. **Multiidioma**: Soporte para detección de palabras clave y generación de respuestas en múltiples idiomas
3. **Escalabilidad**: Diseño modular, fácil adición de nuevas herramientas y escenarios
4. **Alto Rendimiento**: Procesamiento streaming, mecanismos de caché, ejecución asíncrona
5. **Seguridad**: Validación de entrada, protección de claves, control de permisos
6. **Amigable al Usuario**: Respuestas en tiempo real, manejo de errores, reconocimiento de contexto

## Documentación de Interfaz API

### Endpoints API RESTful

```
POST /ai-sidebar/stream-chat       # Chat streaming
GET  /ai-sidebar/scenarios         # Obtener configuración de escenarios
POST /ai-sidebar/execute-tool      # Ejecutar herramienta
GET  /ai-sidebar/memory-stats      # Estadísticas de memoria
GET  /ai-sidebar/history/:sessionId # Historial de sesión
POST /ai-sidebar/search            # Búsqueda en memoria
GET  /ai-sidebar/templates         # Plantillas de flujo
```

### Formatos de Solicitud/Respuesta

**Solicitud de Chat Streaming**:
```json
{
  "message": "Mensaje del usuario",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "Nombre del flujo"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "Nombre del nodo"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "es-ES"
}
```

**Formato de Respuesta Streaming**:
```
data: {"type": "token", "content": "Respuesta"}
data: {"type": "token", "content": "parcial"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## Gestión de Configuración

### Variables de Entorno

```bash
# Configuración de proveedores AI
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# Configuración de base de datos
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# Configuración MCP
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Nodo de Configuración Node-RED

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

## Desarrollo de Extensiones

### Agregar Nuevo Proveedor LLM

```javascript
// Agregar en langchain-manager.js
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### Agregar Nueva Herramienta Integrada

```javascript
// Agregar en método initializeTools
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "Descripción de herramienta personalizada",
    func: async (input) => {
        // Lógica de implementación de herramienta
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### Agregar Nueva Configuración de Escenario

Agregar en `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "Escenario Personalizado",
      "description": "Descripción del escenario",
      "systemPrompt": "Eres un profesional...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "Por favor usa la herramienta...\n\nSolicitud original del usuario: "
        }
      ]
    }
  }
}
```

## Solución de Problemas

### Problemas Comunes

1. **Fallo en Llamada a Herramientas**
   - Verificar estado del servidor MCP
   - Validar formato de parámetros de herramienta
   - Revisar logs de error

2. **Detección de Palabras Clave No Funciona**
   - Confirmar existencia de archivo de configuración de escenario
   - Verificar sensibilidad a mayúsculas/minúsculas de palabras clave
   - Confirmar configuración de idioma

3. **Interrupción de Respuesta Streaming**
   - Verificar conexión de red
   - Validar clave API
   - Revisar errores en consola del navegador

### Modo de Depuración

```bash
# Habilitar logging detallado
DEBUG=langchain:*,mcp:* node-red

# Habilitar logging de llamadas a herramientas
TOOL_DEBUG=true node-red
```

## Recomendaciones de Optimización de Rendimiento

1. **Estrategias de Caché**
   - Caché de instancias LLM
   - Caché de configuración de escenarios
   - Caché de resultados de herramientas

2. **Control de Concurrencia**
   - Limitar número de conversaciones simultáneas
   - Gestión de cola de llamadas a herramientas
   - Monitoreo de uso de recursos

3. **Gestión de Memoria**
   - Limpieza periódica de sesiones expiradas
   - Limitación de longitud de registros de historial
   - Monitoreo de uso de memoria

---

*Esta documentación está basada en la implementación de código real y se mantiene continuamente actualizada con las actualizaciones del proyecto*