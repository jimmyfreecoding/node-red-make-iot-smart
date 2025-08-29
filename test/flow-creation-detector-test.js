/**
 * 流程创建意图检测器测试
 * 测试多语言意图检测功能
 */

const FlowCreationDetector = require('../lib/flow-creation-detector');
const path = require('path');

// 测试用例
const testCases = [
    // 中文测试
    { input: '创建一个温度监控流程', language: 'zh-CN', expected: true },
    { input: '生成IoT数据处理工作流', language: 'zh-CN', expected: true },
    { input: '什么是Node-RED', language: 'zh-CN', expected: false },
    { input: '如何使用传感器', language: 'zh-CN', expected: false },
    
    // 英文测试
    { input: 'create a temperature monitoring flow', language: 'en-US', expected: true },
    { input: 'generate IoT automation workflow', language: 'en-US', expected: true },
    { input: 'what is Node-RED', language: 'en-US', expected: false },
    { input: 'how to use sensors', language: 'en-US', expected: false },
    
    // 日文测试
    { input: '温度監視フローを作成', language: 'ja', expected: true },
    { input: 'IoT自動化ワークフローを生成', language: 'ja', expected: true },
    { input: 'Node-REDとは何ですか', language: 'ja', expected: false },
    
    // 韩文测试
    { input: '온도 모니터링 플로우 생성', language: 'ko', expected: true },
    { input: 'IoT 자동화 워크플로우 만들기', language: 'ko', expected: true },
    { input: 'Node-RED가 무엇인가요', language: 'ko', expected: false },
    
    // 法文测试
    { input: 'créer un flux de surveillance de température', language: 'fr', expected: true },
    { input: 'générer un workflow IoT', language: 'fr', expected: true },
    { input: 'qu\'est-ce que Node-RED', language: 'fr', expected: false },
    
    // 德文测试
    { input: 'erstelle einen Temperaturüberwachungsfluss', language: 'de', expected: true },
    { input: 'generiere IoT Workflow', language: 'de', expected: true },
    { input: 'was ist Node-RED', language: 'de', expected: false },
    
    // 俄文测试
    { input: 'создать поток мониторинга температуры', language: 'ru', expected: true },
    { input: 'генерировать IoT рабочий процесс', language: 'ru', expected: true },
    { input: 'что такое Node-RED', language: 'ru', expected: false }
];

async function runTests() {
    console.log('开始测试流程创建意图检测器...');
    console.log('=' .repeat(60));
    
    // 初始化检测器
    const configPath = path.join(__dirname, '../config');
    const detector = new FlowCreationDetector(configPath);
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n测试 ${i + 1}/${totalTests}: ${testCase.language}`);
        console.log(`输入: "${testCase.input}"`);
        console.log(`期望: ${testCase.expected ? '检测到流程创建意图' : '未检测到流程创建意图'}`);
        
        try {
            // 同步检测
            const syncResult = detector.detectFlowCreationIntentSync(testCase.input);
            console.log(`同步检测结果: ${syncResult.isFlowCreation} (置信度: ${syncResult.confidence.toFixed(3)})`);
            
            // 异步检测（如果支持语义分析）
            let asyncResult = null;
            try {
                asyncResult = await detector.detectFlowCreationIntentAsync(testCase.input);
                console.log(`异步检测结果: ${asyncResult.isFlowCreation} (置信度: ${asyncResult.confidence.toFixed(3)})`);
            } catch (error) {
                console.log(`异步检测失败: ${error.message}`);
            }
            
            // 检查结果
            const result = asyncResult || syncResult;
            const isCorrect = result.isFlowCreation === testCase.expected;
            
            if (isCorrect) {
                console.log('✅ 测试通过');
                passedTests++;
            } else {
                console.log('❌ 测试失败');
            }
            
            // 显示检测方法详情
            if (result.detectionMethods) {
                console.log('检测方法详情:');
                Object.entries(result.detectionMethods).forEach(([method, details]) => {
                    if (details && typeof details === 'object' && details.isMatch !== undefined) {
                        console.log(`  - ${method}: ${details.isMatch} (${details.confidence?.toFixed(3) || 'N/A'})`);
                    }
                });
            }
            
        } catch (error) {
            console.log(`❌ 测试错误: ${error.message}`);
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`测试完成: ${passedTests}/${totalTests} 通过 (${(passedTests/totalTests*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！');
    } else {
        console.log(`⚠️  ${totalTests - passedTests} 个测试失败`);
    }
}

// 运行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, testCases };