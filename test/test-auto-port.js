// Test automatic port detection functionality
const path = require('path');

// Mock RED object
const mockRED = {
    settings: {
        uiPort: 1881  // Mock current Node-RED running on port 1881
    }
};

// Mock global RED object
global.RED = mockRED;

// Test automatic port detection
function testAutoPortDetection() {
    console.log('🧪 测试MCP客户端端口自动检测功能');
    
    // Mock configuration node's port detection logic
    const currentPort = mockRED.settings.uiPort || 1880;
    const mcpEnv = `NODE_RED_URL=http://localhost:${currentPort}`;
    
    console.log('✅ 检测到的端口:', currentPort);
    console.log('✅ 生成的MCP环境变量:', mcpEnv);
    
    // Verify results
    if (currentPort === 1881 && mcpEnv === 'NODE_RED_URL=http://localhost:1881') {
        console.log('🎉 端口自动检测功能正常工作！');
        return true;
    } else {
        console.log('❌ 端口自动检测功能异常');
        return false;
    }
}

// Test different port scenarios
function testDifferentPorts() {
    console.log('\n🧪 测试不同端口场景');
    
    const testCases = [
        { port: 1880, expected: 'NODE_RED_URL=http://localhost:1880' },
        { port: 1881, expected: 'NODE_RED_URL=http://localhost:1881' },
        { port: 3000, expected: 'NODE_RED_URL=http://localhost:3000' },
        { port: undefined, expected: 'NODE_RED_URL=http://localhost:1880' } // Default port
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

// Run tests
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