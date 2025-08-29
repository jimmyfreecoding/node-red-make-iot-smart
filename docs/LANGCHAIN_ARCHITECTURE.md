# LangChain 架构文档

## 概述

本项目基于 LangChain.js 框架构建了一个智能化的 Node-RED AI 助手系统，采用模块化架构设计，支持多语言、多场景、多工具的智能对话能力。系统通过前端关键字检测、后端工具调用和流式响应处理，为用户提供专业的 Node-RED 开发支持。

## 整体架构图

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   前端界面      │    │   后端处理       │    │   外部服务      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ 用户输入    │ │    │ │ HTTP 路由    │ │    │ │ LLM 提供商  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ (OpenAI等)  │ │
│        │        │    │        │         │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ 关键字检测  │ │    │ │ LangChain    │ │    │ │ MCP 工具    │ │
│ └─────────────┘ │    │ │ Manager      │ │    │ │ 服务器      │ │
│        │        │    │ └──────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ 消息构建    │ │────┼────────┼─────────┼────┤                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ 工具管理器   │ │    │                 │
│ │ 流式响应    │ │    │ └──────────────┘ │    │                 │
│ │ 处理        │ │    │        │         │    │                 │
│ └─────────────┘ │    │ ┌──────────────┐ │    │                 │
└─────────────────┘    │ │ 记忆管理器   │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## 端到端流程概述

### 流程图

```
用户输入文字
     │
     ▼
前端关键字检测 ──────┐
     │              │
     ▼              ▼
构建隐藏Human提示词   场景配置获取
     │              │
     ▼              │
HTTP请求发送 ◄───────┘
     │
     ▼
LangChain Manager
     │
     ▼
工具触发检测 ──────┐
     │            │
     ▼            ▼
选择执行模式      工具类型判断
     │            │
     ├────────────┼─── 内置工具
     │            │
     │            └─── MCP工具
     ▼
工具执行 & 结果合并
     │
     ▼
新Human提示词构建
     │
     ▼
LLM调用 (指定语言)
     │
     ▼
流式响应返回
```

## 核心组件详解

### 1. 前端关键字检测系统

#### 配置来源
前端通过以下API获取关键字配置：
```javascript
// 获取当前语言的场景配置
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### 检测逻辑
位于 `ai-sidebar.html` 的 `detectKeywords` 函数：

```javascript
async function detectKeywords(message) {
    // 1. 获取当前语言配置
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. 遍历所有场景的关键字配置
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

#### 特殊关键字处理
系统对特定关键字进行特殊处理：

1. **"当前流程" / "current flow"**：
   - 自动切换到 `development` 场景
   - 构建 `get-flow` 工具调用提示词
   - 传递当前选中的流程ID

2. **"当前节点" / "current node"**：
   - 自动切换到 `development` 场景
   - 构建 `get-node-info` 工具调用提示词
   - 传递选中节点的详细信息

### 2. LangChain Manager (`lib/langchain-manager.js`)

#### 核心职责
- LLM 提供商管理（OpenAI、DeepSeek、Anthropic、Google）
- 工具调用协调
- 场景管理
- 流式响应处理
- 记忆管理集成

#### 主要方法

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
    
    // 工具触发检测
    detectToolTrigger(message)
    
    // 强制工具模式判断
    shouldForceToolMode(message, scenario, dynamicData)
    
    // 纯LLM流式聊天
    executePureLLMChatStream(message, options, onChunk)
    
    // 场景化流式聊天
    executeScenarioChatStream(message, options, onChunk)
}
```

#### 工具触发检测机制

1. **直接工具调用格式**：
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **关键字触发**：
   - 通过 `shouldForceToolMode` 方法检测
   - 基于多语言配置的关键字映射
   - 支持参数提取和工具推断

### 3. 工具管理系统

#### 工具分类

**内置工具 (Built-in Tools)**：
- `search_memory`: 记忆搜索
- `get_user_preferences`: 用户偏好获取
- `get_flow_templates`: 流程模板获取
- `get-flow`: Node-RED 流程数据获取（直接访问 `global.RED`）
- `get-node-info`: Node-RED 节点信息获取（直接访问 `global.RED`）

**MCP 工具 (MCP Tools)**：
- `get-settings`: Node-RED 设置获取
- `get-diagnostics`: 诊断信息获取
- 其他通过 MCP 协议提供的工具

#### 工具选择逻辑

```javascript
// 特殊工具直接执行
if (toolName === 'get-node-info') {
    // 直接使用 Node-RED API
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // 构建 MCP 参数
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // 其他工具使用提供的参数
    mcpArgs = toolTrigger.args;
}
```

### 4. 记忆管理系统 (`lib/memory-manager.js`)

#### 数据库结构

```sql
-- 短期记忆（会话历史）
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 长期记忆（用户偏好、知识库）
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

#### 记忆检索机制
- 基于会话ID的上下文检索
- 语义相似度搜索
- 自动过期清理

### 5. 多语言支持系统

#### 配置结构
场景配置文件位于 `locales/{lang}/scenarios.json`：

```json
{
  "scenarios": {
    "development": {
      "name": "开发",
      "description": "Node-RED流程开发和调试",
      "systemPrompt": "你是一个专业的Node-RED开发助手...",
      "keywords": [
        {
          "key": ["当前配置", "current config"],
          "scenario": "development",
          "newHumanPrompt": "请使用get-settings工具获取当前Node-RED配置信息，然后分析配置状态。\n\n用户原始请求："
        }
      ]
    }
  }
}
```

#### 语言指定机制
在工具执行后，系统通过以下方式指定LLM回复语言：

```javascript
const explanationPrompt = `请根据以下信息回答用户的问题：

用户请求：${userMessage}

工具执行结果：
${result}

请用${this.getLanguageMapping(this.language)}对以上Node-RED流程数据进行专业分析和解释...`;
```

语言映射表：
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': '中文',
        'en-US': 'English',
        'ja': '日本語',
        'ko': '한국어',
        'es-ES': 'Español',
        'pt-BR': 'Português',
        'fr': 'Français'
    };
    return mapping[lang] || '中文';
}
```

## 用户聊天流程详解

### 完整端到端流程

#### 1. 前端消息发送阶段

**用户输入处理**：
- 用户在AI侧边栏输入消息
- 系统获取当前选中的流程和节点信息
- 检查配置节点状态和部署状态

**关键字检测与消息预处理**：
```javascript
// 特殊关键字处理
if (sendMessage.includes('当前流程') || sendMessage.includes('current flow')) {
    // 自动切换到development场景
    currentScenario = 'development';
    
    // 构建get-flow工具调用提示词
    const promptTemplate = "Please use the get-flow tool to retrieve flow data for flow args:{\"id\":\"{flowId}\"}, then analyze and explain the functionality, node connections, and working principles of this flow.\n\nUser's original request: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// 通用关键字检测
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. HTTP请求构造

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

#### 3. 后端路由处理

**请求接收** (`make-iot-smart.js`)：
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**配置节点获取**：
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'Configuration node not found' });
}
```

**语言和数据准备**：
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

#### 4. LangChain管理器处理阶段

**场景检测**：
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**工具调用判断**：

1. **直接工具触发检测**：
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // 直接执行工具
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **关键字强制工具模式**：
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // 进入工具调用模式
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

3. **多语言意图检测**：

**分层检测策略**

优先级顺序：

1. **精确匹配**：配置文件中的查询关键字（排除查询）
2. **配置驱动**：当前语言配置文件中的意图模式
3. **正则匹配**：硬编码的多语言正则表达式
4. **语义分析**：使用 LangChain 进行深度语义理解

**检测流程**：
```javascript
// 1. 精确匹配检查
const isQueryKeyword = this.isExactQueryKeywordMatch(input);
if (isQueryKeyword) {
    return { isFlowCreation: false, reason: 'Query keyword detected' };
}

// 2. 配置驱动检测
const configResult = this.detectConfigDrivenIntent(input);

// 3. 增强正则表达式检测
const regexResult = this.detectEnhancedRegexPatterns(input);

// 4. 语义分析（可选）
const semanticResult = await this.detectSemanticIntent(input);

// 综合评分
const finalConfidence = this.calculateCombinedScore({
    configDriven: configResult,
    enhancedRegex: regexResult,
    semantic: semanticResult
});
```

#### 4. 执行模式选择

**纯LLM模式**：
- 获取会话上下文
- 构建场景提示词
- 直接调用LLM生成响应

**工具调用模式**：
- 确定工具类型（内置 vs MCP）
- 执行工具调用
- 合并工具结果
- 构建解释性提示词
- 调用LLM生成自然语言解释

#### 5. 工具调用执行阶段

**可用工具类型**：

1. **内置工具**：
   - `get-flow`: 直接访问 `global.RED.nodes.getFlows()`
   - `get-node-info`: 直接访问 `global.RED.nodes`
   - `search_memory`: 记忆搜索
   - `get_user_preferences`: 用户偏好

2. **MCP工具**：
   - `get-settings`: Node-RED设置
   - `get-diagnostics`: 诊断信息
   - 其他扩展工具

**工具执行流程**：
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // 内置工具：直接执行
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // MCP工具：通过MCP客户端执行
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // 发送工具结果
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // 构建解释性提示词
    const explanationPrompt = `请根据以下信息回答用户的问题：\n\n用户请求：${userMessage}\n\n工具执行结果：\n${result}\n\n请用${this.getLanguageMapping(this.language)}对以上Node-RED流程数据进行专业分析和解释...`;
    
    // 调用LLM生成解释
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**特殊工具处理**：

1. **get-flow工具**：
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **get-settings和get-diagnostics工具**：
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // 无需参数
}
```

#### 7. 流式响应处理阶段

**事件类型**：
- `token`: 文本内容片段
- `tool_call`: 工具调用信息
- `tool_result`: 工具执行结果
- `error`: 错误信息
- `done`: 响应完成

**数据流向**：
```javascript
// 后端发送
onChunk({ type: 'token', content: '部分响应内容' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// 前端接收
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

**前端流式处理**：
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // 滚动到底部
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. 记忆管理

**对话保存**：
```javascript
// 保存用户消息
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// 保存AI响应
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**会话上下文管理**：
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**记忆检索**：
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. 错误处理和容错机制

**API认证错误**：
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'API密钥无效，请检查配置' });
    }
}
```

**网络错误**：
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `工具调用失败: ${error.message}` });
    // 降级到纯LLM模式
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**工具调用错误**：
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `工具 ${toolName} 执行失败: ${result?.error || '未知错误'}` 
    });
    return;
}
```

#### 10. 性能优化

**缓存机制**：
```javascript
// LLM实例缓存
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // 创建新实例并缓存
}
```

**流式处理**：
```javascript
// 使用流式API减少延迟
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**异步处理**：
```javascript
// 并行处理多个工具调用
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. 多语言支持

**场景配置**：
- 每种语言都有独立的 `scenarios.json` 配置文件
- 支持语言特定的关键字和提示词
- 自动语言检测和切换

**界面本地化**：
```javascript
// 获取本地化文本
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. 安全考虑

**输入验证**：
```javascript
// 消息长度限制
if (message.length > 10000) {
    return res.status(400).json({ error: '消息过长' });
}

// 敏感信息过滤
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[REDACTED]');
```

**API密钥保护**：
```javascript
// 配置节点中的密钥加密存储
const encryptedKey = RED.util.encryptCredentials(apiKey);

// 运行时解密
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**访问控制**：
```javascript
// 检查用户权限
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: '权限不足' });
}
```

### 总结

整个端到端流程实现了从用户输入到AI响应的完整链路，通过前端关键字检测、后端工具调用和流式响应处理，为用户提供了智能化的Node-RED开发支持。系统具有以下特点：

1. **智能化**：自动检测用户意图，选择合适的工具和场景
2. **多语言**：支持多种语言的关键字检测和响应生成
3. **可扩展**：模块化设计，易于添加新工具和场景
4. **高性能**：流式处理、缓存机制、异步执行
5. **安全性**：输入验证、密钥保护、权限控制
6. **用户友好**：实时响应、错误处理、上下文感知

## API 接口文档

### RESTful API 端点

```
POST /ai-sidebar/stream-chat       # 流式聊天
GET  /ai-sidebar/scenarios         # 获取场景配置
POST /ai-sidebar/execute-tool      # 执行工具
GET  /ai-sidebar/memory-stats      # 记忆统计
GET  /ai-sidebar/history/:sessionId # 会话历史
POST /ai-sidebar/search            # 记忆搜索
GET  /ai-sidebar/templates         # 流程模板
```

### 请求/响应格式

**流式聊天请求**：
```json
{
  "message": "用户消息",
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
  "language": "zh-CN"
}
```

**流式响应格式**：
```
data: {"type": "token", "content": "部分"}
data: {"type": "token", "content": "响应"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## 配置管理

### 环境变量

```bash
# AI提供商配置
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# 数据库配置
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# MCP配置
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Node-RED 配置节点

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

## 扩展开发

### 添加新的LLM提供商

```javascript
// 在 langchain-manager.js 中添加
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### 添加新的内置工具

```javascript
// 在 initializeTools 方法中添加
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "自定义工具描述",
    func: async (input) => {
        // 工具实现逻辑
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### 添加新的场景配置

在 `locales/{lang}/scenarios.json` 中添加：

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "自定义场景",
      "description": "场景描述",
      "systemPrompt": "你是一个专业的...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["关键字1", "关键字2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "请使用工具...\n\n用户原始请求："
        }
      ]
    }
  }
}
```

## 故障排除

### 常见问题

1. **工具调用失败**
   - 检查MCP服务器状态
   - 验证工具参数格式
   - 查看错误日志

2. **关键字检测不工作**
   - 确认场景配置文件存在
   - 检查关键字大小写
   - 验证语言设置

3. **流式响应中断**
   - 检查网络连接
   - 验证API密钥
   - 查看浏览器控制台错误

### 调试模式

```bash
# 启用详细日志
DEBUG=langchain:*,mcp:* node-red

# 启用工具调用日志
TOOL_DEBUG=true node-red
```

## 性能优化建议

1. **缓存策略**
   - LLM实例缓存
   - 场景配置缓存
   - 工具结果缓存

2. **并发控制**
   - 限制同时进行的对话数量
   - 工具调用队列管理
   - 资源使用监控

3. **内存管理**
   - 定期清理过期会话
   - 限制历史记录长度
   - 监控内存使用情况

---

*本文档基于实际代码实现编写，随项目更新而持续维护*