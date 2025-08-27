# Node-RED Make IoT Smart

一个专为Node-RED设计的AI智能助手扩展，让IoT开发更智能、更高效。
[![npm version](https://badge.fury.io/js/node-red-make-iot-smart.svg)](https://badge.fury.io/js/node-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)
## 概述

Node-RED Make IoT Smart 是一个专为Node-RED开发设计的综合性AI智能体。它提供智能代码辅助、自动化流程优化和智能调试功能，以增强您的IoT开发体验。扩展现支持六大场景：学习、方案、集成、开发、配置和管理。

## 功能特性

### 🤖 AI助手

- **智能代码建议**：为Node-RED流程提供上下文感知的代码推荐。
- **智能流程分析**：分析流程并提供优化建议。
- **自然语言界面**：使用自然语言命令与Node-RED环境交互。
- **多国语言支持**：支持中文、英文、日文、韩文等多国语言。跟随Node-RED语言配置变化
- **多提供商支持**：基于LangChain.js框架，支持OpenAI、Anthropic、Google、DeepSeek等多种AI模型。
- **智能记忆管理**：基于SQLite的短期和长期记忆系统，支持对话历史、用户偏好和流程模板存储。
- **场景化提示词**：JSON配置的场景化提示词管理，支持动态参数注入。
- **MCP Tools集成**：支持Model Context Protocol (MCP)工具调用，扩展AI助手能力。


### 🔧 开发工具

- **实时代码分析**：持续分析Node-RED流程。
- **配置管理**：为不同AI提供商提供集中式API配置。
- **交互式侧边栏**：集成到Node-RED编辑器中的专用AI助手面板。
- **JSON编辑器**：内置配置文件编辑器，支持语法高亮。
- **MCP工具集成**：支持Model Context Protocol (MCP)工具调用，扩展AI助手能力。
- **LangChain工具管理**：统一的工具管理框架，支持内置工具和MCP工具。
- **场景化支持**：为七大场景提供定制支持：
  - **学习**：解释节点和概念，提供示例流程。
  - **方案**：提供多种IoT解决方案，包含流程JSON和节点安装指导。
  - **集成**：协助集成协议（例如MQTT、Modbus）或软件。
  - **开发**：优化现有流程和函数节点代码。
  - **配置**：指导修改Node-RED设置（例如`settings.js`）。
  - **管理**：支持远程访问、Git集成和批量部署。

### 🚀 即将推出的功能

- **远程调试**：通过AI辅助远程调试Node-RED流程。
- **团队管理**：具有团队管理功能的协作开发。
- **高级分析**：深入了解IoT系统性能。
- **智能部署**：AI指导的IoT应用部署策略。

## 安装

### 从npm安装

```bash
npm install @jimmyfreecoding/node-red-make-iot-smart
```

### 从Node-RED调色板管理器安装

1. 打开Node-RED编辑器。
2. 转到**菜单 → 管理调色板**。
3. 搜索 `@jimmyfreecoding/node-red-make-iot-smart`。
4. 点击**安装**。

## 配置

### 基本配置

1. 安装后，您将在Node-RED侧边栏中看到一个新的**MIS**选项卡。
2. 点击配置按钮设置您的AI提供商。
3. 从支持的提供商中选择：
   - **DeepSeek**：具有强大编码能力的经济高效选择。
   - **OpenAI**：行业领先的GPT模型。
   - **Anthropic**：具有Claude模型的高级推理能力。
4. 输入您的API密钥并选择适当的模型。
5. 开始与您的AI助手交互！

### LangSmith调试配置（可选）

为了更好地调试和监控LangChain执行过程，您可以配置LangSmith支持：

1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入您的LangSmith配置：
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_api_key_here
   LANGCHAIN_PROJECT=your_project_name
   ```

3. 重启Node-RED以应用配置。

4. 访问 [LangSmith](https://smith.langchain.com/) 查看详细的执行跟踪和调试信息。

**注意**：LangSmith配置是可选的，不配置也不会影响基本功能的使用。

## 使用方法

### 基本聊天界面

- 打开**MIS**侧边栏选项卡。
- 用自然语言输入您的问题或指令。
- 获得智能回复，包含代码建议和解释。

### 场景选择

- 通过侧边栏中的下拉菜单选择场景（学习、方案、集成、开发、配置、管理）。
- AI根据所选场景定制响应，提供相关工具和流程JSON。

### JSON/代码处理

- 大型JSON或代码输出隐藏在**查看JSON/代码**按钮后，保持UI整洁。
- 在内置编辑器中编辑流程JSON，支持语法高亮并可直接应用更改。

### 支持的场景

#### 场景概览

| 场景 | 中文名称 | 描述 | 支持工具 |
|------|----------|------|----------|
| learning | 学习模式 | Node-RED学习助手，提供教学指导和知识解答 | get-flows, get-nodes, create-flow, update-flow |
| solution | 解决方案模式 | IoT解决方案专家，提供技术方案和架构建议 | create-flow, update-flow, get-flows, create-subflow |
| integration | 集成模式 | 系统集成专家，处理设备连接和数据集成 | create-flow, update-flow, install-node, get-node-info |
| development | 开发模式 | 代码开发助手，协助编写和优化Node-RED流程 | create-flow, update-flow, create-subflow, get-node-info, install-node, get-flow |
| configuration | 配置模式 | 系统配置专家，处理Node-RED环境和节点配置 | get_settings, update_settings, install_node, get_node_info, get_diagnostics |
| management | 管理模式 | 项目管理助手，协助流程组织和项目规划 | get-flows, create-flow, update-flow, create-subflow |
| general | 通用模式 | 通用AI助手，处理各种Node-RED相关问题 | 无特定工具限制 |

#### 预置提示词示例

| 场景 | 预置提示词 |
|------|------------|
| **学习模式** | • 我是Node-RED新手，请介绍一下Node-RED的基本概念和核心功能<br>• 请解释Node-RED中的流程(Flow)、节点(Node)和连线(Wire)是什么<br>• 如何在Node-RED中创建我的第一个简单流程？请提供详细步骤<br>• Node-RED中常用的核心节点有哪些？它们分别有什么作用？ |
| **解决方案模式** | • 我需要设计一个智能家居控制系统，请提供完整的IoT解决方案架构<br>• 如何使用Node-RED构建一个工业4.0数据采集和监控系统？<br>• 请设计一个农业物联网解决方案，包括传感器数据收集和自动化控制<br>• 我想建立一个智慧城市的环境监测网络，需要什么技术方案？ |
| **集成模式** | • 如何在Node-RED中集成MQTT设备和HTTP API？请提供详细的集成方案<br>• 我需要将传感器数据从Modbus设备发送到云端数据库，如何实现？<br>• 请帮我设计一个数据转换流程，将JSON格式转换为XML并发送到第三方系统<br>• 如何在Node-RED中实现多个不同协议设备的统一数据采集和处理？ |
| **开发模式** | • 当前流程的详细解释和说明<br>• 当前节点的详细解释和说明<br>• 请帮我编写一个Function节点代码，实现数据过滤和格式转换功能<br>• 如何在Node-RED中创建一个自定义节点？请提供完整的开发步骤 |
| **配置模式** | • NodeRed当前配置情况如何<br>• NodeRed当前诊断情况如何<br>• 如何配置Node-RED的安全设置，包括用户认证和HTTPS？<br>• 请帮我优化Node-RED的性能配置，提高系统运行效率<br>• 如何在Node-RED中安装和管理第三方节点包？<br>• 我需要配置Node-RED的日志记录和监控，应该如何设置？ |
| **管理模式** | • 请帮我制定一个IoT项目的开发计划和里程碑安排<br>• 如何在Node-RED中组织和管理大型项目的流程结构？<br>• 我需要评估当前项目的风险和质量，请提供分析建议<br>• 如何建立团队协作的Node-RED开发规范和最佳实践？ |
| **通用模式** | • Node-RED是什么？它有哪些主要特点和应用场景？<br>• 我遇到了一个Node-RED问题，请帮我分析和解决<br>• 请推荐一些Node-RED的学习资源和最佳实践<br>• 如何选择合适的Node-RED场景模式来解决我的具体需求？ |

#### 智能关键字触发

| 场景 | 关键字 | 触发行为 |
|------|--------|----------|
| **开发模式** | 创建流程、生成流程、创造流程、新建流程 | 自动切换到开发模式，生成完整的Node-RED流程JSON代码并提供详细解释 |
| **配置模式** | 当前配置、系统配置、配置信息、设置、当前设置 | 自动调用get_settings工具获取配置信息，并用表格形式展示 |
| **配置模式** | 当前诊断、系统诊断、诊断信息、健康检查 | 自动调用get_diagnostics工具进行系统诊断 |

#### 动态输入参数

所有场景都支持以下动态参数注入：
- `nodeRedVersion` - Node-RED版本信息
- `nodeVersion` - Node.js版本信息  
- `currentTime` - 当前时间戳
- `selectedFlow` - 当前选中的流程
- `selectedNodes` - 当前选中的节点
- `lang` - 当前语言设置
- `mcpTools` - 可用的MCP工具列表

各场景还支持特定的动态参数：
- **学习模式**：`userLevel` (用户技能水平)
- **解决方案模式**：`projectRequirements` (项目需求)
- **集成模式**：`integrationTargets` (集成目标)
- **开发模式**：`developmentTask` (开发任务)
- **配置模式**：`configurationNeeds` (配置需求)
- **管理模式**：`projectStatus` (项目状态)

#### 系统提示词特性

每个场景都配置了专门的系统提示词，确保AI助手能够：
1. **角色定位**：明确自己在特定场景下的专业角色
2. **输出格式**：根据场景需求提供结构化的响应格式
3. **工具集成**：智能调用相应的MCP工具和Node-RED API
4. **上下文感知**：利用动态参数提供个性化的建议


| 场景 | 描述                                              |
| ---- | ------------------------------------------------- |
| 学习 | 解释节点/概念并提供用于学习的示例流程。           |
| 方案 | 提供多种IoT解决方案，包含流程JSON和节点安装指导。 |
| 集成 | 协助集成协议/软件，生成相关流程。                 |
| 开发 | 优化现有流程和函数节点代码。                      |
| 配置 | 指导修改Node-RED设置（例如`settings.js`）。       |
| 管理 | 支持远程访问、Git集成和批量部署。                 |

## 支持的AI提供商


| 提供商    | 模型                                    | 功能特性           |
| --------- | --------------------------------------- | ------------------ |
| OpenAI    | GPT-3.5, GPT-4, GPT-4o                 | 通用目的，广泛兼容 |
| Anthropic | Claude-3, Claude-3.5                    | 高级推理，注重安全 |
| Google    | Gemini Pro, Gemini Flash                | 多模态，高性能     |
| DeepSeek  | deepseek-chat, deepseek-coder           | 经济高效，专注编码 |
| 其他      | 通过LangChain.js支持的所有LLM提供商     | 扩展性强，灵活配置 |

## API配置

- API密钥在本地存储并加密。
- 支持多个提供商配置。
- 在不同提供商和模型之间轻松切换。
- 为规划和执行阶段分别设置模型。

## 开发

### 项目结构

```
├── ai-sidebar.html          # 主侧边栏界面
├── ai-sidebar-config.json   # UI配置
├── make-iot-smart.html      # 节点配置模板
├── make-iot-smart.js        # 后端节点实现
├── lib/
│   ├── langchain-manager.js # LangChain核心管理器
│   ├── memory-manager.js    # SQLite记忆管理
│   └── scenario-manager.js  # 场景化提示词管理
├── config/
│   └── scenarios.json       # 场景配置文件
├── data/
│   └── memory.db           # SQLite数据库文件
└── package.json            # 包配置
```

### 技术架构

本项目基于**LangChain.js**框架构建，采用模块化架构设计：

- **LangChain Manager**：核心AI模型管理，支持多种LLM提供商
- **Memory Manager**：基于SQLite的智能记忆系统，支持短期和长期记忆
- **Scenario Manager**：场景化提示词管理，支持JSON配置和动态参数
- **Tool Manager**：统一工具管理框架，集成MCP工具和内置工具
- **API Layer**：RESTful API接口，支持流式聊天和工具执行

### 贡献

1. Fork仓库。
2. 创建功能分支。
3. 进行更改并提交。
4. 提交拉取请求。

## 路线图

### 第一阶段（已完成）

- ✅ AI助手集成
- ✅ 多提供商支持
- ✅ 交互式侧边栏
- ✅ 配置管理
- ✅ 场景化支持
- ✅ LangChain.js架构迁移
- ✅ SQLite记忆管理系统
- ✅ MCP工具集成
- ✅ 统一工具管理框架

### 第二阶段（即将推出）

- 🔄 远程调试功能
- 🔄 团队协作功能
- 🔄 高级流程分析
- 🔄 智能部署工具

### 第三阶段（未来）

- 📋 团队管理系统
- 📋 企业功能
- 📋 高级安全选项
- 📋 自定义模型训练

## 系统要求

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## 许可证

根据MIT许可证许可。详见[LICENSE](LICENSE)文件。

## 支持
AI开发更像艺术而非技术，驾驭LLM不是一项简单的任务，需要对AI模型、数据和应用场景有深入的理解，每一次问答可能都会得到不一样的结果，初始的版本往往不尽人意，但是随着提示词工程的完善，会逐步真正满足Node-RED使用者无论是IT还是OT的工程师日常的使用，欢迎更多感兴趣的人员加入项目。
- **问题反馈**：[GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **文档**：[Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **讨论**：[GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## 作者

**Zheng He**
- Email: jhe.zheng@gmail.com
- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)

---

*让AI驱动的辅助让您的IoT开发更智能！*

---
