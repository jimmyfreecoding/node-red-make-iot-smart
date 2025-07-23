# Node-RED Make IoT Smart

一个专为Node-RED设计的AI驱动助手扩展，让IoT开发更智能、更高效。

## 概述

Node-RED Make IoT Smart 是一个专为Node-RED开发设计的综合性AI助手。它提供智能代码辅助、自动化流程优化和智能调试功能，以增强您的IoT开发体验。扩展现支持六大场景：学习、方案、集成、开发、配置和管理。

## 功能特性

### 🤖 AI助手

- **智能代码建议**：为Node-RED流程提供上下文感知的代码推荐。
- **智能流程分析**：分析流程并提供优化建议。
- **自然语言界面**：使用自然语言命令与Node-RED环境交互。
- **多提供商支持**：兼容DeepSeek、OpenAI和Anthropic AI模型。

### 🔧 开发工具

- **实时代码分析**：持续分析Node-RED流程。
- **配置管理**：为不同AI提供商提供集中式API配置。
- **交互式侧边栏**：集成到Node-RED编辑器中的专用AI助手面板。
- **JSON编辑器**：内置配置文件编辑器，支持语法高亮。
- **场景化支持**：为六大场景提供定制支持：
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

1. 安装后，您将在Node-RED侧边栏中看到一个新的**MIS**选项卡。
2. 点击配置按钮设置您的AI提供商。
3. 从支持的提供商中选择：
   - **DeepSeek**：具有强大编码能力的经济高效选择。
   - **OpenAI**：行业领先的GPT模型。
   - **Anthropic**：具有Claude模型的高级推理能力。
4. 输入您的API密钥并选择适当的模型。
5. 开始与您的AI助手交互！

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


| 场景 | 描述                                              |
| ---- | ------------------------------------------------- |
| 学习 | 解释节点/概念并提供用于学习的示例流程。           |
| 方案 | 提供多种IoT解决方案，包含流程JSON和节点安装指导。 |
| 集成 | 协助集成协议/软件，生成相关流程。                 |
| 开发 | 优化现有流程和函数节点代码。                      |
| 配置 | 指导修改Node-RED设置（例如`settings.js`）。       |
| 管理 | 支持远程访问、Git集成和批量部署。                 |

## 支持的AI提供商


| 提供商    | 模型                          | 功能特性           |
| --------- | ----------------------------- | ------------------ |
| DeepSeek  | deepseek-chat, deepseek-coder | 经济高效，专注编码 |
| OpenAI    | GPT-3.5, GPT-4                | 通用目的，广泛兼容 |
| Anthropic | Claude-3                      | 高级推理，注重安全 |

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
└── package.json            # 包配置
```

### 贡献

1. Fork仓库。
2. 创建功能分支。
3. 进行更改并提交。
4. 提交拉取请求。

## 路线图

### 第一阶段（当前）

- ✅ AI助手集成
- ✅ 多提供商支持
- ✅ 交互式侧边栏
- ✅ 配置管理
- ✅ 场景化支持

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

根据Apache License 2.0许可。详见[LICENSE](LICENSE)文件。

## 支持

- **问题反馈**：[GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **文档**：[Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **讨论**：[GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## 作者

**Zheng He**

- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)

---

*让AI驱动的辅助让您的IoT开发更智能！*

---
