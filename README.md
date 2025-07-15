# Node-RED Make IoT Smart

An AI-powered assistant extension for Node-RED that makes IoT development smarter and more efficient.

## Overview

Node-RED Make IoT Smart is a comprehensive AI assistant designed specifically for Node-RED development. It provides intelligent code assistance, automated flow optimization, and smart debugging capabilities to enhance your IoT development experience.

## Features

### 🤖 AI Assistant
- **Intelligent Code Suggestions**: Get context-aware code recommendations for your Node-RED flows
- **Smart Flow Analysis**: Analyze your flows and receive optimization suggestions
- **Natural Language Interface**: Interact with your Node-RED environment using natural language commands
- **Multi-Provider Support**: Compatible with DeepSeek, OpenAI, and Anthropic AI models

### 🔧 Development Tools
- **Real-time Code Analysis**: Continuous analysis of your Node-RED flows
- **Configuration Management**: Centralized API configuration for different AI providers
- **Interactive Sidebar**: Dedicated AI assistant panel integrated into Node-RED editor
- **JSON Editor**: Built-in editor for configuration files with syntax highlighting

### 🚀 Upcoming Features
- **Remote Debugging**: Debug your Node-RED flows remotely with AI assistance
- **Group Management**: Collaborative development with team management features
- **Advanced Analytics**: Deep insights into your IoT system performance
- **Smart Deployment**: AI-guided deployment strategies for IoT applications

## Installation

### From npm
```bash
npm install @jimmyfreecoding/node-red-make-iot-smart
```

### From Node-RED Palette Manager
1. Open Node-RED editor
2. Go to Menu → Manage palette
3. Search for `@jimmyfreecoding/node-red-make-iot-smart`
4. Click Install

## Configuration

1. After installation, you'll see a new "MIS" tab in the Node-RED sidebar
2. Click the configuration button to set up your AI provider
3. Choose from supported providers:
   - **DeepSeek**: Cost-effective with strong coding capabilities
   - **OpenAI**: Industry-leading GPT models
   - **Anthropic**: Advanced reasoning with Claude models
4. Enter your API key and select the appropriate model
5. Start chatting with your AI assistant!

## Usage

### Basic Chat Interface
- Open the "MIS" sidebar tab
- Type your questions or instructions in natural language
- Get intelligent responses with code suggestions and explanations

### Configuration Management
- Access API settings through the configuration panel
- Switch between different AI providers and models
- Enable different models for planning and execution phases

### Code Analysis
- The AI assistant automatically analyzes your current flow context
- Provides suggestions based on selected nodes and flow structure
- Offers optimization recommendations for better performance

## Supported AI Providers

| Provider | Models | Features |
|----------|--------|----------|
| DeepSeek | deepseek-chat, deepseek-coder | Cost-effective, coding-focused |
| OpenAI | GPT-3.5, GPT-4 | General purpose, widely compatible |
| Anthropic | Claude-3 | Advanced reasoning, safety-focused |

## API Configuration

The extension uses a secure configuration system:
- API keys are stored locally and encrypted
- Support for multiple provider configurations
- Easy switching between different models
- Separate models for planning and execution phases

## Development

### Project Structure
```
├── ai-sidebar.html          # Main sidebar interface
├── ai-sidebar-config.json   # UI configuration
├── make-iot-smart.html      # Node configuration templates
├── make-iot-smart.js        # Backend node implementation
└── package.json            # Package configuration
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Roadmap

### Phase 1 (Current)
- ✅ AI Assistant Integration
- ✅ Multi-provider Support
- ✅ Interactive Sidebar
- ✅ Configuration Management

### Phase 2 (Coming Soon)
- 🔄 Remote Debugging Capabilities
- 🔄 Team Collaboration Features
- 🔄 Advanced Flow Analytics
- 🔄 Smart Deployment Tools

### Phase 3 (Future)
- 📋 Group Management System
- 📋 Enterprise Features
- 📋 Advanced Security Options
- 📋 Custom Model Training

## Requirements

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **Documentation**: [Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## Author

**Zheng He**
- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)

---

*Make your IoT development smarter with AI-powered assistance!*