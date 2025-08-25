const LangChainManager = require('./lib/langchain-manager.js');

// 创建一个简单的模拟对象
const mockMemoryManager = {
    getSessionContext: () => [],
    addConversation: () => {},
    addToSessionContext: () => {}
};

const mockMcpClient = {
    isClientConnected: () => false
};

// 创建LangChainManager实例
const manager = new LangChainManager(mockMemoryManager, mockMcpClient);

// 测试detectToolTrigger方法
const testMessages = [
    '/工具:get_flows，获取当前流程并解释',
    '/tool:get_flows',
    '/工具:get_flows 获取当前流程',
    '普通消息，不是工具调用'
];

// console.log('测试detectToolTrigger方法:');
// console.log('='.repeat(50));

testMessages.forEach((message, index) => {
    const result = manager.detectToolTrigger(message);
    // console.log(`\n测试 ${index + 1}: ${message}`);
    // console.log('结果:', JSON.stringify(result, null, 2));
});