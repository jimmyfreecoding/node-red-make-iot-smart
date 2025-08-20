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
            // 对于流式响应，我们可以使用LangChain的流式功能
            // 这里先实现基本版本，后续可以优化为真正的流式
            try {
                const result = await node.executeChat(message, scenario, sessionId, dynamicData);
                
                if (onChunk && typeof onChunk === 'function') {
                    // 模拟流式输出
                    const chunks = result.response.split(' ');
                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i] + (i < chunks.length - 1 ? ' ' : '');
                        onChunk({
                            type: 'text-delta',
                            textDelta: chunk
                        });
                        // 添加小延迟以模拟流式效果
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    
                    onChunk({
                        type: 'finish',
                        finishReason: 'stop'
                    });
                }
                
                return result;
            } catch (error) {
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
            const { message, scenario, sessionId, selectedFlow, selectedNodes } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // 获取API配置节点
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                return res.status(400).json({ error: 'API configuration node not found' });
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

    // 流式聊天端点
    RED.httpAdmin.post('/ai-sidebar/stream-chat', async function(req, res) {
        try {
            const { message, scenario, sessionId, selectedFlow, selectedNodes } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // 设置SSE头
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });

            // 获取API配置节点
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                res.write(`data: ${JSON.stringify({ error: 'No API configuration found' })}\n\n`);
                res.end();
                return;
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                res.write(`data: ${JSON.stringify({ error: 'API configuration node not found' })}\n\n`);
                res.end();
                return;
            }

            // 准备动态数据
            const dynamicData = {
                selectedFlow: selectedFlow,
                selectedNodes: selectedNodes
            };

            // 执行流式对话
            await configNode.streamChat(message, scenario, sessionId, dynamicData, (chunk) => {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            });

            res.end();
        } catch (error) {
            console.error('Stream chat endpoint error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    });

    // 获取场景列表端点
    RED.httpAdmin.get('/ai-sidebar/scenarios', function(req, res) {
        try {
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                return res.status(400).json({ error: 'API configuration node not found' });
            }

            const scenarios = configNode.getAvailableScenarios();
            res.json({ scenarios });
        } catch (error) {
            console.error('Scenarios endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 获取记忆统计端点
    RED.httpAdmin.get('/ai-sidebar/memory-stats', function(req, res) {
        try {
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                return res.status(400).json({ error: 'API configuration node not found' });
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
            
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                return res.status(400).json({ error: 'API configuration node not found' });
            }

            const history = configNode.getConversationHistory(sessionId, parseInt(limit));
            res.json({ history });
        } catch (error) {
            console.error('History endpoint error:', error);
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
            
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                return res.status(400).json({ error: 'API configuration node not found' });
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
            
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                return res.status(400).json({ error: 'API configuration node not found' });
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
            
            const configNodes = RED.nodes.getCredentials('api-config') || {};
            const configNodeIds = Object.keys(configNodes);
            
            if (configNodeIds.length === 0) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const configNode = RED.nodes.getNode(configNodeIds[0]);
            if (!configNode) {
                return res.status(400).json({ error: 'API configuration node not found' });
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
            
            res.json({ success: true, result });
        } catch (error) {
            console.error('Execute tool endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });
}
