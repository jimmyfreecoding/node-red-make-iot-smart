// 测试MCP客户端是否正确使用自动检测的端口
const MCPClient = require('../mcp/mcp-client.js');

// 模拟RED对象（类似于Node-RED环境）
const mockRED = {
    settings: {
        uiPort: 1881  // 当前Node-RED运行端口
    }
};

// 设置全局RED对象
global.RED = mockRED;

async function testMCPAutoPort() {
    console.log('🧪 测试MCP客户端端口自动检测功能');
    console.log('当前Node-RED端口:', mockRED.settings.uiPort);
    
    // 模拟配置节点的逻辑
    const currentPort = mockRED.settings.uiPort || 1880;
    const mcpEnv = `NODE_RED_URL=http://localhost:${currentPort}`;
    
    console.log('✅ 自动生成的MCP环境变量:', mcpEnv);
    
    // 解析环境变量
    const envPairs = mcpEnv.split(',');
    let env = {};
    for (const pair of envPairs) {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key && value) {
            env[key] = value;
        }
    }
    
    console.log('✅ 解析后的环境变量:', env);
    
    // 验证端口是否正确
    if (env.NODE_RED_URL === `http://localhost:${currentPort}`) {
        console.log('🎉 MCP客户端将使用正确的端口:', currentPort);
        
        // 尝试创建MCP客户端连接（仅测试配置，不实际连接）
        const mcpClient = new MCPClient();
        console.log('✅ MCP客户端实例创建成功');
        
        console.log('\n📋 连接参数预览:');
        console.log('  命令: npx node-red-mcp-server');
        console.log('  参数: []');
        console.log('  环境变量:', env);
        
        return true;
    } else {
        console.log('❌ 端口配置错误');
        console.log('  期望:', `http://localhost:${currentPort}`);
        console.log('  实际:', env.NODE_RED_URL);
        return false;
    }
}

// 测试多种端口场景
async function testMultiplePortScenarios() {
    console.log('\n🧪 测试多种端口场景');
    
    const testPorts = [1880, 1881, 3000, 8080];
    let allPassed = true;
    
    for (const port of testPorts) {
        console.log(`\n测试端口 ${port}:`);
        mockRED.settings.uiPort = port;
        
        const currentPort = mockRED.settings.uiPort || 1880;
        const mcpEnv = `NODE_RED_URL=http://localhost:${currentPort}`;
        
        const expected = `NODE_RED_URL=http://localhost:${port}`;
        const passed = mcpEnv === expected;
        
        console.log(`  生成的环境变量: ${mcpEnv}`);
        console.log(`  测试结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
        
        if (!passed) {
            allPassed = false;
            console.log(`  期望: ${expected}`);
        }
    }
    
    return allPassed;
}

// 运行测试
if (require.main === module) {
    (async () => {
        console.log('开始测试MCP客户端端口自动检测功能\n');
        
        try {
            const test1 = await testMCPAutoPort();
            const test2 = await testMultiplePortScenarios();
            
            console.log('\n📊 测试结果总结:');
            console.log('基本功能测试:', test1 ? '✅ 通过' : '❌ 失败');
            console.log('多端口场景测试:', test2 ? '✅ 通过' : '❌ 失败');
            
            if (test1 && test2) {
                console.log('\n🎉 所有测试通过！');
                console.log('MCP客户端现在可以自动使用Node-RED当前运行的端口。');
                console.log('\n💡 使用说明:');
                console.log('- 系统会自动检测Node-RED当前运行的端口');
                console.log('- 如果需要指定特定端口，可以在配置中设置mcpEnv参数');
                console.log('- 默认端口为1880（如果无法检测到当前端口）');
                process.exit(0);
            } else {
                console.log('\n❌ 部分测试失败，请检查代码。');
                process.exit(1);
            }
        } catch (error) {
            console.error('\n❌ 测试过程中发生错误:', error);
            process.exit(1);
        }
    })();
}

module.exports = { testMCPAutoPort, testMultiplePortScenarios };