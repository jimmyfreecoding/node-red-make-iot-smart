# 用户聊天端到端流程文档

本文档详细描述了Node-RED Make IoT Smart项目中用户聊天系统的完整端到端流程，从用户发送消息到LLM处理的整个过程。

## 1. 前端消息发送阶段

**位置：** `ai-sidebar.html`

- 用户在聊天界面输入消息并点击发送
- `sendMessage` 函数被触发（第504行）
- 调用 `sendToAI` 函数处理消息（第516行）

## 2. 前端消息预处理阶段

### 关键字检测和消息增强

前端会根据用户消息中的关键词自动进行消息增强和工具调用触发：

#### 2.1 "当前流程"关键词检测
- **触发条件：** 消息包含"当前流程"或"current flow"
- **处理逻辑：** 
  - 自动切换到development场景（确保get-flow工具可用）
  - 如果有选中的流程，传递流程ID给get-flow工具
  - 修改消息为：`请使用get-flow工具获取流程ID为"${flowId}"的流程数据，然后分析和解释这个流程的功能、节点连接关系和工作原理。`
  - 如果没有选中流程，提示用户先选择流程

#### 2.2 "当前节点"关键词检测
- **触发条件：** 消息包含"当前节点"或"current node"
- **处理逻辑：**
  - 自动切换到development场景（确保get-node-info工具可用）
  - 如果有选中的节点，传递节点信息给get-node-info工具
  - 修改消息为：`请使用get-node-info工具获取节点ID为[${nodeIds}]的详细信息，然后分析和解释${nodeDescription}的功能、配置和作用。`（其中nodeIds为明确的节点ID数组）
  - 如果没有选中节点，提示用户先选择节点

#### 2.3 "当前配置"关键词检测
- **触发条件：** 消息包含"当前配置"、"current config"或"current settings"
- **处理逻辑：**
  - 自动切换到configuration场景（因为get-settings工具只在配置场景中可用）
  - 修改消息为：`请使用get_settings工具获取当前Node-RED的配置信息，然后分析和解释配置文件的各项设置、功能和作用。`

#### 2.4 "当前诊断"关键词检测
- **触发条件：** 消息包含"当前诊断"、"current diagnostics"或"系统诊断"
- **处理逻辑：** 修改消息为诊断工具调用格式

### HTTP请求构造

前端通过fetch API发送流式聊天请求：

```javascript
fetch('/ai-sidebar/stream-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
        message: sendMessage,
        scenario: currentScenario,
        sessionId: getCurrentSessionId(),
        nodeId: nodeId,
        selectedFlow: selectedFlow,
        selectedNodes: selectedNodes,
        dynamicData: dynamicData,
        language: language
    })
})
```

**注意：** 后端会自动从selectedFlow对象中提取flowId并添加到dynamicData中，以供get-flow工具使用。

## 3. 后端路由处理阶段

**位置：** `make-iot-smart.js`

### 3.1 请求接收和预处理
- `/ai-sidebar/stream-chat` 端点接收请求（第703行）
- 设置SSE（Server-Sent Events）响应头，支持UTF-8编码
- 处理可能的编码问题，修复乱码字符
- 记录调试信息到日志文件

### 3.2 配置节点获取
- 获取API配置节点（通过nodeId或全局变量）
- 验证配置节点是否存在
- 调用 `detectToolTrigger` 进行工具触发检测

### 3.3 语言和数据准备
- 更新LangChain管理器的语言设置
- 准备动态数据，包括选中的流程、节点信息等
- 调用 `streamChat` 方法开始流式处理

## 4. LangChain管理器处理阶段

**位置：** `lib/langchain-manager.js`

### 4.1 场景检测
- `detectScenario` 方法根据消息内容检测场景类型
- 支持的场景：
  - **general：** 通用对话
  - **development：** 开发相关
  - **configuration：** 配置管理
  - **diagnosis：** 系统诊断
  - **optimization：** 性能优化

### 4.2 工具调用判断

#### 工具触发检测（detectToolTrigger）
检测特定格式的工具调用触发：
- 特定前缀：`/tool:` 或 `/工具:`
- 特定短语："请使用get-flow工具获取流程ID为"

#### 强制工具模式（shouldForceToolMode）
根据场景和消息内容强制启用工具调用：
- **configuration场景：** 检测"当前配置"、"系统诊断"等关键词
- **其他场景：** 可根据需要扩展

### 4.3 执行模式选择

`executeScenarioChatStream` 方法根据检测结果选择执行模式：

#### 纯LLM模式（executePureLLMChatStream）
- **适用场景：** 不需要工具调用的普通对话
- **处理流程：**
  1. 获取会话上下文
  2. 创建场景提示词
  3. 构建消息历史
  4. 使用LLM流式生成响应
  5. 保存对话到记忆

#### 工具调用模式
- **适用场景：** 需要获取系统信息或执行特定操作
- **处理流程：**
  1. 创建场景化代理（createScenarioAgent）
  2. 获取场景工具列表（getScenarioTools）
  3. 创建场景提示词（createScenarioPrompt）
  4. 流式执行代理任务
  5. 处理工具调用和LLM响应

## 5. 工具调用执行阶段

### 5.1 可用工具类型

| 工具名称 | 功能描述 | 适用场景 |
|---------|---------|----------|
| `get_settings` | 获取Node-RED配置信息 | configuration |
| `get_flow` | 获取流程数据 | development, general |
| `get_node_info` | 获取节点信息 | development, general |
| `search_memory` | 搜索对话记忆 | 所有场景 |
| `get_user_preferences` | 获取用户偏好 | 所有场景 |
| `get_flow_templates` | 获取流程模板 | development |

### 5.2 工具执行流程

1. **工具选择：** 代理分析用户消息，决定调用哪个工具
2. **参数准备：** 从用户消息和动态数据中提取工具参数
3. **工具执行：** 调用相应的工具获取数据
4. **结果处理：** 将工具结果传递给LLM进行分析和格式化
5. **响应生成：** 生成包含工具结果分析的最终响应

### 5.3 特殊工具处理

#### get_flow工具
- 支持动态flowId参数
- 优先使用用户提供的flowId，其次使用dynamicData中的flowId
- 返回完整的流程JSON数据供LLM分析

#### get_settings工具
- 通过MCP客户端获取Node-RED配置
- 返回格式化的配置信息
- 仅在configuration场景中可用

## 6. 流式响应处理阶段

### 6.1 事件类型

| 事件类型 | 描述 | 数据内容 |
|---------|------|----------|
| `start` | 开始响应 | 包含系统提示词信息 |
| `text-delta` | 文本增量 | 流式生成的文本内容 |
| `tool_call` | 工具调用 | 工具名称和参数 |
| `tool_result` | 工具结果 | 工具执行的返回结果 |
| `error` | 错误信息 | 错误详情和堆栈 |
| `done/end/finish` | 响应完成 | 标记流式响应结束 |

### 6.2 数据流向

1. **LangChain管理器 → 后端：** 通过回调函数 `onChunk` 发送流式事件
2. **后端 → 前端：** 通过SSE（Server-Sent Events）将事件发送到前端
3. **前端处理：** `handleStreamData` 函数处理流式数据
4. **界面更新：** 实时更新聊天界面显示

### 6.3 前端流式处理

```javascript
// 处理不同类型的流式事件
switch (data.type) {
    case 'start':
        // 移除加载消息，开始显示实际响应
        break;
    case 'text-delta':
        // 追加文本内容到消息
        break;
    case 'tool_call':
        // 显示工具调用信息
        break;
    case 'tool_result':
        // 显示工具执行结果
        break;
    case 'error':
        // 处理错误信息
        break;
    case 'done':
        // 完成响应处理
        break;
}
```

## 7. 记忆管理阶段

### 7.1 对话保存
- 保存用户消息和AI响应到SQLite数据库
- 记录场景信息、时间戳等元数据
- 保存工具调用历史和中间步骤

### 7.2 会话上下文管理
- 维护当前会话的对话历史
- 支持会话切换和历史回溯
- 提供对话搜索功能

### 7.3 记忆检索
- 支持基于关键词的对话搜索
- 提供会话历史查询接口
- 支持跨会话的知识检索

## 8. 错误处理和容错机制

### 8.1 API认证错误
- 检测API密钥认证失败
- 自动显示错误通知
- 引导用户打开配置界面

### 8.2 网络错误
- 处理网络连接失败
- 显示友好的错误提示
- 支持重试机制

### 8.3 工具调用错误
- 捕获工具执行异常
- 记录详细错误日志
- 向用户显示可理解的错误信息

## 9. 性能优化特性

### 9.1 缓存机制
- LLM实例缓存：避免重复创建LLM实例
- 代理缓存：缓存场景化代理以提高响应速度
- 工具结果缓存：对于相同参数的工具调用结果进行缓存

### 9.2 流式处理
- 实时显示AI生成过程
- 减少用户等待时间
- 提供更好的用户体验

### 9.3 异步处理
- 非阻塞的消息处理
- 支持并发会话
- 优化资源利用率

## 10. 多语言支持

### 10.1 场景配置本地化
- 支持中文（zh-CN）、英文（en-US）、日文（ja-JP）
- 动态加载对应语言的场景配置
- 自动回退到默认语言

### 10.2 界面本地化
- 前端界面多语言支持
- 错误消息本地化
- 工具提示本地化

## 11. 安全考虑

### 11.1 输入验证
- 消息内容安全检查
- 参数类型验证
- SQL注入防护

### 11.2 API密钥保护
- 安全的密钥存储
- 避免密钥泄露到日志
- 支持密钥轮换

### 11.3 访问控制
- 基于Node-RED的权限控制
- 工具调用权限验证
- 会话隔离

## 总结

这个端到端流程设计具有以下关键特点：

1. **智能场景检测：** 根据消息内容自动识别用户意图
2. **关键词触发：** 特定关键词自动触发相应工具调用
3. **强制工具模式：** 某些场景下强制启用工具调用
4. **流式响应：** 实时显示AI生成过程
5. **多语言支持：** 支持中英日三种语言
6. **记忆管理：** 维护对话上下文和历史
7. **错误容错：** 完善的错误处理机制
8. **性能优化：** 缓存和异步处理

这个设计确保了用户消息能够被智能地路由到合适的处理模式，并通过工具调用获取准确的系统信息，最终生成有用的AI响应。整个流程从前端到后端，从消息预处理到最终响应，形成了一个完整、高效、用户友好的聊天系统。