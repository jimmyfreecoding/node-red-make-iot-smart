# LangChain.js 架构文档

## 概述

本项目已成功迁移到 LangChain.js 框架，采用模块化架构设计，提供更强大的AI能力和更好的扩展性。

## 核心组件

### 1. LangChain Manager (`lib/langchain-manager.js`)

核心AI模型管理器，负责：
- LLM提供商管理（OpenAI、Anthropic、Google、DeepSeek等）
- 模型配置和初始化
- 聊天会话管理
- 流式响应处理
- 工具调用协调

**主要方法：**
- `initialize(config)`: 初始化LangChain管理器
- `chat(message, options)`: 处理聊天请求
- `streamChat(message, options)`: 流式聊天处理
- `executeTool(toolName, params)`: 执行工具调用

### 2. Memory Manager (`lib/memory-manager.js`)

SQLite数据库驱动的记忆管理系统：
- 短期记忆：会话历史、上下文信息
- 长期记忆：用户偏好、流程模板、知识库
- 智能检索：基于相似度的记忆检索
- 自动清理：过期数据自动清理机制

**数据库表结构：**
```sql
-- 短期记忆表
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 长期记忆表
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

### 3. Scenario Manager (`lib/scenario-manager.js`)

场景化提示词管理系统：
- JSON配置的场景定义
- 动态参数注入
- 上下文感知的提示词生成
- 多语言支持

**场景配置格式：**
```json
{
  "scenarios": {
    "learning": {
      "name": "学习",
      "description": "解释节点和概念，提供示例流程",
      "systemPrompt": "你是一个Node-RED学习助手...",
      "parameters": {
        "difficulty": "beginner",
        "language": "zh-CN"
      }
    }
  }
}
```

### 4. Tool Management

统一工具管理框架，支持：
- 内置工具：文件操作、流程分析、代码生成
- MCP工具：Model Context Protocol工具集成
- 动态工具注册和发现
- 工具权限管理

**工具类型：**
- `BuiltinTool`: 内置工具实现
- `MCPTool`: MCP协议工具包装
- `DynamicTool`: LangChain动态工具

## API 架构

### RESTful API 端点

```
POST /ai-sidebar/chat              # 标准聊天
POST /ai-sidebar/stream-chat       # 流式聊天
GET  /ai-sidebar/scenarios         # 获取场景列表
POST /ai-sidebar/execute-tool      # 执行工具
GET  /ai-sidebar/memory-stats      # 记忆统计
GET  /ai-sidebar/history/:sessionId # 会话历史
POST /ai-sidebar/search            # 记忆搜索
GET  /ai-sidebar/templates         # 流程模板
```

### 请求/响应格式

**聊天请求：**
```json
{
  "message": "用户消息",
  "scenario": "learning",
  "sessionId": "session-uuid",
  "context": {
    "currentFlow": {...},
    "selectedNodes": [...]
  }
}
```

**流式响应：**
```
data: {"type": "token", "content": "部分"}
data: {"type": "token", "content": "响应"}
data: {"type": "tool_call", "tool": "analyze_flow", "params": {...}}
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

# 工具配置
MCP_TOOLS_ENABLED=true
MCP_TOOLS_PATH=./tools
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

## 性能优化

### 1. 连接池管理
- SQLite连接池
- HTTP客户端复用
- 内存缓存机制

### 2. 异步处理
- 流式响应处理
- 后台任务队列
- 非阻塞I/O操作

### 3. 资源管理
- 自动垃圾回收
- 内存使用监控
- 连接超时管理

## 安全考虑

### 1. API密钥安全
- 本地加密存储
- 运行时解密
- 不在日志中记录

### 2. 数据隐私
- 本地数据存储
- 可选的数据加密
- 用户数据控制

### 3. 工具权限
- 工具执行权限控制
- 危险操作确认
- 审计日志记录

## 扩展性

### 1. 新LLM提供商
```javascript
// 添加新的LLM提供商
class CustomLLMProvider extends BaseLLM {
  async _call(prompt, options) {
    // 实现自定义LLM调用
  }
}

// 注册提供商
langchainManager.registerProvider('custom', CustomLLMProvider);
```

### 2. 自定义工具
```javascript
// 创建自定义工具
const customTool = new DynamicTool({
  name: "custom_tool",
  description: "自定义工具描述",
  func: async (input) => {
    // 工具实现逻辑
    return result;
  }
});

// 注册工具
langchainManager.addTool(customTool);
```

### 3. 新场景类型
```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "自定义场景",
      "description": "场景描述",
      "systemPrompt": "系统提示词",
      "tools": ["tool1", "tool2"],
      "parameters": {...}
    }
  }
}
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库文件权限
   - 确认SQLite版本兼容性
   - 查看错误日志

2. **API调用失败**
   - 验证API密钥有效性
   - 检查网络连接
   - 确认模型可用性

3. **工具执行错误**
   - 检查工具权限
   - 验证参数格式
   - 查看工具日志

### 调试模式

```bash
# 启用调试日志
DEBUG=langchain:* node-red

# 详细错误信息
VERBOSE_ERRORS=true node-red
```

## 迁移指南

### 从旧版本迁移

1. **备份现有配置**
2. **更新依赖包**
3. **迁移配置文件**
4. **测试功能完整性**

### 兼容性说明

- Node.js >= 18.0.0
- Node-RED >= 3.0.0
- SQLite >= 3.35.0
- LangChain.js >= 0.1.0

---

*本文档随项目更新而持续维护*