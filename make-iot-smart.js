/**
 * Copyright 2024 Zheng He
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

// 加载环境变量配置
require('dotenv').config();

const MCPClientHelper = require('./mcp/mcp-client');
const MemoryManager = require('./lib/memory-manager');
const LangChainManager = require('./lib/langchain-manager');
const path = require('path');
const fs = require('fs');

module.exports = function (RED) {
    // API配置节点
    function ApiConfigNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // 保存配置
        node.name = config.name;
        node.provider = config.provider || 'openai';
        node.model = config.model || 'gpt-4o-mini';
        node.useDifferentModels = config.useDifferentModels || false;
        node.planningModel = config.planningModel;
        node.executionModel = config.executionModel;
        node.temperature = parseFloat(config.temperature) || 0.1;
        node.maxTokens = parseInt(config.maxTokens) || 2000;
        
        // MCP配置 - 使用node-red-mcp-server
        node.mcpCommand = config.mcpCommand || 'npx node-red-mcp-server';
        node.mcpArgs = config.mcpArgs || '';
        node.mcpEnv = config.mcpEnv || 'NODE_RED_URL=http://localhost:1880';
        node.enableMcp = config.enableMcp !== false; // 默认启用MCP
        
        console.log('API配置节点初始化:', {
            name: node.name,
            provider: node.provider,
            model: node.model,
            enableMcp: node.enableMcp,
            mcpCommand: node.mcpCommand
        });
        
        // 设置全局变量以便其他地方访问
        global.apiConfigNode = node;
        
        // 获取API密钥
        node.apiKey = this.credentials.apiKey;
        
        // 初始化核心组件
        node.memoryManager = null;
        node.langchainManager = null;
        node.mcpClient = new MCPClientHelper();
        
        // 初始化记忆管理器
        node.initMemoryManager = function() {
            try {
                const dbPath = path.join(__dirname, 'data', 'memory.db');
                node.memoryManager = new MemoryManager(dbPath);
                console.log('Memory manager initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize memory manager:', error);
                node.error('Failed to initialize memory manager: ' + error.message);
                return false;
            }
        };
        
        // 初始化LangChain管理器
        node.initLangChainManager = function() {
            try {
                node.langchainManager = new LangChainManager(node.memoryManager, node.mcpClient);
                console.log('LangChain manager initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize LangChain manager:', error);
                node.error('Failed to initialize LangChain manager: ' + error.message);
                return false;
            }
        };
        
        // 初始化MCP连接
        node.initMCP = async function() {
            console.log('initMCP 被调用，检查条件:', {
                enableMcp: node.enableMcp,
                mcpCommand: node.mcpCommand,
                hasCommand: !!node.mcpCommand
            });
            
            if (!node.enableMcp) {
                console.log('MCP未启用 - enableMcp为false');
                return false;
            }
            
            if (!node.mcpCommand) {
                console.log('MCP命令未配置');
                return false;
            }

            try {
                console.log('开始初始化MCP连接:', {
                    command: node.mcpCommand,
                    args: node.mcpArgs,
                    env: node.mcpEnv
                });
                
                const args = node.mcpArgs ? node.mcpArgs.split(' ').filter(arg => arg.trim()) : [];
                
                let env = {};
                if (node.mcpEnv) {
                    const envPairs = node.mcpEnv.split(',');
                    for (const pair of envPairs) {
                        const [key, value] = pair.split('=').map(s => s.trim());
                        if (key && value) {
                            env[key] = value;
                        }
                    }
                }

                const success = await node.mcpClient.connect(node.mcpCommand, args, env);
                if (success) {
                    console.log('MCP server connected successfully');
                    
                    // 重新初始化LangChain管理器以获取MCP工具
                    if (node.langchainManager) {
                        await node.langchainManager.initializeTools();
                    }
                    
                    return true;
                } else {
                    console.warn('MCP server connection failed');
                    return false;
                }
            } catch (error) {
                console.error('MCP initialization failed:', error);
                return false;
            }
        };

        // 获取LLM配置
        node.getLLMConfig = function() {
            return {
                provider: node.provider,
                model: node.model,
                apiKey: node.apiKey,
                temperature: node.temperature,
                maxTokens: node.maxTokens,
                streaming: true
            };
        };

        // 检测场景
        node.detectScenario = function(message) {
            if (node.langchainManager) {
                return node.langchainManager.detectScenario(message);
            }
            return 'general';
        };

        // 执行AI对话
        node.executeChat = async function(message, scenario = null, sessionId = null, dynamicData = {}) {
            if (!node.langchainManager) {
                throw new Error('LangChain manager not initialized');
            }

            // 自动检测场景
            if (!scenario) {
                scenario = node.detectScenario(message);
            }

            // 生成会话ID
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }

            // 获取LLM配置
            const llmConfig = node.getLLMConfig();

            // 准备动态数据
            const contextData = {
                nodeRedVersion: RED.version || 'unknown',
                nodeVersion: process.version,
                currentTime: new Date().toISOString(),
                ...dynamicData
            };

            try {
                const result = await node.langchainManager.executeScenarioChat(
                    scenario,
                    message,
                    llmConfig,
                    sessionId,
                    contextData
                );

                return result;
            } catch (error) {
                console.error('Chat execution failed:', error);
                throw error;
            }
        };

        // 流式对话（兼容性方法）
        node.streamChat = async function(message, scenario = null, sessionId = null, dynamicData = {}, onChunk = null) {
            try {
                // 获取LLM配置
                const llmConfig = node.getLLMConfig();
                
                // 检测场景
                if (!scenario) {
                    scenario = node.langchainManager.detectScenario(message);
                }
                
                // 生成会话ID
                if (!sessionId) {
                    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                }
                
                console.log('开始流式聊天:', { message, scenario, sessionId });
                
                // 使用LangChain的真正流式功能
                const result = await node.langchainManager.executeScenarioChatStream(
                    scenario, 
                    message, 
                    llmConfig, 
                    sessionId, 
                    dynamicData, 
                    onChunk
                );
                
                return result;
            } catch (error) {
                console.error('Stream chat error:', error);
                if (onChunk && typeof onChunk === 'function') {
                    onChunk({
                        type: 'error',
                        error: error.message
                    });
                }
                throw error;
            }
        };

        // 获取记忆统计
        node.getMemoryStats = function() {
            if (node.memoryManager) {
                return node.memoryManager.getMemoryStats();
            }
            return null;
        };

        // 获取可用场景
        node.getAvailableScenarios = function() {
            if (node.langchainManager) {
                return node.langchainManager.getAvailableScenarios();
            }
            return [];
        };

        // 获取会话历史
        node.getConversationHistory = function(sessionId, limit = 50) {
            if (node.memoryManager) {
                return node.memoryManager.getConversationHistory(sessionId, limit);
            }
            return [];
        };

        // 搜索对话记录
        node.searchConversations = function(query, scenario = null, limit = 10) {
            if (node.memoryManager) {
                return node.memoryManager.searchConversations(query, scenario, limit);
            }
            return [];
        };

        // 保存流程模板
        node.saveFlowTemplate = function(name, description, flowJson, scenario, tags = []) {
            if (node.memoryManager) {
                return node.memoryManager.saveFlowTemplate(name, description, flowJson, scenario, tags);
            }
            return null;
        };

        // 获取流程模板
        node.getFlowTemplates = function(scenario = null, limit = 20) {
            if (node.memoryManager) {
                return node.memoryManager.getFlowTemplates(scenario, limit);
            }
            return [];
        };

        // 设置用户偏好
        node.setUserPreference = function(key, value, category = 'general') {
            if (node.memoryManager) {
                return node.memoryManager.setUserPreference(key, value, category);
            }
        };

        // 获取用户偏好
        node.getUserPreference = function(key, defaultValue = null) {
            if (node.memoryManager) {
                return node.memoryManager.getUserPreference(key, defaultValue);
            }
            return defaultValue;
        };

        // 清理旧数据
        node.cleanupOldData = function(daysToKeep = 30) {
            if (node.memoryManager) {
                return node.memoryManager.cleanup(daysToKeep);
            }
            return 0;
        };

        // 重新加载配置
        node.reloadConfig = function() {
            if (node.langchainManager) {
                node.langchainManager.reload();
            }
        };

        // 延迟初始化
        setTimeout(async () => {
            try {
                // 初始化记忆管理器
                const memoryInitialized = node.initMemoryManager();
                if (!memoryInitialized) {
                    node.warn('Memory manager initialization failed');
                }

                // 初始化LangChain管理器
                const langchainInitialized = node.initLangChainManager();
                if (!langchainInitialized) {
                    node.warn('LangChain manager initialization failed');
                }

                // 初始化MCP连接
                if (node.enableMcp) {
                    const mcpInitialized = await node.initMCP();
                    if (!mcpInitialized) {
                        node.warn('MCP initialization failed, continuing without MCP tools');
                    }
                }

                console.log('API配置节点初始化完成');
            } catch (error) {
                console.error('API配置节点初始化失败:', error);
                node.error('Initialization failed: ' + error.message);
            }
        }, 1000);

        // 格式化工具结果
        node.formatToolResult = function(toolResult) {
            if (typeof toolResult === 'string') {
                return toolResult;
            }

            if (toolResult && toolResult.content) {
                if (Array.isArray(toolResult.content)) {
                    return toolResult.content.map(item => 
                        typeof item === 'string' ? item : JSON.stringify(item, null, 2)
                    ).join('\n');
                }
                return typeof toolResult.content === 'string' ? 
                    toolResult.content : JSON.stringify(toolResult.content, null, 2);
            }
            
            return JSON.stringify(toolResult, null, 2);
        };

        // 节点关闭时清理资源
        node.on('close', function(done) {
            console.log('API配置节点关闭，清理资源...');
            
            try {
                // 关闭MCP连接
                if (node.mcpClient) {
                    node.mcpClient.disconnect();
                }
                
                // 关闭记忆管理器
                if (node.memoryManager) {
                    node.memoryManager.close();
                }
                
                // 清理LangChain管理器
                if (node.langchainManager) {
                    node.langchainManager.cleanup();
                }
                
                console.log('资源清理完成');
            } catch (error) {
                console.error('资源清理失败:', error);
            }
            
            done();
        });
    }

    // 注册API配置节点
    RED.nodes.registerType('api-config', ApiConfigNode, {
        credentials: {
            apiKey: { type: 'password' }
        }
    });

    // 注册make-iot-smart节点
    function MakeIotSmartNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        node.name = config.name;
        node.apiConfig = config.apiConfig;
        node.algorithm = config.algorithm;
        node.settings = config.settings;
        
        // 将节点设置为有效状态
        node.valid = true;
        
        // 获取API配置节点
        node.configNode = RED.nodes.getNode(node.apiConfig);
        
        if (!node.configNode) {
            node.error("未找到API配置节点");
            return;
        }
        
        console.log('AI助手节点初始化完成（设置为有效状态）:', {
            name: node.name,
            configNode: node.configNode ? node.configNode.name : 'none',
            valid: node.valid
        });
    }
    
    RED.nodes.registerType('make-iot-smart', MakeIotSmartNode);

    // AI侧边栏端点
    RED.httpAdmin.post('/ai-sidebar/chat', async function(req, res) {
        try {
            // 设置请求字符编码为UTF-8
            req.setEncoding('utf8');
            
            console.log('🌐 收到普通聊天请求:', req.body);
            console.log('🔥 普通聊天端点被调用！');
            console.log('🔍 原始消息内容:', JSON.stringify(req.body.message));
            const { message, scenario, sessionId, selectedFlow, selectedNodes } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // 获取API配置节点
            let configNode = null;
            // 使用全局变量获取配置节点
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            // 准备动态数据
            const dynamicData = {
                selectedFlow: selectedFlow,
                selectedNodes: selectedNodes
            };

            // 执行对话
            const result = await configNode.executeChat(message, scenario, sessionId, dynamicData);

            res.json({
                success: true,
                response: result.response,
                scenario: result.scenario,
                sessionId: result.sessionId,
                intermediateSteps: result.intermediateSteps
            });
        } catch (error) {
            console.error('Chat endpoint error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message 
            });
        }
    });

    // 简单AI测试端点
    RED.httpAdmin.post('/ai-sidebar/test-ai', async function(req, res) {
        try {
            const { message } = req.body;
            
            // 获取配置节点
            const { nodeId } = req.body;
            let configNode = null;
            
            if (nodeId) {
                configNode = RED.nodes.getNode(nodeId);
            } else {
                const configNodes = RED.nodes.getCredentials('api-config') || {};
                const configNodeIds = Object.keys(configNodes);
                
                if (configNodeIds.length > 0) {
                    configNode = RED.nodes.getNode(configNodeIds[0]);
                }
            }
            
            if (!configNode) {
                return res.json({ error: 'No API configuration found' });
            }
            
            const llmConfig = configNode.getLLMConfig();
            console.log('测试AI调用，配置:', llmConfig);
            
            // 直接调用LLM
            const llm = configNode.langchainManager.getLLM(llmConfig);
            const result = await llm.invoke(message || 'Hello');
            
            console.log('AI响应:', result);
            res.json({ 
                success: true, 
                response: result.content || result,
                config: llmConfig
            });
        } catch (error) {
            console.error('AI测试失败:', error);
            res.json({ error: error.message, stack: error.stack });
        }
    });

    // 流式聊天端点
    RED.httpAdmin.post('/ai-sidebar/stream-chat', async function(req, res) {
        try {
            // 设置请求和响应的字符编码为UTF-8
            req.setEncoding('utf8');
            
            console.log('🌐 收到流式聊天请求:', req.body);
            console.log('🔥 流式聊天端点被调用！');
            console.log('🔍 请求方法:', req.method);
            console.log('🔍 请求URL:', req.url);
            console.log('🔍 请求头:', req.headers);
            console.log('🔍 原始消息内容:', JSON.stringify(req.body.message));
            
            const { message, scenario, sessionId, selectedFlow, selectedNodes } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // 设置SSE头，明确指定UTF-8编码
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            console.log('✅ SSE头设置完成');

            // 获取API配置节点
            const { nodeId } = req.body;
            let configNode = null;
            
            if (nodeId) {
                // 如果提供了nodeId，直接获取该节点
                configNode = RED.nodes.getNode(nodeId);
            } else {
                // 否则使用全局变量获取配置节点
                console.log('🔍 开始查找api-config节点...');
                if (global.apiConfigNode) {
                    console.log('✅ 从全局变量找到api-config节点');
                    configNode = global.apiConfigNode;
                } else {
                    console.log('❌ 全局变量中未找到api-config节点');
                }
                console.log('🔍 查找结果:', !!configNode);
            }
            
            console.log('🔍 查找配置节点:', nodeId, !!configNode);
            
            if (!configNode) {
                console.error('❌ 未找到配置节点');
                res.write(`data: ${JSON.stringify({ error: 'No API configuration found' })}\n\n`);
                res.end();
                return;
            }

            // 准备动态数据
            const dynamicData = {
                selectedFlow: selectedFlow,
                selectedNodes: selectedNodes
            };
            
            console.log('📝 请求参数:', { message, scenario, sessionId, dynamicData });
            console.log('🚀 开始流式聊天...');
            
            let chunkCount = 0;

            // 执行流式对话
            await configNode.streamChat(message, scenario, sessionId, dynamicData, (chunk) => {
                chunkCount++;
                console.log(`📤 发送SSE数据块 ${chunkCount}:`, JSON.stringify(chunk));
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            });

            console.log(`✅ 流式聊天完成，共发送${chunkCount}个数据块`);
            res.end();
        } catch (error) {
            console.error('❌ 流式聊天端点错误:', error);
            console.error('❌ 错误堆栈:', error.stack);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    });

    // 获取场景列表端点
    RED.httpAdmin.get('/ai-sidebar/scenarios', function(req, res) {
        try {
            // 直接读取scenarios.json文件
            const scenariosPath = path.join(__dirname, 'config', 'scenarios.json');
            
            if (!fs.existsSync(scenariosPath)) {
                return res.status(404).json({ error: 'Scenarios configuration file not found' });
            }
            
            const scenariosData = fs.readFileSync(scenariosPath, 'utf8');
            const scenarios = JSON.parse(scenariosData);
            
            res.json({ scenarios });
        } catch (error) {
            console.error('Scenarios endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 获取记忆统计端点
    RED.httpAdmin.get('/ai-sidebar/memory-stats', function(req, res) {
        try {
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const stats = configNode.getMemoryStats();
            res.json({ stats });
        } catch (error) {
            console.error('Memory stats endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 获取对话历史端点
    RED.httpAdmin.get('/ai-sidebar/history/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            const { limit = 50 } = req.query;
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const history = configNode.getConversationHistory(sessionId, parseInt(limit));
            res.json({ history });
        } catch (error) {
            console.error('History endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 获取会话列表端点
    RED.httpAdmin.get('/ai-sidebar/sessions', function(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const sessions = configNode.memoryManager.getSessions(parseInt(limit));
            res.json({ sessions });
        } catch (error) {
            console.error('Sessions endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 创建新会话端点
    RED.httpAdmin.post('/ai-sidebar/sessions', function(req, res) {
        try {
            const { sessionId, title, scenario } = req.body;
            
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' });
            }
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const success = configNode.memoryManager.createSession(sessionId, title, scenario);
            if (success) {
                const session = configNode.memoryManager.getSession(sessionId);
                res.json({ session });
            } else {
                res.status(500).json({ error: 'Failed to create session' });
            }
        } catch (error) {
            console.error('Create session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 获取单个会话详情端点
    RED.httpAdmin.get('/ai-sidebar/sessions/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const session = configNode.memoryManager.getSession(sessionId);
            if (session) {
                res.json({ session });
            } else {
                res.status(404).json({ error: 'Session not found' });
            }
        } catch (error) {
            console.error('Get session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 更新会话端点
    RED.httpAdmin.put('/ai-sidebar/sessions/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            const updates = req.body;
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const success = configNode.memoryManager.updateSession(sessionId, updates);
            if (success) {
                const session = configNode.memoryManager.getSession(sessionId);
                res.json({ session });
            } else {
                res.status(500).json({ error: 'Failed to update session' });
            }
        } catch (error) {
            console.error('Update session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 删除会话端点
    RED.httpAdmin.delete('/ai-sidebar/sessions/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const success = configNode.memoryManager.deleteSession(sessionId);
            if (success) {
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to delete session' });
            }
        } catch (error) {
            console.error('Delete session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 搜索对话端点
    RED.httpAdmin.post('/ai-sidebar/search', function(req, res) {
        try {
            const { query, scenario, limit = 10 } = req.body;
            
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const results = configNode.searchConversations(query, scenario, limit);
            res.json({ results });
        } catch (error) {
            console.error('Search endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 流程模板端点
    RED.httpAdmin.get('/ai-sidebar/templates', function(req, res) {
        try {
            const { scenario, limit = 20 } = req.query;
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const templates = configNode.getFlowTemplates(scenario, parseInt(limit));
            res.json({ templates });
        } catch (error) {
            console.error('Templates endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 保存流程模板端点
    RED.httpAdmin.post('/ai-sidebar/templates', function(req, res) {
        try {
            const { name, description, flowJson, scenario, tags = [] } = req.body;
            
            if (!name || !flowJson) {
                return res.status(400).json({ error: 'Name and flowJson are required' });
            }
            
            // 使用全局变量获取配置节点
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const templateId = configNode.saveFlowTemplate(name, description, flowJson, scenario, tags);
            res.json({ success: true, templateId });
        } catch (error) {
            console.error('Save template endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

        // 执行工具端点
        RED.httpAdmin.post('/ai-sidebar/execute-tool', async function(req, res) {
            try {
                const { toolName, parameters, nodeId } = req.body;
                
                if (!toolName) {
                    return res.status(400).json({ error: 'Tool name is required' });
                }

                // 获取配置节点
                const configNode = RED.nodes.getNode(nodeId);
                if (!configNode || !configNode.langchainManager) {
                    return res.status(400).json({ error: 'Invalid configuration or LangChain manager not initialized' });
                }

                // 执行工具
                const result = await configNode.langchainManager.executeTool(toolName, parameters || {});
                
                // 格式化工具结果
                const formattedResult = configNode.formatToolResult(result);
                
                res.json({ success: true, result: formattedResult });
            } catch (error) {
                console.error('Execute tool endpoint error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // 获取支持的LLM提供商和模型列表端点
        RED.httpAdmin.get('/ai-sidebar/llm-providers', function(req, res) {
            try {
                // 定义支持的LLM提供商和模型
                const providers = {
                    openai: {
                        name: 'OpenAI',
                        models: [
                            { value: 'gpt-4o', label: 'GPT-4o' },
                            { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                        ]
                    },
                    deepseek: {
                        name: 'DeepSeek',
                        models: [
                            { value: 'deepseek-chat', label: 'DeepSeek Chat' },
                            { value: 'deepseek-coder', label: 'DeepSeek Coder' }
                        ]
                    },
                    anthropic: {
                        name: 'Anthropic',
                        models: [
                            { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
                            { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
                            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
                        ]
                    },
                    google: {
                        name: 'Google',
                        models: [
                            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                            { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' }
                        ]
                    }
                };

                res.json({ providers });
            } catch (error) {
                console.error('获取LLM提供商列表失败:', error);
                res.status(500).json({ error: '获取LLM提供商列表失败' });
            }
        });
}
