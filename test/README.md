# LangChain 端到端测试

这个目录包含了完整的LangChain架构端到端测试脚本，用于验证从前端用户输入到LLM响应的完整流程。

## 📁 文件结构

```
test/
├── end-to-end-langchain-test.js    # 主测试脚本
├── run-e2e-test.js                 # 测试启动脚本
├── .env.example                    # 环境配置示例
├── .env                           # 实际环境配置（需要创建）
├── test-results/                  # 测试结果目录
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # 本文档
```

## 🚀 快速开始

### 1. 环境配置

首次运行前，需要配置环境变量：

```bash
# 复制环境配置示例
cp .env.example .env

# 编辑 .env 文件，设置必要的配置
# 特别是 OPENAI_API_KEY（如果要测试真实LLM调用）
```

### 2. 运行测试

```bash
# 运行完整的端到端测试
node run-e2e-test.js

# 仅检查环境配置
node run-e2e-test.js --check

# 启用真实LLM调用（需要有效的API密钥）
node run-e2e-test.js --real-llm

# 指定Web服务器端口
node run-e2e-test.js --port 8080

# 详细输出模式
node run-e2e-test.js --verbose
```

### 3. 查看测试报告

测试完成后，会自动启动Web服务器显示测试报告：

- 默认访问地址: http://localhost:3001
- API接口: http://localhost:3001/api/test-results

## 📊 测试内容

### 测试语言

测试覆盖以下7种语言：
- 中文 (zh-CN)
- 英文 (en-US) 
- 日文 (ja)
- 韩文 (ko)
- 西班牙文 (es-ES)
- 葡萄牙文 (pt-BR)
- 法文 (fr)

### 测试用例

每种语言包含5个测试用例：

1. **get-flow工具触发** - 测试"当前流程"关键字
2. **get-node-info工具触发** - 测试"当前节点"关键字
3. **get-settings工具触发** - 测试"当前配置"关键字
4. **get-diagnostics工具触发** - 测试"当前诊断"关键字
5. **自然语言对话** - 测试"介绍Node-RED"（不触发工具）

### 记录的关键信息

每个测试用例记录以下信息：

- **a. 用户输入文字** - 模拟用户在页面中输入的原始文本
- **b. 检测到的关键字** - LangChain接收到并识别的关键字
- **c. 是否判定为需要调用工具** - 系统是否决定调用工具
- **d. 调用工具的类型和返回内容** - 具体调用的工具及其返回结果
- **e. 拼接后发给LLM的newHuman提示词** - 最终发送给LLM的用户提示
- **f. 发送给LLM的系统提示词** - 系统级别的提示词
- **g. LLM的返回** - 大语言模型的响应结果

## 🔧 环境变量说明

### 必需配置

```bash
# OpenAI API密钥（用于真实LLM调用）
OPENAI_API_KEY=your_openai_api_key_here

# 模拟Node-RED环境
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### 可选配置

```bash
# LLM提供商配置
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# Web服务器端口
TEST_WEB_PORT=3001

# 是否启用真实LLM调用
ENABLE_REAL_LLM_CALLS=false

# 调试配置
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 测试报告

### Web报告

测试完成后生成的HTML报告包含：

- **测试概览** - 总体统计信息
- **分语言表格** - 每种语言的详细测试结果
- **状态指示** - 成功/失败状态
- **响应式设计** - 适配不同屏幕尺寸

### JSON数据

原始测试数据以JSON格式保存，可用于：

- 自动化分析
- 集成到CI/CD流程
- 生成自定义报告

## 🛠️ 技术架构

### 测试流程

1. **环境初始化** - 检查配置、依赖和环境变量
2. **模拟前端** - 模拟用户输入和关键字检测
3. **后端处理** - 调用LangChain Manager处理请求
4. **工具执行** - 模拟或真实执行相关工具
5. **LLM交互** - 构建提示词并获取LLM响应
6. **结果记录** - 保存完整的处理链路信息
7. **报告生成** - 生成Web报告和JSON数据

### 模拟组件

- **Mock Node-RED** - 模拟Node-RED运行环境
- **Mock Tools** - 模拟工具执行结果
- **Mock LLM** - 可选的模拟LLM响应

## 🔍 故障排除

### 常见问题

1. **环境变量未设置**
   ```bash
   # 检查 .env 文件是否存在和配置正确
   node run-e2e-test.js --check
   ```

2. **依赖缺失**
   ```bash
   # 安装必要依赖
   npm install express dotenv
   ```

3. **API密钥无效**
   ```bash
   # 使用模拟模式测试
   node run-e2e-test.js
   # 或设置 ENABLE_REAL_LLM_CALLS=false
   ```

4. **端口被占用**
   ```bash
   # 指定其他端口
   node run-e2e-test.js --port 8080
   ```

### 调试模式

```bash
# 启用详细输出
node run-e2e-test.js --verbose

# 或在 .env 中设置
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 扩展开发

### 添加新语言

1. 在 `TEST_CONFIG.languages` 中添加语言代码
2. 在 `TEST_CONFIG.testCases` 中添加对应的测试用例
3. 确保相应的语言配置文件存在

### 添加新测试用例

```javascript
// 在相应语言的测试用例中添加
{ 
    keyword: '新关键字', 
    expectedTool: 'new-tool', 
    description: '新测试用例描述' 
}
```

### 自定义工具模拟

在 `executeTestCase` 函数中的 `mockToolResults` 对象中添加新工具的模拟结果。

## 📄 许可证

本测试脚本遵循与主项目相同的许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进测试脚本！

---

**注意**: 本测试脚本基于 `LANGCHAIN_ARCHITECTURE.md` 文档中描述的架构设计，确保测试覆盖了完整的用户交互流程。