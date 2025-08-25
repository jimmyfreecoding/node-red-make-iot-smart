const axios = require('axios');

// 获取Node-RED中的配置节点ID
async function getConfigNodeId() {
    try {
        console.log('🔍 正在查找配置节点ID...');
        
        // 尝试多个可能的端点来获取节点信息
        const endpoints = [
            'http://127.0.0.1:1881/ai-sidebar/mcp-status',
            'http://127.0.0.1:1881/flows',
            'http://127.0.0.1:1881/nodes'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`📡 尝试端点: ${endpoint}`);
                const response = await axios.get(endpoint, {
                    timeout: 5000
                });
                
                if (response.data) {
                    console.log('✅ 成功获取数据');
                    
                    // 如果是MCP状态端点
                    if (endpoint.includes('mcp-status') && response.data.nodeId) {
                        console.log(`🎯 找到配置节点ID: ${response.data.nodeId}`);
                        return response.data.nodeId;
                    }
                    
                    // 如果是flows端点，查找配置节点
                    if (Array.isArray(response.data)) {
                        for (const item of response.data) {
                            if (item.type === 'make-iot-smart-config' || item.type === 'api-config') {
                                console.log(`🎯 找到配置节点ID: ${item.id}`);
                                return item.id;
                            }
                        }
                    }
                    
                    console.log('📄 响应数据示例:', JSON.stringify(response.data, null, 2).substring(0, 500));
                }
            } catch (error) {
                console.log(`❌ 端点 ${endpoint} 失败: ${error.message}`);
            }
        }
        
        console.log('⚠️  无法自动获取节点ID');
        console.log('请手动查找配置节点ID：');
        console.log('1. 打开 http://127.0.0.1:1881');
        console.log('2. 在Node-RED编辑器中找到 "Make IoT Smart Config" 节点');
        console.log('3. 双击该节点，在配置界面中可以看到节点ID');
        console.log('4. 或者查看浏览器开发者工具的网络请求');
        
        return null;
        
    } catch (error) {
        console.error('❌ 获取节点ID时发生错误:', error.message);
        return null;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    getConfigNodeId().then(nodeId => {
        if (nodeId) {
            console.log(`\n🎉 配置节点ID: ${nodeId}`);
            console.log('\n请将此ID复制到 end-to-end-test.js 文件中的 TEST_NODE_ID 变量');
        } else {
            console.log('\n❌ 无法获取配置节点ID，请手动查找');
        }
    }).catch(console.error);
}

module.exports = { getConfigNodeId };