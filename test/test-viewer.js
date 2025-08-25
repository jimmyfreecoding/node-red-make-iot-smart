const express = require('express');
const fs = require('fs');
const path = require('path');
const { runEndToEndTests } = require('./end-to-end-test');

const app = express();
const PORT = 3000;

// 静态文件服务
app.use(express.static(__dirname));
app.use(express.json());

// 主页面
app.get('/', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Node-RED 端到端测试查看器</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .action-buttons {
            display: flex;
            gap: 20px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            min-width: 150px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        
        .btn-success {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .status {
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-weight: 600;
        }
        
        .status.running {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .results-section {
            margin-top: 40px;
        }
        
        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .result-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }
        
        .result-card h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        
        .result-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .result-item:last-child {
            border-bottom: none;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 5px;
        }
        
        .status-badge.success {
            background: #d4edda;
            color: #155724;
        }
        
        .status-badge.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .log-viewer {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            margin-top: 20px;
        }
        
        .hidden {
            display: none;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .file-links {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .file-link {
            padding: 10px 20px;
            background: #e9ecef;
            color: #495057;
            text-decoration: none;
            border-radius: 5px;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .file-link:hover {
            background: #dee2e6;
            transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
            .action-buttons {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
            }
            
            .results-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Node-RED 端到端测试查看器</h1>
            <p>测试 Node-RED 在不同语言环境下的关键词识别能力</p>
        </div>
        
        <div class="content">
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="runTests()" id="runBtn">
                    <span id="runBtnText">🧪 运行测试</span>
                </button>
                <button class="btn btn-secondary" onclick="loadResults()">
                    📊 加载结果
                </button>
                <button class="btn btn-success" onclick="viewReport()">
                    📋 查看报告
                </button>
            </div>
            
            <div id="status" class="status hidden"></div>
            
            <div id="results" class="results-section hidden">
                <h2>📈 测试结果</h2>
                <div id="resultsContent" class="results-grid"></div>
                
                <div class="file-links">
                    <a href="/json-viewer?file=test-summary.json" class="file-link" target="_blank">
                        📄 测试摘要 (JSON)
                    </a>
                    <a href="/test-results/test-report.md" class="file-link" target="_blank">
                        📋 测试报告 (Markdown)
                    </a>
                    <a href="/json-viewer?file=zh-CN-test-results.json" class="file-link" target="_blank">
                        🇨🇳 中文测试结果
                    </a>
                    <a href="/json-viewer?file=en-US-test-results.json" class="file-link" target="_blank">
                        🇺🇸 英文测试结果
                    </a>
                    <a href="/json-viewer?file=ja-JP-test-results.json" class="file-link" target="_blank">
                        🇯🇵 日文测试结果
                    </a>
                </div>
            </div>
            
            <div id="logs" class="hidden">
                <h3>📝 测试日志</h3>
                <div id="logContent" class="log-viewer"></div>
            </div>
        </div>
    </div>
    
    <script>
        let testRunning = false;
        
        async function runTests() {
            if (testRunning) return;
            
            testRunning = true;
            const runBtn = document.getElementById('runBtn');
            const runBtnText = document.getElementById('runBtnText');
            const status = document.getElementById('status');
            const logs = document.getElementById('logs');
            const logContent = document.getElementById('logContent');
            
            runBtn.disabled = true;
            runBtnText.innerHTML = '<span class="loading"></span>运行中...';
            
            status.className = 'status running';
            status.textContent = '🔄 正在运行端到端测试，请稍候...';
            status.classList.remove('hidden');
            
            logs.classList.remove('hidden');
            logContent.textContent = '正在启动测试...\\n';
            
            try {
                const response = await fetch('/api/run-tests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    status.className = 'status success';
                    status.textContent = '✅ 测试完成！点击"加载结果"查看详细信息。';
                    logContent.textContent += '\\n✅ 测试执行完成\\n';
                    logContent.textContent += JSON.stringify(result, null, 2);
                } else {
                    throw new Error('测试执行失败');
                }
            } catch (error) {
                status.className = 'status error';
                status.textContent = '❌ 测试执行失败: ' + error.message;
                logContent.textContent += '\\n❌ 错误: ' + error.message;
            } finally {
                testRunning = false;
                runBtn.disabled = false;
                runBtnText.textContent = '🧪 运行测试';
            }
        }
        
        async function loadResults() {
            try {
                // 添加时间戳防止缓存
                const timestamp = new Date().getTime();
                const response = await fetch('/api/results?t=' + timestamp, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('加载的测试数据:', data);
                    displayResults(data);
                } else {
                    alert('无法加载测试结果');
                }
            } catch (error) {
                alert('加载结果时发生错误: ' + error.message);
            }
        }
        
        function displayResults(data) {
            const results = document.getElementById('results');
            const resultsContent = document.getElementById('resultsContent');
            
            results.classList.remove('hidden');
            
            if (!data.results || data.results.length === 0) {
                resultsContent.innerHTML = '<p>暂无测试结果</p>';
                return;
            }
            
            resultsContent.innerHTML = '';
            
            data.results.forEach(function(languageResult) {
                const card = document.createElement('div');
                card.className = 'result-card';
                
                let html = '<h3>' + languageResult.testName + '</h3>';
                
                languageResult.cases.forEach(function(testCase) {
                    const streamStatus = testCase.streamResult.success ? 'success' : 'error';
                    
                    // 检查元数据
                    let metadataInfo = '❌';
                    if (testCase.streamResult.metadata) {
                        const hasSettings = testCase.streamResult.metadata.settings;
                        const hasDiagnosis = testCase.streamResult.metadata.diagnosis;
                        const hasFlowData = testCase.streamResult.metadata.flowData;
                        const hasNodeData = testCase.streamResult.metadata.nodeData;
                        
                        if (hasSettings || hasDiagnosis || hasFlowData || hasNodeData) {
                            metadataInfo = '✅';
                            if (hasFlowData && hasNodeData) metadataInfo += ' 流程 节点';
                            else if (hasSettings) metadataInfo += ' 设置';
                            else if (hasDiagnosis) metadataInfo += ' 诊断';
                        }
                    }
                    
                    html += '<div class="result-item">' +
                        '<span>' + testCase.message + '</span>' +
                        '<div>' +
                            '<span class="status-badge ' + streamStatus + '">' +
                                (testCase.streamResult.success ? '✅' : '❌') + ' 流式' +
                            '</span>' +
                            '<span class="status-badge ' + (metadataInfo.includes('✅') ? 'success' : 'error') + '">' +
                                metadataInfo +
                            '</span>' +
                        '</div>' +
                    '</div>';
                });
                
                card.innerHTML = html;
                resultsContent.appendChild(card);
            });
        }
        
        function viewReport() {
            window.open('/test-results/test-report.md', '_blank');
        }
        
        // 页面加载时自动尝试加载结果
        window.addEventListener('load', function() {
            loadResults();
        });
    </script>
</body>
</html>`;
    
    res.send(html);
});

// API: 运行测试
app.post('/api/run-tests', async (req, res) => {
    try {
        console.log('🚀 开始运行端到端测试...');
        await runEndToEndTests();
        res.json({ success: true, message: '测试完成' });
    } catch (error) {
        console.error('测试执行错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: 获取测试结果
app.get('/api/results', (req, res) => {
    try {
        const summaryPath = path.join(__dirname, 'test-results', 'test-summary.json');
        if (fs.existsSync(summaryPath)) {
            const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            res.json(data);
        } else {
            res.json({ results: [] });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// JSON查看器页面
app.get('/json-viewer', (req, res) => {
    const htmlPath = path.join(__dirname, 'json-viewer.html');
    res.sendFile(htmlPath);
});

// 静态文件服务 - 测试结果
app.use('/test-results', express.static(path.join(__dirname, 'test-results')));

// 启动服务器
app.listen(PORT, () => {
    console.log(`🌐 测试查看器已启动: http://localhost:${PORT}`);
    console.log('📊 您可以在浏览器中查看和运行测试');
});

module.exports = app;