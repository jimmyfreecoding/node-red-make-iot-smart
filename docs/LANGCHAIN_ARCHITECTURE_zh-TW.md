# LangChain 架構文件

## 概述

本專案基於 LangChain.js 框架構建了一個智慧化的 Node-RED AI 助手系統，採用模組化架構設計，支援多語言、多場景、多工具的智慧對話能力。系統透過前端關鍵字檢測、後端工具呼叫和串流響應處理，為使用者提供專業的 Node-RED 開發支援。

## 整體架構圖

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   前端介面      │    │   後端處理       │    │   外部服務      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ 使用者輸入  │ │    │ │ HTTP 路由    │ │    │ │ LLM 提供商  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ (OpenAI等)  │ │
│        │        │    │        │         │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ 關鍵字檢測  │ │    │ │ LangChain    │ │    │ │ MCP 工具    │ │
│ └─────────────┘ │    │ │ Manager      │ │    │ │ 伺服器      │ │
│        │        │    │ └──────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ 訊息構建    │ │────┼────────┼─────────┼────┤                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ 工具管理器   │ │    │                 │
│ │ 串流響應    │ │    │ └──────────────┘ │    │                 │
│ │ 處理        │ │    │        │         │    │                 │
│ └─────────────┘ │    │ ┌──────────────┐ │    │                 │
└─────────────────┘    │ │ 記憶管理器   │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## 端到端流程概述

### 流程圖

```
使用者輸入文字
     │
     ▼
前端關鍵字檢測 ──────┐
     │              │
     ▼              ▼
構建隱藏Human提示詞   場景配置獲取
     │              │
     ▼              │
HTTP請求發送 ◄───────┘
     │
     ▼
LangChain Manager
     │
     ▼
工具觸發檢測 ──────┐
     │            │
     ▼            ▼
選擇執行模式      工具類型判斷
     │            │
     ├────────────┼─── 內建工具
     │            │
     │            └─── MCP工具
     ▼
工具執行 & 結果合併
     │
     ▼
新Human提示詞構建
     │
     ▼
LLM呼叫 (指定語言)
     │
     ▼
串流響應返回
```

## 核心元件詳解

### 1. 前端關鍵字檢測系統

#### 配置來源
前端透過以下API獲取關鍵字配置：
```javascript
// 獲取當前語言的場景配置
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### 檢測邏輯
位於 `ai-sidebar.html` 的 `detectKeywords` 函數：

```javascript
async function detectKeywords(message) {
    // 1. 獲取當前語言配置
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. 遍歷所有場景的關鍵字配置
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

#### 特殊關鍵字處理
系統對特定關鍵字進行特殊處理：

1. **"當前流程" / "current flow"**：
   - 自動切換到 `development` 場景
   - 構建 `get-flow` 工具呼叫提示詞
   - 傳遞當前選中的流程ID

2. **"當前節點" / "current node"**：
   - 自動切換到 `development` 場景
   - 構建 `get-node-info` 工具呼叫提示詞
   - 傳遞選中節點的詳細資訊

### 2. LangChain Manager (`lib/langchain-manager.js`)

#### 核心職責
- LLM 提供商管理（OpenAI、DeepSeek、Anthropic、Google）
- 工具呼叫協調
- 場景管理
- 串流響應處理
- 記憶管理整合

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
    
    // 工具觸發檢測
    detectToolTrigger(message)
    
    // 強制工具模式判斷
    shouldForceToolMode(message, scenario, dynamicData)
    
    // 純LLM串流聊天
    executePureLLMChatStream(message, options, onChunk)
    
    // 場景化串流聊天
    executeScenarioChatStream(message, options, onChunk)
}
```

#### 工具觸發檢測機制

1. **直接工具呼叫格式**：
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **關鍵字觸發**：
   - 透過 `shouldForceToolMode` 方法檢測
   - 基於多語言配置的關鍵字映射
   - 支援參數提取和工具推斷

### 3. 工具管理系統

#### 工具分類

**內建工具 (Built-in Tools)**：
- `search_memory`: 記憶搜尋
- `get_user_preferences`: 使用者偏好獲取
- `get_flow_templates`: 流程範本獲取
- `get-flow`: Node-RED 流程資料獲取（直接存取 `global.RED`）
- `get-node-info`: Node-RED 節點資訊獲取（直接存取 `global.RED`）

**MCP 工具 (MCP Tools)**：
- `get-settings`: Node-RED 設定獲取
- `get-diagnostics`: 診斷資訊獲取
- 其他透過 MCP 協定提供的工具

#### 工具選擇邏輯

```javascript
// 特殊工具直接執行
if (toolName === 'get-node-info') {
    // 直接使用 Node-RED API
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // 構建 MCP 參數
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // 其他工具使用提供的參數
    mcpArgs = toolTrigger.args;
}
```

### 4. 記憶管理系統 (`lib/memory-manager.js`)

#### 資料庫結構

```sql
-- 短期記憶（會話歷史）
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 長期記憶（使用者偏好、知識庫）
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

#### 記憶檢索機制
- 基於會話ID的上下文檢索
- 語義相似度搜尋
- 自動過期清理

### 5. 多語言支援系統

#### 配置結構
場景配置檔案位於 `locales/{lang}/scenarios.json`：

```json
{
  "scenarios": {
    "development": {
      "name": "開發",
      "description": "Node-RED流程開發和除錯",
      "systemPrompt": "你是一個專業的Node-RED開發助手...",
      "keywords": [
        {
          "key": ["當前配置", "current config"],
          "scenario": "development",
          "newHumanPrompt": "請使用get-settings工具獲取當前Node-RED配置資訊，然後分析配置狀態。\n\n使用者原始請求："
        }
      ]
    }
  }
}
```

#### 語言指定機制
在工具執行後，系統透過以下方式指定LLM回覆語言：

```javascript
const explanationPrompt = `請根據以下資訊回答使用者的問題：

使用者請求：${userMessage}

工具執行結果：
${result}

請用${this.getLanguageMapping(this.language)}對以上Node-RED流程資料進行專業分析和解釋...`;
```

語言映射表：
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

## 使用者聊天流程詳解

### 完整端到端流程

#### 1. 前端訊息發送階段

**使用者輸入處理**：
- 使用者在AI側邊欄輸入訊息
- 系統獲取當前選中的流程和節點資訊
- 檢查配置節點狀態和部署狀態

**關鍵字檢測與訊息預處理**：
```javascript
// 特殊關鍵字處理
if (sendMessage.includes('當前流程') || sendMessage.includes('current flow')) {
    // 自動切換到development場景
    currentScenario = 'development';
    
    // 構建get-flow工具呼叫提示詞
    const promptTemplate = "Please use the get-flow tool to retrieve flow data for flow args:{\"id\":\"{flowId}\"}, then analyze and explain the functionality, node connections, and working principles of this flow.\n\nUser's original request: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// 通用關鍵字檢測
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. HTTP請求構造

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

#### 3. 後端路由處理

**請求接收** (`make-iot-smart.js`)：
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // 設定SSE響應標頭
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**配置節點獲取**：
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: 'Configuration node not found' });
}
```

**語言和資料準備**：
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

#### 4. LangChain管理器處理階段

**場景檢測**：
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**工具呼叫判斷**：

1. **直接工具觸發檢測**：
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // 直接執行工具
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **關鍵字強制工具模式**：
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // 進入工具呼叫模式
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

3. **多語言意圖檢測**：

**分層檢測策略**

優先級順序：

1. **精確匹配**：配置檔案中的查詢關鍵字（排除查詢請求）
2. **配置驅動**：當前語言配置檔案中的意圖模式
3. **正則匹配**：硬編碼的多語言正則表達式
4. **語義分析**：使用LangChain進行深度語義理解

**檢測流程**：
```javascript
// 1. 精確匹配檢查
const isQueryKeyword = this.isExactQueryKeywordMatch(input);
if (isQueryKeyword) {
    return { isFlowCreation: false, reason: 'Query keyword detected' };
}

// 2. 配置驅動檢測
const configResult = this.detectConfigDrivenIntent(input);

// 3. 增強正則檢測
const regexResult = this.detectEnhancedRegexPatterns(input);

// 4. 語義分析（可選）
const semanticResult = await this.detectSemanticIntent(input);

// 綜合評分
const finalConfidence = this.calculateCombinedScore({
    configDriven: configResult,
    enhancedRegex: regexResult,
    semantic: semanticResult
});
```

#### 4. 執行模式選擇

**純LLM模式**：
- 獲取會話上下文
- 構建場景提示詞
- 直接呼叫LLM生成響應

**工具呼叫模式**：
- 確定工具類型（內建 vs MCP）
- 執行工具呼叫
- 合併工具結果
- 構建解釋性提示詞
- 呼叫LLM生成自然語言解釋

#### 6. 工具呼叫執行階段

**可用工具類型**：

1. **內建工具**：
   - `get-flow`: 直接存取 `global.RED.nodes.getFlows()`
   - `get-node-info`: 直接存取 `global.RED.nodes`
   - `search_memory`: 記憶搜尋
   - `get_user_preferences`: 使用者偏好

2. **MCP工具**：
   - `get-settings`: Node-RED設定
   - `get-diagnostics`: 診斷資訊
   - 其他擴展工具

**工具執行流程**：
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // 內建工具：直接執行
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // MCP工具：透過MCP客戶端執行
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // 發送工具結果
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // 構建解釋性提示詞
    const explanationPrompt = `請根據以下資訊回答使用者的問題：\n\n使用者請求：${userMessage}\n\n工具執行結果：\n${result}\n\n請用${this.getLanguageMapping(this.language)}對以上Node-RED流程資料進行專業分析和解釋...`;
    
    // 呼叫LLM生成解釋
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**特殊工具處理**：

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
    mcpArgs = {}; // 無需參數
}
```

#### 7. 串流響應處理階段

**事件類型**：
- `token`: 文字內容片段
- `tool_call`: 工具呼叫資訊
- `tool_result`: 工具執行結果
- `error`: 錯誤資訊
- `done`: 響應完成

**資料流向**：
```javascript
// 後端發送
onChunk({ type: 'token', content: '部分響應內容' });
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

**前端串流處理**：
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // 滾動到底部
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. 記憶管理

**對話保存**：
```javascript
// 保存使用者訊息
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// 保存AI響應
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**會話上下文管理**：
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**記憶檢索**：
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. 錯誤處理和容錯機制

**API認證錯誤**：
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: 'API金鑰無效，請檢查配置' });
    }
}
```

**網路錯誤**：
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `工具呼叫失敗: ${error.message}` });
    // 降級到純LLM模式
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**工具呼叫錯誤**：
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `工具 ${toolName} 執行失敗: ${result?.error || '未知錯誤'}` 
    });
    return;
}
```

#### 10. 效能最佳化

**快取機制**：
```javascript
// LLM實例快取
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // 建立新實例並快取
}
```

**串流處理**：
```javascript
// 使用串流API減少延遲
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**非同步處理**：
```javascript
// 並行處理多個工具呼叫
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. 多語言支援

**場景配置**：
- 每種語言都有獨立的 `scenarios.json` 配置檔案
- 支援語言特定的關鍵字和提示詞
- 自動語言檢測和切換

**介面本地化**：
```javascript
// 獲取本地化文字
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. 安全考慮

**輸入驗證**：
```javascript
// 訊息長度限制
if (message.length > 10000) {
    return res.status(400).json({ error: '訊息過長' });
}

// 敏感資訊過濾
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[REDACTED]');
```

**API金鑰保護**：
```javascript
// 配置節點中的金鑰加密儲存
const encryptedKey = RED.util.encryptCredentials(apiKey);

// 執行時解密
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**存取控制**：
```javascript
// 檢查使用者權限
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: '權限不足' });
}
```

### 總結

整個端到端流程實現了從使用者輸入到AI響應的完整鏈路，透過前端關鍵字檢測、後端工具呼叫和串流響應處理，為使用者提供了智慧化的Node-RED開發支援。系統具有以下特點：

1. **智慧化**：自動檢測使用者意圖，選擇合適的工具和場景
2. **多語言**：支援多種語言的關鍵字檢測和響應生成
3. **可擴展**：模組化設計，易於新增新工具和場景
4. **高效能**：串流處理、快取機制、非同步執行
5. **安全性**：輸入驗證、金鑰保護、權限控制
6. **使用者友好**：即時響應、錯誤處理、上下文感知

## API 介面文件

### RESTful API 端點

```
POST /ai-sidebar/stream-chat       # 串流聊天
GET  /ai-sidebar/scenarios         # 獲取場景配置
POST /ai-sidebar/execute-tool      # 執行工具
GET  /ai-sidebar/memory-stats      # 記憶統計
GET  /ai-sidebar/history/:sessionId # 會話歷史
POST /ai-sidebar/search            # 記憶搜尋
GET  /ai-sidebar/templates         # 流程範本
```

### 請求/響應格式

**串流聊天請求**：
```json
{
  "message": "使用者訊息",
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
  "language": "zh-TW"
}
```

**串流響應格式**：
```
data: {"type": "token", "content": "部分"}
data: {"type": "token", "content": "響應"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## 配置管理

### 環境變數

```bash
# AI提供商配置
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# 資料庫配置
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# MCP配置
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Node-RED 配置節點

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

## 擴展開發

### 新增新的LLM提供商

```javascript
// 在 langchain-manager.js 中新增
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### 新增新的內建工具

```javascript
// 在 initializeTools 方法中新增
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "自訂工具描述",
    func: async (input) => {
        // 工具實現邏輯
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### 新增新的場景配置

在 `locales/{lang}/scenarios.json` 中新增：

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "自訂場景",
      "description": "場景描述",
      "systemPrompt": "你是一個專業的...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["關鍵字1", "關鍵字2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "請使用工具...\n\n使用者原始請求："
        }
      ]
    }
  }
}
```

## 故障排除

### 常見問題

1. **工具呼叫失敗**
   - 檢查MCP伺服器狀態
   - 驗證工具參數格式
   - 查看錯誤日誌

2. **關鍵字檢測不工作**
   - 確認場景配置檔案存在
   - 檢查關鍵字大小寫
   - 驗證語言設定

3. **串流響應中斷**
   - 檢查網路連線
   - 驗證API金鑰
   - 查看瀏覽器控制台錯誤

### 除錯模式

```bash
# 啟用詳細日誌
DEBUG=langchain:*,mcp:* node-red

# 啟用工具呼叫日誌
TOOL_DEBUG=true node-red
```

## 效能最佳化建議

1. **快取策略**
   - LLM實例快取
   - 場景配置快取
   - 工具結果快取

2. **並發控制**
   - 限制同時進行的對話數量
   - 工具呼叫佇列管理
   - 資源使用監控

3. **記憶體管理**
   - 定期清理過期會話
   - 限制歷史記錄長度
   - 監控記憶體使用情況

---

*本文件基於實際程式碼實現編寫，隨專案更新而持續維護*