# Node-RED Make IoT Smart - LangChain.js 重构设计方案

## 1. 技术可行性分析

### 1.1 当前架构分析

**现有技术栈：**
- AI SDK: `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`
- 核心框架: `ai` (Vercel AI SDK)
- MCP集成: `@modelcontextprotocol/sdk`
- 其他依赖: `zod`, `showdown`, `highlight.js`

**现有功能模块：**
1. **AI模型配置**: 支持OpenAI、DeepSeek、Anthropic、Google等提供商
2. **场景化提示词**: 7个预定义场景（学习、方案、集成、开发、配置、管理、通用）
3. **MCP工具集成**: 20+个工具，包括create-flow、update-flow等
4. **流式对话**: 支持实时AI响应
5. **工具调用**: 自动化Node-RED操作

### 1.2 LangChain.js优势

**核心优势：**
- **统一接口**: 标准化的LLM提供商接口
- **工具管理**: 内置工具调用和代理框架
- **记忆系统**: 原生支持短期和长期记忆
- **提示词管理**: 结构化的提示词模板系统
- **生态系统**: 丰富的集成和扩展

## 2. 新架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Node-RED Make IoT Smart                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (ai-sidebar.html)                                │
│  ├── Scenario Manager                                       │
│  ├── Chat Interface                                         │
│  └── JSON Editor                                            │
├─────────────────────────────────────────────────────────────┤
│  Backend (make-iot-smart.js)                               │
│  ├── LangChain Core                                         │
│  │   ├── LLM Manager                                        │
│  │   ├── Tool Manager                                       │
│  │   ├── Memory Manager                                     │
│  │   └── Prompt Manager                                     │
│  ├── MCP Integration                                        │
│  ├── SQLite Database                                        │
│  └── Configuration Manager                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块设计

#### 2.2.1 LLM Manager

**支持的提供商：**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude-3.5-Sonnet, Claude-3-Haiku)
- Google (Gemini-Pro, Gemini-Flash)
- DeepSeek (DeepSeek-Chat, DeepSeek-Coder)
- Groq (Llama-3.3-70B)
- Mistral AI

**配置结构：**
```javascript
const llmConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 2000,
  streaming: true,
  apiKey: process.env.OPENAI_API_KEY
};
```

#### 2.2.2 Memory Manager

**短期记忆 (内存)：**
- 会话上下文管理
- 最近N轮对话历史
- 临时工具调用结果

**长期记忆 (SQLite)：**
- 用户偏好设置
- 历史对话记录
- 学习模式进度
- 常用流程模板

**数据库结构：**
```sql
-- 对话历史表
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  scenario TEXT, -- 'learning' | 'solution' | etc.
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户偏好表
CREATE TABLE user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 流程模板表
CREATE TABLE flow_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  flow_json TEXT NOT NULL,
  scenario TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.3 Tool Manager

**工具分类：**
1. **Node-RED工具**: create-flow, update-flow, get-flow等
2. **系统工具**: 文件操作、命令执行
3. **外部API工具**: 天气查询、搜索等

**工具定义格式：**
```javascript
const nodeRedTools = [
  {
    name: 'create_flow',
    description: '创建新的Node-RED流程',
    schema: z.object({
      flowJson: z.string().describe('流程JSON配置'),
      label: z.string().describe('流程标签')
    }),
    func: async ({ flowJson, label }) => {
      // MCP工具调用逻辑
    }
  }
];
```

#### 2.2.4 Prompt Manager

**场景配置文件 (scenarios.json)：**
```json
{
  "learning": {
    "systemPrompt": "你是Node-RED学习助手...",
    "outputFormat": {
      "type": "structured",
      "schema": {
        "explanation": "string",
        "example": "object",
        "actionType": "enum"
      }
    },
    "dynamicInputs": [
      "currentFlow",
      "selectedNodes",
      "userLevel"
    ]
  },
  "solution": {
    "systemPrompt": "你是IoT解决方案专家...",
    "outputFormat": {
      "type": "structured",
      "schema": {
        "solutions": "array",
        "comparison": "object",
        "recommendation": "string"
      }
    }
  }
}
```

### 2.3 依赖更新计划

**新增依赖：**
```json
{
  "@langchain/core": "^0.3.0",
  "@langchain/openai": "^0.3.0",
  "@langchain/anthropic": "^0.3.0",
  "@langchain/google-genai": "^0.1.0",
  "@langchain/community": "^0.3.0",
  "langchain": "^0.3.0",
  "sqlite3": "^5.1.7",
  "better-sqlite3": "^11.0.0"
}
```

**移除依赖：**
```json
{
  "@ai-sdk/anthropic": "移除",
  "@ai-sdk/google": "移除",
  "@ai-sdk/openai": "移除",
  "ai": "移除"
}
```

## 3. 实施步骤

### 阶段1: 基础设施搭建
1. 更新package.json依赖
2. 创建SQLite数据库和表结构
3. 设计新的配置文件格式

### 阶段2: 核心模块重构
1. 实现LLM Manager
2. 实现Memory Manager
3. 实现Tool Manager
4. 实现Prompt Manager

### 阶段3: 功能迁移
1. 迁移场景化提示词到JSON配置
2. 重构MCP工具调用逻辑
3. 更新前端API接口

### 阶段4: 测试和优化
1. 功能测试
2. 性能优化
3. 文档更新

## 4. 风险评估

### 4.1 技术风险
- **兼容性**: LangChain.js与现有MCP集成的兼容性
- **性能**: SQLite数据库性能影响
- **学习曲线**: 团队对LangChain.js的熟悉程度

### 4.2 缓解措施
- 渐进式迁移，保持向后兼容
- 数据库查询优化和索引设计
- 详细的技术文档和示例代码

## 5. 预期收益

### 5.1 技术收益
- **标准化**: 统一的LLM接口和工具管理
- **可扩展性**: 更容易添加新的LLM提供商和工具
- **记忆能力**: 智能的上下文管理和历史记录
- **配置化**: 场景和提示词的JSON配置管理

### 5.2 用户体验
- **个性化**: 基于历史记录的个性化推荐
- **连续性**: 跨会话的上下文保持
- **智能化**: 更准确的场景识别和响应

## 6. 时间估算

- **阶段1**: 2-3天
- **阶段2**: 5-7天
- **阶段3**: 3-4天
- **阶段4**: 2-3天

**总计**: 12-17天

## 7. 成功指标

1. **功能完整性**: 所有现有功能正常工作
2. **性能指标**: 响应时间不超过现有系统的120%
3. **记忆效果**: 能够准确召回和利用历史对话
4. **配置灵活性**: 场景和提示词可通过JSON配置修改
5. **扩展性**: 能够轻松添加新的LLM提供商

---

*本设计方案基于当前项目架构分析和LangChain.js框架特性制定，将为Node-RED Make IoT Smart项目带来更强大的AI能力和更好的用户体验。*