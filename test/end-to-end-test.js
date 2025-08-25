const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://127.0.0.1:1881';
const TEST_NODE_ID = 'd1b65edb7885fb7b'; // 实际的配置节点ID

// 模拟数据
const MOCK_FLOW = {
    "id": "34ab4d95e517fb00",
    "type": "tab",
    "label": "新流程"
};

const MOCK_NODE = {
    "id": "debug-node",
    "type": "debug",
    "z": "34ab4d95e517fb00",
    "name": "输出调试信息",
    "active": true,
    "tosidebar": true,
    "console": false,
    "tostatus": false,
    "complete": "false",
    "targetType": "msg",
    "statusVal": "",
    "statusType": "auto",
    "x": 550,
    "y": 100,
    "wires": []
};

// 测试用例定义
const TEST_CASES = [
    // 中文环境测试
    {
        language: 'zh-CN',
        testName: '中文环境关键词识别测试',
        testCases: [
            { message: '介绍NodeRed', expectedKeyword: 'NodeRed介绍', scenario: 'learning' },
            { message: '当前流程', expectedKeyword: '当前流程', scenario: 'current_flow' },
            { message: '当前节点', expectedKeyword: '当前节点', scenario: 'current_node' },
            { message: '当前诊断', expectedKeyword: '当前诊断', scenario: 'current_diagnosis' },
            { message: '当前设置', expectedKeyword: '当前设置', scenario: 'current_settings' },
            { message: '当前配置', expectedKeyword: '当前配置', scenario: 'current_settings' }
        ]
    },
    // 英文环境测试
    {
        language: 'en-US',
        testName: '英文环境关键词识别测试',
        testCases: [
            { message: 'how about NodeRed', expectedKeyword: 'NodeRed介绍', scenario: 'learning' },
            { message: 'current flow', expectedKeyword: '当前流程', scenario: 'current_flow' },
            { message: 'current node', expectedKeyword: '当前节点', scenario: 'current_node' },
            { message: 'current diagnostics', expectedKeyword: '当前诊断', scenario: 'current_diagnosis' },
            { message: 'current settings', expectedKeyword: '当前设置', scenario: 'current_settings' }
        ]
    },
    // 日文环境测试
    {
        language: 'ja-JP',
        testName: '日文环境关键词识别测试',
        testCases: [
            { message: '現在のフロー', expectedKeyword: '当前流程', scenario: 'current_flow' },
            { message: '現在のノード', expectedKeyword: '当前节点', scenario: 'current_node' },
            { message: '現在の診断', expectedKeyword: '当前诊断', scenario: 'current_diagnosis' },
            { message: '現在の設定', expectedKeyword: '当前设置', scenario: 'current_settings' }
        ]
    }
];

// 创建测试结果目录
const TEST_RESULTS_DIR = path.join(__dirname, 'test-results');
if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR);
}

// 清空测试结果文件
function clearTestResults() {
    console.log('🧹 清空之前的测试结果文件...');
    
    // 清空所有语言的测试结果文件
    const languages = ['zh-CN', 'en-US', 'ja-JP'];
    languages.forEach(language => {
        const logFile = path.join(TEST_RESULTS_DIR, `${language}-test-results.json`);
        if (fs.existsSync(logFile)) {
            fs.unlinkSync(logFile);
            console.log(`🗑️ 已删除: ${logFile}`);
        }
    });
    
    // 清空测试摘要和报告文件
    const summaryFile = path.join(TEST_RESULTS_DIR, 'test-summary.json');
    const reportFile = path.join(TEST_RESULTS_DIR, 'test-report.md');
    
    if (fs.existsSync(summaryFile)) {
        fs.unlinkSync(summaryFile);
        console.log(`🗑️ 已删除: ${summaryFile}`);
    }
    
    if (fs.existsSync(reportFile)) {
        fs.unlinkSync(reportFile);
        console.log(`🗑️ 已删除: ${reportFile}`);
    }
}

// 根据场景获取元数据
function getMetadataByScenario(scenario) {
    switch (scenario) {
        case 'current_flow':
        case 'current_node':
            return {
                flowData: MOCK_FLOW,
                nodeData: MOCK_NODE
            };
        case 'current_settings':
            return {
                settings: {
                    "httpAdminRoot": "/",
                    "httpNodeRoot": "/api",
                    "userDir": "./data",
                    "functionGlobalContext": {},
                    "debugMaxLength": 1000,
                    "mqttReconnectTime": 15000,
                    "serialReconnectTime": 15000
                }
            };
        case 'current_diagnosis':
            return {
                diagnosis: {
                    "status": "healthy",
                    "checks": [
                        {"name": "memory_usage", "status": "ok", "value": "45%"},
                        {"name": "cpu_usage", "status": "ok", "value": "12%"},
                        {"name": "disk_space", "status": "warning", "value": "85%"}
                    ],
                    "timestamp": new Date().toISOString()
                }
            };
        default:
            return {};
    }
}

// 日志记录函数
function logTestResult(testName, language, message, systemPrompt, humanPrompt, aiResponse, timestamp, scenario = 'learning') {
    const logEntry = {
        timestamp,
        testName,
        language,
        input: {
            message,
            humanPrompt
        },
        systemPrompt,
        aiResponse,
        metadata: getMetadataByScenario(scenario)
    };
    
    const logFile = path.join(TEST_RESULTS_DIR, `${language}-test-results.json`);
    
    let existingLogs = [];
    if (fs.existsSync(logFile)) {
        try {
            existingLogs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        } catch (e) {
            existingLogs = [];
        }
    }
    
    existingLogs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
    
    console.log(`✅ 测试结果已记录到: ${logFile}`);
}



// 执行流式聊天测试
async function executeStreamChatTest(language, testCase, nodeId, scenario = 'learning') {
    try {
        console.log(`\n🌊 执行流式聊天测试: [${language}] ${testCase.message} (场景: ${scenario})`);
        
        // 根据场景获取元数据
        const scenarioMetadata = getMetadataByScenario(scenario);
        
        const requestData = {
            message: testCase.message,
            nodeId: nodeId,
            selectedFlow: MOCK_FLOW,
            selectedNodes: [MOCK_NODE],
            flowData: {
                flows: [MOCK_FLOW],
                nodes: [MOCK_NODE]
            },
            language: language,
            history: [],
            scenario: scenario,
            // 将场景特定的元数据放在dynamicData中，这样后端能正确处理
            dynamicData: scenarioMetadata
        };
        
        // 发送流式聊天请求
        const response = await axios.post(`${BASE_URL}/ai-sidebar/stream-chat`, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            responseType: 'stream',
            timeout: 30000
        });
        
        let fullResponse = '';
        let systemPrompt = '';
        
        return new Promise((resolve) => {
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.type === 'start') {
                                console.log('🚀 流式聊天开始');
                                console.log('场景:', data.scenario);
                                console.log('MCP工具可用:', data.mcpAvailable);
                                console.log('MCP工具数量:', data.mcpToolsCount);
                                // 捕获系统提示词
                                if (data.systemPrompt) {
                                    systemPrompt = data.systemPrompt;
                                    console.log('✅ 成功捕获系统提示词，长度:', systemPrompt.length);
                                }
                            } else if (data.type === 'content') {
                                fullResponse += data.content;
                            } else if (data.type === 'text-delta') {
                                fullResponse += data.textDelta;
                            } else if (data.type === 'tool_call') {
                                console.log('🔧 工具调用:', data.toolName);
                            } else if (data.type === 'end') {
                                console.log('✅ 流式聊天结束');
                            } else if (data.type === 'finish') {
                                console.log('✅ 流式聊天完成');
                            }
                        } catch (e) {
                            // 忽略JSON解析错误
                        }
                    }
                }
            });
            
            response.data.on('end', () => {
                const timestamp = new Date().toISOString();
                const metadata = getMetadataByScenario(scenario);
                
                // 记录流式聊天测试结果
                logTestResult(
                    `${testCase.message} (流式)`,
                    language,
                    testCase.message,
                    systemPrompt || '系统提示词未捕获',
                    testCase.message,
                    fullResponse || '无AI回复内容',
                    timestamp,
                    scenario
                );
                
                console.log('✅ 流式聊天测试完成');
                resolve({
                    success: true,
                    response: fullResponse,
                    metadata: metadata
                });
            });
            
            response.data.on('error', (error) => {
                console.error('❌ 流式聊天错误:', error.message);
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });
        
    } catch (error) {
        console.error(`❌ 流式聊天测试失败: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// 获取可用的节点ID
async function getAvailableNodeId() {
    // 直接使用已配置的节点ID
    if (TEST_NODE_ID && TEST_NODE_ID !== 'your-config-node-id-here') {
        return TEST_NODE_ID;
    }
    
    try {
        // 尝试获取MCP状态来确认节点ID
        const response = await axios.get(`${BASE_URL}/ai-sidebar/mcp-status`);
        if (response.data && response.data.nodeId) {
            return response.data.nodeId;
        }
    } catch (error) {
        console.log('无法自动获取节点ID，请手动指定');
    }
    
    // 如果无法自动获取，返回一个默认值（需要用户手动替换）
    return 'please-replace-with-actual-node-id';
}

// 主测试函数
async function runEndToEndTests() {
    console.log('🚀 开始端到端测试');
    console.log('测试时间:', new Date().toISOString());
    
    // 清空之前的测试结果
    clearTestResults();
    
    // 获取节点ID
    const nodeId = await getAvailableNodeId();
    console.log('使用节点ID:', nodeId);
    
    if (nodeId === 'please-replace-with-actual-node-id') {
        console.log('⚠️  请在脚本中替换为实际的节点ID');
        console.log('您可以在Node-RED界面中找到配置节点的ID');
        return;
    }
    
    const testResults = {
        timestamp: new Date().toISOString(),
        results: []
    };
    
    // 执行所有测试用例
    for (const languageTest of TEST_CASES) {
        console.log(`\n📋 开始 ${languageTest.testName}`);
        
        const languageResults = {
            language: languageTest.language,
            testName: languageTest.testName,
            cases: []
        };
        
        for (const testCase of languageTest.testCases) {
            // 只执行流式聊天测试
            const streamResult = await executeStreamChatTest(languageTest.language, testCase, nodeId, testCase.scenario);
            
            languageResults.cases.push({
                message: testCase.message,
                expectedKeyword: testCase.expectedKeyword,
                streamResult
            });
            
            // 测试间隔
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        testResults.results.push(languageResults);
    }
    
    // 保存总体测试结果
    const summaryFile = path.join(TEST_RESULTS_DIR, 'test-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(testResults, null, 2));
    
    console.log('\n🎉 所有测试完成！');
    console.log(`📊 测试总结已保存到: ${summaryFile}`);
    console.log(`📁 详细结果请查看: ${TEST_RESULTS_DIR}`);
    
    // 生成测试报告
    generateTestReport(testResults);
}

// 生成测试报告
function generateTestReport(testResults) {
    const reportFile = path.join(TEST_RESULTS_DIR, 'test-report.md');
    
    let report = `# 端到端测试报告\n\n`;
    report += `**测试时间:** ${testResults.timestamp}\n\n`;
    
    for (const languageResult of testResults.results) {
        report += `## ${languageResult.testName}\n\n`;
        report += `**语言环境:** ${languageResult.language}\n\n`;
        
        report += `| 测试消息 | 期望关键词 | 流式聊天 | 元数据 |\n`;
        report += `|---------|----------|----------|--------|\n`;
        
        for (const testCase of languageResult.cases) {
            const streamStatus = testCase.streamResult.success ? '✅' : '❌';
            
            // 检查是否有元数据
            let metadataStatus = '❌';
            if (testCase.streamResult.metadata) {
                const hasSettings = testCase.streamResult.metadata.settings;
                const hasDiagnosis = testCase.streamResult.metadata.diagnosis;
                const hasFlowData = testCase.streamResult.metadata.flowData;
                const hasNodeData = testCase.streamResult.metadata.nodeData;
                
                if (hasSettings || hasDiagnosis || hasFlowData || hasNodeData) {
                    metadataStatus = '✅';
                    if (hasSettings) metadataStatus += ' 设置';
                    if (hasDiagnosis) metadataStatus += ' 诊断';
                    if (hasFlowData) metadataStatus += ' 流程';
                    if (hasNodeData) metadataStatus += ' 节点';
                }
            }
            
            report += `| ${testCase.message} | ${testCase.expectedKeyword} | ${streamStatus} | ${metadataStatus} |\n`;
        }
        
        report += `\n`;
    }
    
    fs.writeFileSync(reportFile, report);
    console.log(`📋 测试报告已生成: ${reportFile}`);
}

// 如果直接运行此脚本
if (require.main === module) {
    runEndToEndTests().catch(console.error);
}

module.exports = {
    runEndToEndTests,
    executeStreamChatTest
};