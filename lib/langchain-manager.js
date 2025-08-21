const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { DynamicTool } = require('@langchain/core/tools');
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const { AgentExecutor, createToolCallingAgent } = require('langchain/agents');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');

/**
 * LangChain管理器 - 统一管理LLM、工具和提示词
 */
class LangChainManager {
    constructor(memoryManager, mcpClient) {
        this.memoryManager = memoryManager;
        this.mcpClient = mcpClient;
        this.llmInstances = new Map();
        this.tools = new Map();
        this.scenarios = null;
        this.agents = new Map();
        
        this.loadScenarios();
        this.initializeTools();
    }

    /**
     * 加载场景配置
     */
    loadScenarios() {
        try {
            const scenariosPath = path.join(__dirname, '..', 'config', 'scenarios.json');
            const scenariosData = fs.readFileSync(scenariosPath, 'utf8');
            this.scenarios = JSON.parse(scenariosData);
            console.log('Scenarios loaded successfully');
        } catch (error) {
            console.error('Failed to load scenarios:', error);
            this.scenarios = {};
        }
    }

    /**
     * 获取LLM实例
     */
    getLLM(config) {
        const cacheKey = `${config.provider}-${config.model}-${config.apiKey?.slice(-8)}`;
        
        if (this.llmInstances.has(cacheKey)) {
            return this.llmInstances.get(cacheKey);
        }

        let llm;
        const commonConfig = {
            temperature: config.temperature || 0.1,
            maxTokens: config.maxTokens || 2000,
            streaming: config.streaming !== false
        };

        try {
            switch (config.provider) {
                case 'openai':
                case 'deepseek':
                    llm = new ChatOpenAI({
                        ...commonConfig,
                        modelName: config.model,
                        openAIApiKey: config.apiKey,
                        configuration: config.provider === 'deepseek' ? {
                            baseURL: 'https://api.deepseek.com/v1'
                        } : undefined
                    });
                    break;

                case 'anthropic':
                    llm = new ChatAnthropic({
                        ...commonConfig,
                        modelName: config.model,
                        anthropicApiKey: config.apiKey
                    });
                    break;

                case 'google':
                    llm = new ChatGoogleGenerativeAI({
                        ...commonConfig,
                        modelName: config.model,
                        apiKey: config.apiKey
                    });
                    break;

                default:
                    throw new Error(`Unsupported LLM provider: ${config.provider}`);
            }

            this.llmInstances.set(cacheKey, llm);
            return llm;
        } catch (error) {
            console.error('Failed to create LLM instance:', error);
            throw error;
        }
    }

    /**
     * 初始化工具
     */
    async initializeTools() {
        try {
            // 获取MCP工具
            if (this.mcpClient && this.mcpClient.isClientConnected()) {
                const mcpTools = await this.mcpClient.getServerInfo();
                this.convertMCPTools(mcpTools.tools || []);
            }

            // 添加内置工具
            this.addBuiltinTools();
            
            console.log(`Initialized ${this.tools.size} tools`);
        } catch (error) {
            console.error('Failed to initialize tools:', error);
        }
    }

    /**
     * 转换MCP工具为LangChain工具
     */
    convertMCPTools(mcpTools) {
        for (const tool of mcpTools) {
            try {
                const langchainTool = new DynamicTool({
                    name: tool.name.replace(/-/g, '_'), // LangChain工具名不能包含连字符
                    description: tool.description,
                    schema: this.convertMCPSchemaToZod(tool.inputSchema),
                    func: async (input) => {
                        try {
                            // 确保参数是对象格式
                            let toolArgs;
                            if (typeof input === 'string') {
                                // 如果输入是字符串，根据工具schema创建参数对象
                                const schema = tool.inputSchema;
                                if (schema && schema.properties) {
                                    const firstProperty = Object.keys(schema.properties)[0];
                                    if (firstProperty) {
                                        toolArgs = { [firstProperty]: input };
                                    } else {
                                        toolArgs = { input: input };
                                    }
                                } else {
                                    toolArgs = { input: input };
                                }
                            } else if (typeof input === 'object' && input !== null) {
                                toolArgs = input;
                            } else {
                                toolArgs = { input: input };
                            }
                            
                            console.log(`调用MCP工具 ${tool.name}，参数:`, toolArgs);
                            const result = await this.mcpClient.callTool(tool.name, toolArgs);
                            
                            // 限制返回结果的大小，避免超过模型上下文限制
                            let resultStr = JSON.stringify(result);
                            const maxLength = 10000; // 限制为10KB
                            if (resultStr.length > maxLength) {
                                const truncated = resultStr.substring(0, maxLength);
                                resultStr = truncated + '\n\n[结果已截断，原始长度: ' + resultStr.length + ' 字符]';
                                console.log(`MCP工具 ${tool.name} 返回结果过大，已截断: ${resultStr.length} -> ${maxLength}`);
                            }
                            
                            return resultStr;
                        } catch (error) {
                            console.error(`MCP工具调用失败 ${tool.name}:`, error);
                            return `Error calling tool ${tool.name}: ${error.message}`;
                        }
                    }
                });

                this.tools.set(tool.name, langchainTool);
            } catch (error) {
                console.error(`Failed to convert MCP tool ${tool.name}:`, error);
            }
        }
    }

    /**
     * 转换MCP Schema到Zod Schema
     */
    convertMCPSchemaToZod(mcpSchema) {
        if (!mcpSchema || !mcpSchema.properties) {
            return z.object({});
        }

        const zodFields = {};
        
        for (const [key, prop] of Object.entries(mcpSchema.properties)) {
            let zodType;
            
            switch (prop.type) {
                case 'string':
                    zodType = z.string();
                    break;
                case 'number':
                    zodType = z.number();
                    break;
                case 'boolean':
                    zodType = z.boolean();
                    break;
                case 'array':
                    zodType = z.array(z.any());
                    break;
                case 'object':
                    zodType = z.object({});
                    break;
                default:
                    zodType = z.any();
            }
            
            if (prop.description) {
                zodType = zodType.describe(prop.description);
            }
            
            // 检查是否为必需字段
            if (!mcpSchema.required || !mcpSchema.required.includes(key)) {
                zodType = zodType.optional();
            }
            
            zodFields[key] = zodType;
        }
        
        return z.object(zodFields);
    }

    /**
     * 添加内置工具
     */
    addBuiltinTools() {
        // 记忆搜索工具
        const memorySearchTool = new DynamicTool({
            name: 'search_memory',
            description: 'Search conversation history and memory for relevant information',
            schema: z.object({
                query: z.string().describe('Search query'),
                scenario: z.string().optional().describe('Scenario filter'),
                limit: z.number().optional().describe('Maximum results')
            }),
            func: async ({ query, scenario, limit = 10 }) => {
                try {
                    const results = this.memoryManager.searchConversations(query, scenario, limit);
                    return JSON.stringify(results);
                } catch (error) {
                    return `Error searching memory: ${error.message}`;
                }
            }
        });

        // 用户偏好工具
        const preferencesTool = new DynamicTool({
            name: 'get_user_preferences',
            description: 'Get user preferences and settings. Only use when user explicitly asks about their preferences or settings.',
            schema: z.object({
                category: z.string().optional().describe('Preference category')
            }),
            func: async ({ category }) => {
                try {
                    if (category) {
                        const pref = this.memoryManager.getUserPreference(category);
                        return JSON.stringify({ [category]: pref || 'No preference set' });
                    } else {
                        // 返回默认偏好设置
                        return JSON.stringify({ 
                            message: 'No specific preferences configured',
                            defaults: {
                                language: 'zh-CN',
                                theme: 'default',
                                skill_level: 'intermediate'
                            }
                        });
                    }
                } catch (error) {
                    return `Error getting preferences: ${error.message}`;
                }
            }
        });

        // 流程模板工具
        const templatesTool = new DynamicTool({
            name: 'get_flow_templates',
            description: 'Get saved flow templates',
            schema: z.object({
                scenario: z.string().optional().describe('Scenario filter'),
                limit: z.number().optional().describe('Maximum results')
            }),
            func: async ({ scenario, limit = 20 }) => {
                try {
                    const templates = this.memoryManager.getFlowTemplates(scenario, limit);
                    return JSON.stringify(templates);
                } catch (error) {
                    return `Error getting templates: ${error.message}`;
                }
            }
        });

        this.tools.set('search_memory', memorySearchTool);
        this.tools.set('get_user_preferences', preferencesTool);
        this.tools.set('get_flow_templates', templatesTool);
    }

    /**
     * 获取场景的工具列表
     */
    getScenarioTools(scenario) {
        const scenarioConfig = this.scenarios[scenario];
        
        // 对于general场景，如果没有明确的工具配置，只返回必要的工具
        if (scenario === 'general' && (!scenarioConfig || !scenarioConfig.tools)) {
            return [
                this.tools.get('search_memory')
            ].filter(Boolean);
        }
        
        if (!scenarioConfig || !scenarioConfig.tools) {
            return Array.from(this.tools.values());
        }

        const scenarioTools = [];
        for (const toolName of scenarioConfig.tools) {
            const tool = this.tools.get(toolName);
            if (tool) {
                scenarioTools.push(tool);
            }
        }

        // 只为特定场景添加内置工具
        if (scenario !== 'general') {
            scenarioTools.push(
                this.tools.get('search_memory'),
                this.tools.get('get_user_preferences'),
                this.tools.get('get_flow_templates')
            );
        } else {
            // general场景只添加记忆搜索工具
            scenarioTools.push(
                this.tools.get('search_memory')
            );
        }

        return scenarioTools.filter(Boolean);
    }

    /**
     * 创建场景化提示词
     */
    createScenarioPrompt(scenario, dynamicData = {}) {
        const scenarioConfig = this.scenarios[scenario] || this.scenarios.general;
        let systemPrompt = scenarioConfig.systemPrompt;

        // 替换动态输入
        if (scenarioConfig.dynamicInputs) {
            for (const input of scenarioConfig.dynamicInputs) {
                const value = dynamicData[input] || '';
                const placeholder = `{{${input}}}`;
                systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), value);
            }
        }

        return ChatPromptTemplate.fromMessages([
            SystemMessagePromptTemplate.fromTemplate(systemPrompt),
            HumanMessagePromptTemplate.fromTemplate('{input}'),
            // 添加代理scratchpad用于工具调用
            HumanMessagePromptTemplate.fromTemplate('{agent_scratchpad}')
        ]);
    }

    /**
     * 创建场景化代理
     */
    async createScenarioAgent(scenario, llmConfig, dynamicData = {}) {
        const cacheKey = `${scenario}-${llmConfig.provider}-${llmConfig.model}`;
        
        if (this.agents.has(cacheKey)) {
            return this.agents.get(cacheKey);
        }

        try {
            const llm = this.getLLM(llmConfig);
            const tools = this.getScenarioTools(scenario);
            const prompt = this.createScenarioPrompt(scenario, dynamicData);

            const agent = await createToolCallingAgent({
                llm,
                tools,
                prompt
            });

            const agentExecutor = new AgentExecutor({
                agent,
                tools,
                verbose: true,
                maxIterations: 2, // 允许2次迭代：1次工具调用 + 1次LLM分析
                returnIntermediateSteps: true,
                maxExecutionTime: 30000, // 30秒超时
                earlyStoppingMethod: 'force' // 强制停止
            });

            this.agents.set(cacheKey, agentExecutor);
            return agentExecutor;
        } catch (error) {
            console.error('Failed to create scenario agent:', error);
            throw error;
        }
    }

    /**
     * 执行场景化对话
     */
    async executeScenarioChat(scenario, message, llmConfig, sessionId, dynamicData = {}) {
        try {
            // 获取会话上下文
            const sessionContext = this.memoryManager.getSessionContext(sessionId);
            
            // 创建代理
            const agent = await this.createScenarioAgent(scenario, llmConfig, dynamicData);
            
            // 构建输入
            const input = {
                input: message,
                chat_history: sessionContext.map(ctx => `${ctx.role}: ${ctx.content}`).join('\n')
            };

            // 执行对话
            const result = await agent.invoke(input);

            // 保存到记忆
            this.memoryManager.addConversation(sessionId, 'user', message, scenario);
            this.memoryManager.addConversation(sessionId, 'assistant', result.output, scenario, {
                intermediateSteps: result.intermediateSteps,
                toolCalls: result.intermediateSteps?.map(step => step.action) || []
            });

            // 更新会话上下文
            this.memoryManager.addToSessionContext(sessionId, { role: 'user', content: message });
            this.memoryManager.addToSessionContext(sessionId, { role: 'assistant', content: result.output });

            return {
                response: result.output,
                intermediateSteps: result.intermediateSteps,
                scenario: scenario,
                sessionId: sessionId
            };
        } catch (error) {
            console.error('Failed to execute scenario chat:', error);
            throw error;
        }
    }

    /**
     * 流式执行场景聊天
     */
    /**
     * 检测是否为工具调用触发
     */
    detectToolTrigger(message) {
        // 检测特殊符号格式：/tool:命令 或 /工具:命令，支持空格或逗号分隔参数
        const toolTriggerPattern = /^\/(?:tool|工具):(\w+)(?:[\s，,]+(.*))?$/i;
        const match = message.match(toolTriggerPattern);
        
        if (match) {
            return {
                isToolTrigger: true,
                toolName: match[1],
                toolArgs: match[2] || '',
                originalMessage: message
            };
        }
        
        return {
            isToolTrigger: false,
            originalMessage: message
        };
    }

    /**
     * 纯LLM流式聊天（不使用工具）
     */
    async executePureLLMChatStream(scenario, message, llmConfig, sessionId, dynamicData = {}, onChunk = null) {
        try {
            console.log('🚀 开始执行纯LLM流式聊天:', { scenario, message, sessionId });
            
            // 发送开始事件
            if (onChunk && typeof onChunk === 'function') {
                onChunk({ type: 'start' });
            }
            
            // 获取会话上下文
            const sessionContext = this.memoryManager.getSessionContext(sessionId);
            console.log('📚 会话上下文:', sessionContext.length, '条记录');
            
            // 获取LLM实例
            const llm = this.getLLM(llmConfig);
            
            // 创建场景提示词（不包含工具）
            const prompt = this.createScenarioPrompt(scenario, dynamicData);
            
            // 构建消息历史
            const messages = [];
            
            // 添加系统提示
            const scenarioConfig = this.scenarios[scenario] || this.scenarios.general;
            let systemPrompt = scenarioConfig.systemPrompt;
            
            // 替换动态输入
            if (scenarioConfig.dynamicInputs) {
                for (const input of scenarioConfig.dynamicInputs) {
                    const value = dynamicData[input] || '';
                    const placeholder = `{{${input}}}`;
                    systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), value);
                }
            }
            
            messages.push({ role: 'system', content: systemPrompt });
            
            // 添加会话历史
            sessionContext.forEach(ctx => {
                messages.push({ role: ctx.role === 'user' ? 'human' : 'assistant', content: ctx.content });
            });
            
            // 添加当前消息
            messages.push({ role: 'human', content: message });
            
            console.log('🌊 开始纯LLM流式生成...');
            
            let fullResponse = '';
            let chunkCount = 0;
            
            // 使用LLM流式生成
            const stream = await llm.stream(messages);
            
            for await (const chunk of stream) {
                const content = chunk.content || '';
                if (content) {
                    chunkCount++;
                    fullResponse += content;
                    
                    console.log(`📦 文本块 ${chunkCount}:`, content);
                    
                    if (onChunk && typeof onChunk === 'function') {
                        onChunk({
                            type: 'text-delta',
                            textDelta: content
                        });
                    }
                }
            }
            
            console.log('✅ 纯LLM流式处理完成，共处理', chunkCount, '个文本块');
            console.log('📝 完整响应:', fullResponse);
            
            // 发送完成事件
            if (onChunk && typeof onChunk === 'function') {
                console.log('📤 发送finish事件');
                onChunk({
                    type: 'finish',
                    finishReason: 'stop'
                });
            }
            
            // 保存对话到记忆
            console.log('💾 开始保存对话到记忆...');
            this.memoryManager.addConversation(sessionId, 'user', message, scenario);
            this.memoryManager.addConversation(sessionId, 'assistant', fullResponse, scenario);
            console.log('✅ 对话保存完成');
            
            return {
                response: fullResponse,
                intermediateSteps: [],
                scenario: scenario
            };
            
        } catch (error) {
            console.error('❌ 纯LLM流式聊天执行失败:', error);
            
            if (onChunk && typeof onChunk === 'function') {
                onChunk({
                    type: 'error',
                    error: error.message
                });
            }
            
            throw error;
        }
    }

    async executeScenarioChatStream(scenario, message, llmConfig, sessionId, dynamicData = {}, onChunk = null) {
        try {
            console.log('🚀 开始执行流式场景聊天:', { scenario, message, sessionId });
            console.log('📋 onChunk回调函数:', typeof onChunk, !!onChunk);
            console.log('🔧 LLM配置:', llmConfig);
            
            // 检测是否为工具调用触发
            const toolTrigger = this.detectToolTrigger(message);
            console.log('🔍 工具触发检测结果:', toolTrigger);
            
            // 如果不是工具触发，使用纯LLM模式
            if (!toolTrigger.isToolTrigger) {
                console.log('📝 使用纯LLM模式处理消息');
                return await this.executePureLLMChatStream(scenario, message, llmConfig, sessionId, dynamicData, onChunk);
            }
            
            // 工具调用模式（保留原有逻辑）
            console.log('🔧 使用工具调用模式处理消息');
            
            // 发送开始事件
            if (onChunk && typeof onChunk === 'function') {
                console.log('📤 发送start事件');
                onChunk({
                    type: 'start'
                });
            }
            
            // 获取会话上下文
            const sessionContext = this.memoryManager.getSessionContext(sessionId);
            console.log('📚 会话上下文:', sessionContext.length, '条记录');
            
            // 创建代理
            console.log('🤖 开始创建代理...');
            const agent = await this.createScenarioAgent(scenario, llmConfig, dynamicData);
            console.log('✅ 代理创建成功');
            
            // 构建输入
            const input = {
                input: message,
                chat_history: sessionContext.map(ctx => `${ctx.role}: ${ctx.content}`).join('\n')
            };
            console.log('📝 输入构建完成:', input);

            let fullResponse = '';
            let intermediateSteps = [];
            let chunkCount = 0;

            console.log('🌊 开始流式执行...');
            // 使用流式执行
            const stream = await agent.streamEvents(input, { version: 'v2' });
            console.log('✅ 流式对象创建成功，开始处理事件...');
            
            for await (const chunk of stream) {
                console.log('📦 收到流式事件:', {
                    event: chunk.event,
                    name: chunk.name,
                    data: chunk.data
                });
                
                // 处理不同类型的流式事件
                if (chunk.event === 'on_chat_model_stream' && chunk.data?.chunk?.content) {
                    const content = chunk.data.chunk.content;
                    console.log('💬 检查文本内容:', JSON.stringify(content));
                    
                    if (content && onChunk) {
                        chunkCount++;
                        fullResponse += content;
                        console.log(`📤 发送第${chunkCount}个文本块:`, JSON.stringify(content));
                        
                        onChunk({
                            type: 'text-delta',
                            textDelta: content
                        });
                    }
                } else if (chunk.event === 'on_llm_stream' && chunk.data?.chunk?.text) {
                    // 备用的LLM流式事件处理
                    const content = chunk.data.chunk.text;
                    console.log('💬 LLM流式文本内容:', JSON.stringify(content));
                    
                    if (content && onChunk) {
                        chunkCount++;
                        fullResponse += content;
                        console.log(`📤 发送第${chunkCount}个文本块:`, JSON.stringify(content));
                        
                        onChunk({
                            type: 'text-delta',
                            textDelta: content
                        });
                    }
                } else if (chunk.event === 'on_agent_action') {
                    console.log('🔧 代理动作:', chunk.data);
                    if (onChunk) {
                        console.log('📤 发送tool_call事件');
                        onChunk({
                            type: 'tool_call',
                            tool_name: chunk.data?.tool,
                            arguments: chunk.data?.toolInput
                        });
                    }
                } else if (chunk.event === 'on_tool_end') {
                    console.log('🔧 工具结束:', chunk.data);
                    console.log('🔧 工具原始输出:', JSON.stringify(chunk.data?.output, null, 2));
                    
                    // 记录工具执行步骤
                    intermediateSteps.push({
                        action: { tool: chunk.name },
                        observation: chunk.data?.output
                    });
                    
                    if (onChunk) {
                        console.log('📤 发送tool_result事件');
                        // 格式化工具结果
                        const formattedResult = this.formatToolResult(chunk.data?.output);
                        console.log('📤 格式化后的结果:', formattedResult);
                        onChunk({
                            type: 'tool_result',
                            result: formattedResult
                        });
                    }
                }
            }

            console.log(`✅ 流式处理完成，共处理${chunkCount}个文本块`);
            console.log('📝 完整响应:', fullResponse);

            // 如果是工具触发且有工具执行结果，添加AI解释
            if (toolTrigger.isToolTrigger && intermediateSteps.length > 0) {
                console.log('🤖 开始生成AI解释...');
                
                // 构建解释提示
                const toolResults = intermediateSteps.map(step => {
                    return `工具: ${step.action?.tool || 'unknown'}\n结果: ${JSON.stringify(step.observation, null, 2)}`;
                }).join('\n\n');
                
                const explanationPrompt = `用户请求: ${toolTrigger.originalMessage}\n\n工具执行结果:\n${toolResults}\n\n请用中文解释这些结果，帮助用户理解。`;
                
                // 使用纯LLM模式生成解释
                const llm = this.getLLM(llmConfig);
                const explanationStream = await llm.stream(explanationPrompt);
                
                console.log('📤 开始发送AI解释...');
                for await (const chunk of explanationStream) {
                    if (chunk.content && onChunk) {
                        fullResponse += chunk.content;
                        onChunk({
                            type: 'text-delta',
                            textDelta: chunk.content
                        });
                    }
                }
                console.log('✅ AI解释发送完成');
            }

            if (onChunk) {
                console.log('📤 发送finish事件');
                onChunk({
                    type: 'finish',
                    finishReason: 'stop'
                });
            } else {
                console.warn('⚠️ onChunk回调不存在，无法发送finish事件');
            }

            // 保存到记忆
            console.log('💾 开始保存对话到记忆...');
            this.memoryManager.addConversation(sessionId, 'user', message, scenario);
            this.memoryManager.addConversation(sessionId, 'assistant', fullResponse, scenario, {
                intermediateSteps: intermediateSteps
            });

            // 更新会话上下文
            this.memoryManager.addToSessionContext(sessionId, { role: 'user', content: message });
            this.memoryManager.addToSessionContext(sessionId, { role: 'assistant', content: fullResponse });
            console.log('✅ 对话保存完成');

            return {
                response: fullResponse,
                intermediateSteps: intermediateSteps,
                scenario: scenario,
                sessionId: sessionId
            };
        } catch (error) {
            console.error('❌ 流式场景聊天执行错误:', error);
            console.error('❌ 错误堆栈:', error.stack);
            if (onChunk) {
                console.log('📤 发送error事件');
                onChunk({
                    type: 'error',
                    error: error.message
                });
            }
            throw error;
        }
    }

    /**
     * 检测场景
     */
    detectScenario(message) {
        const lowerMessage = message.toLowerCase();
        
        // 优先检查一般性问题关键词，这些应该直接回答而不调用工具
        const generalKeywords = ['介绍', '是什么', '简介', 'introduce', 'introduction', 'what is'];
        if (generalKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 'general';
        }
        
        // 关键词匹配逻辑
        const scenarioKeywords = {
            learning: ['学习', '教学', '教程', '如何使用', '怎么用', '详细解释', 'learn', 'tutorial', 'how to use', 'detailed explanation'],
            solution: ['方案', '解决方案', '架构', '设计', '建议', 'solution', 'architecture', 'design', 'recommend'],
            integration: ['集成', '连接', '对接', '接口', 'api', 'integrate', 'connect', 'interface'],
            development: ['开发', '编程', '代码', '函数', '调试', 'develop', 'code', 'function', 'debug'],
            configuration: ['配置', '设置', '安装', '环境', 'config', 'setting', 'install', 'environment'],
            management: ['管理', '项目', '规划', '组织', 'manage', 'project', 'plan', 'organize']
        };

        for (const [scenario, keywords] of Object.entries(scenarioKeywords)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return scenario;
            }
        }

        return 'general';
    }

    /**
     * 获取场景信息
     */
    getScenarioInfo(scenario) {
        return this.scenarios[scenario] || this.scenarios.general;
    }

    /**
     * 获取所有可用场景
     */
    getAvailableScenarios() {
        return Object.keys(this.scenarios).map(key => ({
            key,
            name: this.scenarios[key].name,
            description: this.scenarios[key].description
        }));
    }

    /**
     * 重新加载配置
     */
    reload() {
        this.loadScenarios();
        this.agents.clear(); // 清除缓存的代理
        console.log('LangChain manager reloaded');
    }

    /**
     * 格式化工具结果
     */
    formatToolResult(toolResult) {
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
    }

    /**
     * 执行工具
     */
    async executeTool(toolName, parameters) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        try {
            const result = await tool.func(parameters);
            return result;
        } catch (error) {
            console.error(`Error executing tool ${toolName}:`, error);
            throw error;
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.llmInstances.clear();
        this.tools.clear();
        this.agents.clear();
    }
}

module.exports = LangChainManager;