# LangChain Architecture Documentation

## Overview

This project builds an intelligent Node-RED AI assistant system based on the LangChain.js framework, adopting a modular architecture design that supports multi-language, multi-scenario, and multi-tool intelligent conversation capabilities. The system provides professional Node-RED development support through frontend keyword detection, backend tool invocation, and streaming response processing.

## Overall Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend        │    │   External      │
│                 │    │   Processing     │    │   Services      │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ User Input  │ │    │ │ HTTP Routes  │ │    │ │ LLM         │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ Providers   │ │
│        │        │    │        │         │    │ │ (OpenAI etc)│ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ │ Keyword     │ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ Detection   │ │    │ │ Manager      │ │    │ │ MCP Tools   │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ Server      │ │
│        │        │    │        │         │    │ └─────────────┘ │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ Message     │ │────┼────────┼─────────┼────┤                 │
│ │ Building    │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Tool Manager │ │    │                 │
│ │ Streaming   │ │    │ └──────────────┘ │    │                 │
│ │ Response    │ │    │        │         │    │                 │
│ │ Processing  │ │    │ ┌──────────────┐ │    │                 │
│ └─────────────┘ │    │ │ Memory       │ │    │                 │
└─────────────────┘    │ │ Manager      │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## End-to-End Process Overview

### Process Flow Diagram

```
User Text Input
     │
     ▼
Frontend Keyword Detection ──────┐
     │                           │
     ▼                           ▼
Build Hidden Human Prompt    Scenario Config Fetch
     │                           │
     ▼                           │
HTTP Request Send ◄──────────────┘
     │
     ▼
LangChain Manager
     │
     ▼
Tool Trigger Detection ──────┐
     │                       │
     ▼                       ▼
Select Execution Mode    Tool Type Judgment
     │                       │
     ├───────────────────────┼─── Built-in Tools
     │                       │
     │                       └─── MCP Tools
     ▼
Tool Execution & Result Merge
     │
     ▼
New Human Prompt Construction
     │
     ▼
LLM Call (Specified Language)
     │
     ▼
Streaming Response Return
```

## Core Component Details

### 1. Frontend Keyword Detection System

#### Configuration Source
The frontend obtains keyword configuration through the following API:
```javascript
// Get scenario configuration for current language
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### Detection Logic
Located in the `detectKeywords` function in `ai-sidebar.html`:

```javascript
async function detectKeywords(message) {
    // 1. Get current language configuration
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. Iterate through all scenario keyword configurations
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

#### Special Keyword Handling
The system performs special handling for specific keywords:

1. **"current flow" / "当前流程"**:
   - Automatically switch to `development` scenario
   - Build `get-flow` tool call prompt
   - Pass currently selected flow ID

2. **"current node" / "当前节点"**:
   - Automatically switch to `development` scenario
   - Build `get-node-info` tool call prompt
   - Pass selected node detailed information

### 2. LangChain Manager (`lib/langchain-manager.js`)

#### Core Responsibilities
- LLM provider management (OpenAI, DeepSeek, Anthropic, Google)
- Tool invocation coordination
- Scenario management
- Streaming response processing
- Memory management integration

#### Main Methods

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
    
    // Tool trigger detection
    detectToolTrigger(message)
    
    // Force tool mode judgment
    shouldForceToolMode(message, scenario, dynamicData)
    
    // Pure LLM streaming chat
    executePureLLMChatStream(message, options, onChunk)
    
    // Scenario-based streaming chat
    executeScenarioChatStream(message, options, onChunk)
}
```

#### Tool Trigger Detection Mechanism

1. **Direct Tool Call Format**:
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **Keyword Triggering**:
   - Detection through `shouldForceToolMode` method
   - Based on multi-language configuration keyword mapping
   - Support parameter extraction and tool inference

### 3. Tool Management System

#### Tool Classification

**Built-in Tools**:
- `search_memory`: Memory search
- `get_user_preferences`: User preference retrieval
- `get_flow_templates`: Flow template retrieval
- `get-flow`: Node-RED flow data retrieval (direct access to `global.RED`)
- `get-node-info`: Node-RED node information retrieval (direct access to `global.RED`)

**MCP Tools**:
- `get-settings`: Node-RED settings retrieval
- `get-diagnostics`: Diagnostic information retrieval
- Other tools provided through MCP protocol

#### Tool Selection Logic

```javascript
// Special tools direct execution
if (toolName === 'get-node-info') {
    // Direct use of Node-RED API
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // Build MCP parameters
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // Other tools use provided parameters
    mcpArgs = toolTrigger.args;
}
```

### 4. Memory Management System (`lib/memory-manager.js`)

#### Database Structure

```sql
-- Short-term memory (session history)
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Long-term memory (user preferences, knowledge base)
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

#### Memory Retrieval Mechanism
- Session ID-based context retrieval
- Semantic similarity search
- Automatic expiration cleanup

### 5. Multi-language Support System

#### Configuration Structure
Scenario configuration files located at `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "development": {
      "name": "Development",
      "description": "Node-RED flow development and debugging",
      "systemPrompt": "You are a professional Node-RED development assistant...",
      "keywords": [
        {
          "key": ["current config", "当前配置"],
          "scenario": "development",
          "newHumanPrompt": "Please use the get-settings tool to retrieve current Node-RED configuration information, then analyze the configuration status.\n\nUser's original request: "
        }
      ]
    }
  }
}
```

#### Language Specification Mechanism
After tool execution, the system specifies LLM response language through the following method:

```javascript
const explanationPrompt = `Please answer the user's question based on the following information:

User request: ${userMessage}

Tool execution result:
${result}

Please provide professional analysis and explanation of the above Node-RED flow data in ${this.getLanguageMapping(this.language)}...`;
```

Language mapping table:
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': 'Chinese',
        'en-US': 'English',
        'ja': 'Japanese',
        'ko': 'Korean',
        'es-ES': 'Spanish',
        'pt-BR': 'Portuguese',
        'fr': 'French'
    };
    return mapping[lang] || 'English';
}
```

## User Chat Flow Details

### Complete End-to-End Process

#### 1. Frontend Message Sending Phase

**User Input Processing**:
- User inputs message in AI sidebar
- System retrieves currently selected flow and node information
- Check configuration node status and deployment status

**Keyword Detection and Message Preprocessing**:
```javascript
// Special keyword handling
if (sendMessage.includes('current flow') || sendMessage.includes('当前流程')) {
    // Automatically switch to development scenario
    currentScenario = 'development';
    
    // Build get-flow tool call prompt
    const promptTemplate = "Please use the get-flow tool to retrieve flow data for flow args:{\"id\":\"{flowId}\"}, then analyze and explain the functionality, node connections, and working principles of this flow.\n\nUser's original request: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// General keyword detection
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. HTTP Request Construction

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

#### 3. Backend Route Processing

**Request Reception** (`make-iot-smart.js`):
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // Set SSE response headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**Configuration Node Retrieval**:
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'Configuration node not found' });
}
```

**Language and Data Preparation**:
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

#### 4. LangChain Manager Processing Phase

**Scenario Detection**:
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Tool Call Judgment**:

1. **Direct Tool Trigger Detection**:
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // Direct tool execution
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **Keyword Force Tool Mode**:
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // Enter tool call mode
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

3. **Multilingual Intent Detection**:

**Layered Detection Strategy**

Priority Order:

1. **Exact Match**: Query keywords in configuration files (exclude queries)
2. **Configuration-Driven**: Intent patterns in current language configuration files
3. **Regex Matching**: Hard-coded multilingual regular expressions
4. **Semantic Analysis**: Deep semantic understanding using LangChain

**Detection Flow**:
```javascript
// 1. Exact match check
const isQueryKeyword = this.isExactQueryKeywordMatch(input);
if (isQueryKeyword) {
    return { isFlowCreation: false, reason: 'Query keyword detected' };
}

// 2. Configuration-driven detection
const configResult = this.detectConfigDrivenIntent(input);

// 3. Enhanced regex detection
const regexResult = this.detectEnhancedRegexPatterns(input);

// 4. Semantic analysis (optional)
const semanticResult = await this.detectSemanticIntent(input);

// Combined scoring
const finalConfidence = this.calculateCombinedScore({
    configDriven: configResult,
    enhancedRegex: regexResult,
    semantic: semanticResult
});
```

#### 4. Execution Mode Selection

**Pure LLM Mode**:
- Retrieve session context
- Build scenario prompts
- Direct LLM call for response generation

**Tool Call Mode**:
- Determine tool type (built-in vs MCP)
- Execute tool calls
- Merge tool results
- Build explanatory prompts
- Call LLM for natural language explanation

#### 5. Tool Call Execution Phase

**Available Tool Types**:

1. **Built-in Tools**:
   - `get-flow`: Direct access to `global.RED.nodes.getFlows()`
   - `get-node-info`: Direct access to `global.RED.nodes`
   - `search_memory`: Memory search
   - `get_user_preferences`: User preferences

2. **MCP Tools**:
   - `get-settings`: Node-RED settings
   - `get-diagnostics`: Diagnostic information
   - Other extension tools

**Tool Execution Flow**:
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // Built-in tool: direct execution
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // MCP tool: execute through MCP client
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // Send tool result
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // Build explanatory prompt
    const explanationPrompt = `Please answer the user's question based on the following information:\n\nUser request: ${userMessage}\n\nTool execution result:\n${result}\n\nPlease provide professional analysis and explanation of the above Node-RED flow data in ${this.getLanguageMapping(this.language)}...`;
    
    // Call LLM for explanation
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**Special Tool Handling**:

1. **get-flow tool**:
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **get-settings and get-diagnostics tools**:
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // No parameters needed
}
```

#### 7. Streaming Response Processing Phase

**Event Types**:
- `token`: Text content fragments
- `tool_call`: Tool call information
- `tool_result`: Tool execution results
- `error`: Error information
- `done`: Response completion

**Data Flow**:
```javascript
// Backend sending
onChunk({ type: 'token', content: 'Partial response content' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// Frontend receiving
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

**Frontend Streaming Processing**:
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. Memory Management

**Conversation Saving**:
```javascript
// Save user message
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// Save AI response
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**Session Context Management**:
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**Memory Retrieval**:
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. Error Handling and Fault Tolerance

**API Authentication Errors**:
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'Invalid API key, please check configuration' });
    }
}
```

**Network Errors**:
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `Tool call failed: ${error.message}` });
    // Fallback to pure LLM mode
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**Tool Call Errors**:
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `Tool ${toolName} execution failed: ${result?.error || 'Unknown error'}` 
    });
    return;
}
```

#### 10. Performance Optimization

**Caching Mechanism**:
```javascript
// LLM instance caching
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // Create new instance and cache
}
```

**Streaming Processing**:
```javascript
// Use streaming API to reduce latency
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**Asynchronous Processing**:
```javascript
// Parallel processing of multiple tool calls
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. Multi-language Support

**Scenario Configuration**:
- Each language has independent `scenarios.json` configuration files
- Support for language-specific keywords and prompts
- Automatic language detection and switching

**Interface Localization**:
```javascript
// Get localized text
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. Security Considerations

**Input Validation**:
```javascript
// Message length limit
if (message.length > 10000) {
    return res.status(400).json({ error: 'Message too long' });
}

// Sensitive information filtering
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[REDACTED]');
```

**API Key Protection**:
```javascript
// Encrypted key storage in configuration nodes
const encryptedKey = RED.util.encryptCredentials(apiKey);

// Runtime decryption
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**Access Control**:
```javascript
// Check user permissions
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
}
```

### Summary

The entire end-to-end process implements a complete pipeline from user input to AI response, providing intelligent Node-RED development support through frontend keyword detection, backend tool invocation, and streaming response processing. The system features:

1. **Intelligence**: Automatic user intent detection, appropriate tool and scenario selection
2. **Multi-language**: Support for keyword detection and response generation in multiple languages
3. **Extensibility**: Modular design, easy to add new tools and scenarios
4. **High Performance**: Streaming processing, caching mechanisms, asynchronous execution
5. **Security**: Input validation, key protection, permission control
6. **User-friendly**: Real-time response, error handling, context awareness

## API Interface Documentation

### RESTful API Endpoints

```
POST /ai-sidebar/stream-chat       # Streaming chat
GET  /ai-sidebar/scenarios         # Get scenario configuration
POST /ai-sidebar/execute-tool      # Execute tool
GET  /ai-sidebar/memory-stats      # Memory statistics
GET  /ai-sidebar/history/:sessionId # Session history
POST /ai-sidebar/search            # Memory search
GET  /ai-sidebar/templates         # Flow templates
```

### Request/Response Formats

**Streaming Chat Request**:
```json
{
  "message": "User message",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "Flow Name"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "Node Name"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "en-US"
}
```

**Streaming Response Format**:
```
data: {"type": "token", "content": "Partial"}
data: {"type": "token", "content": "response"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## Configuration Management

### Environment Variables

```bash
# AI provider configuration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# Database configuration
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# MCP configuration
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Node-RED Configuration Node

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

## Extension Development

### Adding New LLM Providers

```javascript
// Add in langchain-manager.js
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### Adding New Built-in Tools

```javascript
// Add in initializeTools method
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "Custom tool description",
    func: async (input) => {
        // Tool implementation logic
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### Adding New Scenario Configuration

Add in `locales/{lang}/scenarios.json`:

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "Custom Scenario",
      "description": "Scenario description",
      "systemPrompt": "You are a professional...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "Please use tool...\n\nUser's original request: "
        }
      ]
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Tool Call Failures**
   - Check MCP server status
   - Verify tool parameter format
   - Review error logs

2. **Keyword Detection Not Working**
   - Confirm scenario configuration file exists
   - Check keyword case sensitivity
   - Verify language settings

3. **Streaming Response Interruption**
   - Check network connection
   - Verify API key
   - Review browser console errors

### Debug Mode

```bash
# Enable verbose logging
DEBUG=langchain:*,mcp:* node-red

# Enable tool call logging
TOOL_DEBUG=true node-red
```

## Performance Optimization Recommendations

1. **Caching Strategy**
   - LLM instance caching
   - Scenario configuration caching
   - Tool result caching

2. **Concurrency Control**
   - Limit simultaneous conversation count
   - Tool call queue management
   - Resource usage monitoring

3. **Memory Management**
   - Regular cleanup of expired sessions
   - Limit history record length
   - Monitor memory usage

---

*This documentation is written based on actual code implementation and is continuously maintained with project updates*