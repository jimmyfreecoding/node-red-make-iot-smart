/**
 * 测试重新加载LangChain管理器配置
 */

const path = require('path');
const fs = require('fs');

// 导入必要的模块
const MemoryManager = require('../lib/memory-manager');
const LangChainManager = require('../lib/langchain-manager');
const MCPClientHelper = require('../mcp/mcp-client');

async function testReloadLangChain() {
    console.log('🔄 开始测试LangChain管理器重新加载...');
    
    try {
        // 初始化记忆管理器
        const dbPath = path.join(__dirname, '..', 'data', 'memory.db');
        const memoryManager = new MemoryManager(dbPath);
        console.log('✅ 记忆管理器初始化成功');
        
        // 初始化MCP客户端
        const mcpClient = new MCPClientHelper();
        console.log('✅ MCP客户端初始化成功');
        
        // 初始化LangChain管理器
        const langchainManager = new LangChainManager(memoryManager, mcpClient, 'zh-CN');
        console.log('✅ LangChain管理器初始化成功');
        
        // 检查当前configuration场景的配置
        console.log('\n📋 重新加载前的configuration场景配置:');
        const configBefore = langchainManager.getScenarioInfo('configuration');
        console.log('系统提示词长度:', configBefore.systemPrompt?.length || 0);
        console.log('工具列表:', configBefore.tools || []);
        
        // 重新加载配置
        console.log('\n🔄 执行重新加载...');
        langchainManager.reload();
        console.log('✅ 重新加载完成');
        
        // 检查重新加载后的configuration场景配置
        console.log('\n📋 重新加载后的configuration场景配置:');
        const configAfter = langchainManager.getScenarioInfo('configuration');
        console.log('系统提示词长度:', configAfter.systemPrompt?.length || 0);
        console.log('工具列表:', configAfter.tools || []);
        
        // 显示系统提示词的前200个字符
        console.log('\n📝 系统提示词预览:');
        console.log(configAfter.systemPrompt?.substring(0, 200) + '...');
        
        // 检查是否包含工具调用指令
        const hasToolInstruction = configAfter.systemPrompt?.includes('get_settings');
        console.log('\n🔍 是否包含get_settings工具指令:', hasToolInstruction);
        
        if (hasToolInstruction) {
            console.log('✅ 系统提示词已包含工具调用指令');
        } else {
            console.log('❌ 系统提示词未包含工具调用指令');
        }
        
        // 清理资源
        memoryManager.close();
        console.log('\n✅ 测试完成，资源已清理');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行测试
testReloadLangChain();