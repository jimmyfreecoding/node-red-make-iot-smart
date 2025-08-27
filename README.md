# Node-RED Make IoT Smart

A comprehensive AI-driven assistant extension for Node-RED, making IoT development smarter and more efficient.

## Overview

Node-RED Make IoT Smart is a specialized AI assistant designed for Node-RED development. It provides intelligent code suggestions, automated flow optimization, and smart debugging capabilities to enhance your IoT development experience. The extension now supports six distinct scenarios: Learning, Solution, Integration, Development, Configuration, and Management.

## Features

### 🤖 AI Assistant

- **Intelligent Code Suggestions**: Context-aware code recommendations for Node-RED flows.
- **Smart Flow Analysis**: Analyzes flows and provides optimization suggestions.
- **Natural Language Interface**: Interact with your Node-RED environment using natural language commands.
- **Multi-Provider Support**: Compatible with DeepSeek, OpenAI, and Anthropic AI models.

### 🔧 Development Tools

- **Real-Time Code Analysis**: Continuously analyzes your Node-RED flows.
- **Configuration Management**: Centralized API configuration for different AI providers.
- **Interactive Sidebar**: Dedicated AI assistant panel integrated into the Node-RED editor.
- **JSON Editor**: Built-in editor for configuration files with syntax highlighting.
- **Scenario-Based Assistance**: Tailored support for six scenarios:
  - **Learning**: Explains nodes and concepts with sample flows.
  - **Solution**: Provides multiple IoT solutions with flow JSON and node installation guidance.
  - **Integration**: Assists with integrating protocols (e.g., MQTT, Modbus) or software.
  - **Development**: Optimizes existing flows and function node code.
  - **Configuration**: Guides modification of Node-RED settings (e.g., `settings.js`).
  - **Management**: Supports remote access, Git integration, and batch deployment.

### 🚀 Upcoming Features

- **Remote Debugging**: AI-assisted remote debugging for Node-RED flows.
- **Team Management**: Collaborative development with team management features.
- **Advanced Analytics**: Deep insights into IoT system performance.
- **Smart Deployment**: AI-guided deployment strategies for IoT applications.

## Installation

### Install from npm

```bash
npm install @jimmyfreecoding/node-red-make-iot-smart
```

### Install from Node-RED Palette Manager

1. Open the Node-RED editor.
2. Navigate to **Menu → Manage Palette**.
3. Search for `@jimmyfreecoding/node-red-make-iot-smart`.
4. Click **Install**.

## Configuration

1. After installation, a new **MIS** tab appears in the Node-RED sidebar.
2. Click the configuration button to set up your AI provider.
3. Choose from supported providers:
   - **DeepSeek**: Cost-effective with strong coding capabilities.
   - **OpenAI**: Industry-leading GPT models.
   - **Anthropic**: Advanced reasoning with Claude models.
4. Enter your API key and select the appropriate model.
5. Start interacting with your AI assistant!

## Usage

### Basic Chat Interface

- Open the **MIS** sidebar tab.
- Input your question or command in natural language.
- Receive intelligent responses with code suggestions and explanations.

### Scenario Selection

- Select a scenario (Learning, Solution, Integration, Development, Configuration, Management) via the dropdown in the sidebar.
- The AI tailors responses to the chosen scenario, providing relevant tools and flow JSON.

### JSON/Code Handling

- Large JSON or code outputs are hidden behind a **View JSON/Code** button to keep the UI clean.
- Edit flow JSON in a built-in editor with syntax highlighting and apply changes directly.

### Supported Scenarios


| Scenario      | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| Learning      | Explains nodes/concepts and provides sample flows for learning.              |
| Solution      | Offers multiple IoT solutions with flow JSON and node installation guidance. |
| Integration   | Assists with integrating protocols/software, generating relevant flows.      |
| Development   | Optimizes existing flows and function node code.                             |
| Configuration | Guides modification of Node-RED settings (e.g.,`settings.js`).               |
| Management    | Supports remote access, Git integration, and batch deployment.               |

## Supported AI Providers


| Provider  | Models                        | Features                             |
| --------- | ----------------------------- | ------------------------------------ |
| DeepSeek  | deepseek-chat, deepseek-coder | Cost-effective, coding-focused       |
| OpenAI    | GPT-3.5, GPT-4                | General-purpose, broad compatibility |
| Anthropic | Claude-3                      | Advanced reasoning, safety-focused   |

## API Configuration

- API keys are stored locally and encrypted.
- Supports multiple provider configurations.
- Easily switch between providers and models.
- Separate model settings for planning and execution phases.

## Development

### Project Structure

```
├── ai-sidebar.html          # Main sidebar interface
├── ai-sidebar-config.json   # UI configuration
├── make-iot-smart.html      # Node configuration template
├── make-iot-smart.js        # Backend node implementation
└── package.json            # Package configuration
```

### Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make changes and commit.
4. Submit a pull request.

## Roadmap

### Phase 1 (Current)

- ✅ AI assistant integration
- ✅ Multi-provider support
- ✅ Interactive sidebar
- ✅ Configuration management
- ✅ Scenario-based assistance

### Phase 2 (Upcoming)

- 🔄 Remote debugging capabilities
- 🔄 Team collaboration features
- 🔄 Advanced flow analytics
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

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **Documentation**: [Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## Author

**Zheng He**

- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)

---

*Make your IoT development smarter with AI-driven assistance!*

---
