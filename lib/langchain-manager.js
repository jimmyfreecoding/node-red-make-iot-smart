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
                            const result = await this.mcpClient.callTool(tool.name, input);
                            return JSON.stringify(result);
                        } catch (error) {
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
            description: 'Get user preferences and settings',
            schema: z.object({
                category: z.string().optional().describe('Preference category')
            }),
            func: async ({ category }) => {
                try {
                    if (category) {
                        const pref = this.memoryManager.getUserPreference(category);
                        return JSON.stringify({ [category]: pref });
                    } else {
                        // 获取所有偏好设置的逻辑需要在MemoryManager中实现
                        return JSON.stringify({ message: 'Specify a category to get preferences' });
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

        // 总是包含内置工具
        scenarioTools.push(
            this.tools.get('search_memory'),
            this.tools.get('get_user_preferences'),
            this.tools.get('get_flow_templates')
        );

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
                maxIterations: 10,
                returnIntermediateSteps: true
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
     * 检测场景
     */
    detectScenario(message) {
        const lowerMessage = message.toLowerCase();
        
        // 关键词匹配逻辑
        const scenarioKeywords = {
            learning: ['学习', '教学', '教程', '如何', '什么是', '解释', 'learn', 'tutorial', 'how to', 'what is'],
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