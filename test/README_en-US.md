# LangChain End-to-End Testing

This directory contains complete LangChain architecture end-to-end test scripts to verify the complete process from frontend user input to LLM response.

## 📁 File Structure

```
test/
├── end-to-end-langchain-test.js    # Main test script
├── run-e2e-test.js                 # Test launcher script
├── .env.example                    # Environment configuration example
├── .env                           # Actual environment configuration (needs to be created)
├── test-results/                  # Test results directory
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # This document
```

## 🚀 Quick Start

### 1. Environment Configuration

Before first run, you need to configure environment variables:

```bash
# Copy environment configuration example
cp .env.example .env

# Edit .env file and set necessary configurations
# Especially OPENAI_API_KEY (if you want to test real LLM calls)
```

### 2. Run Tests

```bash
# Run complete end-to-end tests
node run-e2e-test.js

# Check environment configuration only
node run-e2e-test.js --check

# Enable real LLM calls (requires valid API key)
node run-e2e-test.js --real-llm

# Specify web server port
node run-e2e-test.js --port 8080

# Verbose output mode
node run-e2e-test.js --verbose
```

### 3. View Test Reports

After tests complete, a web server will automatically start to display test reports:

- Default access URL: http://localhost:3001
- API endpoint: http://localhost:3001/api/test-results

## 📊 Test Content

### Test Languages

Tests cover the following 7 languages:
- Chinese (zh-CN)
- English (en-US) 
- Japanese (ja)
- Korean (ko)
- Spanish (es-ES)
- Portuguese (pt-BR)
- French (fr)

### Test Cases

Each language includes 5 test cases:

1. **get-flow tool trigger** - Test "current flow" keyword
2. **get-node-info tool trigger** - Test "current node" keyword
3. **get-settings tool trigger** - Test "current config" keyword
4. **get-diagnostics tool trigger** - Test "current diagnostics" keyword
5. **Natural language conversation** - Test "introduce Node-RED" (no tool trigger)

### Recorded Key Information

Each test case records the following information:

- **a. User input text** - Simulated original text entered by user on the page
- **b. Detected keywords** - Keywords received and identified by LangChain
- **c. Whether determined to call tools** - Whether the system decides to call tools
- **d. Tool type and return content** - Specific tools called and their return results
- **e. Concatenated newHuman prompt sent to LLM** - Final user prompt sent to LLM
- **f. System prompt sent to LLM** - System-level prompts
- **g. LLM response** - Large language model response results

## 🔧 Environment Variables

### Required Configuration

```bash
# OpenAI API key (for real LLM calls)
OPENAI_API_KEY=your_openai_api_key_here

# Simulate Node-RED environment
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### Optional Configuration

```bash
# LLM provider configuration
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# Web server port
TEST_WEB_PORT=3001

# Whether to enable real LLM calls
ENABLE_REAL_LLM_CALLS=false

# Debug configuration
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 Test Reports

### Web Reports

HTML reports generated after test completion include:

- **Test Overview** - Overall statistics
- **Language Tables** - Detailed test results for each language
- **Status Indicators** - Success/failure status
- **Responsive Design** - Adapts to different screen sizes

### JSON Data

Raw test data is saved in JSON format and can be used for:

- Automated analysis
- Integration into CI/CD pipelines
- Generating custom reports

## 🛠️ Technical Architecture

### Test Process

1. **Environment Initialization** - Check configuration, dependencies and environment variables
2. **Frontend Simulation** - Simulate user input and keyword detection
3. **Backend Processing** - Call LangChain Manager to process requests
4. **Tool Execution** - Simulate or actually execute related tools
5. **LLM Interaction** - Build prompts and get LLM responses
6. **Result Recording** - Save complete processing chain information
7. **Report Generation** - Generate web reports and JSON data

### Simulation Components

- **Mock Node-RED** - Simulate Node-RED runtime environment
- **Mock Tools** - Simulate tool execution results
- **Mock LLM** - Optional simulated LLM responses

## 🔍 Troubleshooting

### Common Issues

1. **Environment variables not set**
   ```bash
   # Check if .env file exists and is configured correctly
   node run-e2e-test.js --check
   ```

2. **Missing dependencies**
   ```bash
   # Install necessary dependencies
   npm install express dotenv
   ```

3. **Invalid API key**
   ```bash
   # Use simulation mode for testing
   node run-e2e-test.js
   # Or set ENABLE_REAL_LLM_CALLS=false
   ```

4. **Port occupied**
   ```bash
   # Specify another port
   node run-e2e-test.js --port 8080
   ```

### Debug Mode

```bash
# Enable verbose output
node run-e2e-test.js --verbose

# Or set in .env
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 Extension Development

### Adding New Languages

1. Add language code to `TEST_CONFIG.languages`
2. Add corresponding test cases to `TEST_CONFIG.testCases`
3. Ensure corresponding language configuration files exist

### Adding New Test Cases

```javascript
// Add to test cases for corresponding language
{ 
    keyword: 'new keyword', 
    expectedTool: 'new-tool', 
    description: 'new test case description' 
}
```

### Custom Tool Simulation

Add simulation results for new tools in the `mockToolResults` object in the `executeTestCase` function.

## 📄 License

This test script follows the same license as the main project.

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve the test scripts!

---

**Note**: This test script is based on the architecture design described in the `LANGCHAIN_ARCHITECTURE.md` document, ensuring test coverage of the complete user interaction process.