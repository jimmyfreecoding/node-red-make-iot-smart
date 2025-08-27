const LangChainManager = require('../lib/langchain-manager.js');
const MCPClient = require('../mcp/mcp-client.js');

// 创建模拟对象
const mockMemoryManager = {
    getSessionContext: () => [],
    addConversation: () => {},
    addToSessionContext: () => {}
};

// 创建MCP客户端
const mcpClient = new MCPClient();

async function debugMCPTools() {
    // console.log('🔍 开始调试MCP工具连接状态');
    
    try {
        // 检查MCP连接
        // console.log('1. 检查MCP连接状态:', mcpClient.isClientConnected());
        
        if (!mcpClient.isClientConnected()) {
            // console.log('2. 尝试连接MCP服务器...');
            const success = await mcpClient.connect('npx node-red-mcp-server', [], { NODE_RED_URL: 'http://localhost:1880' });
            // console.log('   连接结果:', success);
        }
        
        if (mcpClient.isClientConnected()) {
            // console.log('3. 获取MCP工具列表...');
            const serverInfo = await mcpClient.getServerInfo();
            // console.log('   可用工具:', serverInfo.tools?.map(t => t.name) || []);
            
            // 创建LangChain管理器
            // console.log('4. 创建LangChain管理器...');
            const manager = new LangChainManager(mockMemoryManager, mcpClient);
            
            // 等待工具初始化
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // console.log('5. 检查转换后的工具...');
            // console.log('   工具Map大小:', manager.tools.size);
            // console.log('   工具名称列表:', Array.from(manager.tools.keys()));
            
            // 检查configuration场景的工具
            // console.log('6. 检查configuration场景工具...');
            const configTools = manager.getScenarioTools('configuration');
            // console.log('   configuration场景工具数量:', configTools.length);
            // console.log('   configuration场景工具名称:', configTools.map(t => t.name));
            
            // 测试get-settings工具是否存在
            const getSettingsTool = manager.tools.get('get-settings');
            // console.log('7. get-settings工具检查:');
            // console.log('   工具存在:', !!getSettingsTool);
            if (getSettingsTool) {
                // console.log('   工具名称:', getSettingsTool.name);
                // console.log('   工具描述:', getSettingsTool.description);
            }
            
        } else {
            // console.log('❌ MCP连接失败，无法继续测试');
        }
        
    } catch (error) {
        // console.error('❌ 调试过程中出现错误:', error);
    }
}

debugMCPTools();