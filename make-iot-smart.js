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

const { generateText, streamText } = require('ai');
const { openai } = require('@ai-sdk/openai');
const { anthropic } = require('@ai-sdk/anthropic');
const { google } = require('@ai-sdk/google');

module.exports = function (RED) {
    
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
        
        // 获取API密钥（从凭证中）
        node.apiKey = this.credentials.apiKey;
        
        // 添加初始化调试信息
        node.log(`ApiConfigNode initialized - Provider: ${node.provider}, Model: ${node.model}, Config: ${JSON.stringify(config)}`);
        
        // 获取模型实例
        node.getModel = function(modelType = 'default') {
            if (!node.apiKey) {
                throw new Error('API key is required');
            }
            
            let modelName;
            if (node.useDifferentModels && modelType === 'planning') {
                modelName = node.planningModel || node.model;
            } else if (node.useDifferentModels && modelType === 'execution') {
                modelName = node.executionModel || node.model;
            } else {
                modelName = node.model;
            }
            
            if (!modelName) {
                throw new Error('Model name is required');
            }
            
            try {
                switch (node.provider.toLowerCase()) {
                    case 'openai':
                        return openai(modelName, {
                            apiKey: node.apiKey,
                        });
                    case 'deepseek':
                        // 创建OpenAI兼容的客户端实例
                        const { createOpenAI } = require('@ai-sdk/openai');
                        const deepseekClient = createOpenAI({
                            apiKey: node.apiKey,
                            baseURL: 'https://api.deepseek.com'
                        });
                        return deepseekClient(modelName);
                    case 'anthropic':
                        return anthropic(modelName, {
                            apiKey: node.apiKey,
                        });
                    case 'google':
                        return google(modelName, {
                            apiKey: node.apiKey,
                        });
                    default:
                        throw new Error(`Unsupported provider: ${node.provider}`);
                }
            } catch (error) {
                node.error(`Model creation failed: ${error.message}`);
                throw error;
            }
        };
        
        // 生成文本响应
        node.generateResponse = async function(messages, options = {}) {
            try {
                const model = node.getModel(options.modelType);
                if (!model) {
                    throw new Error('AI model not initialized');
                }
                
                const result = await generateText({
                    model: model,
                    messages: messages,
                    temperature: node.temperature,
                    maxTokens: node.maxTokens,
                    ...options
                });
                
                return {
                    text: result.text,
                    usage: result.usage,
                    finishReason: result.finishReason
                };
            } catch (error) {
                node.error(`AI generation failed: ${error.message}`);
                throw error;
            }
        };
        
        // 流式生成文本响应
        node.streamResponse = async function(messages, onChunk, options = {}) {
            try {
                const model = node.getModel(options.modelType);
                if (!model) {
                    throw new Error('AI model not initialized');
                }
                
                const result = await streamText({
                    model: model,
                    messages: messages,
                    temperature: node.temperature,
                    maxTokens: node.maxTokens,
                    ...options
                });
                
                for await (const delta of result.textStream) {
                    onChunk(delta);
                }
                
                return await result.usage;
            } catch (error) {
                node.error(`AI streaming failed: ${error.message}`);
                throw error;
            }
        };
        
        // 在节点初始化时测试连接
        if (node.apiKey) {
            try {
                const model = node.getModel();
                if (model) {
                    node.log(`AI model initialized successfully for provider: ${node.provider}`);
                } else {
                    node.warn(`Failed to initialize AI model for provider: ${node.provider}`);
                }
            } catch (error) {
                node.warn(`AI model initialization error: ${error.message}`);
            }
        } else {
            node.warn('No API key configured');
        }
    }

    // 注册API配置节点，包括凭证处理
    RED.nodes.registerType('api-config', ApiConfigNode, {
        credentials: {
            apiKey: { type: "password" }
        }
    });
    
    // 注册make-iot-smart节点
    function MakeIotSmartNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        node.name = config.name;
        node.algorithm = config.algorithm;
        node.settings = config.settings;
    }
    
    RED.nodes.registerType('make-iot-smart', MakeIotSmartNode);
    
    // 添加HTTP端点用于AI聊天
    RED.httpAdmin.post('/make-iot-smart/chat', async function(req, res) {
        try {
            const { message, history = [], nodeId, modelType = 'default' } = req.body;
            
            if (!nodeId) {
                return res.status(400).json({ error: 'Node ID is required' });
            }
            
            // 获取配置节点
            const configNode = RED.nodes.getNode(nodeId);
            if (!configNode) {
                return res.status(404).json({ error: 'Configuration node not found' });
            }
            
            // 构建消息历史
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI assistant specialized in Node-RED development and IoT applications. 
                    Help users with flow creation, debugging, and optimization. You have access to Node-RED context 
                    and can provide specific guidance for IoT development.`
                },
                ...history,
                {
                    role: 'user',
                    content: message
                }
            ];
            
            // 生成AI响应
            const response = await configNode.generateResponse(messages, { modelType });
            
            res.json({
                success: true,
                response: response.text,
                usage: response.usage,
                provider: configNode.provider,
                model: configNode.model
            });
            
        } catch (error) {
            RED.log.error('AI chat error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    });
    
    // 添加HTTP端点用于流式AI聊天
    RED.httpAdmin.post('/make-iot-smart/chat-stream', async function(req, res) {
        try {
            const { message, nodeId, history } = req.body;

            // 设置SSE响应头
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control",
            });

            // 发送SSE事件的辅助函数
            const sendSSE = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // 验证nodeId
            if (!nodeId) {
                sendSSE({
                    type: "error",
                    content: "Node ID is required",
                });
                res.end();
                return;
            }

            // 获取配置节点
            const configNode = RED.nodes.getNode(nodeId);
            if (!configNode) {
                sendSSE({
                    type: "error",
                    content: `Configuration node not found: ${nodeId}`,
                });
                res.end();
                return;
            }

            // 检查节点类型
            if (configNode.type !== 'api-config') {
                sendSSE({
                    type: "error",
                    content: `Invalid node type: ${configNode.type}, expected api-config`,
                });
                res.end();
                return;
            }

            // 检查节点配置
            if (!configNode.apiKey) {
                sendSSE({
                    type: "error",
                    content: `Node configuration incomplete: missing API key. Please configure the node.`,
                });
                res.end();
                return;
            }

            // 检查provider和model
            if (!configNode.provider) {
                sendSSE({
                    type: "error",
                    content: `Node configuration incomplete: missing provider.`,
                });
                res.end();
                return;
            }

            if (!configNode.model) {
                sendSSE({
                    type: "error",
                    content: `Node configuration incomplete: missing model.`,
                });
                res.end();
                return;
            }

            // 构建消息历史
            const messages = [
                {
                    role: "system",
                    content: `You are an AI assistant specialized in Node-RED development and IoT applications. 
                    Help users with flow creation, debugging, and optimization. You have access to Node-RED context 
                    and can provide specific guidance for IoT development.`,
                },
            ];

            if (history && Array.isArray(history)) {
                messages.push(...history);
            }

            messages.push({
                role: "user",
                content: message,
            });

            // 发送开始状态
            sendSSE({
                type: "start",
                content: "Starting response...",
            });

            // 调用LLM流式响应
            await configNode.streamResponse(messages, (chunk) => {
                sendSSE({
                    type: "text",
                    content: chunk
                });
            });

            // 发送完成状态
            sendSSE({
                type: "done",
                content: "Response completed",
            });

            // 关闭连接
            res.end();
        } catch (error) {
            console.error('Stream error:', error);
            try {
                res.write(
                    `data: ${JSON.stringify({
                        type: "error",
                        content: `Stream error: ${error.message}`,
                    })}\n\n`
                );
                res.end();
            } catch (writeError) {
                console.error("Error writing to stream:", writeError);
            }
        }
    });
    
    // 获取可用的AI模型列表
    RED.httpAdmin.get('/make-iot-smart/models/:provider', function(req, res) {
        const provider = req.params.provider;
        
        const modelLists = {
            openai: [
                'gpt-4o',
                'gpt-4o-mini', 
                'gpt-4-turbo',
                'gpt-3.5-turbo'
            ],
            anthropic: [
                'claude-3-5-sonnet-20241022',
                'claude-3-5-haiku-20241022',
                'claude-3-opus-20240229'
            ],
            google: [
                'gemini-1.5-pro',
                'gemini-1.5-flash',
                'gemini-1.0-pro'
            ]
        };
        
        res.json({
            success: true,
            models: modelLists[provider] || []
        });
    });
}
