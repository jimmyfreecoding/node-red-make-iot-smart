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

module.exports = function (RED) {
    const { openai } = require('@ai-sdk/openai');
    const { anthropic } = require('@ai-sdk/anthropic');
    const { google } = require('@ai-sdk/google');
    const { createOpenAI } = require('@ai-sdk/openai');
    const { streamText, generateText } = require('ai');

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
        
        // MCP配置 - 添加详细日志
        node.mcpCommand = config.mcpCommand || 'npx @supcon-international/node-red-mcp-server';
        node.mcpArgs = config.mcpArgs || '';
        node.mcpEnv = config.mcpEnv || '';
        node.enableMcp = config.enableMcp || false;
        
        console.log('API配置节点初始化:', {
            name: node.name,
            provider: node.provider,
            model: node.model,
            enableMcp: node.enableMcp,
            mcpCommand: node.mcpCommand
        });
        
        // 获取API密钥
        node.apiKey = this.credentials.apiKey;
        
        // MCP客户端实例
        node.mcpClient = new MCPClientHelper();
        
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
                    
                    // 测试获取工具列表
                    try {
                        const tools = await node.getMCPTools();
                        console.log('MCP工具列表:', tools.map(t => t.function.name));
                    } catch (toolError) {
                        console.warn('获取MCP工具列表失败:', toolError.message);
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

        // 获取MCP工具
        node.getMCPTools = async function() {
            if (!node.mcpClient || !node.mcpClient.isClientConnected()) {
                return [];
            }

            try {
                const serverInfo = await node.mcpClient.getServerInfo();
                console.log('=== MCP工具原始数据 ===');
                console.log(JSON.stringify(serverInfo.tools, null, 2));
                
                // 转换MCP工具格式为AI SDK兼容格式
                const convertedTools = serverInfo.tools.map(tool => {
                    // 创建AI SDK兼容的工具定义
                    const aiTool = {
                        type: 'function',
                        function: {
                            name: tool.name,
                            description: tool.description,
                            parameters: {
                                type: 'object',
                                properties: tool.inputSchema.properties || {},
                                required: tool.inputSchema.required || [],
                                additionalProperties: tool.inputSchema.additionalProperties !== undefined ? 
                                    tool.inputSchema.additionalProperties : false
                            }
                        }
                    };
                    
                    console.log(`转换工具 ${tool.name}:`, JSON.stringify(aiTool, null, 2));
                    return aiTool;
                });
                
                console.log(`成功转换 ${convertedTools.length} 个MCP工具`);
                return convertedTools;
                
            } catch (error) {
                console.error('Failed to get MCP tools:', error);
                node.error('Failed to get MCP tools: ' + error.message);
                return [];
            }
        };

        // 执行MCP工具调用
        node.executeMCPTool = async function(toolName, toolArgs) {
            if (!node.mcpClient || !node.mcpClient.isClientConnected()) {
                throw new Error('MCP client not connected');
            }

            try {
                const result = await node.mcpClient.callTool(toolName, toolArgs);
                return result;
            } catch (error) {
                node.error(`MCP tool call failed ${toolName}: ${error.message}`);
                throw error;
            }
        };

        // 格式化工具结果
        node.formatToolResult = function(toolResult) {
            if (typeof toolResult === 'string') {
                return toolResult;
            }
            
            if (toolResult && toolResult.content) {
                if (Array.isArray(toolResult.content)) {
                    return toolResult.content.map(item => 
                        typeof item === 'string' ? item : JSON.stringify(item)
                    ).join('\n');
                }
                return typeof toolResult.content === 'string' ? 
                    toolResult.content : JSON.stringify(toolResult.content);
            }
            
            return JSON.stringify(toolResult);
        };

        // 生成增强的系统提示
        node.generateSystemPrompt = function(selectedFlow, selectedNodes, flowData, mcpTools = []) {
            const nodeRedVersion = RED.version || 'unknown';
            const nodeVersion = process.version;
            
            let systemPrompt = `You are an AI assistant specialized in Node-RED development and IoT applications.

Environment Information:
- Node-RED Version: ${nodeRedVersion}
- Node.js Version: ${nodeVersion}
- Platform: ${process.platform}
- Architecture: ${process.arch}

`;

            // 添加MCP工具信息
            if (mcpTools && mcpTools.length > 0) {
                systemPrompt += `Available MCP Tools:
You have access to the following MCP tools for Node-RED operations:
`;
                mcpTools.forEach((tool, index) => {
                    systemPrompt += `${index + 1}. ${tool.function.name}: ${tool.function.description}\n`;
                });
                systemPrompt += `
IMPORTANT: When users ask you to create flows, nodes, or perform Node-RED operations, you MUST use these MCP tools. Do not just provide instructions - actually execute the operations using the available tools.

`;
            }

            systemPrompt += `You help users with:
- Flow creation and optimization (USE MCP TOOLS when available)
- Node configuration and debugging
- IoT device integration
- Data processing and transformation
- API integration and automation
- Best practices and troubleshooting

`;

            // 添加当前选中的流程信息
            if (selectedFlow) {
                systemPrompt += `Current Flow Context:
- Flow ID: ${selectedFlow.id}
- Flow Name: ${selectedFlow.label || 'Unnamed Flow'}
- Flow Type: ${selectedFlow.type || 'tab'}
- Node Count: ${selectedFlow.nodeCount || 0}

`;

                // 如果有详细的流程数据，添加节点列表
                if (flowData && flowData.nodes && flowData.nodes.length > 0) {
                    systemPrompt += `Flow Nodes:\n`;
                    flowData.nodes.forEach((node, index) => {
                        systemPrompt += `${index + 1}. ${node.type}`;
                        if (node.name) systemPrompt += ` ("${node.name}")`;
                        systemPrompt += ` [${node.id}]`;
                        if (node.wires && node.wires.length > 0) {
                            systemPrompt += ` -> connects to ${node.wires.flat().length} outputs`;
                        }
                        systemPrompt += '\n';
                    });
                    systemPrompt += '\n';
                    
                    // 添加流程的JSON结构（简化版）
                    systemPrompt += `Flow Structure (JSON):\n`;
                    systemPrompt += JSON.stringify({
                        id: flowData.id,
                        label: flowData.label,
                        nodes: flowData.nodes.map(n => ({
                            id: n.id,
                            type: n.type,
                            name: n.name,
                            wires: n.wires
                        }))
                    }, null, 2);
                    systemPrompt += '\n\n';
                }
            }

            // 添加选中的节点信息
            if (selectedNodes && selectedNodes.length > 0) {
                systemPrompt += `Selected Nodes (Detailed):\n`;
                selectedNodes.forEach((node, index) => {
                    systemPrompt += `${index + 1}. ${node.type} (${node.id})`;
                    if (node.name) systemPrompt += ` - "${node.name}"`;
                    systemPrompt += '\n';
                    
                    // 添加节点配置信息
                    if (node.config && Object.keys(node.config).length > 0) {
                        systemPrompt += `   Configuration: ${JSON.stringify(node.config, null, 4)}\n`;
                    }
                    
                    // 添加连接信息
                    if (node.wires && node.wires.length > 0) {
                        systemPrompt += `   Connections: ${JSON.stringify(node.wires)}\n`;
                    }
                });
                systemPrompt += '\n';
            }

            if (mcpTools && mcpTools.length > 0) {
                systemPrompt += `REMEMBER: You have MCP tools available. When users request Node-RED operations like creating flows or nodes, USE THE TOOLS to actually perform the operations, don't just provide instructions.`;
            } else {
                systemPrompt += `Please provide specific, actionable guidance for Node-RED development. When suggesting code or configurations, use Node-RED's standard patterns and best practices.`;
            }

            return systemPrompt;
        };

        // 初始化MCP（如果启用）
        console.log('检查是否需要初始化MCP:', {
            enableMcp: node.enableMcp,
            mcpCommand: node.mcpCommand
        });
        
        if (node.enableMcp && node.mcpCommand) {
            console.log('MCP已启用，开始初始化...');
            // 延迟初始化，确保节点完全创建后再连接
            setImmediate(async () => {
                try {
                    const success = await node.initMCP();
                    if (success) {
                        console.log('MCP初始化成功');
                    } else {
                        console.warn('MCP初始化失败');
                    }
                } catch (error) {
                    console.error('MCP初始化异常:', error);
                }
            });
        } else {
            console.log('MCP未启用或命令未配置:', {
                enableMcp: node.enableMcp,
                hasCommand: !!node.mcpCommand
            });
        }

        // 节点关闭时断开MCP连接
        node.on('close', async function() {
            if (node.mcpClient) {
                await node.mcpClient.disconnect();
            }
        });

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

        // 调用LLM（支持工具调用）
        node.callLLMWithTools = async function(messages, tools = []) {
            const model = node.getModel();
            
            try {
                const result = await generateText({
                    model: model,
                    messages: messages,
                    tools: tools.length > 0 ? tools : undefined,
                    maxTokens: node.maxTokens,
                    temperature: node.temperature,
                    maxToolRoundtrips: 5,
                });

                return {
                    content: result.text,
                    toolCalls: result.toolCalls || [],
                    usage: result.usage
                };
            } catch (error) {
                node.error(`LLM call failed: ${error.message}`);
                throw error;
            }
        };

        // 验证工具格式 - 更严格的验证
        node.validateTool = function(tool) {
            try {
                // 检查基本结构
                if (!tool || typeof tool !== 'object') {
                    console.warn('工具不是有效对象:', tool);
                    return false;
                }
                
                if (!tool.function || typeof tool.function !== 'object') {
                    console.warn('工具缺少function字段:', tool);
                    return false;
                }
                
                if (!tool.function.name || typeof tool.function.name !== 'string') {
                    console.warn('工具缺少name字段:', tool);
                    return false;
                }
                
                // 检查参数schema
                const params = tool.function.parameters;
                if (params) {
                    // 必须是对象
                    if (typeof params !== 'object' || Array.isArray(params)) {
                        console.warn('工具参数不是有效对象:', tool.function.name, params);
                        return false;
                    }
                    
                    // 必须有type字段且为object
                    if (!params.type || params.type !== 'object') {
                        console.warn('工具参数类型必须是object:', tool.function.name, params.type);
                        return false;
                    }
                    
                    // properties必须是对象
                    if (params.properties && (typeof params.properties !== 'object' || Array.isArray(params.properties))) {
                        console.warn('工具参数properties必须是对象:', tool.function.name, params.properties);
                        return false;
                    }
                    
                    // required必须是数组
                    if (params.required && !Array.isArray(params.required)) {
                        console.warn('工具参数required必须是数组:', tool.function.name, params.required);
                        return false;
                    }
                }
                
                return true;
            } catch (error) {
                console.error('工具验证失败:', tool, error);
                return false;
            }
        };

        // 流式调用LLM（支持工具调用）
        node.streamLLMWithTools = async function(messages, tools = [], onChunk) {
            console.log('streamLLMWithTools 开始:', {
                provider: node.provider,
                model: node.model,
                messagesCount: messages.length,
                toolsCount: tools.length
            });
            
            const model = node.getModel();
            
            try {
                // 如果没有工具，使用简单的流式调用
                if (!tools || tools.length === 0) {
                    console.log('无工具模式，使用简单流式调用');
                    
                    const result = await streamText({
                        model: model,
                        messages: messages,
                        maxTokens: node.maxTokens,
                        temperature: node.temperature,
                    });

                    console.log('streamText 创建成功，开始读取流...');
                    
                    let fullText = '';
                    
                    for await (const delta of result.textStream) {
                        console.log('收到文本块:', delta);
                        fullText += delta;
                        if (onChunk) {
                            onChunk({
                                type: 'content',
                                content: delta
                            });
                        }
                    }

                    console.log('文本流读取完成，总长度:', fullText.length);
                    
                    if (onChunk) {
                        onChunk({ type: 'end' });
                    }

                    const usage = await result.usage;
                    console.log('使用统计:', usage);

                    return {
                        content: fullText,
                        toolCalls: [],
                        usage: usage
                    };
                }
                
                // 如果有工具，暂时跳过工具处理
                console.log('检测到工具，但暂时跳过以避免schema错误');
                throw new Error('工具调用暂时禁用');
                
            } catch (error) {
                console.error(`LLM streaming failed:`, error);
                if (onChunk) {
                    onChunk({
                        type: 'error',
                        content: error.message
                    });
                }
                throw error;
            }
        };

        // 将MCP工具转换为AI SDK兼容的工具格式
        node.convertMCPToolsForAI = function(mcpTools) {
            console.log('开始转换MCP工具，数量:', mcpTools.length);
            
            try {
                const { z } = require('zod');
                const { tool } = require('ai');
                console.log('zod和tool导入成功');
                
                return mcpTools.map((mcpTool, index) => {
                    try {
                        console.log(`处理工具 ${index + 1}/${mcpTools.length}: ${mcpTool.function.name}`);
                        
                        // 获取参数schema
                        const params = mcpTool.function.parameters;
                        console.log(`工具 ${mcpTool.function.name} 的参数:`, JSON.stringify(params, null, 2));
                        
                        // 创建zod schema
                        let zodSchema;
                        
                        if (!params.properties || Object.keys(params.properties).length === 0) {
                            console.log(`工具 ${mcpTool.function.name} 无参数，创建空schema`);
                            zodSchema = z.object({});
                        } else {
                            const properties = params.properties;
                            const required = params.required || [];
                            
                            const zodObject = {};
                            
                            Object.keys(properties).forEach(key => {
                                const prop = properties[key];
                                let zodType;
                                
                                switch (prop.type) {
                                    case 'string':
                                        zodType = z.string();
                                        break;
                                    case 'boolean':
                                        zodType = z.boolean();
                                        break;
                                    case 'number':
                                        zodType = z.number();
                                        break;
                                    case 'integer':
                                        zodType = z.number().int();
                                        break;
                                    case 'array':
                                        zodType = z.array(z.any());
                                        break;
                                    case 'object':
                                        zodType = z.object({}).passthrough();
                                        break;
                                    default:
                                        zodType = z.string();
                                }
                                
                                if (prop.description) {
                                    zodType = zodType.describe(prop.description);
                                }
                                
                                if (!required.includes(key)) {
                                    zodType = zodType.optional();
                                }
                                
                                zodObject[key] = zodType;
                            });
                            
                            zodSchema = z.object(zodObject);
                        }
                        
                        // 使用AI SDK的tool函数创建工具
                        const aiTool = tool({
                            description: mcpTool.function.description,
                            parameters: zodSchema,
                            execute: async (params) => {
                                // 这里不会被调用，因为我们会手动处理工具调用
                                return 'Tool execution handled separately';
                            }
                        });
                        
                        // 返回带有名称的工具对象
                        const result = {
                            [mcpTool.function.name]: aiTool
                        };
                        
                        console.log(`工具 ${mcpTool.function.name} 转换完成（使用tool函数）`);
                        return result;
                        
                    } catch (error) {
                        console.error(`转换工具 ${mcpTool.function.name} 失败:`, error);
                        return null;
                    }
                }).filter(tool => tool !== null);
                
            } catch (error) {
                console.error('工具转换失败:', error);
                return [];
            }
        };
    }

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
        node.algorithm = config.algorithm;
        node.settings = config.settings;
    }
    
    RED.nodes.registerType('make-iot-smart', MakeIotSmartNode);
    
    // 添加HTTP端点用于AI聊天
    RED.httpAdmin.post('/make-iot-smart/chat', async function(req, res) {
        try {
            const { message, history = [], nodeId, selectedFlow, selectedNodes } = req.body;
            
            if (!nodeId) {
                return res.status(400).json({ error: 'Node ID is required' });
            }
            
            const configNode = RED.nodes.getNode(nodeId);
            if (!configNode) {
                return res.status(404).json({ error: 'Configuration node not found' });
            }
            
            // 生成增强的系统提示
            const systemPrompt = configNode.generateSystemPrompt(selectedFlow, selectedNodes);
            
            // 获取MCP工具
            const mcpTools = await configNode.getMCPTools();
            
            // 构建消息历史
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: message }
            ];
            
            // 调用LLM
            const result = await configNode.callLLMWithTools(messages, mcpTools);
            
            res.json({
                success: true,
                response: result.content,
                toolCalls: result.toolCalls,
                mcpAvailable: configNode.enableMcp && configNode.mcpClient.isClientConnected(),
                mcpTools: mcpTools.length
            });
            
        } catch (error) {
            console.error('Chat error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 流式聊天端点
    RED.httpAdmin.post('/make-iot-smart/chat-stream', async function(req, res) {
        console.log('收到聊天请求:', req.body);
        
        try {
            const { message, history = [], nodeId, selectedFlow, selectedNodes, flowData } = req.body;
            
            if (!nodeId) {
                console.error('缺少nodeId');
                return res.status(400).json({ error: 'Node ID is required' });
            }
            
            const configNode = RED.nodes.getNode(nodeId);
            if (!configNode) {
                console.error('找不到配置节点:', nodeId);
                return res.status(404).json({ error: 'Configuration node not found' });
            }
            
            console.log('找到配置节点:', {
                provider: configNode.provider,
                model: configNode.model,
                enableMcp: configNode.enableMcp,
                mcpConnected: configNode.mcpClient ? configNode.mcpClient.isClientConnected() : false
            });
            
            // 设置SSE响应头
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            
            const sendSSE = (data) => {
                const jsonData = JSON.stringify(data);
                // console.log('发送SSE数据:', jsonData);
                res.write(`data: ${jsonData}\n\n`);
            };
            
            // 尝试获取MCP工具
            let mcpTools = [];
            let aiCompatibleTools = [];
            let mcpAvailable = false;
            
            if (configNode.enableMcp && configNode.mcpClient && configNode.mcpClient.isClientConnected()) {
                try {
                    console.log('尝试获取MCP工具...');
                    mcpTools = await configNode.getMCPTools();
                    
                    if (mcpTools.length > 0) {
                        console.log('转换MCP工具为AI SDK格式...');
                        aiCompatibleTools = configNode.convertMCPToolsForAI(mcpTools);
                        console.log(`成功转换 ${aiCompatibleTools.length} 个工具`);
                    }
                    
                    mcpAvailable = true;
                    console.log('MCP工具获取成功，数量:', mcpTools.length);
                } catch (error) {
                    console.error('获取MCP工具失败:', error);
                    mcpAvailable = false;
                }
            }
            
            // 生成增强的系统提示（传入MCP工具信息）
            const systemPrompt = configNode.generateSystemPrompt(selectedFlow, selectedNodes, flowData, mcpTools);
            console.log('生成的系统提示长度:', systemPrompt.length);
            
            // 构建消息历史
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: message }
            ];
            
            console.log('构建的消息历史:', messages.length, '条消息');
            
            // 发送开始信号
            sendSSE({ 
                type: 'start', 
                mcpAvailable: mcpAvailable,
                mcpToolsCount: mcpTools.length,
                mcpTools: mcpTools.map(t => ({ name: t.function?.name || 'unknown', description: t.function?.description || '' }))
            });
            
            // 使用工具调用LLM
            if (aiCompatibleTools.length > 0) { // 重新启用工具
                console.log('开始调用LLM（带工具）...');
                
                // 合并所有工具到一个对象
                const toolsObject = {};
                aiCompatibleTools.forEach(toolObj => {
                    Object.assign(toolsObject, toolObj);
                });
                
                console.log(`合并后的工具数量: ${Object.keys(toolsObject).length}`);
                console.log('工具名称:', Object.keys(toolsObject));
                
                const model = configNode.getModel();
                
                const result = await streamText({
                    model: model,
                    messages: messages,
                    tools: toolsObject,
                    maxTokens: configNode.maxTokens,
                    temperature: configNode.temperature,
                    onStepFinish: async (step) => {
                        console.log('步骤完成:', step.stepType);
                        
                        if (step.toolCalls && step.toolCalls.length > 0) {
                            console.log('检测到工具调用:', step.toolCalls.length, '个');
                            
                            for (const toolCall of step.toolCalls) {
                                console.log('工具调用:', toolCall.toolName, toolCall.args);
                                
                                sendSSE({
                                    type: 'tool',
                                    content: `🔧 调用工具: ${toolCall.toolName}`
                                });
                                
                                try {
                                    // 执行MCP工具调用
                                    const toolResult = await configNode.executeMCPTool(
                                        toolCall.toolName, 
                                        toolCall.args
                                    );
                                    
                                    const formattedResult = configNode.formatToolResult(toolResult);
                                    console.log('工具调用结果:', formattedResult.substring(0, 200) + '...');
                                    
                                } catch (error) {
                                    console.error('工具调用失败:', error);
                                    sendSSE({
                                        type: 'error',
                                        content: `❌ 工具调用失败: ${error.message}`
                                    });
                                }
                            }
                        }
                    }
                });

                console.log('streamText 创建成功，开始读取流...');
                
                let fullText = '';
                
                // 处理流数据
                for await (const delta of result.textStream) {
                    fullText += delta;
                    sendSSE({
                        type: 'content',
                        content: delta
                    });
                }

                console.log('文本流读取完成，总长度:', fullText.length);
                
                // 如果没有文本内容但有工具调用，发送提示信息
                if (fullText.length === 0) {
                    console.log('检查是否有工具调用结果...');
                    const finalResult = await result.response;
                    console.log('最终结果:', finalResult);
                    
                    if (finalResult.toolCalls && finalResult.toolCalls.length > 0) {
                        sendSSE({
                            type: 'content',
                            content: '\n\n✅ 工具调用完成'
                        });
                    }
                }
                
            } else {
                console.log('开始调用LLM（无工具）...');
                
                const model = configNode.getModel();
                
                const result = await streamText({
                    model: model,
                    messages: messages,
                    maxTokens: configNode.maxTokens,
                    temperature: configNode.temperature,
                });

                console.log('streamText 创建成功，开始读取流...');
                
                let fullText = '';
                
                // 处理流数据
                for await (const delta of result.textStream) {
                    fullText += delta;
                    sendSSE({
                        type: 'content',
                        content: delta
                    });
                }

                console.log('文本流读取完成，总长度:', fullText.length);
            }
            
            sendSSE({ type: 'end' });
            
            console.log('LLM调用完成');
            res.end();
            
        } catch (error) {
            console.error('Stream chat error:', error);
            res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
            res.end();
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

    // 添加MCP状态检查端点
    RED.httpAdmin.get('/make-iot-smart/mcp-status/:nodeId', function(req, res) {
        try {
            const nodeId = req.params.nodeId;
            const configNode = RED.nodes.getNode(nodeId);
            
            if (!configNode) {
                return res.status(404).json({ error: 'Configuration node not found' });
            }
            
            const status = {
                enabled: configNode.enableMcp,
                command: configNode.mcpCommand,
                args: configNode.mcpArgs,
                env: configNode.mcpEnv,
                connected: configNode.mcpClient ? configNode.mcpClient.isClientConnected() : false,
                tools: []
            };
            
            // 如果连接了，获取工具列表
            if (status.connected) {
                configNode.getMCPTools().then(tools => {
                    status.tools = tools.map(t => ({
                        name: t.function.name,
                        description: t.function.description
                    }));
                    res.json(status);
                }).catch(error => {
                    status.error = error.message;
                    res.json(status);
                });
            } else {
                res.json(status);
            }
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}
