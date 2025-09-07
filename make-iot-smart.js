/**
 * Copyright (c) 2024 Zheng He
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Load environment variable configuration
require('dotenv').config();

const MCPClientHelper = require('./mcp/mcp-client');
const MemoryManager = require('./lib/memory-manager');
const LangChainManager = require('./lib/langchain-manager');
const path = require('path');
const fs = require('fs');

module.exports = function (RED) {
    // Set global RED instance for langchain-manager access
    global.RED = RED;
    
    // API configuration node
    function ApiConfigNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Save configuration
        node.name = config.name;
        node.provider = config.provider || 'openai';
        node.model = config.model || 'gpt-4o-mini';
        node.useDifferentModels = config.useDifferentModels || false;
        node.planningModel = config.planningModel;
        node.executionModel = config.executionModel;
        node.temperature = parseFloat(config.temperature) || 0.1;
        node.maxTokens = parseInt(config.maxTokens) || 2000;
        
        // MCP configuration - using node-red-mcp-server
        node.mcpCommand = config.mcpCommand || 'npx node-red-mcp-server';
        node.mcpArgs = config.mcpArgs || '';
        // Automatically get the current running port of Node-RED
        const currentPort = RED.settings.uiPort || 1880;
        node.mcpEnv = config.mcpEnv || `NODE_RED_URL=http://localhost:${currentPort}`;
        node.enableMcp = config.enableMcp !== false; // Enable MCP by default
        
        // console.log(RED._('messages.apiConfigInit') + ':', {
        //     name: node.name,
        //     provider: node.provider,
        //     model: node.model,
        //     enableMcp: node.enableMcp,
        //     mcpCommand: node.mcpCommand
        // });
        
        // Set global variable for access from other places
        global.apiConfigNode = node;
        
        // Get API key
        node.apiKey = this.credentials.apiKey;
        
        // Initialize core components
        node.memoryManager = null;
        node.langchainManager = null;
        node.mcpClient = new MCPClientHelper();
        
        // Initialize memory manager
        node.initMemoryManager = function() {
            try {
                const dbPath = path.join(__dirname, 'data', 'memory.db');
                node.memoryManager = new MemoryManager(dbPath);
                // console.log('Memory manager initialized successfully');
                return true;
            } catch (error) {
                // console.error('Failed to initialize memory manager:', error);
                node.error('Failed to initialize memory manager: ' + error.message);
                return false;
            }
        };
        
        // Initialize LangChain manager
        // Get current Node-RED language
        node.getCurrentLanguage = function() {
            let currentLanguage = 'zh-CN'; // Default language
            try {
                // Try multiple ways to get language settings
                if (RED.i18n && typeof RED.i18n.lang === 'function') {
                    currentLanguage = RED.i18n.lang() || 'zh-CN';
                }
                
                // Try to get from RED.settings
                if (RED.settings && RED.settings.lang) {
                    currentLanguage = RED.settings.lang;
                }
                
                // Try to get from user settings
                if (RED.user && RED.user.lang) {
                    currentLanguage = RED.user.lang;
                }
                
                // console.log('Detected language:', currentLanguage);
            } catch (langError) {
                // console.warn('Failed to get Node-RED language, using default:', langError.message);
            }
            return currentLanguage;
        };

        node.initLangChainManager = function() {
            try {
                const currentLanguage = node.getCurrentLanguage();
                // console.log('Current Node-RED language:', currentLanguage);
                
                node.langchainManager = new LangChainManager(node.memoryManager, node.mcpClient, currentLanguage);
                // console.log('LangChain manager initialized successfully with language:', currentLanguage);
                return true;
            } catch (error) {
                // console.error('Failed to initialize LangChain manager:', error);
                node.error('Failed to initialize LangChain manager: ' + error.message);
                return false;
            }
        };

        // Update language settings (triggered when called by frontend)
        node.updateLanguageFromFrontend = function(language) {
            if (language && node.langchainManager) {
                const currentLanguage = node.langchainManager.language || node.getCurrentLanguage();
                if (language !== currentLanguage) {
                    // console.log(`Language changed from ${currentLanguage} to ${language}`);
                    node.langchainManager.updateLanguage(language);
                }
            }
        };


        
        // Initialize MCP connection
        node.initMCP = async function() {
            // console.log('🔧 [MCP DEBUG] initMCP called, checking conditions:', {
            //     enableMcp: node.enableMcp,
            //     mcpCommand: node.mcpCommand,
            //     hasCommand: !!node.mcpCommand
            // });
            
            if (!node.enableMcp) {
                // console.log('❌ [MCP DEBUG] MCP not enabled:', RED._('messages.mcpNotEnabled'));
                return false;
            }
            
            if (!node.mcpCommand) {
                // console.log('❌ [MCP DEBUG] MCP command not configured:', RED._('messages.mcpCommandNotConfigured'));
                return false;
            }

            try {
                // console.log('🚀 [MCP DEBUG] ' + RED._('messages.mcpInitStart') + ':', {
                //     command: node.mcpCommand,
                //     args: node.mcpArgs,
                //     env: node.mcpEnv
                // });
                
                const args = node.mcpArgs ? node.mcpArgs.split(' ').filter(arg => arg.trim()) : [];
                // console.log('📋 [MCP DEBUG] Parsed args:', args);
                
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
                // console.log('🌍 [MCP DEBUG] Environment variables:', env);

                // console.log('🔌 [MCP DEBUG] Attempting to connect to MCP server...');
                const success = await node.mcpClient.connect(node.mcpCommand, args, env);
                // console.log('🔌 [MCP DEBUG] MCP connection result:', success);
                
                if (success) {
                    // console.log('✅ [MCP DEBUG] ' + RED._('messages.mcpInitSuccess'));
                    
                    // Test getting server info
                    try {
                        // console.log('🔍 [MCP DEBUG] Testing MCP server info...');
                        const serverInfo = await node.mcpClient.getServerInfo();
                        // console.log('📊 [MCP DEBUG] Server info:', {
                        //     toolsCount: serverInfo.tools ? serverInfo.tools.length : 0,
                        //     toolNames: serverInfo.tools ? serverInfo.tools.map(t => t.name) : []
                        // });
                    } catch (serverInfoError) {
                        // console.error('❌ [MCP DEBUG] Failed to get server info:', serverInfoError.message);
                    }
                    
                    // Reinitialize LangChain manager to get MCP tools
                    if (node.langchainManager) {
                        // console.log('🔄 [MCP DEBUG] Reinitializing LangChain manager tools...');
                        await node.langchainManager.initializeTools();
                        // console.log('✅ [MCP DEBUG] LangChain manager tools reinitialized');
                    }
                    
                    return true;
                } else {
                    // console.error('❌ [MCP DEBUG] MCP server connection failed');
                    return false;
                }
            } catch (error) {
                // console.error('💥 [MCP DEBUG] ' + RED._('messages.mcpInitFailed') + ':', error.message);
                // console.error('💥 [MCP DEBUG] Error stack:', error.stack);
                return false;
            }
        };

        // Get LLM configuration
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

        // Detect scenario
        node.detectScenario = function(message) {
            if (node.langchainManager) {
                return node.langchainManager.detectScenario(message);
            }
            return 'general';
        };

        // Execute AI conversation
        node.executeChat = async function(message, scenario = null, sessionId = null, dynamicData = {}) {
            if (!node.langchainManager) {
                throw new Error('LangChain manager not initialized');
            }

            // Auto-detect scenario
            if (!scenario) {
                scenario = node.detectScenario(message);
            }

            // Generate session ID
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }

            // 获取LLM配置
            const llmConfig = node.getLLMConfig();

            // 获取MCP工具
            let mcpTools = [];
            try {
                if (node.langchainManager && node.langchainManager.mcpClient) {
                    const serverInfo = await node.langchainManager.mcpClient.getServerInfo();
                    mcpTools = serverInfo.tools || [];
                }
            } catch (error) {
                // console.warn('Failed to get MCP tools:', error.message);
            }

            // 获取当前语言
            const currentLanguage = node.getCurrentLanguage();

            // Prepare dynamic data
            const contextData = {
                nodeRedVersion: RED.version || RED.settings?.version || 'unknown',
                nodeVersion: process.version,
                currentTime: new Date().toISOString(),
                mcpTools: Array.isArray(mcpTools) ? mcpTools.map(tool => typeof tool === 'object' ? `${tool.name || 'unknown'}: ${tool.description || ''}` : tool).join(', ') : '',
                lang: currentLanguage,
                userLevel: dynamicData.userLevel || 'beginner',
                projectRequirements: dynamicData.projectRequirements || '',
                developmentTask: dynamicData.developmentTask || '',
                configurationNeeds: dynamicData.configurationNeeds || '',
                projectStatus: dynamicData.projectStatus || '',
                ...dynamicData
            };
            
            // Add integration targets for integration scenario
            if (scenario === 'integration') {
                contextData.integrationTargets = dynamicData.integrationTargets || [];
            }
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
                // console.error('Chat execution failed:', error);
                throw error;
            }
        };

        // Streaming conversation (compatibility method)
        node.streamChat = async function(message, scenario = null, sessionId = null, dynamicData = {}, onChunk = null) {
            try {
                // Get LLM configuration
                const llmConfig = node.getLLMConfig();
                
                // Print LLM configuration for debugging
                // console.log('🔧 LLM配置:', llmConfig);
                
                // Check if API key is not configured
                if (!llmConfig.apiKey || llmConfig.apiKey === RED._('placeholder.apiKey') || llmConfig.apiKey.trim() === '') {
                    const error = new Error(RED._('errors.apiKeyMissing'));
                    error.code = 'API_AUTH_FAILED';
                    throw error;
                }
                
                // Detect scenario
                if (!scenario) {
                    scenario = node.langchainManager.detectScenario(message);
                }
                
                // Generate session ID
                if (!sessionId) {
                    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                }
                
                // 获取MCP工具
                let mcpTools = [];
                try {
                    if (node.langchainManager && node.langchainManager.mcpClient) {
                        const serverInfo = await node.langchainManager.mcpClient.getServerInfo();
                        mcpTools = serverInfo.tools || [];
                    }
                } catch (error) {
                    // console.warn('Failed to get MCP tools:', error.message);
                }

                // 获取当前语言
                const currentLanguage = node.getCurrentLanguage();

                // Prepare complete context data (same as executeChat)
                const contextData = {
                    nodeRedVersion: RED.version || RED.settings?.version || 'unknown',
                    nodeVersion: process.version,
                    currentTime: new Date().toISOString(),
                    mcpTools: Array.isArray(mcpTools) ? mcpTools.map(tool => typeof tool === 'object' ? `${tool.name || 'unknown'}: ${tool.description || ''}` : tool).join(', ') : '',
                    lang: currentLanguage,
                    userLevel: dynamicData.userLevel || 'beginner',
                    projectRequirements: dynamicData.projectRequirements || '',
                    developmentTask: dynamicData.developmentTask || '',
                    configurationNeeds: dynamicData.configurationNeeds || '',
                    projectStatus: dynamicData.projectStatus || '',
                    ...dynamicData
                };
                
                // Add integration targets for integration scenario
                if (scenario === 'integration') {
                    contextData.integrationTargets = dynamicData.integrationTargets || [];
                }
                
                // console.log('streamChat contextData:', contextData);
                
                // console.log('Starting streaming chat:', { message, scenario, sessionId });
                
                // Use LangChain's real streaming functionality
                const result = await node.langchainManager.executeScenarioChatStream(
                    scenario, 
                    message, 
                    llmConfig, 
                    sessionId, 
                    contextData, 
                    onChunk
                );
                
                return result;
            } catch (error) {
                // console.error('Stream chat error:', error);
                if (onChunk && typeof onChunk === 'function') {
                    onChunk({
                        type: 'error',
                         error: error.message
                     });
                }
                throw error;
            }
        };

        // Get memory statistics
        node.getMemoryStats = function() {
            if (node.memoryManager) {
                return node.memoryManager.getMemoryStats();
            }
            return null;
        };

        // Get available scenarios
        node.getAvailableScenarios = function() {
            if (node.langchainManager) {
                return node.langchainManager.getAvailableScenarios();
            }
            return [];
        };

        // Get conversation history
        node.getConversationHistory = function(sessionId, limit = 50) {
            if (node.memoryManager) {
                return node.memoryManager.getConversationHistory(sessionId, limit);
            }
            return [];
        };

        // Search conversation records
        node.searchConversations = function(query, scenario = null, limit = 10) {
            if (node.memoryManager) {
                return node.memoryManager.searchConversations(query, scenario, limit);
            }
            return [];
        };

        // Save flow template
        node.saveFlowTemplate = function(name, description, flowJson, scenario, tags = []) {
            if (node.memoryManager) {
                return node.memoryManager.saveFlowTemplate(name, description, flowJson, scenario, tags);
            }
            return null;
        };

        // Get flow templates
        node.getFlowTemplates = function(scenario = null, limit = 20) {
            if (node.memoryManager) {
                return node.memoryManager.getFlowTemplates(scenario, limit);
            }
            return [];
        };

        // Set user preference
        node.setUserPreference = function(key, value, category = 'general') {
            if (node.memoryManager) {
                return node.memoryManager.setUserPreference(key, value, category);
            }
        };

        // Get user preference
        node.getUserPreference = function(key, defaultValue = null) {
            if (node.memoryManager) {
                return node.memoryManager.getUserPreference(key, defaultValue);
            }
            return defaultValue;
        };

        // Clean up old data
        node.cleanupOldData = function(daysToKeep = 30) {
            if (node.memoryManager) {
                return node.memoryManager.cleanup(daysToKeep);
            }
            return 0;
        };

        // Reload configuration
        node.reloadConfig = function() {
            if (node.langchainManager) {
                node.langchainManager.reload();
            }
        };

        // Delayed initialization
        setTimeout(async () => {
            try {
                // Initialize memory manager
                const memoryInitialized = node.initMemoryManager();
                if (!memoryInitialized) {
                    node.warn('Memory manager initialization failed');
                }

                // Initialize LangChain manager
                const langchainInitialized = node.initLangChainManager();
                if (!langchainInitialized) {
                    node.warn('LangChain manager initialization failed');
                }

                // Initialize MCP connection
                if (node.enableMcp) {
                    const mcpInitialized = await node.initMCP();
                    if (!mcpInitialized) {
                        node.warn('MCP initialization failed, continuing without MCP tools');
                    }
                }

                // console.log('API configuration node initialization completed');
                
                // console.log('API configuration node initialization completed');
            } catch (error) {
                // console.error('API configuration node initialization failed:', error);
                node.error('Initialization failed: ' + error.message);
            }
        }, 1000);

        // Format tool result
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

        // Clean up resources when node closes
        node.on('close', function(done) {
            // console.log('API configuration node closing, cleaning up resources...');
            
            try {
                // Close MCP connection
                if (node.mcpClient) {
                    node.mcpClient.disconnect();
                }
                
                // Force close memory manager to release database locks
                if (node.memoryManager) {
                    if (typeof node.memoryManager.forceClose === 'function') {
                        node.memoryManager.forceClose();
                    } else {
                        node.memoryManager.close();
                    }
                }
                
                // Clean up LangChain manager
                if (node.langchainManager) {
                    node.langchainManager.cleanup();
                }
                
                // console.log('Resource cleanup completed');
            } catch (error) {
                // console.error('Resource cleanup failed:', error);
            }
            
            done();
        });
    }

    // Register API configuration node
    RED.nodes.registerType('api-config', ApiConfigNode, {
        credentials: {
            apiKey: { type: 'password' }
        }
    });

    // Register make-iot-smart node
    function MakeIotSmartNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        node.name = config.name;
        node.apiConfig = config.apiConfig;
        node.algorithm = config.algorithm;
        node.settings = config.settings;
        
        // Set node to valid state
        // node.valid = true;
        
        // Get API configuration node
        node.configNode = RED.nodes.getNode(node.apiConfig);
        
        if (!node.configNode) {
            node.error("API configuration node not found");
            return;
        }
        
        // console.log('AI assistant node initialization completed (set to valid state):', {
        //     name: node.name,
        //     configNode: node.configNode ? node.configNode.name : 'none',
        //     valid: node.valid
        // });
    }
    
    RED.nodes.registerType('make-iot-smart', MakeIotSmartNode);

    // AI sidebar endpoint
    RED.httpAdmin.post('/ai-sidebar/chat', async function(req, res) {
        try {
            // Set request character encoding to UTF-8
            req.setEncoding('utf8');
            
            // console.log('🌐 Received normal chat request:', req.body);
            // console.log('🔥 Normal chat endpoint called!');
            // console.log('🔍 Original message content:', JSON.stringify(req.body.message));
            const { message, scenario, sessionId, selectedFlow, selectedNodes, dynamicData: requestDynamicData, language } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // Get API configuration node
            let configNode = null;
            // Use global variable to get configuration node
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            // If frontend passed language parameter, update LangChain manager's language
            if (language) {
                // console.log('🌐 Language passed from frontend:', language);
                configNode.updateLanguageFromFrontend(language);
            }

            // Prepare dynamic data
            const dynamicData = {
                ...(requestDynamicData || {}),  // First merge dynamic data passed from frontend
                selectedFlow: selectedFlow,
                selectedNodes: selectedNodes
            };
            
            // Ensure flowId is correctly passed
            if (requestDynamicData && requestDynamicData.flowId) {
                dynamicData.flowId = requestDynamicData.flowId;
                // console.log('✅ Got flowId from frontend:', requestDynamicData.flowId);
            } else if (selectedFlow && selectedFlow.id) {
                dynamicData.flowId = selectedFlow.id;
                // console.log('✅ Got flowId from selectedFlow:', selectedFlow.id);
            }

            // Execute conversation
            const result = await configNode.executeChat(message, scenario, sessionId, dynamicData);

            res.json({
                success: true,
                response: result.response,
                scenario: result.scenario,
                sessionId: result.sessionId,
                intermediateSteps: result.intermediateSteps
            });
        } catch (error) {
            // console.error('Chat endpoint error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message 
            });
        }
    });

    // Simple AI test endpoint
    RED.httpAdmin.post('/ai-sidebar/test-ai', async function(req, res) {
        try {
            const { message } = req.body;
            
            // Get configuration node
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
            // console.log('Testing AI call, configuration:', llmConfig);
            
            // Call LLM directly
            const llm = configNode.langchainManager.getLLM(llmConfig);
            const result = await llm.invoke(message || 'Hello');
            
            // console.log('AI response:', result);
            res.json({ 
                success: true, 
                response: result.content || result,
                config: llmConfig
            });
        } catch (error) {
            // console.error('AI test failed:', error);
            res.json({ error: error.message, stack: error.stack });
        }
    });

    // Streaming chat endpoint
    RED.httpAdmin.post('/ai-sidebar/stream-chat', async function(req, res) {
        try {
            // Set request and response character encoding to UTF-8
            req.setEncoding('utf8');
            
            // console.log('🌐 Received streaming chat request:', req.body);
            // console.log('🔥 Streaming chat endpoint called!');
            // console.log('🔍 Request method:', req.method);
            // console.log('🔍 Request URL:', req.url);
            // console.log('🔍 Request headers:', req.headers);
            // console.log('🔍 Original message content:', JSON.stringify(req.body.message));
            
            const { message, scenario, sessionId, selectedFlow, selectedNodes, dynamicData: requestDynamicData, language } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // Set SSE headers, explicitly specify UTF-8 encoding
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            // console.log('✅ SSE headers set completed');

            // Get API configuration node
            const { nodeId } = req.body;
            let configNode = null;
            
            if (nodeId) {
                // If nodeId is provided, get the node directly
                configNode = RED.nodes.getNode(nodeId);
            } else {
                // Otherwise use global variable to get configuration node
                // console.log('🔍 Starting to search for api-config node...');
                if (global.apiConfigNode) {
                    // console.log('✅ Found api-config node from global variable');
                    configNode = global.apiConfigNode;
                } else {
                    // console.log('❌ api-config node not found in global variable');
                }
                // console.log('🔍 Search result:', !!configNode);
            }
            
            // console.log('🔍 Search configuration node:', nodeId, !!configNode);
            
            if (!configNode) {
                // console.error('❌ Configuration node not found');
                res.write(`data: ${JSON.stringify({ error: 'No API configuration found' })}\n\n`);
                res.end();
                return;
            }

            // If frontend passed language parameter, update LangChain manager's language
            if (language) {
                // console.log('🌐 Language passed from frontend:', language);
                configNode.updateLanguageFromFrontend(language);
            }

            // Prepare dynamic data
            const dynamicData = {
                selectedFlow: selectedFlow,
                flowId: selectedFlow ? selectedFlow.id : null,  // Provide flowId for get-flow tool
                selectedNodes: selectedNodes,
                ...(requestDynamicData || {})  // Merge dynamic data passed from frontend
            };
            
            // console.log('📝 Request parameters:', { message, scenario, sessionId, dynamicData });
            // console.log('🚀 Starting streaming chat...');
            
            let chunkCount = 0;
            let isClientDisconnected = false;
            let connectionEstablished = false;

            // Delay setting event listeners to avoid triggering before connection is established
            setTimeout(() => {
                connectionEstablished = true;
                
                // Listen for client abort request events
                req.on('aborted', () => {
                    if (connectionEstablished) {
                        // console.log('🛑 Backend received client abort request event, stopping LLM response');
                        isClientDisconnected = true;
                    }
                });

                // Listen for connection errors
                req.on('error', (err) => {
                    if (connectionEstablished) {
                        // console.log('🔌 Backend received connection error, stopping LLM response:', err.message);
                        isClientDisconnected = true;
                    }
                });
                
                // Listen for connection close events (more reliable disconnect detection)
                req.on('close', () => {
                    if (connectionEstablished) {
                        // console.log('📡 Backend received connection close event, stopping LLM response');
                        isClientDisconnected = true;
                    }
                });
                
                // Add response object finish and close event listeners
                res.on('close', () => {
                    if (connectionEstablished) {
                        // console.log('📡 Response connection closed, stopping LLM response');
                        isClientDisconnected = true;
                    }
                });
                
                res.on('error', (err) => {
                    if (connectionEstablished) {
                        // console.log('🔌 Response connection error, stopping LLM response:', err.message);
                        isClientDisconnected = true;
                    }
                });
                
                // console.log('🔍 Backend has set event listeners, connection established');
            }, 100); // Delay 100ms to set event listeners

            // Execute streaming conversation
            await configNode.streamChat(message, scenario, sessionId, dynamicData, (chunk) => {
                // Check if client has disconnected
                if (isClientDisconnected) {
                    // console.log('🛑 Detected client disconnect, stopping data transmission');
                    return false; // Return false to stop streaming processing
                }
                
                // Handle heartbeat check events (not sent to client, only for checking connection status)
                if (chunk.type === 'heartbeat') {
                    return !isClientDisconnected; // Return connection status
                }
                
                chunkCount++;
                // console.log(`📤 发送SSE数据块 ${chunkCount}:`, JSON.stringify(chunk));
                
                try {
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                } catch (writeError) {
                    // console.log('🔌 Failed to write response, client may have disconnected:', writeError.message);
                    isClientDisconnected = true;
                    return false;
                }
                
                return true; // Explicitly return true to continue processing
            });

            if (!isClientDisconnected) {
                // console.log(`✅ Streaming chat completed, sent ${chunkCount} data chunks`);
                res.end();
            } else {
                // console.log(`🛑 Streaming chat interrupted, sent ${chunkCount} data chunks`);
            }
        } catch (error) {
            // console.error('❌ Streaming chat endpoint error:', error);
            // console.error('❌ Error stack:', error.stack);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    });

    // Static file service - provide locales directory access
    RED.httpAdmin.get('/ai-sidebar/locales/:lang/:file', function(req, res) {
        // console.log('Locales route called:', req.path);
        // console.log('Route params:', req.params);
        try {
            const { lang, file } = req.params;
            const filePath = path.join(__dirname, 'locales', lang, file);
            // console.log('Language:', lang, 'File:', file);
            // console.log('File path:', filePath);
            
            // Security check: ensure requested file is within locales directory
            const resolvedPath = path.resolve(filePath);
            const localesDir = path.resolve(path.join(__dirname, 'locales'));
            
            if (!resolvedPath.startsWith(localesDir)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            // Check if file exists
            if (!fs.existsSync(resolvedPath)) {
                return res.status(404).json({ error: 'File not found' });
            }
            
            // Only allow JSON files
            if (!resolvedPath.endsWith('.json')) {
                return res.status(403).json({ error: 'Only JSON files are allowed' });
            }
            
            // Read and return JSON file
            const fileContent = fs.readFileSync(resolvedPath, 'utf8');
            const jsonData = JSON.parse(fileContent);
            
            res.setHeader('Content-Type', 'application/json');
            res.json(jsonData);
        } catch (error) {
            // console.error('Locales file serving error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get scenarios list endpoint
    RED.httpAdmin.get('/ai-sidebar/scenarios', function(req, res) {
        try {
            // Get language parameter, default to zh-CN
            const lang = req.query.lang || 'zh-CN';
            
            // Read multilingual scenarios.json file
            const scenariosPath = path.join(__dirname, 'config', 'locales', lang, 'scenarios.json');
            
            if (!fs.existsSync(scenariosPath)) {
                // If specified language file doesn't exist, try to use default English configuration
                const fallbackPath = path.join(__dirname, 'config', 'locales', 'en-US', 'scenarios.json');
                if (!fs.existsSync(fallbackPath)) {
                    return res.status(404).json({ error: 'Scenarios configuration file not found' });
                }
                const fallbackData = fs.readFileSync(fallbackPath, 'utf8');
                const fallbackScenarios = JSON.parse(fallbackData).scenarios;
                return res.json({ scenarios: fallbackScenarios });
            }
            
            const scenariosData = fs.readFileSync(scenariosPath, 'utf8');
            const scenarios = JSON.parse(scenariosData).scenarios;
            
            res.json({ scenarios });
        } catch (error) {
            // console.error('Scenarios endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get memory statistics endpoint
    RED.httpAdmin.get('/ai-sidebar/memory-stats', function(req, res) {
        try {
            // Use global variable to get configuration node
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
            // console.error('Memory stats endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get conversation history endpoint
    RED.httpAdmin.get('/ai-sidebar/history/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            const { limit = 50 } = req.query;
            
            // Use global variable to get configuration node
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
            // console.error('History endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get sessions list endpoint
    RED.httpAdmin.get('/ai-sidebar/sessions', function(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            // Use global variable to get configuration node
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
            // console.error('Sessions endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Create new session endpoint
    RED.httpAdmin.post('/ai-sidebar/sessions', function(req, res) {
        try {
            const { sessionId, title, scenario } = req.body;
            
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' });
            }
            
            // Use global variable to get configuration node
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
            // console.error('Create session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get single session details endpoint
    RED.httpAdmin.get('/ai-sidebar/sessions/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            
            // Use global variable to get configuration node
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
            // console.error('Get session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Update session endpoint
    RED.httpAdmin.put('/ai-sidebar/sessions/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            const updates = req.body;
            
            // Use global variable to get configuration node
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
            // console.error('Update session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Delete session endpoint
    RED.httpAdmin.delete('/ai-sidebar/sessions/:sessionId', function(req, res) {
        try {
            const { sessionId } = req.params;
            
            // Use global variable to get configuration node
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
            // console.error('Delete session endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Delete all sessions endpoint
    RED.httpAdmin.delete('/ai-sidebar/sessions', function(req, res) {
        try {
            // Use global variable to get configuration node
            let configNode = null;
            if (global.apiConfigNode) {
                configNode = global.apiConfigNode;
            }
            
            if (!configNode) {
                return res.status(400).json({ error: 'No API configuration found' });
            }

            const success = configNode.memoryManager.deleteAllSessions();
            if (success) {
                res.json({ success: true });
            } else {
                res.status(500).json({ error: 'Failed to delete all sessions' });
            }
        } catch (error) {
            // console.error('Delete all sessions endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Search conversations endpoint
    RED.httpAdmin.post('/ai-sidebar/search', function(req, res) {
        try {
            const { query, scenario, limit = 10 } = req.body;
            
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            
            // Use global variable to get configuration node
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
            // console.error('Search endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Flow templates endpoint
    RED.httpAdmin.get('/ai-sidebar/templates', function(req, res) {
        try {
            const { scenario, limit = 20 } = req.query;
            
            // Use global variable to get configuration node
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
            // console.error('Templates endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Save flow template endpoint
    RED.httpAdmin.post('/ai-sidebar/templates', function(req, res) {
        try {
            const { name, description, flowJson, scenario, tags = [] } = req.body;
            
            if (!name || !flowJson) {
                return res.status(400).json({ error: 'Name and flowJson are required' });
            }
            
            // Use global variable to get configuration node
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
            // console.error('Save template endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    });

        // Execute tool endpoint
        RED.httpAdmin.post('/ai-sidebar/execute-tool', async function(req, res) {
            try {
                const { toolName, parameters, nodeId, selectedFlow } = req.body;
                
                if (!toolName) {
                    return res.status(400).json({ error: 'Tool name is required' });
                }

                // Get configuration node
                const configNode = RED.nodes.getNode(nodeId);
                if (!configNode || !configNode.langchainManager) {
                    return res.status(400).json({ error: 'Invalid configuration or LangChain manager not initialized' });
                }

                let toolArgs = parameters || {};
                
                // Special handling for flowJson parameter of create-flow and update-flow tools
                if ((toolName === 'create-flow' || toolName === 'update-flow') && toolArgs.flowJson) {
                    // console.log('API endpoint starts processing flowJson parameter, tool:', toolName);
                    let flowData;
                    
                    // If it's a string, try to parse as JSON
                    if (typeof toolArgs.flowJson === 'string') {
                        try {
                            flowData = JSON.parse(toolArgs.flowJson);
                            // console.log('API endpoint parsed flowJson string to object, type:', Array.isArray(flowData) ? 'array' : 'object');
                        } catch (error) {
                            // console.error('API endpoint failed to parse flowJson:', error);
                            return res.status(400).json({ error: 'Invalid flowJson format: ' + error.message });
                        }
                    } else {
                        flowData = toolArgs.flowJson;
                        // console.log('API endpoint flowJson is already an object, type:', Array.isArray(flowData) ? 'array' : 'object');
                    }
                    
                    // Ensure flowData is in array format (Node-RED flow format)
                    if (Array.isArray(flowData)) {
                        // console.log('API endpoint enters array processing branch, original node count:', flowData.length);
                        
                        if (toolName === 'create-flow') {
                            // create-flow tool expects object format with nodes property, but needs to filter out tab nodes
                            const functionalNodes = flowData.filter(node => node.type !== 'tab');
                            
                            // Generate unique tab ID
                            const tabId = RED.util.generateId();
                            
                            // Generate unique ID for each node and set z property to tab ID
                            const nodesWithUniqueIds = functionalNodes.map(node => {
                                const newNode = { ...node };
                                newNode.id = RED.util.generateId();
                                // Set z property to tab ID for all functional nodes
                                newNode.z = tabId;
                                return newNode;
                            });
                            
                            // Update node IDs in wire connections
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
                            
                            const flowObject = {
                                nodes: nodesWithUniqueIds,
                                label: toolArgs.label || 'New Flow',
                                description: toolArgs.description || '',
                                tabId: tabId
                            };
                            toolArgs.flowJson = JSON.stringify(flowObject);
                            // console.log('API endpoint create-flow processing completed, generated unique IDs and tab ID:', tabId, ', retained functional node count:', nodesWithUniqueIds.length);
                        }
                    }
                }

                // Execute tool
                const result = await configNode.langchainManager.executeTool(toolName, toolArgs);
                
                // Format tool result
                const formattedResult = configNode.formatToolResult(result);
                
                res.json({ success: true, result: formattedResult });
            } catch (error) {
                // console.error('Execute tool endpoint error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Update language settings endpoint
        RED.httpAdmin.post('/ai-sidebar/update-language', function(req, res) {
            try {
                const { language } = req.body;
                
                if (!language) {
                    return res.status(400).json({ error: 'Language parameter is required' });
                }
                
                // Find configuration node
                let configNode = null;
                if (global.apiConfigNode) {
                    configNode = global.apiConfigNode;
                } else {
                    // If not in global variable, try to find the first configuration node
                    const configNodes = RED.nodes.getNodesByType('api-config');
                    if (configNodes.length > 0) {
                        configNode = configNodes[0];
                    }
                }
                
                if (!configNode) {
                    return res.status(404).json({ error: 'No API configuration found' });
                }
                
                // Update language settings
                configNode.updateLanguageFromFrontend(language);
                
                // console.log('🌐 Language updated from frontend:', language);
                res.json({ success: true, language: language });
                
            } catch (error) {
                // console.error('❌ Error updating language:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        
        // Get supported LLM providers and models list endpoint
        RED.httpAdmin.get('/ai-sidebar/llm-providers', function(req, res) {
            try {
                // Define supported LLM providers and models
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
                // console.error('Failed to get LLM providers list:', error);
                res.status(500).json({ error: 'Failed to get LLM providers list' });
            }
        });

    // Mechanism for automatically creating AI assistant nodes
    function ensureAIHelperNode() {
        try {
            // Re-enable auto-rebuild functionality
            const AUTO_REBUILD_ENABLED = true;
            
            // Check if AI assistant node exists
            let hasAIHelper = false;
            
            RED.nodes.eachNode(function(node) {
                if (node.type === 'make-iot-smart') {
                    hasAIHelper = true;
                    return false; // Stop traversal
                }
            });
            
            // If no AI assistant node exists, create one through HTTP API
            if (!hasAIHelper) {
                // console.log(RED._('messages.aiHelperNodeCreating'));
                
                // Find the first API configuration node
                let apiConfigId = null;
                
                RED.nodes.eachNode(function(node) {
                    if (node.type === 'api-config') {
                        apiConfigId = node.id;
                        return false; // Stop traversal
                    }
                });
                
                if (apiConfigId) {
                    // Get current flows
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
                                
                                // Find the first workspace
                                let workspaceId = null;
                                for (const flow of flows) {
                                    if (flow.type === 'tab') {
                                        workspaceId = flow.id;
                                        break;
                                    }
                                }
                                
                                // If no workspace exists, create one
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
                                
                                // Add AI assistant node (set as valid but disabled by default)
                                const newNodeId = RED.util.generateId();
                                flows.push({
                                    id: newNodeId,
                                    type: 'make-iot-smart',
                                    name: 'AI Assistant',
                                    apiConfig: apiConfigId,
                                    algorithm: 'dagre_lr',
                                    settings: {},
                                    valid: true,
                                    d: true,
                                    x: -1000,
                                    y: -1000,
                                    z: workspaceId
                                });
                                // console.log('Auto-created AI assistant node (set as valid but disabled by default):', newNodeId);
                                
                                // Update flows
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
                                        // console.log(RED._('messages.aiHelperNodeCreated') + ':', newNodeId);
                                    } else {
                                        // console.error(RED._('errors.executionFailed') + ', ' + RED._('status.error') + ':', updateRes.statusCode);
                                    }
                                });
                                
                                updateReq.on('error', (err) => {
                                    // console.error(RED._('errors.executionFailed') + ':', err);
                                });
                                
                                updateReq.write(JSON.stringify(flows));
                                updateReq.end();
                                
                            } catch (parseError) {
                                // console.error(RED._('errors.executionFailed') + ':', parseError);
                            }
                        });
                    });
                    
                    req.on('error', (err) => {
                        // console.error(RED._('errors.executionFailed') + ':', err);
                    });
                    
                    req.end();
                } else {
                    // console.log(RED._('messages.apiConfigNotFound'));
                }
            } else {
                // console.log(RED._('messages.aiHelperNodeExists'));
            }
        } catch (error) {
            // console.error(RED._('errors.executionFailed') + ':', error);
        }
    }
    
    // Execute check immediately
    // console.log(RED._('messages.initializingAIHelper'));
    setTimeout(() => {
        // console.log(RED._('messages.aiHelperNodeChecking'));
        ensureAIHelperNode();
    }, 3000);
    
    // Listen for node deletion events, automatically recreate AI assistant node
    RED.events.on('flows:stopped', function() {
        setTimeout(ensureAIHelperNode, 1000);
    });
    
    // Provide language switching test page
    RED.httpAdmin.get('/ai-sidebar/test-language-switch', function(req, res) {
        const testPagePath = path.join(__dirname, 'test-language-switch.html');
        res.sendFile(testPagePath);
    });
    
    // Listen for flow deployment events
    RED.events.on('flows:started', function() {
        setTimeout(ensureAIHelperNode, 2000);
    });

    // Return cleanup function for proper module uninstallation
    return {
        // This function is called when the module is being uninstalled
        remove: function() {
            // Force close database connections to release file locks
            if (global.apiConfigNode && global.apiConfigNode.memoryManager) {
                try {
                    if (typeof global.apiConfigNode.memoryManager.forceClose === 'function') {
                        global.apiConfigNode.memoryManager.forceClose();
                    } else {
                        global.apiConfigNode.memoryManager.close();
                    }
                } catch (error) {
                    // Ignore database close errors during uninstall
                }
            }
            
            // Clean up event listeners
            RED.events.removeAllListeners('flows:stopped');
            RED.events.removeAllListeners('flows:started');
            
            // Clean up HTTP routes
            try {
                // Remove AI sidebar routes
                RED.httpAdmin._router.stack = RED.httpAdmin._router.stack.filter(function(layer) {
                    return !layer.route || !layer.route.path.startsWith('/ai-sidebar');
                });
            } catch (error) {
                // Ignore cleanup errors
            }
            
            // Clean up global variables
            if (global.apiConfigNode) {
                delete global.apiConfigNode;
            }
            if (global.RED) {
                delete global.RED;
            }
        }
    };
}
