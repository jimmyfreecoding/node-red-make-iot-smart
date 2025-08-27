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
 * LangChain Manager - Unified management of LLM, tools and prompts
 */
class LangChainManager {
    constructor(memoryManager, mcpClient, language = 'zh-CN') {
        this.memoryManager = memoryManager;
        this.mcpClient = mcpClient;
        this.llmInstances = new Map();
        this.tools = new Map();
        this.scenarios = null;
        this.agents = new Map();
        this.language = language;
        
        this.loadScenarios();
        this.initializeTools();
    }

    /**
     * Load scenario configuration
     */
    loadScenarios() {
        try {
            // First try to load multi-language version of scenarios.json
            const localizedScenariosPath = path.join(__dirname, '..', 'config', 'locales', this.language, 'scenarios.json');
            
            let scenariosPath;
            if (fs.existsSync(localizedScenariosPath)) {
                scenariosPath = localizedScenariosPath;
                // console.log(`Loading localized scenarios for language: ${this.language}`);
            } else {
                // Fallback to default scenarios.json
                scenariosPath = path.join(__dirname, '..', 'config', 'scenarios.json');
                // console.log('Loading default scenarios.json (fallback)');
            }
            
            const scenariosData = fs.readFileSync(scenariosPath, 'utf8');
            this.scenarios = JSON.parse(scenariosData);
            // console.log('Scenarios loaded successfully from:', scenariosPath);
        } catch (error) {
            // console.error('Failed to load scenarios:', error);
            this.scenarios = {};
        }
    }

    /**
     * Get LLM instance
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
            // console.error('Failed to create LLM instance:', error);
            throw error;
        }
    }

    /**
     * Initialize tools
     */
    async initializeTools() {
        try {
            // Get MCP tools
            if (this.mcpClient && this.mcpClient.isClientConnected()) {
                const mcpTools = await this.mcpClient.getServerInfo();
                this.convertMCPTools(mcpTools.tools || []);
            }

            // Add built-in tools
            this.addBuiltinTools();
            
            // console.log(`Initialized ${this.tools.size} tools`);
        } catch (error) {
            // console.error('Failed to initialize tools:', error);
        }
    }

    /**
     * Convert MCP tools to LangChain tools
     */
    convertMCPTools(mcpTools) {
        for (const tool of mcpTools) {
            try {
                const langchainTool = new DynamicTool({
                    name: tool.name.replace(/-/g, '_'), // LangChain tool names cannot contain hyphens
                    description: tool.description,
                    schema: this.convertMCPSchemaToZod(tool.inputSchema),
                    func: async (input) => {
                        try {
                            // Ensure parameters are in object format
                            let toolArgs;
                            if (typeof input === 'string') {
                                // If input is string, create parameter object based on tool schema
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
                            
                            // console.log(`Calling MCP tool ${tool.name}, parameters:`, toolArgs);
                            const result = await this.mcpClient.callTool(tool.name, toolArgs);
                            
                            // Limit return result size to avoid exceeding model context limits
                            let resultStr = typeof result === 'string' ? result : JSON.stringify(result);
                            const maxLength = 10000; // Limit to 10KB
                            if (resultStr.length > maxLength) {
                                const truncated = resultStr.substring(0, maxLength);
                                resultStr = truncated + '\n\n[Result truncated, original length: ' + resultStr.length + ' characters]';
                                // console.log(`MCP tool ${tool.name} result too large, truncated: ${resultStr.length} -> ${maxLength}`);
                            }
                            
                            return resultStr;
                        } catch (error) {
                            // console.error(`MCP tool call failed ${tool.name}:`, error);
                            return `Error calling tool ${tool.name}: ${error.message}`;
                        }
                    }
                });

                this.tools.set(tool.name, langchainTool);
            } catch (error) {
                // console.error(`Failed to convert MCP tool ${tool.name}:`, error);
            }
        }
    }

    /**
     * Convert MCP Schema to Zod Schema
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
            
            // Check if it's a required field
            if (!mcpSchema.required || !mcpSchema.required.includes(key)) {
                zodType = zodType.optional().nullable();
            }
            
            zodFields[key] = zodType;
        }
        
        return z.object(zodFields);
    }

    /**
     * Add built-in tools
     */
    addBuiltinTools() {
        // Memory search tool
        const memorySearchTool = new DynamicTool({
            name: 'search_memory',
            description: 'Search conversation history and memory for relevant information',
            schema: z.object({
                query: z.string().describe('Search query'),
                scenario: z.string().optional().nullable().describe('Scenario filter'),
                limit: z.number().optional().nullable().describe('Maximum results')
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

        // User preferences tool
        const preferencesTool = new DynamicTool({
            name: 'get_user_preferences',
            description: 'Get user preferences and settings. Only use when user explicitly asks about their preferences or settings.',
            schema: z.object({
                category: z.string().optional().nullable().describe('Preference category')
            }),
            func: async ({ category }) => {
                try {
                    if (category) {
                        const pref = this.memoryManager.getUserPreference(category);
                        return JSON.stringify({ [category]: pref || 'No preference set' });
                    } else {
                        // Return default preference settings
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

        // Flow template tool
        const templatesTool = new DynamicTool({
            name: 'get_flow_templates',
            description: 'Get saved flow templates',
            schema: z.object({
                scenario: z.string().optional().nullable().describe('Scenario filter'),
                limit: z.number().optional().nullable().describe('Maximum results')
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

        // get_flow tool is now dynamically created in getScenarioTools to access dynamicData

        this.tools.set('search_memory', memorySearchTool);
        this.tools.set('get_user_preferences', preferencesTool);
        this.tools.set('get_flow_templates', templatesTool);
        // get_flow tool is now dynamically created in getScenarioTools
    }

    /**
     * Get tool list for scenario
     */
    getScenarioTools(scenario, dynamicData = {}, excludeTools = []) {
        const scenarioConfig = this.scenarios[scenario];
        
        // For general scenario, if no explicit tool configuration, only return necessary tools
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
            // Skip excluded tools
            if (excludeTools.includes(toolName)) {
                console.log(`[getScenarioTools] Skipping excluded tool: ${toolName}`);
                continue;
            }
            
            // Special handling for get_flow tool to enable access to dynamicData
            if (toolName === 'get_flow') {
                const getFlowTool = new DynamicTool({
                    name: 'get_flow',
                    description: 'Get Node-RED flow data by flow ID for analysis and explanation',
                    schema: z.object({
                        flowId: z.string().optional().nullable().describe('The ID of the flow to retrieve. If not provided, will use the current flow ID from context.')
                    }),
                    func: async ({ flowId }) => {
                        // Always use fresh dynamicData.flowId, not cached version
                        const currentDynamicData = arguments[1] || dynamicData; // Get current dynamicData from context
                        const targetFlowId = flowId || currentDynamicData.flowId;
                        console.log(`[get_flow] DynamicTool execution - Starting to get flow data, flowId: ${targetFlowId}`);
                        console.log(`[get_flow] DynamicTool execution - currentDynamicData:`, currentDynamicData);
                        // console.log(`[get_flow] dynamicData:`, dynamicData);
                        
                        if (!targetFlowId) {
                            // console.log('[get_flow] Error: No flowId provided and no flowId in dynamicData');
                            return JSON.stringify({ error: 'No flow ID provided and no current flow ID available' });
                        }
                        
                        try {
                            // Get global Node-RED instance
                            const RED = global.RED;
                            if (!RED) {
                                // console.log('[get_flow] Error: Node-RED instance not available');
                                return JSON.stringify({ error: 'Node-RED instance not available' });
                            }
                            // console.log('[get_flow] Node-RED instance obtained successfully');

                            // Get flow data
                            const flows = RED.nodes.getFlows();
                            // console.log(`[get_flow] Got flow list, total: ${flows.flows ? flows.flows.length : 0}`);
                            
                            if (flows.flows) {
                                // console.log('[get_flow] Available flow ID list:', flows.flows.map(f => ({ id: f.id, label: f.label, type: f.type })));
                            }
                            
                            const targetFlow = flows.flows.find(flow => flow.id === targetFlowId);
                            
                            if (!targetFlow) {
                                // console.log(`[get_flow] Error: Flow with ID ${targetFlowId} not found`);
                                return JSON.stringify({ error: `Flow with ID ${targetFlowId} not found` });
                            }
                            // console.log(`[get_flow] Found target flow: ${targetFlow.label || 'Unnamed Flow'}`);

                            // Get all nodes in the flow
                            const flowNodes = flows.flows.filter(node => 
                                node.z === targetFlowId || node.id === targetFlowId
                            );
                            // console.log(`[get_flow] Got flow node count: ${flowNodes.length}`);

                            const result = {
                                flow: targetFlow,
                                nodes: flowNodes,
                                nodeCount: flowNodes.length,
                                flowInfo: {
                                    id: targetFlow.id,
                                    label: targetFlow.label || 'Unnamed Flow',
                                    type: targetFlow.type,
                                    disabled: targetFlow.disabled || false
                                }
                            };
                            
                            // console.log('[get_flow] Successfully returned flow data');
                            return JSON.stringify(result);
                        } catch (error) {
                            // console.log(`[get_flow] Exception error: ${error.message}`);
                            // console.error('[get_flow] Error stack:', error.stack);
                            return JSON.stringify({ error: `Error getting flow: ${error.message}` });
                        }
                    }
                });
                scenarioTools.push(getFlowTool);
                continue;
            }
            
            // Special handling for get-node-info tool to enable access to dynamicData
            if (toolName === 'get-node-info') {
                const getNodeInfoTool = new DynamicTool({
                    name: 'get-node-info',
                    description: 'Get detailed information about selected Node-RED nodes for analysis and explanation',
                    schema: z.object({
                        nodeIds: z.array(z.string()).optional().describe('Array of node IDs to retrieve. If not provided, will use selected nodes from context.')
                    }),
                    func: async ({ nodeIds }) => {
                        // Always use fresh dynamicData.selectedNodes, not cached version
                        const currentDynamicData = arguments[1] || dynamicData; // Get current dynamicData from context
                        const targetNodeIds = nodeIds || (currentDynamicData.selectedNodes ? currentDynamicData.selectedNodes.map(n => n.id) : []);
                        console.log(`[get-node-info] DynamicTool execution - Starting to get node info, nodeIds: ${JSON.stringify(targetNodeIds)}`);
                        console.log(`[get-node-info] DynamicTool execution - currentDynamicData:`, currentDynamicData);
                        
                        if (!targetNodeIds || targetNodeIds.length === 0) {
                            console.log('[get-node-info] Error: No nodeIds provided and no selected nodes in dynamicData');
                            return JSON.stringify({ error: 'No node IDs provided and no selected nodes available' });
                        }
                        
                        try {
                            // Get global Node-RED instance
                            const RED = global.RED;
                            if (!RED) {
                                // console.log('[get-node-info] Error: Node-RED instance not available');
                                return JSON.stringify({ error: 'Node-RED instance not available' });
                            }
                            // console.log('[get-node-info] Node-RED instance obtained successfully');

                            // Get node information
                            const nodeInfos = [];
                            const notFoundNodes = [];
                            
                            for (const nodeId of targetNodeIds) {
                                const node = RED.nodes.getNode(nodeId);
                                if (node) {
                                    // Get complete JSON data of the node, excluding sensitive information and internal properties
                                    const nodeInfo = {};
                                    
                                    // Copy all node properties, but exclude sensitive information and internal properties
                                    Object.keys(node).forEach(key => {
                                        // Exclude sensitive information, internal properties and functions
                                        if (!['credentials', 'apiKey', 'password', 'token'].includes(key) && 
                                            !key.startsWith('_') && 
                                            typeof node[key] !== 'function') {
                                            nodeInfo[key] = node[key];
                                        }
                                    });
                                    
                                    nodeInfos.push(nodeInfo);
                                    console.log(`[get-node-info] Successfully got complete node info: ${node.type} (${node.name || node.id})`);
                                    console.log(`[get-node-info] Node data fields:`, Object.keys(nodeInfo));
                                    console.log(`[get-node-info] Complete node data:`, JSON.stringify(nodeInfo, null, 2));
                                } else {
                                    notFoundNodes.push(nodeId);
                                    console.log(`[get-node-info] Node not found: ${nodeId}`);
                                }
                            }
                            
                            const result = {
                                nodes: nodeInfos,
                                nodeCount: nodeInfos.length,
                                notFoundNodes: notFoundNodes,
                                summary: {
                                    totalRequested: targetNodeIds.length,
                                    found: nodeInfos.length,
                                    notFound: notFoundNodes.length,
                                    nodeTypes: [...new Set(nodeInfos.map(n => n.type))]
                                }
                            };
                            
                            // console.log('[get-node-info] Successfully returned node information');
                            return JSON.stringify(result);
                        } catch (error) {
                            // console.log(`[get-node-info] Exception error: ${error.message}`);
                            // console.error('[get-node-info] Error stack:', error.stack);
                            return JSON.stringify({ error: `Error getting node info: ${error.message}` });
                        }
                    }
                });
                scenarioTools.push(getNodeInfoTool);
                continue;
            }
            
            const tool = this.tools.get(toolName);
            if (tool) {
                scenarioTools.push(tool);
            }
        }

        // Only add built-in tools for specific scenarios
        if (scenario !== 'general') {
            scenarioTools.push(
                this.tools.get('search_memory'),
                this.tools.get('get_user_preferences'),
                this.tools.get('get_flow_templates')
            );
        } else {
            // general scenario only adds memory search tool
            scenarioTools.push(
                this.tools.get('search_memory')
            );
        }

        return scenarioTools.filter(Boolean);
    }

    /**
     * Create scenario-based prompt
     */
    createScenarioPrompt(scenario, dynamicData = {}) {
        const scenarioConfig = this.scenarios[scenario] || this.scenarios.general;
        
        // Defensive check: ensure both scenarioConfig and systemPrompt exist
        if (!scenarioConfig) {
            // console.error(`Scenario config not found for: ${scenario}`);
            throw new Error(`Scenario configuration not found: ${scenario}`);
        }
        
        if (!scenarioConfig.systemPrompt) {
            console.error(`SystemPrompt not found in scenario: ${scenario}`, scenarioConfig);
            throw new Error(`SystemPrompt not found in scenario configuration: ${scenario}`);
        }
        
        let systemPrompt = scenarioConfig.systemPrompt;

        // Replace dynamic inputs
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
            // Add agent scratchpad for tool calls
            HumanMessagePromptTemplate.fromTemplate('{agent_scratchpad}')
        ]);
    }

    /**
     * Create scenario-based agent
     */
    async createScenarioAgent(scenario, llmConfig, dynamicData = {}, excludeTools = []) {
        const cacheKey = `${scenario}-${llmConfig.provider}-${llmConfig.model}-${excludeTools.join(',')}`;
        
        if (this.agents.has(cacheKey)) {
            return this.agents.get(cacheKey);
        }

        try {
            const llm = this.getLLM(llmConfig);
            const tools = this.getScenarioTools(scenario, dynamicData, excludeTools);
            const prompt = this.createScenarioPrompt(scenario, dynamicData);

            const agent = await createToolCallingAgent({
                llm,
                tools,
                prompt
            });

            const agentExecutor = new AgentExecutor({
                agent,
                tools,
                verbose: false,
                maxIterations: 2, // Allow 2 iterations: 1 tool call + 1 LLM analysis
                returnIntermediateSteps: true,
                maxExecutionTime: 30000, // 30 second timeout
                earlyStoppingMethod: 'force' // Force stop
            });

            this.agents.set(cacheKey, agentExecutor);
            return agentExecutor;
        } catch (error) {
            // console.error('Failed to create scenario agent:', error);
            throw error;
        }
    }

    /**
     * Execute scenario-based conversation
     */
    async executeScenarioChat(scenario, message, llmConfig, sessionId, dynamicData = {}) {
        try {
            // Ensure language information is added to dynamicData
            const enrichedDynamicData = {
                ...dynamicData,
                lang: this.language
            };
            
            // Get session context
            const sessionContext = this.memoryManager.getSessionContext(sessionId);
            
            // Create agent
            const agent = await this.createScenarioAgent(scenario, llmConfig, enrichedDynamicData);
            
            // Build input
            const input = {
                input: message,
                chat_history: sessionContext.map(ctx => `${ctx.role}: ${ctx.content}`).join('\n')
            };

            // Execute conversation
            const result = await agent.invoke(input);

            // Save to memory
            this.memoryManager.addConversation(sessionId, 'user', message, scenario);
            this.memoryManager.addConversation(sessionId, 'assistant', result.output, scenario, {
                intermediateSteps: result.intermediateSteps,
                toolCalls: result.intermediateSteps?.map(step => step.action) || []
            });

            // Update session context
            this.memoryManager.addToSessionContext(sessionId, { role: 'user', content: message });
            this.memoryManager.addToSessionContext(sessionId, { role: 'assistant', content: result.output });

            return {
                response: result.output,
                intermediateSteps: result.intermediateSteps,
                scenario: scenario,
                sessionId: sessionId
            };
        } catch (error) {
            // console.error('Failed to execute scenario chat:', error);
            throw error;
        }
    }

    /**
     * Stream execution of scenario chat
     */
    /**
     * Detect if it's a tool call trigger
     * Supports precise format validation: @tools:toolName|['param1','param2',...] or @tools:toolName
     * 
     * Examples of supported tool call formats:
     * - @tools:get-flow|['flow-id-123'] - Get specific flow by ID
     * - @tools:get-flow - Get flow using context (no parameters needed)
     * - @tools:get-node-info|['node1','node2'] - Get information for specific nodes
     * - @tools:get-settings|[] - Get current Node-RED settings (no parameters)
     * - @tools:get-settings - Get current Node-RED settings (simplified format)
     * - @tools:get-diagnostics|[] - Get system diagnostics (no parameters)
     * - @tools:get-diagnostics - Get system diagnostics (simplified format)
     */
    detectToolTrigger(message) {
        console.log('[detectToolTrigger] Input message:', message);
        
        // Pattern 1: @tools:toolName|['param1','param2',...] format with parameters
        const toolTriggerWithParamsPattern = /^@tools:([a-zA-Z-]+)\|\[(.*?)\]$/;
        const matchWithParams = message.match(toolTriggerWithParamsPattern);
        
        // Pattern 2: @tools:toolName format without parameters
        const toolTriggerSimplePattern = /^@tools:([a-zA-Z-]+)$/;
        const matchSimple = message.match(toolTriggerSimplePattern);
        
        let match = matchWithParams || matchSimple;
        
        if (match) {
            const toolName = matchWithParams ? matchWithParams[1] : matchSimple[1];
            const paramsString = matchWithParams ? matchWithParams[2].trim() : '';
            
            // Parse parameters array
            let toolArgs = [];
            if (paramsString) {
                try {
                    // Split by comma and clean up quotes
                    toolArgs = paramsString.split(',').map(param => {
                        return param.trim().replace(/^['"]|['"]$/g, '');
                    }).filter(param => param.length > 0);
                } catch (error) {
                    console.warn('[detectToolTrigger] Failed to parse parameters:', error);
                    toolArgs = [];
                }
            }
            
            const result = {
                isToolTrigger: true,
                toolName: toolName,
                toolArgs: toolArgs,
                originalMessage: message,
                directExecution: true  // Mark as direct execution, no LLM decision needed
            };
            console.log('[detectToolTrigger] Parsed tool trigger:', result);
            return result;
        }
        
        const result = {
            isToolTrigger: false,
            originalMessage: message
        };
        
        console.log('[detectToolTrigger] Final result:', result);
        return result;
    }

    /**
     * Build keyword to tool mapping from all language configurations
     */
    buildKeywordToolMapping() {
        if (this.keywordToolMapping) {
            return this.keywordToolMapping;
        }
        
        this.keywordToolMapping = new Map();
        
        // Get all language directories
        const localesDir = path.join(__dirname, '..', 'config', 'locales');
        
        try {
            const languages = fs.readdirSync(localesDir).filter(dir => 
                fs.statSync(path.join(localesDir, dir)).isDirectory()
            );
            
            // Process each language
            for (const lang of languages) {
                const scenariosPath = path.join(localesDir, lang, 'scenarios.json');
                
                if (fs.existsSync(scenariosPath)) {
                    try {
                        const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
                        
                        // Process each scenario
                        for (const [scenarioName, scenarioConfig] of Object.entries(scenarios)) {
                            if (scenarioConfig.keywords && Array.isArray(scenarioConfig.keywords)) {
                                // Process each keyword group
                                for (const keywordGroup of scenarioConfig.keywords) {
                                    if (keywordGroup.key && Array.isArray(keywordGroup.key)) {
                                        // Determine tool name from newHumanPrompt or keywords
                                        let toolName = 'get-settings'; // default
                                        
                                        if (keywordGroup.newHumanPrompt) {
                                            if (keywordGroup.newHumanPrompt.includes('get-settings') || 
                                                keywordGroup.newHumanPrompt.includes('get-settings')) {
                                                toolName = 'get-settings';
                                            } else if (keywordGroup.newHumanPrompt.includes('get-diagnostics') || 
                                                      keywordGroup.newHumanPrompt.includes('get-diagnostics')) {
                                                toolName = 'get-diagnostics';
                                            } else if (keywordGroup.newHumanPrompt.includes('get-node-info') || 
                                                      keywordGroup.newHumanPrompt.includes('get-node-info')) {
                                                toolName = 'get-node-info';
                                            } else if (keywordGroup.newHumanPrompt.includes('get-flow') || 
                                                      keywordGroup.newHumanPrompt.includes('get-flow')) {
                                                toolName = 'get-flow';
                                            }
                                        }
                                        
                                        // If no tool found in newHumanPrompt, try to infer from keywords
                                        if (toolName === 'get-settings' && keywordGroup.key) {
                                            const keywordText = keywordGroup.key.join(' ').toLowerCase();
                                            if (keywordText.includes('节点') || keywordText.includes('node')) {
                                                toolName = 'get-node-info';
                                            } else if (keywordText.includes('流程') || keywordText.includes('flow')) {
                                                toolName = 'get-flow';
                                            }
                                        }
                                        
                                        // Add all keywords to mapping
                                        for (const keyword of keywordGroup.key) {
                                            const normalizedKeyword = keyword.toLowerCase().trim();
                                            if (normalizedKeyword) {
                                                this.keywordToolMapping.set(normalizedKeyword, {
                                                    toolName: toolName,
                                                    scenario: scenarioName,
                                                    language: lang,
                                                    originalKeyword: keyword
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to parse scenarios for language ${lang}:`, error.message);
                    }
                }
            }
            
            // console.log(`[buildKeywordToolMapping] Built mapping with ${this.keywordToolMapping.size} keywords from ${languages.length} languages`);
        } catch (error) {
            console.error('Failed to build keyword tool mapping:', error);
        }
        
        return this.keywordToolMapping;
    }
    
    /**
     * Check if should force tool mode based on scenario and message content
     * Dynamically reads keywords from all internationalized scenario configurations
     */
    shouldForceToolMode(scenario, message) {
        console.log(`[shouldForceToolMode] Checking scenario: ${scenario}, message: ${message}`);
        
        // Build keyword mapping if not exists
        const keywordMapping = this.buildKeywordToolMapping();
        
        if (keywordMapping.size === 0) {
            console.log(`[shouldForceToolMode] No keyword mapping available`);
            return {
                isToolTrigger: false,
                originalMessage: message
            };
        }
        
        const messageLower = message.toLowerCase();
        
        // Check if any keyword matches the message
        for (const [keyword, toolInfo] of keywordMapping) {
            if (messageLower.includes(keyword)) {
                // Only trigger if the keyword belongs to the current scenario or is generic
                if (toolInfo.scenario === scenario || scenario === 'configuration') {
                    // console.log(`[shouldForceToolMode] Matched keyword '${keyword}' (${toolInfo.language}) -> tool: ${toolInfo.toolName}`);
                    
                    // Extract tool arguments based on tool type
                    let toolArgs = '';
                    if (toolInfo.toolName === 'get-node-info') {
                        // Extract node IDs from new args format: args:{"id":[nodeIds]}
                        const nodeIdMatch = message.match(/args:\{\"id\":\[([^\]]+)\]\}/i);
                        if (nodeIdMatch) {
                            const nodeIdsStr = nodeIdMatch[1];
                            try {
                                // Parse the node IDs string as JSON array
                                const nodeIds = JSON.parse(`[${nodeIdsStr}]`);
                                // Return as comma-separated string like "id1,id2,id3"
                                toolArgs = nodeIds.join(',');
                            } catch (e) {
                                // If JSON parsing fails, split by comma and clean up, then join back
                                const nodeIds = nodeIdsStr.split(',').map(id => id.trim().replace(/["\']]/g, ''));
                                toolArgs = nodeIds.join(',');
                            }
                        }
                    } else if (toolInfo.toolName === 'get-flow') {
                        // Extract flow ID from new args format: args:{"id":"flowId"}
                        const flowIdMatch = message.match(/args:\{\"id\":\"([^\"]+)\"\}/i);
                        if (flowIdMatch) {
                            const flowId = flowIdMatch[1].trim();
                            toolArgs = flowId;
                        }
                    }
                    const result = {
                        isToolTrigger: true,
                        toolName: toolInfo.toolName,
                        toolArgs: toolArgs,
                        originalMessage: message,
                        forcedByScenario: true,
                        matchedKeyword: toolInfo.originalKeyword,
                        matchedLanguage: toolInfo.language
                    };
                    console.log(`[shouldForceToolMode] 返回结果:`, JSON.stringify(result, null, 2));
                    return result;
                }
            }
        }
        
        console.log(`[shouldForceToolMode] No matching keywords found for scenario: ${scenario}`);
        const result = {
            isToolTrigger: false,
            originalMessage: message
        };
        console.log(`[shouldForceToolMode] 返回结果:`, JSON.stringify(result, null, 2));
        return result;
    }

    /**
     * Pure LLM streaming chat (without tools)
     */
    async executePureLLMChatStream(scenario, message, llmConfig, sessionId, dynamicData = {}, onChunk = null) {
        try {
            // console.log('🚀 Starting pure LLM streaming chat:', { scenario, message, sessionId });
            
            // Send start event
            if (onChunk && typeof onChunk === 'function') {
                onChunk({ type: 'start' });
            }
            
            // Get session context
            const sessionContext = this.memoryManager.getSessionContext(sessionId);
            // console.log('📚 Session context:', sessionContext.length, 'records');
            
            // Get LLM instance
            const llm = this.getLLM(llmConfig);
            
            // Create scenario prompt (without tools)
            const prompt = this.createScenarioPrompt(scenario, dynamicData);
            
            // Build message history
            const messages = [];
            
            // Add system prompt
            const scenarioConfig = this.scenarios[scenario] || this.scenarios.general;
            let systemPrompt = scenarioConfig.systemPrompt;
            
            // Replace dynamic inputs
            if (scenarioConfig.dynamicInputs) {
                for (const input of scenarioConfig.dynamicInputs) {
                    const value = dynamicData[input] || '';
                    const placeholder = `{{${input}}}`;
                    systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), value);
                }
            }
            
            messages.push({ role: 'system', content: systemPrompt });
            
            // Add session history
            sessionContext.forEach(ctx => {
                messages.push({ role: ctx.role === 'user' ? 'human' : 'assistant', content: ctx.content });
            });
            
            // Add current message
            messages.push({ role: 'human', content: message });
            
            // console.log('🌊 Starting pure LLM streaming generation...');
            
            let fullResponse = '';
            let chunkCount = 0;
            
            // Use LLM streaming generation
            const stream = await llm.stream(messages);
            
            for await (const chunk of stream) {
                // Check if abort is needed before processing each streaming chunk
                if (onChunk && typeof onChunk === 'function') {
                    const shouldContinue = onChunk({ type: 'heartbeat' });
                    if (shouldContinue === false) {
                        console.log('🛑 Received stop signal before pure LLM streaming chunk processing, interrupting');
                        break;
                    }
                }
                
                const content = chunk.content || '';
                if (content) {
                    chunkCount++;
                    fullResponse += content;
                    
                    // console.log(`📦 Text chunk ${chunkCount}:`, content);
                    
                    if (onChunk && typeof onChunk === 'function') {
                        const shouldContinue = onChunk({
                            type: 'text-delta',
                            textDelta: content
                        });
                        
                        // If onChunk returns false, stop streaming processing
                        if (shouldContinue === false) {
                            console.log('🛑 Received stop signal, interrupting pure LLM streaming processing');
                            break;
                        }
                    }
                }
            }
            
            // console.log('✅ Pure LLM streaming processing completed, processed', chunkCount, 'text chunks');
            // console.log('📝 Complete response:', fullResponse);
            
            // Send completion event
            if (onChunk && typeof onChunk === 'function') {
                // console.log('📤 Sending finish event');
                onChunk({
                    type: 'finish',
                    finishReason: 'stop'
                });
            }
            
            // Save conversation to memory
            // console.log('💾 Starting to save conversation to memory...');
            this.memoryManager.addConversation(sessionId, 'user', message, scenario);
            this.memoryManager.addConversation(sessionId, 'assistant', fullResponse, scenario);
            // console.log('✅ Conversation saved successfully');
            
            return {
                response: fullResponse,
                intermediateSteps: [],
                scenario: scenario
            };
            
        } catch (error) {
            // console.error('❌ Pure LLM streaming chat execution failed:', error);
            
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
            // console.log('🚀 Starting streaming scenario chat execution:', { scenario, message, sessionId });
            // console.log('📋 onChunk callback function:', typeof onChunk, !!onChunk);
        // console.log('🔧 LLM configuration:', llmConfig);
            
            // Ensure language information is added to dynamicData
            const enrichedDynamicData = {
                ...dynamicData,
                lang: this.language
            };
            
            // Detect if it's a tool call trigger
            let toolTrigger = this.detectToolTrigger(message);
            // console.log('🔍 Tool trigger detection result:', toolTrigger);
            
            // If not a tool trigger, check if should force tool mode based on scenario
            if (!toolTrigger.isToolTrigger) {
                toolTrigger = this.shouldForceToolMode(scenario, message);
                // console.log('🔍 Force tool mode check result:', toolTrigger);
                // If shouldForceToolMode detects a tool trigger, mark it as directExecution to avoid duplicate calls
                if (toolTrigger.isToolTrigger) {
                    toolTrigger.directExecution = true;
                    console.log('🔧 shouldForceToolMode detected tool trigger, enabling directExecution mode');
                }
            }
            
            // If still not a tool trigger, use pure LLM mode
            if (!toolTrigger.isToolTrigger) {
                console.log('📝 Using pure LLM mode to process message');
                return await this.executePureLLMChatStream(scenario, message, llmConfig, sessionId, enrichedDynamicData, onChunk);
            }
            
            // Tool call mode
            console.log('🔧 Using tool call mode to process message');
            
            // Send start event
            if (onChunk && typeof onChunk === 'function') {
                console.log('📤 Sending start event');
                onChunk({
                    type: 'start'
                });
            }
            
            // If direct execution mode, call MCP tool directly
            if (toolTrigger.directExecution) {
                console.log('⚡ Direct execution mode, calling tool:', toolTrigger.toolName);
                console.log('🔧 Direct execution - toolArgs:', toolTrigger.toolArgs);
                console.log('🔧 Direct execution - enrichedDynamicData:', enrichedDynamicData);
                try {
                    let toolResult = '';
                    
                    // Special handling for get-node-info tool - use local Node-RED method instead of MCP
                    if (toolTrigger.toolName === 'get-node-info') {
                        console.log('🔧 Using local Node-RED method for get-node-info');
                        
                        // Parse node IDs from toolArgs
                        let targetNodeIds = [];
                        if (toolTrigger.toolArgs && typeof toolTrigger.toolArgs === 'string') {
                            targetNodeIds = toolTrigger.toolArgs.split(',').map(id => id.trim());
                        }
                        
                        // Fallback to selected nodes if no specific IDs provided
                        if (targetNodeIds.length === 0 && enrichedDynamicData.selectedNodes) {
                            targetNodeIds = enrichedDynamicData.selectedNodes.map(n => n.id);
                        }
                        
                        if (targetNodeIds.length === 0) {
                            throw new Error('No node IDs provided and no selected nodes available');
                        }
                        
                        // Get global Node-RED instance
                        const RED = global.RED;
                        if (!RED) {
                            throw new Error('Node-RED instance not available');
                        }
                        
                        // Get node information using local Node-RED API
                        const nodeInfos = [];
                        const notFoundNodes = [];
                        
                        for (const nodeId of targetNodeIds) {
                            const node = RED.nodes.getNode(nodeId);
                            if (node) {
                                // Get complete JSON data of the node, excluding sensitive information and internal properties
                                const nodeInfo = {};
                                
                                // Copy all node properties, but exclude sensitive information and internal properties
                                Object.keys(node).forEach(key => {
                                    // Exclude sensitive information, internal properties and functions
                                    if (!['credentials', 'apiKey', 'password', 'token'].includes(key) && 
                                        !key.startsWith('_') && 
                                        typeof node[key] !== 'function') {
                                        nodeInfo[key] = node[key];
                                    }
                                });
                                
                                nodeInfos.push(nodeInfo);
                                console.log(`[get-node-info] Local method - Successfully got node info: ${node.type} (${node.name || node.id})`);
                            } else {
                                notFoundNodes.push(nodeId);
                                console.log(`[get-node-info] Local method - Node not found: ${nodeId}`);
                            }
                        }
                        
                        const result = {
                            nodes: nodeInfos,
                            nodeCount: nodeInfos.length,
                            notFoundNodes: notFoundNodes,
                            summary: {
                                totalRequested: targetNodeIds.length,
                                found: nodeInfos.length,
                                notFound: notFoundNodes.length,
                                nodeTypes: [...new Set(nodeInfos.map(n => n.type))]
                            }
                        };
                        
                        toolResult = JSON.stringify(result);
                        console.log('✅ Local Node-RED method execution completed for get-node-info');
                        
                    } else {
                        // For other tools, continue using MCP
                        // Build MCP tool parameters based on tool type and arguments
                        const mcpToolParams = {};
                        
                        // Handle different tool types with their specific parameter requirements
                        if (toolTrigger.toolName === 'get-flow') {
                            // get-flow tool expects 'id' parameter
                            if (Array.isArray(toolTrigger.toolArgs) && toolTrigger.toolArgs.length > 0) {
                                mcpToolParams.id = toolTrigger.toolArgs[0];  // First parameter is flow ID
                            } else if (typeof toolTrigger.toolArgs === 'string' && toolTrigger.toolArgs) {
                                mcpToolParams.id = toolTrigger.toolArgs;  // Legacy string format
                            } else if (enrichedDynamicData.flowId) {
                                mcpToolParams.id = enrichedDynamicData.flowId;  // Fallback to dynamicData
                            }
                            
                            if (!mcpToolParams.id) {
                                throw new Error('No valid flow ID provided for get-flow tool');
                            }
                        } else if (toolTrigger.toolName === 'get-settings' || toolTrigger.toolName === 'get-diagnostics') {
                            // These tools don't require parameters
                            // mcpToolParams remains empty object
                        } else {
                            // For other tools, pass parameters as provided
                            if (Array.isArray(toolTrigger.toolArgs) && toolTrigger.toolArgs.length > 0) {
                                // Map array parameters to tool-specific parameter names
                                // This can be extended based on specific tool requirements
                                mcpToolParams.args = toolTrigger.toolArgs;
                            }
                        }
                        
                        console.log('🔧 MCP tool parameters:', mcpToolParams);
                        
                        // Call MCP tool directly
                        const mcpToolResult = await this.mcpClient.callTool(toolTrigger.toolName, mcpToolParams);

                        // console.log('✅ MCP tool execution completed, raw result:', JSON.stringify(mcpToolResult, null, 2));
                        
                        // Format MCP tool result
                        if (mcpToolResult && mcpToolResult.content && mcpToolResult.content.length > 0) {
                            toolResult = mcpToolResult.content[0].text;
                            console.log('📄 Extracted tool result text:', toolResult);
                        } else {
                            toolResult = JSON.stringify(mcpToolResult);
                            console.log('📄 Fallback tool result (JSON):', toolResult);
                        }
                    }
                    
                    // Send tool call event first to show "✅ 工具执行成功" message
                    if (onChunk && typeof onChunk === 'function') {
                        console.log(`🔔 [DIRECT_EXECUTION] Sending tool_call event for tool: ${toolTrigger.toolName}`);
                        console.log(`🔔 [DIRECT_EXECUTION] tool_call arguments:`, JSON.stringify(toolTrigger.toolArgs || {}));
                        onChunk({
                            type: 'tool_call',
                            tool_name: toolTrigger.toolName,
                            arguments: toolTrigger.toolArgs || {}
                        });
                        
                        // Then send tool execution result event
                        console.log(`📤 [DIRECT_EXECUTION] Sending tool_result event for tool: ${toolTrigger.toolName}`);
                        console.log(`📤 [DIRECT_EXECUTION] tool_result content length: ${toolResult.length} characters`);
                        console.log(`📤 [DIRECT_EXECUTION] tool_result content ${toolResult} `);
                        onChunk({
                            type: 'tool_result',
                            result: toolResult
                        });
                    }
                    
                    // Use pure LLM mode to generate explanation based on tool result
                    const languageMap = {
                        'zh-CN': 'Chinese (Simplified)',
                        'zh-TW': 'Chinese (Traditional)',
                        'en-US': 'English',
                        'ja': 'Japanese',
                        'ja-JP': 'Japanese',
                        'de': 'German',
                        'es-ES': 'Spanish',
                        'fr': 'French',
                        'ko': 'Korean',
                        'pt-BR': 'Portuguese (Brazil)',
                        'ru': 'Russian'
                    };
                    const responseLanguage = languageMap[this.language] || 'English';
                    const explanationPrompt = `User request: ${toolTrigger.originalMessage}\n\nTool execution result:\n${toolResult}\n\nAs a professional Node-RED system administrator, please analyze the above flow data in detail and explain in natural language:\n1. The overall functionality and purpose of the flow\n2. Main node types and their roles\n3. Connection relationships and data flow between nodes\n4. Working principles and execution logic of the flow\n\nPlease answer in ${responseLanguage} with professional but easy-to-understand language.`;
                    
                    return await this.executePureLLMChatStream(scenario, explanationPrompt, llmConfig, sessionId, enrichedDynamicData, onChunk);
                    
                } catch (error) {
                    // console.error('❌ Direct MCP tool execution failed:', error);
                    if (onChunk && typeof onChunk === 'function') {
                        onChunk({
                            type: 'error',
                            content: `Tool execution failed: ${error.message}`
                        });
                    }
                    return;
                }
            }
            
            // Get session context
            const sessionContext = this.memoryManager.getSessionContext(sessionId);
            // console.log('📚 Session context:', sessionContext.length, 'records');
            
            // Create agent
            // console.log('🤖 Starting to create agent...');
            // If directExecution mode is active, exclude the tool from agent to avoid duplicate calls
            const excludeTools = toolTrigger.directExecution ? [toolTrigger.toolName] : [];
            console.log('🤖 Creating agent with excluded tools:', excludeTools);
            const agent = await this.createScenarioAgent(scenario, llmConfig, enrichedDynamicData, excludeTools);
            // console.log('✅ Agent created successfully');
            
            // Build input
            const input = {
                input: message,
                chat_history: sessionContext.map(ctx => `${ctx.role}: ${ctx.content}`).join('\n')
            };
            // console.log('📝 Input construction completed:', input);

            let fullResponse = '';
            let intermediateSteps = [];
            let chunkCount = 0;

            // console.log('🌊 Starting streaming execution...');
            // Use streaming execution
            const stream = await agent.streamEvents(input, { version: 'v2' });
            // console.log('✅ Streaming object created successfully, starting to process events...');
            
            for await (const chunk of stream) {
                // Check if abort is needed before processing each streaming event
                if (onChunk) {
                    const shouldContinue = onChunk({ type: 'heartbeat' });
                    if (shouldContinue === false) {
                        console.log('🛑 Received stop signal before streaming event processing, interrupting');
                        break;
                    }
                }
                
                // console.log('📦 Received streaming event:', {
                //     event: chunk.event,
                //     name: chunk.name,
                //     data: chunk.data
                // });
                
                // Handle different types of streaming events
                if (chunk.event === 'on_chat_model_stream' && chunk.data?.chunk?.content) {
                    const content = chunk.data.chunk.content;
                    // console.log('💬 Checking text content:', JSON.stringify(content));
                    
                    if (content && onChunk) {
                        chunkCount++;
                        fullResponse += content;
                        // console.log(`📤 Sending text chunk ${chunkCount}:`, JSON.stringify(content));
                        
                        const shouldContinue = onChunk({
                            type: 'text-delta',
                            textDelta: content
                        });
                        
                        // If onChunk returns false, stop streaming processing
                        if (shouldContinue === false) {
                            console.log('🛑 Received stop signal, interrupting tool call streaming processing');
                            break;
                        }
                    }
                } else if (chunk.event === 'on_llm_stream' && chunk.data?.chunk?.text) {
                    // Backup LLM streaming event handling
                    const content = chunk.data.chunk.text;
                    // console.log('💬 LLM streaming text content:', JSON.stringify(content));
                    
                    if (content && onChunk) {
                        chunkCount++;
                        fullResponse += content;
                        // console.log(`📤 Sending text chunk ${chunkCount}:`, JSON.stringify(content));
                        
                        const shouldContinue = onChunk({
                            type: 'text-delta',
                            textDelta: content
                        });
                        
                        // If onChunk returns false, stop streaming processing
                        if (shouldContinue === false) {
                            console.log('🛑 Received stop signal, interrupting LLM streaming processing');
                            break;
                        }
                    }
                } else if (chunk.event === 'on_agent_action') {
                    console.log(`🔧 [AGENT_EXECUTION] Agent action: ${chunk.data?.tool}`);
                    console.log('🔧 [AGENT_EXECUTION] Tool input:', JSON.stringify(chunk.data?.toolInput, null, 2));
                    if (onChunk) {
                        console.log(`🔔 [AGENT_EXECUTION] Sending tool_call event for tool: ${chunk.data?.tool}`);
                        console.log(`🔔 [AGENT_EXECUTION] tool_call arguments:`, JSON.stringify(chunk.data?.toolInput));
                        onChunk({
                            type: 'tool_call',
                            tool_name: chunk.data?.tool,
                            arguments: chunk.data?.toolInput
                        });
                    }
                } else if (chunk.event === 'on_tool_end') {
                    console.log(`🔧 [AGENT_EXECUTION] Tool ended: ${chunk.name}`);
                    console.log('🔧 [AGENT_EXECUTION] Tool raw output:', JSON.stringify(chunk.data?.output, null, 2));
                    
                    // Record tool execution steps
                    intermediateSteps.push({
                        action: { tool: chunk.name },
                        observation: chunk.data?.output
                    });
                    
                    if (onChunk) {
                        console.log(`📤 [AGENT_EXECUTION] Sending tool_result event for tool: ${chunk.name}`);
                        // Format tool result
                        const formattedResult = this.formatToolResult(chunk.data?.output);
                        console.log(`📤 [AGENT_EXECUTION] Formatted result length: ${JSON.stringify(formattedResult).length} characters`);
                        onChunk({
                            type: 'tool_result',
                            result: formattedResult
                        });
                    }
                }
            }

            // console.log(`✅ Streaming processing completed, processed ${chunkCount} text chunks`);
            // console.log('📝 Complete response:', fullResponse);

            // If it's a tool trigger and has tool execution results, add AI explanation
            if (toolTrigger.isToolTrigger && intermediateSteps.length > 0) {
                // console.log('🤖 Starting to generate AI explanation...');
                
                // Build explanation prompt
                const toolResults = intermediateSteps.map(step => {
                    return `Tool: ${step.action?.tool || 'unknown'}\nResult: ${JSON.stringify(step.observation, null, 2)}`;
                }).join('\n\n');
                
                const languageMap = {
                    'zh-CN': 'Chinese (Simplified)',
                    'zh-TW': 'Chinese (Traditional)',
                    'en-US': 'English',
                    'ja': 'Japanese',
                    'ja-JP': 'Japanese',
                    'de': 'German',
                    'es-ES': 'Spanish',
                    'fr': 'French',
                    'ko': 'Korean',
                    'pt-BR': 'Portuguese (Brazil)',
                    'ru': 'Russian'
                };
                const responseLanguage = languageMap[this.language] || 'Chinese';
                const explanationPrompt = `User request: ${toolTrigger.originalMessage}\n\nTool execution results:\n${toolResults}\n\nAs a professional Node-RED system administrator, please analyze the above diagnostic JSON data in detail and explain in natural language:\n1. Current system running status and health\n2. Performance metrics analysis (memory, CPU, event loop delay, etc.)\n3. Specific meaning of discovered issues and warnings\n4. Targeted optimization suggestions and solutions\n5. System maintenance recommendations\n\nPlease answer in ${responseLanguage}, avoid directly outputting JSON format, but use easy-to-understand natural language for professional analysis.`;
                
                // Use pure LLM mode to generate explanation
                const llm = this.getLLM(llmConfig);
                const explanationStream = await llm.stream(explanationPrompt);
                
                // console.log('📤 Starting to send AI explanation...');
                for await (const chunk of explanationStream) {
                    if (chunk.content && onChunk) {
                        fullResponse += chunk.content;
                        onChunk({
                            type: 'text-delta',
                            textDelta: chunk.content
                        });
                    }
                }
                // console.log('✅ AI explanation sending completed');
            }

            if (onChunk) {
                // console.log('📤 Sending finish event');
                onChunk({
                    type: 'finish',
                    finishReason: 'stop'
                });
            } else {
                // console.warn('⚠️ onChunk callback does not exist, cannot send finish event');
            }

            // Save to memory
            // console.log('💾 Starting to save conversation to memory...');
            this.memoryManager.addConversation(sessionId, 'user', message, scenario);
            this.memoryManager.addConversation(sessionId, 'assistant', fullResponse, scenario, {
                intermediateSteps: intermediateSteps
            });

            // Update session context
            this.memoryManager.addToSessionContext(sessionId, { role: 'user', content: message });
            this.memoryManager.addToSessionContext(sessionId, { role: 'assistant', content: fullResponse });
            // console.log('✅ Conversation saved successfully');

            return {
                response: fullResponse,
                intermediateSteps: intermediateSteps,
                scenario: scenario,
                sessionId: sessionId
            };
        } catch (error) {
            // console.error('❌ Streaming scenario chat execution error:', error);
            // console.error('❌ Error stack:', error.stack);
            if (onChunk) {
                // console.log('📤 Sending error event');
                onChunk({
                    type: 'error',
                    error: error.message
                });
            }
            throw error;
        }
    }

    /**
     * Detect scenario
     */
    detectScenario(message) {
        const lowerMessage = message.toLowerCase();
        
        // Prioritize checking general question keywords, these should be answered directly without calling tools
        const generalKeywords = ['介绍', '是什么', '简介', 'introduce', 'introduction', 'what is'];
        if (generalKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 'general';
        }
        
        // Keyword matching logic
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
     * Get scenario information
     */
    getScenarioInfo(scenario) {
        return this.scenarios[scenario] || this.scenarios.general;
    }

    /**
     * Get all available scenarios
     */
    getAvailableScenarios() {
        return Object.keys(this.scenarios).map(key => ({
            key,
            name: this.scenarios[key].name,
            description: this.scenarios[key].description
        }));
    }

    /**
     * Update language settings and reload configuration
     */
    updateLanguage(newLanguage) {
        if (this.language !== newLanguage) {
            // console.log(`Updating language from ${this.language} to ${newLanguage}`);
            this.language = newLanguage;
            this.loadScenarios();
            // Clear cached agents, force recreation
            this.agents.clear();
            // console.log('Language updated and scenarios reloaded');
        }
    }

    /**
     * Reload configuration
     */
    reload() {
        this.loadScenarios();
        this.agents.clear(); // Clear cached agents
        // console.log('LangChain manager reloaded');
    }

    /**
     * Format tool result
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
     * Execute tool
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
            // console.error(`Error executing tool ${toolName}:`, error);
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.llmInstances.clear();
        this.tools.clear();
        this.agents.clear();
    }
}

module.exports = LangChainManager;