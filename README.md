# Node-RED Make IoT Smart



A powerful AI assistant for Node-RED that makes IoT development smarter and more efficient. Built on **LangChain.js** framework with modular architecture design, supporting multiple LLM providers, intelligent memory management, and comprehensive tool integration.
[![npm version](https://badge.fury.io/js/node-red-make-iot-smart.svg)](https://badge.fury.io/js/node-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)
## Overview

Node-RED Make IoT Smart is an intelligent assistant designed specifically for Node-RED developers. It integrates advanced AI capabilities to help you:

- **Learn Node-RED faster** with interactive tutorials and smart guidance
- **Develop flows more efficiently** with AI-powered code generation and optimization
- **Solve complex IoT challenges** with expert solution recommendations
- **Integrate diverse systems** seamlessly with intelligent protocol handling
- **Manage projects better** with automated planning and best practices

## Features

### AI Assistant
- 🤖 **Multi-LLM Support**: Compatible with OpenAI, Anthropic, Google, Ollama, and more
- 💬 **Interactive Chat Interface**: Intuitive sidebar for seamless AI interaction
- 🧠 **Intelligent Memory**: SQLite-based memory system for context-aware conversations
- 🔧 **Tool Integration**: Comprehensive MCP (Model Context Protocol) tool support
- 🎯 **Scenario-based Assistance**: Specialized modes for different development needs

### Development Tools
- 📝 **Flow Generation**: AI-powered Node-RED flow creation and optimization
- 🔍 **Code Analysis**: Intelligent flow debugging and performance optimization
- 🔗 **System Integration**: Expert guidance for device and API integration
- 📚 **Learning Support**: Interactive tutorials and best practice recommendations
- ⚙️ **Configuration Management**: Automated system setup and optimization

### Upcoming Features
- 🌐 **Remote Debugging**: Advanced debugging capabilities for distributed systems
- 👥 **Team Collaboration**: Multi-user support with shared workspaces
- 📊 **Advanced Analytics**: Deep flow analysis and performance insights
- 🚀 **Smart Deployment**: Intelligent deployment tools and environment management

## Installation

### Method 1: Install via Node-RED Palette Manager

1. Open Node-RED in your browser
2. Go to Menu → Manage Palette
3. Click the "Install" tab
4. Search for `node-red-make-iot-smart`
5. Click "Install"

### Method 2: Install via npm

```bash
npm install node-red-make-iot-smart
```

### Method 3: Install from Source

```bash
git clone https://github.com/jimmyfreecoding/node-red-make-iot-smart.git
cd node-red-make-iot-smart
npm install
npm link
cd ~/.node-red
npm link node-red-make-iot-smart
```

## Configuration

### Basic Setup

1. **Add the Node**: Drag the "Make IoT Smart" node from the palette to your flow
2. **Configure AI Provider**: Double-click the node to open configuration
3. **Set API Key**: Enter your LLM provider's API key
4. **Choose Model**: Select the appropriate model for your needs
5. **Deploy**: Click the Deploy button to activate

### AI Provider Configuration

Supported providers and their configuration:

#### OpenAI
```json
{
  "provider": "openai",
  "apiKey": "your-openai-api-key",
  "model": "gpt-4",
  "baseURL": "https://api.openai.com/v1"
}
```

#### Anthropic
```json
{
  "provider": "anthropic",
  "apiKey": "your-anthropic-api-key",
  "model": "claude-3-sonnet-20240229"
}
```

#### Google
```json
{
  "provider": "google",
  "apiKey": "your-google-api-key",
  "model": "gemini-pro"
}
```

#### Ollama (Local)
```json
{
  "provider": "ollama",
  "baseURL": "http://localhost:11434",
  "model": "llama2"
}
```

### Advanced Configuration

- **Memory Settings**: Configure conversation history and context retention
- **Tool Integration**: Enable/disable specific MCP tools
- **Scenario Customization**: Modify or add custom scenario prompts
- **Performance Tuning**: Adjust streaming, timeout, and retry settings

## Usage

### Quick Start

1. **Open AI Sidebar**: Click the AI assistant icon in the Node-RED sidebar
2. **Select Scenario**: Choose the appropriate assistance mode:
   - **Learning**: For Node-RED tutorials and concept explanations
   - **Development**: For flow creation and code assistance
   - **Solution**: For IoT architecture and solution design
   - **Integration**: For system and device integration
   - **Configuration**: For system setup and optimization
   - **Management**: For project planning and organization
   - **General**: For general Node-RED assistance

3. **Start Chatting**: Type your question or request in the chat interface
4. **Apply Suggestions**: Use the "Apply" button to implement AI-generated flows

### Example Use Cases

#### Learning Node-RED
```
User: "I'm new to Node-RED, please explain the basic concepts"
AI: Provides comprehensive explanation of flows, nodes, and wires with examples
```

#### Creating Flows
```
User: "Create a flow that reads temperature sensor data and sends alerts"
AI: Generates complete JSON flow with detailed explanations
```

#### System Integration
```
User: "How do I connect MQTT devices to a REST API?"
AI: Provides integration architecture and implementation steps
```

#### Troubleshooting
```
User: "My flow is running slowly, help me optimize it"
AI: Analyzes performance and suggests optimizations
```

## Supported Scenarios

### Learning
**Description**: Node-RED learning assistant, providing teaching guidance and knowledge answers

**Sample Prompts**:
- "I'm new to Node-RED, please introduce the basic concepts and core functions of Node-RED"
- "Please explain what Flow, Node and Wire are in Node-RED"
- "How to create my first simple flow in Node-RED? Please provide detailed steps"
- "What are the commonly used core nodes in Node-RED? What are their respective functions?"

**Smart Keywords**: Automatically triggered when learning-related terms are detected
**Dynamic Parameters**: nodeRedVersion, nodeVersion, currentTime, selectedFlow, selectedNodes, userLevel, mcpTools, lang
**System Prompt**: Professional Node-RED learning assistant that explains complex concepts in simple language, provides practical examples, and adjusts explanation depth based on user skill level.

### Solution
**Description**: IoT solution expert, providing technical solutions and architecture recommendations

**Sample Prompts**:
- "I need to design a smart home control system, please provide a complete IoT solution architecture"
- "How to use Node-RED to build an Industry 4.0 data collection and monitoring system?"
- "Please design an agricultural IoT solution, including sensor data collection and automation control"
- "I want to establish a smart city environmental monitoring network, what technical solutions are needed?"

**Smart Keywords**: Automatically triggered when solution design terms are detected
**Dynamic Parameters**: nodeRedVersion, nodeVersion, currentTime, selectedFlow, selectedNodes, projectRequirements, mcpTools, lang
**System Prompt**: Professional IoT solution architect that analyzes business requirements, provides multiple feasible options, compares pros and cons, and recommends optimal technology stacks.

### Integration
**Description**: System integration expert, handling device connections and data integration

**Sample Prompts**:
- "How to integrate MQTT devices and HTTP APIs in Node-RED? Please provide detailed integration solutions"
- "I need to send sensor data from Modbus devices to cloud databases, how to implement this?"
- "Please help me design a data transformation flow that converts JSON format to XML and sends to third-party systems"
- "How to implement unified data collection and processing for multiple different protocol devices in Node-RED?"

**Smart Keywords**: Automatically triggered when integration-related terms are detected
**Dynamic Parameters**: nodeRedVersion, nodeVersion, currentTime, selectedFlow, selectedNodes, integrationTargets, mcpTools, lang
**System Prompt**: Professional system integration engineer focusing on IoT device connections, data integration, and API integration with emphasis on stability and security.

### Development
**Description**: Code development assistant, helping to write and optimize Node-RED flows

**Sample Prompts**:
- "Explanation current flow"
- "Explanation current node"
- "Please help me write a Function node code that implements data filtering and format conversion"
- "How to create a custom node in Node-RED? Please provide complete development steps"
- "My flow is running slowly, please help me analyze performance bottlenecks and provide optimization suggestions"
- "Please design an error handling mechanism to ensure the flow can run stably under abnormal conditions"

**Smart Keywords**: 
- ["create flow", "generate flow", "new flow", "build flow"] → Triggers structured flow creation format

**Dynamic Parameters**: nodeRedVersion, nodeVersion, currentTime, selectedFlow, selectedNodes, developmentTask, mcpTools, lang
**System Prompt**: Professional Node-RED development engineer that writes high-quality flow logic, provides code review and optimization suggestions, and assists with debugging and custom node creation.

### Configuration
**Description**: System configuration expert, handling Node-RED environment and node configuration

**Sample Prompts**:
- "Current Node-RED configuration"
- "Current Node-RED diagnostics"
- "How to configure Node-RED security settings, including user authentication and HTTPS?"
- "Please help me optimize Node-RED performance configuration to improve system efficiency"
- "How to install and manage third-party node packages in Node-RED?"
- "I need to configure Node-RED logging and monitoring, how should I set it up?"

**Smart Keywords**:
- ["current config", "current settings", "system config", "configuration info"] → Triggers get_settings tool
- ["current diagnostics", "system diagnostics", "diagnostic info", "health check"] → Triggers get_diagnostics tool

**Dynamic Parameters**: nodeRedVersion, nodeVersion, currentTime, selectedFlow, selectedNodes, configurationNeeds, mcpTools, lang
**System Prompt**: Professional Node-RED system administrator that provides configuration recommendations, assists with node management, optimizes performance, and handles security configuration with automatic tool calling for current system information.

### Management
**Description**: Project management assistant, helping with flow organization and project planning

**Sample Prompts**:
- "Please help me develop an IoT project development plan and milestone arrangement"
- "How to organize and manage large project flow structures in Node-RED?"
- "I need to assess the risks and quality of the current project, please provide analysis suggestions"
- "How to establish Node-RED development standards and best practices for team collaboration?"

**Smart Keywords**: Automatically triggered when project management terms are detected
**Dynamic Parameters**: nodeRedVersion, nodeVersion, currentTime, selectedFlow, selectedNodes, projectStatus, mcpTools, lang
**System Prompt**: Professional IoT project management expert that analyzes project requirements, provides flow organization recommendations, assists with progress management, and optimizes team collaboration processes.

### General
**Description**: General AI assistant, handling various Node-RED related issues

**Sample Prompts**:
- "What is Node-RED? What are its main features and application scenarios?"
- "I encountered a Node-RED problem, please help me analyze and solve it"
- "Please recommend some Node-RED learning resources and best practices"
- "How to choose the appropriate Node-RED scenario mode to solve my specific needs?"

**Smart Keywords**: No specific keywords - serves as fallback for general inquiries
**Dynamic Parameters**: nodeRedVersion, nodeVersion, currentTime, selectedFlow, selectedNodes, lang
**System Prompt**: Professional Node-RED AI assistant that automatically identifies the most suitable processing method, provides accurate solutions, and guides users to specific professional modes when necessary.

## Supported AI Providers

| Provider | Models | Features |
|----------|--------|----------|
| **OpenAI** | GPT-4, GPT-3.5-turbo | Function calling, streaming, vision |
| **Anthropic** | Claude-3 (Opus, Sonnet, Haiku) | Large context, safety-focused |
| **Google** | Gemini Pro, Gemini Pro Vision | Multimodal, fast inference |
| **Ollama** | Llama2, CodeLlama, Mistral | Local deployment, privacy |
| **Azure OpenAI** | GPT-4, GPT-3.5-turbo | Enterprise features, compliance |
| **Cohere** | Command, Command-Light | Multilingual, enterprise |
| **Hugging Face** | Various open-source models | Customizable, cost-effective |

## API Configuration

### Environment Variables

Set environment variables for your preferred AI provider:

```bash
# OpenAI
export OPENAI_API_KEY="your-api-key"

# Anthropic
export ANTHROPIC_API_KEY="your-api-key"

# Google
export GOOGLE_API_KEY="your-api-key"

# Azure OpenAI
export AZURE_OPENAI_API_KEY="your-api-key"
export AZURE_OPENAI_ENDPOINT="your-endpoint"
```

### Configuration File

Alternatively, create a configuration file:

```json
{
  "llm": {
    "provider": "openai",
    "apiKey": "your-api-key",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "memory": {
    "enabled": true,
    "maxHistory": 50,
    "persistPath": "./data/memory.db"
  },
  "tools": {
    "enabled": true,
    "mcpServers": ["filesystem", "web-search"]
  }
}
```

### Advanced Settings

- **Streaming**: Enable real-time response streaming
- **Temperature**: Control response creativity (0.0-1.0)
- **Max Tokens**: Limit response length
- **Timeout**: Set request timeout duration
- **Retry Logic**: Configure automatic retry on failures
- **Rate Limiting**: Manage API usage limits
- **Separate Models**: Set different models for planning and execution phases

## Development

### Project Structure

```
├── ai-sidebar.html          # Main sidebar interface
├── ai-sidebar-config.json   # UI configuration
├── make-iot-smart.html      # Node configuration template
├── make-iot-smart.js        # Backend node implementation
├── lib/
│   ├── langchain-manager.js # LangChain core manager
│   ├── memory-manager.js    # SQLite memory management
│   └── scenario-manager.js  # Scenario-based prompt management
├── config/
│   └── scenarios.json       # Scenario configuration file
├── data/
│   └── memory.db           # SQLite database file
└── package.json            # Package configuration
```

### Technical Architecture

This project is built on the **LangChain.js** framework with a modular architecture design:

- **LangChain Manager**: Core AI model management, supporting multiple LLM providers
- **Memory Manager**: SQLite-based intelligent memory system, supporting short-term and long-term memory
- **Scenario Manager**: Scenario-based prompt management, supporting JSON configuration and dynamic parameters
- **Tool Manager**: Unified tool management framework, integrating MCP tools and built-in tools
- **API Layer**: RESTful API interface, supporting streaming chat and tool execution

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and commit
4. Submit a pull request

## Roadmap

### Phase 1 (Completed)

- ✅ AI assistant integration
- ✅ Multi-provider support
- ✅ Interactive sidebar
- ✅ Configuration management
- ✅ Scenario-based support
- ✅ LangChain.js architecture migration
- ✅ SQLite memory management system
- ✅ MCP tool integration
- ✅ Unified tool management framework

### Phase 2 (Coming Soon)

- 🔄 Remote debugging functionality
- 🔄 Team collaboration features
- 🔄 Advanced flow analysis
- 🔄 Smart deployment tools

### Phase 3 (Future)

- 📋 Team management system
- 📋 Enterprise features
- 📋 Advanced security options
- 📋 Custom model training

## System Requirements

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## License

Licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Support

AI development is more like art than technology. Mastering LLMs is not a simple task and requires deep understanding of AI models, data, and application scenarios. Each Q&A session may yield different results. Initial versions are often imperfect, but with the improvement of prompt engineering, they will gradually truly meet the daily needs of Node-RED users, whether IT or OT engineers. We welcome more interested people to join the project.

- **Issue Reports**: [GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **Documentation**: [Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## Author

**Zheng He**
- Email: jhe.zheng@gmail.com
- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)

---

*Let AI-driven assistance make your IoT development smarter!*

---
