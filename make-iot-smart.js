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
                // console.log(JSON.stringify(serverInfo.tools, null, 2));
                
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
                    
                    // console.log(`转换工具 ${tool.name}:`, JSON.stringify(aiTool, null, 2));
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

        // 生成增强的系统提示 - 支持场景化
        node.generateSystemPrompt = function(selectedFlow, selectedNodes, flowData, mcpTools = [], scenario = 'general') {
            const nodeRedVersion = RED.version || 'unknown';
            const nodeVersion = process.version;
            
            // 场景特定指令
            const scenarioPrompts = {
                learning: `
                    You are an AI assistant helping users learn Node-RED. Your role is to:
                    - Explain Node-RED nodes, flows, or concepts in detail, using examples from official Node-RED documentation, local examples, or third-party flows.
                    - Provide step-by-step explanations for beginners, including node purposes and configurations.
                    - Generate a sample flow JSON for the user to import and experiment with.
                    - Suggest interactive tasks to help users understand the flow.
                    
                    For initial learning scenario responses, always end with a "Usage Guide" section that includes:
                    
                    **Usage Guide**
                    You can use these prompts for node learning:
                    1) Introduce Node-RED basics
                    2) Introduce the usage of xxx node with examples
                    3) Introduce dashboard usage methods
                    4) Explain the current flow
                    5) Explain the current node
                    
                    ACTION_TYPE: CREATE (for flow creation) or EXPLAIN (for explanations without flow creation).
                `,
                solution: `
                    You are an AI assistant helping users find IoT solutions. Your role is to:
                    - Analyze the user's requirements and context.
                    - Provide three distinct solutions with pros, cons, and a comparison table.
                    - Recommend nodes to install and provide a sample flow JSON for each solution.
                    - Guide the user to install nodes and import flows.
                    ACTION_TYPE: INSTALL (for node installation) or CREATE (for flow creation).
                `,
                integration: `
                    You are an AI assistant for integrating IoT protocols or software with Node-RED. Your role is to:
                    - Read and interpret provided integration documentation (e.g., MQTT, HTTP, Modbus).
                    - Generate a sample flow JSON for the integration.
                    - Suggest necessary nodes and provide installation instructions.
                    - Assist with configuration steps for the integration.
                    ACTION_TYPE: CREATE (for flow creation) or INSTALL (for node installation).
                `,
                development: `
                    You are an AI assistant for Node-RED development. Your role is to:
                    - Analyze existing flows and function node code.
                    - Suggest optimizations or modifications based on user requirements.
                    - Generate updated flow JSON or function node code.
                    - Recommend additional nodes if needed.
                    ACTION_TYPE: MODIFY (for flow edits) or INSTALL (for new nodes).
                `,
                configuration: `
                    You are an AI assistant for Node-RED configuration. Your role is to:
                    - Guide users through modifying Node-RED settings (e.g., settings.js) via SSH or local file edits.
                    - Provide commands for restarting Node-RED after changes.
                    - Explain configuration options clearly.
                    ACTION_TYPE: CONFIG (for settings changes) or RESTART (for service restart).
                `,
                management: `
                    You are an AI assistant for managing Node-RED deployments. Your role is to:
                    - Provide guidance for remote access setup, Git integration, or batch deployment.
                    - Generate scripts or flows for Git operations or multi-device management.
                    - Suggest tools or nodes for management tasks.
                    ACTION_TYPE: CONFIG (for remote access) or DEPLOY (for batch deployment).
                `,
                general: `
                    You are an AI assistant for general Node-RED queries. Provide clear, concise answers and, if applicable, include:
                    - Explanations of nodes or flows.
                    - Sample flow JSON or node installation instructions.
                    - Suggestions for next steps.
                    ACTION_TYPE: Varies based on query (CREATE, INSTALL, MODIFY, etc.).
                `
            };

            // 选择适当的场景提示
            const scenarioInstruction = scenarioPrompts[scenario] || scenarioPrompts.general;

            // 构建完整的系统提示
            let systemPrompt = `You are an AI assistant specialized in Node-RED development and IoT applications.

CRITICAL WORKFLOW:
- Always follow the scenario-specific instructions below.
- For flow/node operations, provide:
  1. A detailed text explanation.
  2. A complete JSON configuration (if applicable).
  3. An ACTION_TYPE indicator (CREATE, MODIFY, DELETE, INSTALL, RESTART, CONFIG, DEPLOY, BACKUP, RESTORE, EXPLAIN).
- For JSON outputs, format them cleanly and avoid displaying excessively large JSON in the UI (use a button to show JSON).
- If tools are called, describe the tool's purpose before execution.

SCENARIO-SPECIFIC INSTRUCTIONS:
${scenarioInstruction}

Available MCP Tools: ${mcpTools.length} tools
${mcpTools.map(tool => `- ${tool.function?.name}: ${tool.function?.description}`).join('\n')}

Current Context:
- Node-RED Version: ${nodeRedVersion}
- Node.js Version: ${nodeVersion}
- Current Time: ${new Date().toISOString()}
${selectedFlow ? `Current Flow: ${selectedFlow.label} (ID: ${selectedFlow.id})` : 'No flow selected'}
${selectedNodes && selectedNodes.length > 0 ? `Selected Nodes: ${selectedNodes.length} node(s)` : 'No nodes selected'}

Always provide clear explanations, properly formatted JSON, and action type indicators.`;

            return systemPrompt;
        };

        // 场景检测函数
        node.detectScenario = function(message) {
            const messageLower = message.toLowerCase();
            
            if (messageLower.includes('learn') || messageLower.includes('explain') || messageLower.includes('教学') || messageLower.includes('学习')) {
                return 'learning';
            } else if (messageLower.includes('solution') || messageLower.includes('options') || messageLower.includes('方案') || messageLower.includes('解决方案')) {
                return 'solution';
            } else if (messageLower.includes('integrate') || messageLower.includes('protocol') || messageLower.includes('集成') || messageLower.includes('协议')) {
                return 'integration';
            } else if (messageLower.includes('optimize') || messageLower.includes('develop') || messageLower.includes('优化') || messageLower.includes('开发')) {
                return 'development';
            } else if (messageLower.includes('configure') || messageLower.includes('settings') || messageLower.includes('配置') || messageLower.includes('设置')) {
                return 'configuration';
            } else if (messageLower.includes('manage') || messageLower.includes('deploy') || messageLower.includes('管理') || messageLower.includes('部署')) {
                return 'management';
            }
            
            return 'general';
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
                const error = new Error('API密钥缺失，请在配置节点中设置API密钥');
                error.code = 'API_KEY_MISSING';
                throw error;
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
                const error = new Error('模型名称缺失，请在配置节点中选择模型');
                error.code = 'MODEL_NAME_MISSING';
                throw error;
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
                // 检查是否是API认证相关错误
                if (node.isAuthError(error)) {
                    const authError = new Error('API密钥认证失败，请检查密钥是否正确');
                    authError.code = 'API_AUTH_FAILED';
                    node.error(`Model creation failed: ${authError.message}`);
                    throw authError;
                }
                
                node.error(`Model creation failed: ${error.message}`);
                throw error;
            }
        };
        
        // 检查是否是API认证错误
        node.isAuthError = function(error) {
            if (!error) return false;
            
            const errorMessage = error.message ? error.message.toLowerCase() : '';
            const errorCode = error.code ? error.code.toLowerCase() : '';
            const statusCode = error.status || error.statusCode;
            
            // 检查常见的认证失败错误
            return (
                statusCode === 401 ||
                statusCode === 403 ||
                errorCode.includes('unauthorized') ||
                errorCode.includes('invalid_api_key') ||
                errorCode.includes('authentication') ||
                errorMessage.includes('unauthorized') ||
                errorMessage.includes('invalid api key') ||
                errorMessage.includes('authentication failed') ||
                errorMessage.includes('api key') ||
                errorMessage.includes('invalid_api_key') ||
                errorMessage.includes('incorrect api key')
            );
        };

        // 调用LLM（支持工具调用）
        node.callLLMWithTools = async function(messages, tools = []) {
            try {
                const model = node.getModel();
                
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
                // 检查是否是API认证相关错误
                if (node.isAuthError(error)) {
                    const authError = new Error('API密钥认证失败，请检查密钥是否正确');
                    authError.code = 'API_AUTH_FAILED';
                    node.error(`LLM call failed: ${authError.message}`);
                    throw authError;
                }
                
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
            console.log('转换MCP工具为AI SDK格式，数量:', mcpTools.length);
            
            try {
                const { z } = require('zod');
                const { tool } = require('ai');
                
                return mcpTools.map((mcpTool, index) => {
                    try {
                        console.log(`处理工具 ${index + 1}/${mcpTools.length}: ${mcpTool.function.name}`);
                        
                        const params = mcpTool.function.parameters;
                        let zodSchema;

                        if (!params.properties || Object.keys(params.properties).length === 0) {
                            zodSchema = z.object({});
                        } else {
                            const zodObject = {};
                            const required = params.required || [];
                            
                            Object.keys(params.properties).forEach(key => {
                                const prop = params.properties[key];
                                let zodType;
                                
                                switch (prop.type) {
                                    case 'string': 
                                        zodType = z.string();
                                        if (prop.enum) {
                                            zodType = z.enum(prop.enum);
                                        }
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

                        const aiTool = tool({
                            description: mcpTool.function.description,
                            parameters: zodSchema,
                            execute: async (params) => {
                                console.log(`执行MCP工具: ${mcpTool.function.name}`, params);
                                
                                // 特殊处理create-flow和update-flow工具的flowJson参数
                                if ((mcpTool.function.name === 'create-flow' || mcpTool.function.name === 'update-flow') && params.flowJson) {
                                    console.log('开始处理flowJson参数，工具:', mcpTool.function.name);
                                    let flowData;
                                    
                                    // 如果是字符串，尝试解析为JSON
                                    if (typeof params.flowJson === 'string') {
                                        try {
                                            flowData = JSON.parse(params.flowJson);
                                            console.log('解析flowJson字符串为对象，类型:', Array.isArray(flowData) ? 'array' : 'object');
                                        } catch (error) {
                                            console.error('解析flowJson失败:', error);
                                            throw new Error('Invalid flowJson format: ' + error.message);
                                        }
                                    } else {
                                        flowData = params.flowJson;
                                        console.log('flowJson已是对象，类型:', Array.isArray(flowData) ? 'array' : 'object');
                                    }
                                    
                                    // 确保flowData是数组格式（Node-RED流程格式）
                                    if (Array.isArray(flowData)) {
                                        console.log('进入数组处理分支，原始节点数:', flowData.length);
                                        
                                        if (mcpTool.function.name === 'create-flow') {
                            // create-flow工具期望包含nodes属性的对象格式，但需要过滤掉tab节点
                            const functionalNodes = flowData.filter(node => node.type !== 'tab');
                            const flowObject = {
                                nodes: functionalNodes,
                                label: params.label || '新流程',
                                description: params.description || ''
                            };
                            params.flowJson = JSON.stringify(flowObject);
                            console.log('转换flowJson为对象格式（create-flow），过滤掉tab节点，保留功能节点数:', functionalNodes.length);
                                        } else {
                                            // update-flow只需要功能节点，过滤掉tab类型的节点
                                            const functionalNodes = flowData.filter(node => node.type !== 'tab');
                                            console.log(`过滤前节点数: ${flowData.length}, 过滤后节点数: ${functionalNodes.length}`);
                                            // update-flow需要节点数组，并且需要生成唯一ID避免冲突
                                            // update-flow需要节点数组，并且需要生成唯一ID避免冲突
                                            const nodesWithUniqueIds = functionalNodes.map(node => {
                                                const newId = 'flow-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                                                const newNode = { ...node, id: newId };
                                                
                                                // 如果节点有z属性（所属流程），需要在update-flow时由工具自动设置
                                                if (newNode.z) {
                                                    delete newNode.z;
                                                }
                                                
                                                return newNode;
                                            });
                                            
                                            // 更新节点间的连接关系（wires）
                                            const idMapping = {};
                                            functionalNodes.forEach((node, index) => {
                                                idMapping[node.id] = nodesWithUniqueIds[index].id;
                                            });
                                            
                                            nodesWithUniqueIds.forEach(node => {
                                                if (node.wires && Array.isArray(node.wires)) {
                                                    node.wires = node.wires.map(wireArray => 
                                                        wireArray.map(wireId => idMapping[wireId] || wireId)
                                                    );
                                                }
                                            });
                                            
                                            params.flowJson = JSON.stringify(nodesWithUniqueIds);
                                            console.log('转换flowJson为带唯一ID的节点数组（update-flow）');
                                        }
                                    } else if (flowData && typeof flowData === 'object') {
                                        // 如果已经是对象，确保有nodes属性
                                        if (!flowData.nodes) {
                                            // 如果对象没有nodes属性，假设整个对象就是单个节点
                                            if (mcpTool.function.name === 'create-flow') {
                                                // create-flow工具期望包含nodes属性的对象格式，但需要过滤掉tab节点
                                                const functionalNodes = flowData.type !== 'tab' ? [flowData] : [];
                                                const flowObject = {
                                                    nodes: functionalNodes,
                                                    label: params.label || '新流程',
                                                    description: params.description || ''
                                                };
                                                params.flowJson = JSON.stringify(flowObject);
                                            } else {
                                                // update-flow过滤掉tab节点
                                                const singleNode = flowData.type !== 'tab' ? [flowData] : [];
                                                params.flowJson = JSON.stringify(singleNode);
                                            }
                                        } else {
                                            // 如果对象有nodes属性
                                            if (mcpTool.function.name === 'create-flow') {
                                                // create-flow工具期望包含nodes属性的对象格式，但需要过滤掉tab节点
                                                const allNodes = Array.isArray(flowData.nodes) ? flowData.nodes : [];
                                                const functionalNodes = allNodes.filter(node => node.type !== 'tab');
                                                const flowObject = {
                                                    nodes: functionalNodes,
                                                    label: params.label || flowData.label || '新流程',
                                                    description: params.description || flowData.description || ''
                                                };
                                                console.log(`对象格式create-flow过滤掉tab节点，保留功能节点数: ${functionalNodes.length}`);
                                                params.flowJson = JSON.stringify(flowObject);
                                            } else {
                                                // update-flow过滤掉tab节点
                                                const functionalNodes = Array.isArray(flowData.nodes) ? 
                                                    flowData.nodes.filter(node => node.type !== 'tab') : [];
                                                console.log(`对象格式过滤前节点数: ${Array.isArray(flowData.nodes) ? flowData.nodes.length : 0}, 过滤后节点数: ${functionalNodes.length}`);
                                                 
                                                 // update-flow需要生成唯一ID
                                                const nodesWithUniqueIds = functionalNodes.map(node => {
                                                    const newId = 'flow-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                                                    const newNode = { ...node, id: newId };
                                                    if (newNode.z) {
                                                        delete newNode.z;
                                                    }
                                                    return newNode;
                                                });
                                                
                                                // 更新连接关系
                                                const idMapping = {};
                                                functionalNodes.forEach((node, index) => {
                                                    idMapping[node.id] = nodesWithUniqueIds[index].id;
                                                });
                                                
                                                nodesWithUniqueIds.forEach(node => {
                                                    if (node.wires && Array.isArray(node.wires)) {
                                                        node.wires = node.wires.map(wireArray => 
                                                            wireArray.map(wireId => idMapping[wireId] || wireId)
                                                        );
                                                    }
                                                });
                                                
                                                params.flowJson = JSON.stringify(nodesWithUniqueIds);
                                            }
                                        }
                                        console.log('确保flowJson格式正确并过滤tab节点');
                                    } else {
                                        throw new Error('flowJson must be an array or object with nodes property');
                                    }
                                    
                                    console.log('处理后的flowJson结构:', {
                                        isArray: Array.isArray(params.flowJson),
                                        hasNodes: !!params.flowJson.nodes,
                                        nodesCount: Array.isArray(params.flowJson) ? params.flowJson.length : (Array.isArray(params.flowJson.nodes) ? params.flowJson.nodes.length : 0),
                                        label: params.flowJson.label || params.label
                                    });
                                }
                                
                                // 如果是创建流程工具，且有选中的流程，改为使用update-flow工具
                                let actualToolName = mcpTool.function.name;
                                if (mcpTool.function.name === 'create-flow' && selectedFlow && selectedFlow.id) {
                                    // 改为调用update-flow工具来更新当前流程
                                    actualToolName = 'update-flow';
                                    params.id = selectedFlow.id;  // update-flow需要id参数
                                    
                                    // 获取当前流程的现有节点和信息
                                    const currentWorkspace = RED.nodes.workspace(selectedFlow.id);
                                    const existingNodes = RED.nodes.filterNodes({z: selectedFlow.id});
                                    
                                    // 保留当前流程的label
                                    if (currentWorkspace && currentWorkspace.label) {
                                        params.label = currentWorkspace.label;
                                    }
                                    
                                    // 计算新节点的起始Y坐标（位于现有节点下方）
                                    let maxY = 0;
                                    if (existingNodes.length > 0) {
                                        maxY = Math.max(...existingNodes.map(node => (node.y || 0) + 50)); // 50是节点高度的估计值
                                    }
                                    const startY = maxY + 100; // 在最下方节点下方留100像素间距
                                    
                                    // 解析新节点并调整坐标
                                    let newNodes;
                                    try {
                                        newNodes = JSON.parse(params.flowJson);
                                    } catch (e) {
                                        console.error('解析flowJson失败:', e);
                                        newNodes = [];
                                    }
                                    
                                    // 为新节点重新计算坐标
                                    if (Array.isArray(newNodes)) {
                                        newNodes.forEach((node, index) => {
                                            if (node.x !== undefined && node.y !== undefined) {
                                                // 保持相对位置，但整体向下移动
                                                const minY = Math.min(...newNodes.map(n => n.y || 0));
                                                node.y = node.y - minY + startY;
                                            } else {
                                                // 如果没有坐标，设置默认位置
                                                node.x = 100 + (index % 5) * 200; // 每行5个节点
                                                node.y = startY + Math.floor(index / 5) * 100;
                                            }
                                        });
                                        params.flowJson = JSON.stringify(newNodes);
                                    }
                                    
                                    console.log('AI助手节点改为在当前流程中更新:', selectedFlow.id, '现有节点数:', existingNodes.length, '新节点起始Y:', startY);
                                }
                                
                                const result = await node.executeMCPTool(actualToolName, params);
                                return node.formatToolResult(result);
                            }
                        });

                        console.log(`工具 ${mcpTool.function.name} 转换完成`);
                        return { [mcpTool.function.name]: aiTool };
                        
                    } catch (error) {
                        console.error(`转换工具 ${mcpTool.function.name} 失败:`, error);
                        return null;
                    }
                }).filter(tool => tool !== null);
                
            } catch (error) {
                console.error('MCP工具转换失败:', error);
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
    
    // 自动创建AI助手节点的机制
    function ensureAIHelperNode() {
        try {
            // 重新启用自动重建功能
            const AUTO_REBUILD_ENABLED = true;
            
            // 检查是否存在AI助手节点
            let hasAIHelper = false;
            
            RED.nodes.eachNode(function(node) {
                if (node.type === 'make-iot-smart') {
                    hasAIHelper = true;
                    return false; // 停止遍历
                }
            });
            
            // 如果没有AI助手节点，通过HTTP API创建一个
            if (!hasAIHelper) {
                console.log('未找到AI助手节点，自动创建中...');
                
                // 查找第一个API配置节点
                let apiConfigId = null;
                
                RED.nodes.eachNode(function(node) {
                    if (node.type === 'api-config') {
                        apiConfigId = node.id;
                        return false; // 停止遍历
                    }
                });
                
                if (apiConfigId) {
                    // 获取当前流程
                    const http = require('http');
                    const options = {
                        hostname: 'localhost',
                        port: 1880,
                        path: '/flows',
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    };
                    
                    const req = http.request(options, (res) => {
                        let data = '';
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        res.on('end', () => {
                            try {
                                const flows = JSON.parse(data);
                                
                                // 查找第一个工作区
                                let workspaceId = null;
                                for (const flow of flows) {
                                    if (flow.type === 'tab') {
                                        workspaceId = flow.id;
                                        break;
                                    }
                                }
                                
                                // 如果没有工作区，创建一个
                                if (!workspaceId) {
                                    workspaceId = RED.util.generateId();
                                    flows.push({
                                        id: workspaceId,
                                        type: 'tab',
                                        label: 'Flow 1',
                                        disabled: false,
                                        info: ''
                                    });
                                }
                                
                                // 添加AI助手节点（设置为有效状态但默认禁用）
                                 const newNodeId = RED.util.generateId();
                                 flows.push({
                                     id: newNodeId,
                                     type: 'make-iot-smart',
                                     name: 'AI助手',
                                     apiConfig: apiConfigId,
                                     algorithm: 'dagre_lr',
                                     settings: {},
                                     valid: true,
                                     d: true,
                                     x: 100,
                                     y: 100,
                                     z: workspaceId
                                 });
                                 console.log('自动创建AI助手节点（设置为有效状态但默认禁用）:', newNodeId);
                                
                                // 更新流程
                                const updateOptions = {
                                    hostname: 'localhost',
                                    port: 1880,
                                    path: '/flows',
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                };
                                
                                const updateReq = http.request(updateOptions, (updateRes) => {
                                    if (updateRes.statusCode === 200 || updateRes.statusCode === 204) {
                                        console.log('AI助手节点自动创建成功:', newNodeId);
                                    } else {
                                        console.error('更新流程失败，状态码:', updateRes.statusCode);
                                    }
                                });
                                
                                updateReq.on('error', (err) => {
                                    console.error('更新流程请求失败:', err);
                                });
                                
                                updateReq.write(JSON.stringify(flows));
                                updateReq.end();
                                
                            } catch (parseError) {
                                console.error('解析流程数据失败:', parseError);
                            }
                        });
                    });
                    
                    req.on('error', (err) => {
                        console.error('获取流程失败:', err);
                    });
                    
                    req.end();
                } else {
                    console.log('未找到API配置节点，无法自动创建AI助手节点');
                }
            } else {
                console.log('AI助手节点已存在，无需创建');
            }
        } catch (error) {
            console.error('ensureAIHelperNode执行失败:', error);
        }
    }
    
    // 立即执行一次检查
    console.log('设置setTimeout来调用ensureAIHelperNode...');
    setTimeout(() => {
        console.log('setTimeout触发，开始执行ensureAIHelperNode...');
        ensureAIHelperNode();
    }, 3000);
    
    // 监听节点删除事件，自动重新创建AI助手节点
    RED.events.on('flows:stopped', function() {
        setTimeout(ensureAIHelperNode, 1000);
    });
    
    // 监听流部署事件
    RED.events.on('flows:started', function() {
        setTimeout(ensureAIHelperNode, 2000);
    });
    
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

    // 流式聊天端点 - 添加场景检测
    RED.httpAdmin.post('/make-iot-smart/chat-stream', async function(req, res) {
        console.log('收到聊天请求:', req.body);
        
        let configNode; // 在函数顶部声明configNode变量
        
        try {
            const { message, history = [], nodeId, selectedFlow, selectedNodes, flowData, scenario: userScenario } = req.body;
            
            if (!nodeId) {
                console.error('缺少nodeId');
                return res.status(400).json({ error: 'Node ID is required' });
            }
            
            configNode = RED.nodes.getNode(nodeId);
            if (!configNode) {
                console.error('找不到配置节点:', nodeId);
                return res.status(404).json({ error: 'Configuration node not found' });
            }
            
            // 场景检测
            let detectedScenario = userScenario || configNode.detectScenario(message);
            console.log('检测到场景:', detectedScenario);
            
            // 设置SSE响应头
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });

            function sendSSE(data) {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            }

            let mcpTools = [];
            let aiCompatibleTools = [];
            let mcpAvailable = false;
            
            // 获取MCP工具
            if (configNode.enableMcp && configNode.mcpClient && configNode.mcpClient.isClientConnected()) {
                try {
                    console.log('尝试获取MCP工具...');
                    mcpTools = await configNode.getMCPTools();
                    console.log('原始MCP工具:', mcpTools.length, '个');
                    
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
            
            // 生成场景化的系统提示
            const systemPrompt = configNode.generateSystemPrompt(selectedFlow, selectedNodes, flowData, mcpTools, detectedScenario);
            console.log('生成场景化系统提示，场景:', detectedScenario);
            
            // 构建消息历史
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: message }
            ];
            
            console.log('构建的消息历史:', messages.length, '条消息');
            
            // 发送开始信号，包含场景信息
            sendSSE({ 
                type: 'start', 
                scenario: detectedScenario,
                mcpAvailable: mcpAvailable,
                mcpToolsCount: mcpTools.length,
                mcpTools: mcpTools.map(t => ({ name: t.function?.name || 'unknown', description: t.function?.description || '' }))
            });
            
            // 使用工具调用LLM
            if (aiCompatibleTools.length > 0) {
                console.log('开始调用LLM（带工具）...');
                
                // 合并所有工具到一个对象
                const toolsObject = {};
                aiCompatibleTools.forEach(toolObj => {
                    Object.assign(toolsObject, toolObj);
                });
                
                console.log(`合并后的工具数量: ${Object.keys(toolsObject).length}`);
                console.log('工具名称:', Object.keys(toolsObject));
                
                let model;
                try {
                    model = configNode.getModel();
                } catch (error) {
                    if (error.code === 'API_KEY_MISSING') {
                        // 通过SSE发送错误消息给客户端
                        sendSSE({ type: 'error', message: 'API密钥缺失，请在配置节点中设置API密钥' });
                        return;
                    }
                    throw error;
                }
                
                const result = await streamText({
                    model: model,
                    messages: messages,
                    tools: toolsObject,
                    maxTokens: configNode.maxTokens,
                    temperature: configNode.temperature,
                    onStepFinish: async (step) => {
                        console.log('步骤完成:', step.stepType);
                        
                        if (step.text) {
                            console.log('步骤文本内容长度:', step.text.length);
                        }
                        
                        if (step.toolCalls && step.toolCalls.length > 0) {
                            console.log('检测到工具调用:', step.toolCalls.length, '个');
                            
                            for (const toolCall of step.toolCalls) {
                                console.log('工具调用:', toolCall.toolName, toolCall.args);
                                
                                // 发送工具调用信息
                                sendSSE({
                                    type: 'tool_call',
                                    toolName: toolCall.toolName,
                                    toolArgs: toolCall.args,
                                    scenario: detectedScenario
                                });
                                
                                try {
                                    // 这里工具已经通过AI SDK自动执行
                                    console.log('工具调用已通过AI SDK执行');
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
                        content: delta,
                        scenario: detectedScenario
                    });
                }

                console.log('文本流读取完成，总长度:', fullText.length);
                
            } else {
                console.log('开始调用LLM（无工具）...');
                
                let model;
                try {
                    model = configNode.getModel();
                } catch (error) {
                    if (error.code === 'API_KEY_MISSING') {
                        // 通过SSE发送错误消息给客户端
                        sendSSE({ type: 'error', message: 'API密钥缺失，请在配置节点中设置API密钥' });
                        return;
                    }
                    throw error;
                }
                
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
                        content: delta,
                        scenario: detectedScenario
                    });
                }

                console.log('文本流读取完成，总长度:', fullText.length);
            }
            
            sendSSE({ 
                type: 'end',
                scenario: detectedScenario
            });
            
            console.log('LLM调用完成');
            res.end();
            
        } catch (error) {
            console.error('Stream chat error:', error);
            
            // 检查是否是API认证相关错误
            if (configNode && configNode.isAuthError && configNode.isAuthError(error)) {
                const authErrorMsg = 'API密钥认证失败，请检查配置节点中的API密钥是否正确';
                
                // 发送错误到前端
                res.write(`data: ${JSON.stringify({ 
                    type: 'error', 
                    content: authErrorMsg,
                    code: 'API_AUTH_FAILED',
                    notify: true // 标记需要显示通知
                })}\n\n`);
                
                console.error('API认证失败:', error.message);
            } else {
                // 其他错误
                res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
            }
            
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

    // 执行工具调用端点（用于按钮点击）
    RED.httpAdmin.post('/make-iot-smart/execute-tool', async function(req, res) {
        try {
            const { toolName: originalToolName, toolArgs, nodeId, selectedFlow } = req.body;
            
            if (!nodeId) {
                return res.status(400).json({ error: 'Node ID is required' });
            }
            
            const configNode = RED.nodes.getNode(nodeId);
            if (!configNode) {
                return res.status(404).json({ error: 'Configuration node not found' });
            }
            
            console.log('执行工具调用:', originalToolName, toolArgs);
            
            // 特殊处理create-flow和update-flow工具的flowJson参数
            if ((originalToolName === 'create-flow' || originalToolName === 'update-flow') && toolArgs.flowJson) {
                console.log('API端点开始处理flowJson参数，工具:', originalToolName);
                let flowData;
                
                // 如果是字符串，尝试解析为JSON
                if (typeof toolArgs.flowJson === 'string') {
                    try {
                        flowData = JSON.parse(toolArgs.flowJson);
                        console.log('API端点解析flowJson字符串为对象，类型:', Array.isArray(flowData) ? 'array' : 'object');
                    } catch (error) {
                        console.error('API端点解析flowJson失败:', error);
                        return res.status(400).json({ error: 'Invalid flowJson format: ' + error.message });
                    }
                } else {
                    flowData = toolArgs.flowJson;
                    console.log('API端点flowJson已是对象，类型:', Array.isArray(flowData) ? 'array' : 'object');
                }
                
                // 确保flowData是数组格式（Node-RED流程格式）
            if (Array.isArray(flowData)) {
                console.log('API端点进入数组处理分支，原始节点数:', flowData.length);
                
                if (originalToolName === 'create-flow') {
                    // create-flow工具期望包含nodes属性的对象格式，但需要过滤掉tab节点
                    const functionalNodes = flowData.filter(node => node.type !== 'tab');
                    const flowObject = {
                        nodes: functionalNodes,
                        label: toolArgs.label || '新流程',
                        description: toolArgs.description || ''
                    };
                    toolArgs.flowJson = JSON.stringify(flowObject);
                    console.log('API端点create-flow处理完成，过滤掉tab节点，保留功能节点数:', functionalNodes.length);
                    // 重要：如果后续会转换为update-flow，不要预设label，让后续逻辑处理
                    if (selectedFlow && selectedFlow.id) {
                        // 清除预设的label，让后续的currentLabel优先
                        delete toolArgs.label;
                    }
                } else {
                    // update-flow的节点合并将在后面的selectedFlow处理中进行，这里只做基本处理
                    const functionalNodes = flowData.filter(node => node.type !== 'tab');
                    console.log('API端点过滤后功能节点数:', functionalNodes.length);
                    
                    // 如果没有选中流程，才进行常规的update-flow处理
                    if (!selectedFlow || !selectedFlow.id) {
                        // update-flow需要节点数组，并且需要生成唯一ID，参数必须是JSON字符串
                        const nodesWithUniqueIds = functionalNodes.map(node => {
                            const newNode = { ...node };
                            newNode.id = RED.util.generateId();
                            // 移除z属性，让Node-RED自动分配
                            delete newNode.z;
                            return newNode;
                        });
                        
                        // 更新连线关系中的节点ID
                        const idMapping = {};
                        functionalNodes.forEach((oldNode, index) => {
                            idMapping[oldNode.id] = nodesWithUniqueIds[index].id;
                        });
                        
                        nodesWithUniqueIds.forEach(node => {
                            if (node.wires && Array.isArray(node.wires)) {
                                node.wires = node.wires.map(wireArray => 
                                    wireArray.map(wireId => idMapping[wireId] || wireId)
                                );
                            }
                        });
                        
                        toolArgs.flowJson = JSON.stringify(nodesWithUniqueIds);
                        console.log('API端点update-flow处理完成，节点数:', nodesWithUniqueIds.length);
                    } else {
                        // 有选中流程时，保持原始数据，等待后续的节点合并处理
                        toolArgs.flowJson = JSON.stringify(functionalNodes);
                        console.log('API端点保持原始节点数据，等待节点合并处理，节点数:', functionalNodes.length);
                    }
                }
                } else if (flowData && typeof flowData === 'object' && flowData.nodes) {
                    console.log('API端点进入对象处理分支，原始节点数:', flowData.nodes.length);
                    
                    if (originalToolName === 'create-flow') {
                        // create-flow工具期望包含nodes属性的对象格式，但需要过滤掉tab节点
                        const allNodes = Array.isArray(flowData.nodes) ? flowData.nodes : [];
                        const functionalNodes = allNodes.filter(node => node.type !== 'tab');
                        const flowObject = {
                            nodes: functionalNodes,
                            label: toolArgs.label || flowData.label || '新流程',
                            description: toolArgs.description || flowData.description || ''
                        };
                        toolArgs.flowJson = JSON.stringify(flowObject);
                        // 重要：如果后续会转换为update-flow，不要预设label，让后续逻辑处理
                        if (selectedFlow && selectedFlow.id) {
                            // 清除预设的label，让后续的currentLabel优先
                            delete toolArgs.label;
                        }
                        console.log('API端点对象create-flow处理完成，过滤掉tab节点，保留功能节点数:', functionalNodes.length);
                    } else {
                        // update-flow的节点合并将在后面的selectedFlow处理中进行，这里只做基本处理
                        const functionalNodes = flowData.nodes.filter(node => node.type !== 'tab');
                        console.log('API端点对象过滤后功能节点数:', functionalNodes.length);
                        
                        // 如果没有选中流程，才进行常规的update-flow处理
                        if (!selectedFlow || !selectedFlow.id) {
                            // update-flow需要节点数组，并且需要生成唯一ID，参数必须是JSON字符串
                            const nodesWithUniqueIds = functionalNodes.map(node => {
                                const newNode = { ...node };
                                newNode.id = RED.util.generateId();
                                // 移除z属性，让Node-RED自动分配
                                delete newNode.z;
                                return newNode;
                            });
                            
                            // 更新连线关系中的节点ID
                            const idMapping = {};
                            functionalNodes.forEach((oldNode, index) => {
                                idMapping[oldNode.id] = nodesWithUniqueIds[index].id;
                            });
                            
                            nodesWithUniqueIds.forEach(node => {
                                if (node.wires && Array.isArray(node.wires)) {
                                    node.wires = node.wires.map(wireArray => 
                                        wireArray.map(wireId => idMapping[wireId] || wireId)
                                    );
                                }
                            });
                            
                            toolArgs.flowJson = JSON.stringify(nodesWithUniqueIds);
                            console.log('API端点对象update-flow处理完成，节点数:', nodesWithUniqueIds.length);
                        } else {
                            // 有选中流程时，保持原始数据，等待后续的节点合并处理
                            toolArgs.flowJson = JSON.stringify(functionalNodes);
                            console.log('API端点对象保持原始节点数据，等待节点合并处理，节点数:', functionalNodes.length);
                        }
                    }
                } else {
                    console.error('API端点flowData格式不正确:', typeof flowData, Array.isArray(flowData));
                    return res.status(400).json({ error: 'flowData must be an array or object with nodes property' });
                }
                
                console.log('API端点最终处理结果:', {
                    isArray: Array.isArray(toolArgs.flowJson),
                    hasNodes: toolArgs.flowJson && toolArgs.flowJson.nodes ? true : false,
                    nodesCount: Array.isArray(toolArgs.flowJson) ? toolArgs.flowJson.length : (toolArgs.flowJson && toolArgs.flowJson.nodes ? toolArgs.flowJson.nodes.length : 0),
                    label: toolArgs.label || '新流程'
                });
            }
            
            // 如果是创建流程工具，且有选中的流程，改为使用update-flow工具
            let actualToolName = originalToolName;
            if (originalToolName === 'create-flow' && selectedFlow && selectedFlow.id) {
                // 改为调用update-flow工具来更新当前流程
                actualToolName = 'update-flow';
                toolArgs.id = selectedFlow.id;  // update-flow需要id参数，不是flowId
                
                // 获取当前流程的现有节点和信息（通过MCP工具）
                try {
                    const flowResult = await configNode.executeMCPTool('get-flow', { id: selectedFlow.id });
                    console.log('get-flow返回结果:', JSON.stringify(flowResult, null, 2));
                    if (flowResult && flowResult.content && flowResult.content.length > 0) {
                        const flowData = JSON.parse(flowResult.content[0].text);
                        console.log('解析后的flowData:', JSON.stringify(flowData, null, 2));
                        
                        // 智能解析flowData格式
                        let currentLabel = '';
                        let existingNodes = [];
                        
                        if (Array.isArray(flowData)) {
                             // 如果是数组格式，查找tab节点获取label，其他为功能节点
                             const tabNode = flowData.find(node => node.type === 'tab' && node.id === selectedFlow.id);
                             currentLabel = tabNode ? tabNode.label : '';
                             existingNodes = flowData.filter(node => node.type !== 'tab' && node.z === selectedFlow.id);
                         } else if (flowData.nodes || flowData.configs) {
                             // 如果是对象格式且有nodes或configs属性
                             currentLabel = flowData.label || '';
                             // 合并nodes和configs数组，排除tab节点
                             const allFlowNodes = [
                                 ...(flowData.nodes || []),
                                 ...(flowData.configs || [])
                             ];
                             existingNodes = allFlowNodes.filter(node => node.type !== 'tab');
                         } else {
                             // 其他格式
                             currentLabel = flowData.label || '';
                             existingNodes = [];
                         }
                        
                        console.log('解析结果 - 标签:', currentLabel, '现有节点数:', existingNodes.length);
                        
                        // 保留当前流程的label
                        if (currentLabel) {
                            toolArgs.label = currentLabel;
                        }
                        
                        // 计算新节点的起始Y坐标（位于现有节点下方）
                        let maxY = 0;
                        if (existingNodes.length > 0) {
                            maxY = Math.max(...existingNodes.map(node => (node.y || 0) + 50)); // 50是节点高度的估计值
                        }
                        const startY = maxY + 100; // 在最下方节点下方留100像素间距
                        
                        // 解析新节点并调整坐标
                        let newNodes;
                        try {
                            newNodes = JSON.parse(toolArgs.flowJson);
                        } catch (e) {
                            console.error('解析flowJson失败:', e);
                            newNodes = [];
                        }
                        
                        // 为新节点重新计算坐标
                        if (Array.isArray(newNodes)) {
                            newNodes.forEach((node, index) => {
                                if (node.x !== undefined && node.y !== undefined) {
                                    // 保持相对位置，但整体向下移动
                                    const minY = Math.min(...newNodes.map(n => n.y || 0));
                                    node.y = node.y - minY + startY;
                                } else {
                                    // 如果没有坐标，设置默认位置
                                    node.x = 100 + (index % 5) * 200; // 每行5个节点
                                    node.y = startY + Math.floor(index / 5) * 100;
                                }
                            });
                            
                            // 关键修复：将现有节点和新节点合并，并构造正确的流程对象格式
                            const allNodes = [...existingNodes, ...newNodes];
                            
                            // 构造符合Node-RED API要求的流程对象格式
                            const flowObject = {
                                id: selectedFlow.id,
                                label: currentLabel || toolArgs.label || selectedFlow.label || '当前流程',
                                nodes: allNodes,
                                configs: [] // 配置节点通常为空，或者可以从现有流程中提取
                            };
                            
                            toolArgs.flowJson = JSON.stringify(flowObject);
                            console.log('合并节点完成 - 现有节点:', existingNodes.length, '新节点:', newNodes.length, '总节点:', allNodes.length, '保留标签:', flowObject.label);
                        }
                        
                        console.log('API端点改为在当前流程中更新:', selectedFlow.id, '现有节点数:', existingNodes.length, '新节点起始Y:', startY);
                    }
                } catch (error) {
                    console.error('获取流程信息失败:', error);
                    // 如果获取失败，保持原有标签，不要覆盖
                    if (!toolArgs.label) {
                        toolArgs.label = selectedFlow.label || '当前流程';
                    }
                    console.log('改为在当前流程中更新:', selectedFlow.id, '(获取流程信息失败，保持原有标签:', toolArgs.label, ')');
                }
            }
            
            try {
                const toolResult = await configNode.executeMCPTool(actualToolName, toolArgs);
                const formattedResult = configNode.formatToolResult(toolResult);
                
                res.json({
                    success: true,
                    result: formattedResult,
                    toolName: actualToolName
                });
                
            } catch (error) {
                console.error('工具执行失败:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
            
        } catch (error) {
            console.error('Execute tool error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}
