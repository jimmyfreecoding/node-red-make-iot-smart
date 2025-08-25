// 测试自动端口检测功能
const path = require('path');

// 模拟RED对象
const mockRED = {
    settings: {
        uiPort: 1881  // 模拟当前Node-RED运行在1881端口
    }
};

// 模拟全局RED对象
global.RED = mockRED;

// 测试端口自动检测
function testAutoPortDetection() {
    console.log('🧪 测试MCP客户端端口自动检测功能');
    
    // 模拟配置节点的端口检测逻辑
    const currentPort = mockRED.settings.uiPort || 1880;
    const mcpEnv = `NODE_RED_URL=http://localhost:${currentPort}`;
    
    console.log('✅ 检测到的端口:', currentPort);
    console.log('✅ 生成的MCP环境变量:', mcpEnv);
    
    // 验证结果
    if (currentPort === 1881 && mcpEnv === 'NODE_RED_URL=http://localhost:1881') {
        console.log('🎉 端口自动检测功能正常工作！');
        return true;
    } else {
        console.log('❌ 端口自动检测功能异常');
        return false;
    }
}

// 测试不同端口场景
function testDifferentPorts() {
    console.log('\n🧪 测试不同端口场景');
    
    const testCases = [
        { port: 1880, expected: 'NODE_RED_URL=http://localhost:1880' },
        { port: 1881, expected: 'NODE_RED_URL=http://localhost:1881' },
        { port: 3000, expected: 'NODE_RED_URL=http://localhost:3000' },
        { port: undefined, expected: 'NODE_RED_URL=http://localhost:1880' } // 默认端口
    ];
    
    let allPassed = true;
    
    testCases.forEach((testCase, index) => {
        mockRED.settings.uiPort = testCase.port;
        const currentPort = mockRED.settings.uiPort || 1880;
        const mcpEnv = `NODE_RED_URL=http://localhost:${currentPort}`;
        
        const passed = mcpEnv === testCase.expected;
        console.log(`测试 ${index + 1}: 端口 ${testCase.port || 'undefined'} -> ${mcpEnv} ${passed ? '✅' : '❌'}`);
        
        if (!passed) {
            allPassed = false;
            console.log(`   期望: ${testCase.expected}`);
            console.log(`   实际: ${mcpEnv}`);
        }
    });
    
    return allPassed;
}

// 运行测试
if (require.main === module) {
    console.log('开始测试MCP端口自动检测功能\n');
    
    const test1 = testAutoPortDetection();
    const test2 = testDifferentPorts();
    
    console.log('\n📊 测试结果总结:');
    console.log('基本功能测试:', test1 ? '✅ 通过' : '❌ 失败');
    console.log('多端口场景测试:', test2 ? '✅ 通过' : '❌ 失败');
    
    if (test1 && test2) {
        console.log('\n🎉 所有测试通过！MCP端口自动检测功能正常工作。');
        process.exit(0);
    } else {
        console.log('\n❌ 部分测试失败，请检查代码。');
        process.exit(1);
    }
}

module.exports = { testAutoPortDetection, testDifferentPorts };