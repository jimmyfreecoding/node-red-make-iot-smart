const FlowCreationDetector = require('../lib/flow-creation-detector');
const path = require('path');

// 模拟LangChain管理器
class MockLangChainManager {
    constructor() {
        this.scenarios = {
            'zh-CN': {
                general: {
                    systemPrompt: '你是一个专业的Node-RED AI助手。当用户请求创建流程时，请严格按照以下格式回复：\n1. 首先生成功能节点数组的JSON代码\n2. 然后详细解释每个节点的作用和配置\n3. 最后以"点击Apply按钮进行创建"结束描述'
                }
            }
        };
    }

    getScenarios() {
        return this.scenarios;
    }
}

// 测试PLC流程创建检测
async function testPLCFlowCreation() {
    console.log('🧪 测试PLC流程创建检测功能\n');
    
    const mockLangChain = new MockLangChainManager();
    const detector = new FlowCreationDetector(mockLangChain);
    
    const testCases = [
        {
            input: '创建一个关于PLC的流程',
            description: 'PLC流程创建请求（中文）'
        },
        {
            input: 'create a PLC flow',
            description: 'PLC流程创建请求（英文）'
        },
        {
            input: '你需要创建一个Node-RED流程。请严格按照以下格式回复：创建一个关于PLC的流程',
            description: '用户原始消息中的PLC流程创建请求'
        },
        {
            input: '生成一个工业PLC控制流程',
            description: '工业PLC控制流程创建'
        },
        {
            input: 'PLC是什么',
            description: 'PLC概念询问（不应检测为流程创建）'
        }
    ];
    
    let passedTests = 0;
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`测试 ${i + 1}/${testCases.length}: ${testCase.description}`);
        console.log(`输入: "${testCase.input}"`);
        
        try {
            // 同步检测
            const syncResult = detector.detectFlowCreationIntentSync(testCase.input);
            console.log(`同步检测结果: ${syncResult.isFlowCreation} (置信度: ${syncResult.confidence.toFixed(3)})`);
            
            // 异步检测
            const asyncResult = await detector.detectFlowCreationIntentAsync(testCase.input);
            console.log(`异步检测结果: ${asyncResult.isFlowCreation} (置信度: ${asyncResult.confidence.toFixed(3)})`);
            
            // 检查是否正确检测
            const shouldDetect = testCase.input.includes('创建') || testCase.input.includes('生成') || testCase.input.includes('create');
            const isCorrect = (shouldDetect && syncResult.isFlowCreation) || (!shouldDetect && !syncResult.isFlowCreation);
            
            if (isCorrect) {
                console.log('✅ 测试通过');
                passedTests++;
            } else {
                console.log('❌ 测试失败');
            }
            
            // 如果检测到流程创建意图，测试提示词增强
            if (syncResult.isFlowCreation) {
                const enhancedPrompt = detector.enhancePrompt(testCase.input, syncResult);
                console.log('增强后的提示词:');
                console.log(enhancedPrompt.substring(0, 200) + '...');
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`❌ 测试出错: ${error.message}`);
            console.log('');
        }
    }
    
    console.log('============================================================');
    console.log(`测试完成: ${passedTests}/${testCases.length} 通过 (${(passedTests/testCases.length*100).toFixed(1)}%)`);
    
    if (passedTests === testCases.length) {
        console.log('🎉 所有测试通过！');
    } else {
        console.log(`⚠️  ${testCases.length - passedTests} 个测试失败`);
    }
}

// 运行测试
testPLCFlowCreation().catch(console.error);