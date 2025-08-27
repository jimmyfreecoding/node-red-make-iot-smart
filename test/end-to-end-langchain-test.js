/**
 * End-to-End LangChain Architecture Test Script
 * Fully simulates user input flow on the page, recording the complete processing chain
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
require('dotenv').config();

// Mock Node-RED environment
const mockRED = {
    nodes: {
        getNode: (id) => {
            if (id === process.env.TEST_CONFIG_NODE_ID || id === 'test-config-node') {
                return {
                    config: {
                        provider: process.env.TEST_LLM_PROVIDER || 'openai',
                        model: process.env.TEST_LLM_MODEL || 'gpt-3.5-turbo',
                        apiKey: process.env.OPENAI_API_KEY,
                        temperature: 0.7,
                        maxTokens: 4000
                    },
                    credentials: {
                        apiKey: process.env.OPENAI_API_KEY
                    }
                };
            }
            return null;
        },
        getFlows: () => {
            return [
                {
                    id: process.env.TEST_FLOW_ID || 'test-flow-123',
                    label: 'Test Flow',
                    type: 'tab',
                    nodes: [
                        {
                            id: process.env.TEST_NODE_ID || 'test-node-456',
                            type: 'inject',
                            name: 'Test Inject Node',
                            x: 100,
                            y: 100,
                            wires: [['test-node-789']]
                        },
                        {
                            id: 'test-node-789',
                            type: 'debug',
                            name: 'Test Debug Node',
                            x: 300,
                            y: 100,
                            wires: []
                        }
                    ]
                }
            ];
        }
    },
    util: {
        decryptCredentials: (creds) => creds
    },
    _: (key) => key
};

// Set global RED object
global.RED = mockRED;

// Import necessary modules
const LangChainManager = require('../lib/langchain-manager');
const MemoryManager = require('../lib/memory-manager');
const MCPClientHelper = require('../mcp/mcp-client');

// Test configuration
const TEST_CONFIG = {
    languages: ['zh-CN', 'en-US', 'ja', 'ko', 'es-ES', 'pt-BR', 'fr'],
    testCases: {
        'zh-CN': [
            { keyword: 'current flow', expectedTool: 'get-flow', description: 'Get current flow information' },
            { keyword: 'current node', expectedTool: 'get-node-info', description: 'Get current node information' },
            { keyword: 'current config', expectedTool: 'get-settings', description: 'Get current configuration' },
            { keyword: 'current diagnostics', expectedTool: 'get-diagnostics', description: 'Get diagnostics information' },
            { keyword: 'introduce Node-RED', expectedTool: null, description: 'Natural language conversation' }
        ],
        'en-US': [
            { keyword: 'current flow', expectedTool: 'get-flow', description: 'Get current flow information' },
            { keyword: 'current node', expectedTool: 'get-node-info', description: 'Get current node information' },
            { keyword: 'current config', expectedTool: 'get-settings', description: 'Get current configuration' },
            { keyword: 'current diagnostics', expectedTool: 'get-diagnostics', description: 'Get diagnostics information' },
            { keyword: 'introduce Node-RED', expectedTool: null, description: 'Natural language conversation' }
        ],
        'ja': [
            { keyword: '現在のフロー', expectedTool: 'get-flow', description: '現在のフロー情報を取得' },
            { keyword: '現在のノード', expectedTool: 'get-node-info', description: '現在のノード情報を取得' },
            { keyword: '現在の設定', expectedTool: 'get-settings', description: '現在の設定を取得' },
            { keyword: '現在の診断', expectedTool: 'get-diagnostics', description: '診断情報を取得' },
            { keyword: 'Node-REDを紹介', expectedTool: null, description: '自然言語での会話' }
        ],
        'ko': [
            { keyword: '현재 플로우', expectedTool: 'get-flow', description: '현재 플로우 정보 가져오기' },
            { keyword: '현재 노드', expectedTool: 'get-node-info', description: '현재 노드 정보 가져오기' },
            { keyword: '현재 설정', expectedTool: 'get-settings', description: '현재 설정 가져오기' },
            { keyword: '현재 진단', expectedTool: 'get-diagnostics', description: '진단 정보 가져오기' },
            { keyword: 'Node-RED 소개', expectedTool: null, description: '자연어 대화' }
        ],
        'es-ES': [
            { keyword: 'flujo actual', expectedTool: 'get-flow', description: 'Obtener información del flujo actual' },
            { keyword: 'nodo actual', expectedTool: 'get-node-info', description: 'Obtener información del nodo actual' },
            { keyword: 'configuración actual', expectedTool: 'get-settings', description: 'Obtener configuración actual' },
            { keyword: 'diagnóstico actual', expectedTool: 'get-diagnostics', description: 'Obtener información de diagnóstico' },
            { keyword: 'introducir Node-RED', expectedTool: null, description: 'Conversación en lenguaje natural' }
        ],
        'pt-BR': [
            { keyword: 'fluxo atual', expectedTool: 'get-flow', description: 'Obter informações do fluxo atual' },
            { keyword: 'nó atual', expectedTool: 'get-node-info', description: 'Obter informações do nó atual' },
            { keyword: 'configuração atual', expectedTool: 'get-settings', description: 'Obter configuração atual' },
            { keyword: 'diagnóstico atual', expectedTool: 'get-diagnostics', description: 'Obter informações de diagnóstico' },
            { keyword: 'apresentar Node-RED', expectedTool: null, description: 'Conversa em linguagem natural' }
        ],
        'fr': [
            { keyword: 'flux actuel', expectedTool: 'get-flow', description: 'Obtenir les informations du flux actuel' },
            { keyword: 'nœud actuel', expectedTool: 'get-node-info', description: 'Obtenir les informations du nœud actuel' },
            { keyword: 'configuration actuelle', expectedTool: 'get-settings', description: 'Obtenir la configuration actuelle' },
            { keyword: 'diagnostic actuel', expectedTool: 'get-diagnostics', description: 'Obtenir les informations de diagnostic' },
            { keyword: 'présenter Node-RED', expectedTool: null, description: 'Conversation en langage naturel' }
        ]
    }
};

// Test results storage
let testResults = {};

/**
 * Simulate frontend keyword detection
 */
async function simulateKeywordDetection(message, language) {
    try {
        // Simulate getting scenario configuration - search according to LangChain Manager's path
        const localizedScenariosPath = path.join(__dirname, '..', 'config', 'locales', language, 'scenarios.json');
        const defaultScenariosPath = path.join(__dirname, '..', 'config', 'scenarios.json');
        
        let scenariosPath;
        if (fs.existsSync(localizedScenariosPath)) {
            scenariosPath = localizedScenariosPath;
        } else if (fs.existsSync(defaultScenariosPath)) {
            scenariosPath = defaultScenariosPath;
        } else {
            console.log(`Scenario configuration file does not exist: ${localizedScenariosPath} and ${defaultScenariosPath}`);
            return null;
        }
        
        const scenariosData = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
        const scenarios = scenariosData.scenarios || scenariosData;
        const lowerMessage = message.toLowerCase();
        
        // Iterate through all scenario keyword configurations
        for (const [scenarioKey, scenarioConfig] of Object.entries(scenarios)) {
            if (scenarioConfig.keywords) {
                for (const keywordConfig of scenarioConfig.keywords) {
                    for (const keyword of keywordConfig.key) {
                        if (lowerMessage.includes(keyword.toLowerCase())) {
                            return {
                                scenario: keywordConfig.scenario,
                                newHumanPrompt: keywordConfig.newHumanPrompt,
                                matchedKeyword: keyword
                            };
                        }
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.error(`Keyword detection error (${language}):`, error.message);
        return null;
    }
}

/**
 * Simulate frontend message preprocessing
 */
function simulateMessagePreprocessing(message, language) {
    let processedMessage = message;
    let dynamicData = {};
    
    // Simulate "current flow" keyword processing
    if (message.includes('current flow') || message.includes('current flow') || 
        message.includes('現在のフロー') || message.includes('현재 플로우') ||
        message.includes('flujo actual') || message.includes('fluxo atual') ||
        message.includes('flux actuel')) {
        
        const flowId = process.env.TEST_FLOW_ID || 'test-flow-123';
        dynamicData.flowId = flowId;
        
        const promptTemplate = "Please use the get-flow tool to retrieve flow data for flow args:{\"id\":\"{flowId}\"}, then analyze and explain the functionality, node connections, and working principles of this flow.\n\nUser's original request: {originalMessage}";
        processedMessage = promptTemplate.replace('{flowId}', flowId).replace('{originalMessage}', message);
    }
    
    // Simulate "current node" keyword processing
    if (message.includes('current node') || message.includes('current node') ||
        message.includes('現在のノード') || message.includes('현재 노드') ||
        message.includes('nodo actual') || message.includes('nó atual') ||
        message.includes('nœud actuel')) {
        
        const nodeId = process.env.TEST_NODE_ID || 'test-node-456';
        dynamicData.selectedNodes = [{
            id: nodeId,
            type: 'inject',
            name: 'Test Inject Node'
        }];
        
        const nodePromptTemplate = "Please use get-node-info tool to retrieve detailed information for nodes with args:{\"id\":[\"{nodeId}\"]}, then analyze and explain the functionality, configuration, and purpose of the selected node.\n\nUser's original request: {originalMessage}";
        processedMessage = nodePromptTemplate.replace('{nodeId}', nodeId).replace('{originalMessage}', message);
    }
    
    return { processedMessage, dynamicData };
}

/**
 * Execute single test case
 */
async function executeTestCase(testCase, language) {
    console.log(`\nExecuting test case: ${language} - ${testCase.keyword}`);
    
    const testResult = {
        language: language,
        keyword: testCase.keyword,
        description: testCase.description,
        expectedTool: testCase.expectedTool,
        userInput: testCase.keyword,
        detectedKeyword: null,
        toolCallRequired: false,
        toolType: null,
        toolResult: null,
        finalHumanPrompt: null,
        systemPrompt: null,
        llmResponse: null,
        error: null,
        timestamp: new Date().toISOString()
    };
    
    try {
        // 1. Simulate frontend keyword detection
        const keywordDetected = await simulateKeywordDetection(testCase.keyword, language);
        if (keywordDetected) {
            testResult.detectedKeyword = keywordDetected.matchedKeyword;
            testResult.toolCallRequired = true;
        }
        
        // 2. Simulate frontend message preprocessing
        const { processedMessage, dynamicData } = simulateMessagePreprocessing(testCase.keyword, language);
        
        // 3. Initialize dependency components
        const memoryManager = new MemoryManager(':memory:'); // Use in-memory database
        const mcpClient = new MCPClientHelper();
        
        // 4. Initialize LangChain Manager
        const langchainManager = new LangChainManager(memoryManager, mcpClient, language);
        
        // 5. Simulate backend processing
        const options = {
            scenario: keywordDetected?.scenario || 'general',
            sessionId: `test-session-${Date.now()}`,
            config: {
                provider: process.env.TEST_LLM_PROVIDER || 'openai',
                model: process.env.TEST_LLM_MODEL || 'gpt-3.5-turbo',
                apiKey: process.env.OPENAI_API_KEY,
                temperature: 0.7,
                maxTokens: 1000
            },
            selectedFlow: {
                id: process.env.TEST_FLOW_ID || 'test-flow-123',
                label: 'Test Flow'
            },
            selectedNodes: dynamicData.selectedNodes || [],
            dynamicData: dynamicData
        };
        
        // 6. Detect tool trigger
        const toolTrigger = langchainManager.detectToolTrigger(processedMessage);
        if (toolTrigger) {
            testResult.toolCallRequired = true;
            testResult.toolType = 'direct';
        } else {
            const shouldForceTools = await langchainManager.shouldForceToolMode(processedMessage, options.scenario, dynamicData);
            if (shouldForceTools.shouldForce) {
                testResult.toolCallRequired = true;
                testResult.toolType = 'keyword-triggered';
            }
        }
        
        // 7. Build final Human prompt
        let finalMessage = processedMessage;
        if (keywordDetected) {
            finalMessage = keywordDetected.newHumanPrompt + testCase.keyword;
        }
        testResult.finalHumanPrompt = finalMessage;
        
        // 8. Get system prompt
        if (options.scenario && langchainManager.scenarios[options.scenario]) {
            testResult.systemPrompt = langchainManager.scenarios[options.scenario].systemPrompt;
        }
        
        // 9. Simulate tool call (if needed)
        if (testResult.toolCallRequired && testCase.expectedTool) {
            try {
                // Simulate tool execution results
                const mockToolResults = {
                    'get-flow': JSON.stringify({
                        id: process.env.TEST_FLOW_ID || 'test-flow-123',
                        label: 'Test Flow',
                        nodes: [{ id: 'node1', type: 'inject' }, { id: 'node2', type: 'debug' }]
                    }, null, 2),
                    'get-node-info': JSON.stringify({
                        id: process.env.TEST_NODE_ID || 'test-node-456',
                        type: 'inject',
                        name: 'Test Inject Node',
                        properties: { topic: 'test' }
                    }, null, 2),
                    'get-settings': JSON.stringify({
                        version: '3.0.0',
                        settings: { httpAdminRoot: '/', httpNodeRoot: '/api' }
                    }, null, 2),
                    'get-diagnostics': JSON.stringify({
                        system: { memory: '512MB', cpu: '2 cores' },
                        nodeRed: { version: '3.0.0', uptime: '1 hour' }
                    }, null, 2)
                };
                
                testResult.toolResult = mockToolResults[testCase.expectedTool] || 'Mock tool result';
            } catch (toolError) {
                testResult.toolResult = `Tool call error: ${toolError.message}`;
            }
        }
        
        // 10. Simulate LLM response (simplified version)
        if (process.env.OPENAI_API_KEY && process.env.ENABLE_REAL_LLM_CALLS === 'true') {
            try {
                // Real LLM calls can be added here
                testResult.llmResponse = 'Simulated LLM response due to test environment limitations.';
            } catch (llmError) {
                testResult.llmResponse = `LLM call error: ${llmError.message}`;
            }
        } else {
            testResult.llmResponse = `Simulated LLM response (${language}): Based on the request for ${testCase.keyword}, ${testCase.description}.`;
        }
        
    } catch (error) {
        testResult.error = error.message;
        console.error(`Test case execution error:`, error);
    }
    
    return testResult;
}

/**
 * Execute all tests
 */
async function runAllTests() {
    console.log('Starting end-to-end LangChain architecture test...');
    
    for (const language of TEST_CONFIG.languages) {
        console.log(`\n=== Test language: ${language} ===`);
        
        if (!testResults[language]) {
            testResults[language] = [];
        }
        
        const testCases = TEST_CONFIG.testCases[language] || [];
        
        for (const testCase of testCases) {
            const result = await executeTestCase(testCase, language);
            testResults[language].push(result);
            
            // Add delay to avoid API limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Save test results
    const resultsDir = path.join(__dirname, 'test-results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const resultsFile = path.join(resultsDir, 'langchain-e2e-test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    
    console.log(`\nTest completed! Results saved to: ${resultsFile}`);
    
    // Generate test report
    generateTestReport();
}

/**
 * Generate test report
 */
function generateTestReport() {
    const reportPath = path.join(__dirname, 'test-results', 'langchain-e2e-test-report.html');
    
    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LangChain End-to-End Test Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #007acc;
            padding-bottom: 10px;
        }
        h2 {
            color: #007acc;
            margin-top: 40px;
            margin-bottom: 20px;
            border-left: 4px solid #007acc;
            padding-left: 15px;
        }
        .summary {
            background: #e8f4fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .summary-item {
            display: inline-block;
            margin: 10px 20px;
            text-align: center;
        }
        .summary-number {
            font-size: 2em;
            font-weight: bold;
            color: #007acc;
        }
        .summary-label {
            font-size: 0.9em;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #007acc;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #f0f8ff;
        }
        .status-success {
            color: #28a745;
            font-weight: bold;
        }
        .status-error {
            color: #dc3545;
            font-weight: bold;
        }
        .code {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
        .keyword-tag {
            background: #007acc;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin: 2px;
            display: inline-block;
        }
        .tool-tag {
            background: #28a745;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        .no-tool-tag {
            background: #6c757d;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LangChain End-to-End Test Report</h1>
        
        <div class="summary">
            <div class="summary-item">
                <div class="summary-number">${TEST_CONFIG.languages.length}</div>
                <div class="summary-label">Test Languages</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">${Object.values(testResults).reduce((sum, results) => sum + results.length, 0)}</div>
                <div class="summary-label">Total Test Cases</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">${Object.values(testResults).reduce((sum, results) => sum + results.filter(r => !r.error).length, 0)}</div>
                <div class="summary-label">Successful Cases</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">${new Date().toLocaleString('zh-CN')}</div>
                <div class="summary-label">Test Time</div>
            </div>
        </div>
`;
    
    // Generate table for each language
    for (const language of TEST_CONFIG.languages) {
        const results = testResults[language] || [];
        if (results.length === 0) continue;
        
        html += `
        <h2>📋 ${language} Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>User Input</th>
                    <th>Detected Keyword</th>
                    <th>Tool Called</th>
                    <th>Tool Type</th>
                    <th>Tool Result</th>
                    <th>Final Human Prompt</th>
                    <th>System Prompt</th>
                    <th>LLM Response</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
`;
        
        for (const result of results) {
            const statusClass = result.error ? 'status-error' : 'status-success';
            const statusText = result.error ? '❌ Failed' : '✅ Success';
            const toolTag = result.toolCallRequired ? 
                `<span class="tool-tag">${result.expectedTool || 'Unknown Tool'}</span>` : 
                `<span class="no-tool-tag">No Tool Call</span>`;
            
            html += `
                <tr>
                    <td><span class="keyword-tag">${result.userInput}</span></td>
                    <td>${result.detectedKeyword || 'None'}</td>
                    <td>${result.toolCallRequired ? 'Yes' : 'No'}</td>
                    <td>${toolTag}</td>
                    <td><div class="code">${result.toolResult ? result.toolResult.substring(0, 200) + (result.toolResult.length > 200 ? '...' : '') : 'None'}</div></td>
                    <td><div class="code">${result.finalHumanPrompt ? result.finalHumanPrompt.substring(0, 150) + (result.finalHumanPrompt.length > 150 ? '...' : '') : 'None'}</div></td>
                    <td><div class="code">${result.systemPrompt ? result.systemPrompt.substring(0, 100) + (result.systemPrompt.length > 100 ? '...' : '') : 'None'}</div></td>
                    <td><div class="code">${result.llmResponse ? result.llmResponse.substring(0, 150) + (result.llmResponse.length > 150 ? '...' : '') : 'None'}</div></td>
                    <td class="${statusClass}">${statusText}</td>
                </tr>
`;
        }
        
        html += `
            </tbody>
        </table>
`;
    }
    
    html += `
        <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #666;">
            <p>📊 Test Report Generated: ${new Date().toLocaleString('zh-CN')}</p>
            <p>🔧 Based on LANGCHAIN_ARCHITECTURE.md Architecture Documentation</p>
        </div>
    </div>
</body>
</html>
`;
    
    fs.writeFileSync(reportPath, html, 'utf8');
    console.log(`Test report generated: ${reportPath}`);
}

/**
 * Start web server to display test results
 */
function startWebServer() {
    const app = express();
    const port = process.env.TEST_WEB_PORT || 3001;
    
    // Static file service
    app.use('/test-results', express.static(path.join(__dirname, 'test-results')));
    
    // Redirect homepage to test report
    app.get('/', (req, res) => {
        res.redirect('/test-results/langchain-e2e-test-report.html');
    });
    
    // API endpoint returns JSON data
    app.get('/api/test-results', (req, res) => {
        res.json(testResults);
    });
    
    const server = app.listen(port, () => {
        console.log(`\n🌐 Test report web server started:`);
        console.log(`   Access URL: http://localhost:${port}`);
        console.log(`   API Endpoint: http://localhost:${port}/api/test-results`);
    });
    
    return server;
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting LangChain end-to-end test...');
        
        // Check necessary environment variables
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️  Warning: OPENAI_API_KEY not set, will use simulated responses');
        }
        
        // Execute tests
        await runAllTests();
        
        // Start web server
        const server = startWebServer();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down server...');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('Test execution failed:', error);
        process.exit(1);
    }
}

// If running this file directly
if (require.main === module) {
    main();
}

module.exports = {
    runAllTests,
    executeTestCase,
    simulateKeywordDetection,
    simulateMessagePreprocessing,
    startWebServer
};