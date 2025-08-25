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

// 中文"当前配置"专项测试
async function testCurrentConfigZH() {
    console.log('🚀 开始中文"当前配置"专项测试');
    console.log('测试时间:', new Date().toISOString());
    
    try {
        console.log('\n🌊 执行流式聊天测试: [zh-CN] 当前配置');
        
        // 构建请求数据，模拟用户在界面中发出"当前配置"请求
        // 模拟前端ai-sidebar.html中的逻辑：检测到"当前配置"时自动切换到configuration场景并修改消息
        const originalMessage = '当前配置';
        const modifiedMessage = `请使用get_settings工具获取当前Node-RED的配置信息，然后分析和解释配置文件的各项设置、功能和作用。\n\n用户原始请求：${originalMessage}`;
        
        const requestData = {
            message: modifiedMessage,
            nodeId: TEST_NODE_ID,
            selectedFlow: MOCK_FLOW,
            selectedNodes: [MOCK_NODE],
            flowData: {
                flows: [MOCK_FLOW],
                nodes: [MOCK_NODE]
            },
            language: 'zh-CN',
            history: [],
            scenario: 'configuration',
            // 设置元数据，模拟当前配置场景
            dynamicData: {
                settings: {
                    "httpAdminRoot": "/admin",
                    "httpNodeRoot": "/",
                    "userDir": "/home/nodered/.node-red",
                    "nodesDir": "/home/nodered/.node-red/nodes",
                    "uiHost": "0.0.0.0",
                    "uiPort": 1880,
                    "httpStatic": "/usr/src/node-red/public",
                    "httpStaticAuth": {
                        "user": "",
                        "pass": ""
                    },
                    "httpAuth": {
                        "user": "",
                        "pass": ""
                    },
                    "https": {
                        "enabled": false,
                        "key": "",
                        "cert": ""
                    },
                    "disableEditor": false,
                    "flowFile": "flows.json",
                    "flowFilePretty": true,
                    "credentialSecret": "false",
                    "httpNodeCors": {
                        "origin": "*",
                        "methods": "GET,PUT,POST,DELETE"
                    },
                    "httpNodeMiddleware": [],
                    "logging": {
                        "console": {
                            "level": "info",
                            "metrics": false,
                            "audit": false
                        }
                    },
                    "contextStorage": {
                        "default": "memory",
                        "memory": {}
                    },
                    "exportGlobalContextKeys": false,
                    "externalModules": {},
                    "editorTheme": {
                        "palette": {},
                        "projects": {
                            "enabled": false
                        },
                        "codeEditor": {
                            "lib": "monaco",
                            "options": {}
                        }
                    },
                    "functionExternalModules": true,
                    "functionGlobalContext": {},
                    "debugMaxLength": 1000,
                    "mqttReconnectTime": 15000,
                    "serialReconnectTime": 15000,
                    "socketReconnectTime": 15000,
                    "socketTimeout": 120000,
                    "maxMessageSize": 1048576,
                    "tcpTimeout": 120000,
                    "inactivityTimeout": 0,
                    "verbose": false
                }
            }
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
        let hasGetSettingsTool = false;
        let toolCallDetails = [];
        
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
                                    console.log('系统提示词预览:', systemPrompt.substring(0, 200) + '...');
                                }
                            } else if (data.type === 'content') {
                                fullResponse += data.content;
                            } else if (data.type === 'text-delta') {
                                fullResponse += data.textDelta;
                            } else if (data.type === 'tool_call') {
                                console.log('🔧 工具调用:', data.toolName);
                                if (data.toolName === 'get_settings') {
                                    hasGetSettingsTool = true;
                                    console.log('✅ 检测到get_settings工具调用');
                                }
                                toolCallDetails.push({
                                    toolName: data.toolName,
                                    params: data.params || {}
                                });
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
                
                // 分析测试结果
                console.log('\n📊 测试结果分析:');
                console.log('- 系统提示词捕获:', systemPrompt ? '✅ 成功' : '❌ 失败');
                console.log('- get_settings工具调用:', hasGetSettingsTool ? '✅ 成功' : '❌ 失败');
                console.log('- AI回复内容长度:', fullResponse.length);
                console.log('- 工具调用次数:', toolCallDetails.length);
                
                // 检查系统提示词是否包含专业配置管理员角色
                const isConfigExpert = systemPrompt.includes('Node-RED系统管理员') || 
                                     systemPrompt.includes('配置专家') ||
                                     systemPrompt.includes('get_settings');
                console.log('- 配置专家角色识别:', isConfigExpert ? '✅ 成功' : '❌ 失败');
                
                // 检查AI回复是否包含配置分析
                const hasConfigAnalysis = fullResponse.includes('配置') && 
                                         (fullResponse.includes('分析') || fullResponse.includes('设置'));
                console.log('- 配置分析内容:', hasConfigAnalysis ? '✅ 成功' : '❌ 失败');
                
                // 保存测试结果
                const testResult = {
                    timestamp,
                    testName: '中文"当前配置"专项测试',
                    language: 'zh-CN',
                    input: {
                        message: '当前配置',
                        humanPrompt: '当前配置'
                    },
                    systemPrompt: systemPrompt || '系统提示词未捕获',
                    aiResponse: fullResponse || '无AI回复内容',
                    toolCalls: toolCallDetails,
                    analysis: {
                        systemPromptCaptured: !!systemPrompt,
                        getSettingsToolCalled: hasGetSettingsTool,
                        configExpertRoleDetected: isConfigExpert,
                        configAnalysisPresent: hasConfigAnalysis,
                        responseLength: fullResponse.length,
                        toolCallCount: toolCallDetails.length
                    },
                    metadata: {
                        settings: requestData.dynamicData.settings
                    }
                };
                
                // 保存到文件
                const resultFile = path.join(__dirname, 'test-results', 'current-config-zh-test.json');
                fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2));
                console.log(`\n💾 测试结果已保存到: ${resultFile}`);
                
                console.log('\n✅ 中文"当前配置"专项测试完成');
                resolve({
                    success: true,
                    response: fullResponse,
                    analysis: testResult.analysis
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
        console.error(`❌ 测试失败: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testCurrentConfigZH().catch(console.error);
}

module.exports = {
    testCurrentConfigZH
};