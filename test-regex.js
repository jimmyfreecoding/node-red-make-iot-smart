const pattern = /^\/(?:tool|工具):(\w+)(?:[\s，,]+(.*))?$/i;
const message = '/工具:get_flows，获取当前流程并解释';
const match = message.match(pattern);

console.log('输入:', message);
console.log('匹配结果:', match);
if(match) {
    console.log('工具名:', match[1]);
    console.log('参数:', match[2]);
} else {
    console.log('未匹配');
}

// 测试其他格式
const testCases = [
    '/工具:get_flows',
    '/tool:get_flows',
    '/工具:get_flows 获取当前流程',
    '/工具:get_flows，获取当前流程并解释'
];

console.log('\n测试其他格式:');
testCases.forEach(test => {
    const result = test.match(pattern);
    console.log(`输入: ${test}`);
    console.log(`匹配: ${result ? '是' : '否'}`);
    if(result) {
        console.log(`工具名: ${result[1]}, 参数: ${result[2] || '无'}`);
    }
    console.log('---');
});