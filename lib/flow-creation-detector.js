const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * FlowCreationDetector - 智能流程创建意图检测器
 * 负责检测用户输入中的流程创建意图，并提供动态提示词增强
 */
class FlowCreationDetector {
    constructor(langchainManager) {
        this.langchainManager = langchainManager;
        this.queryKeywords = this.loadQueryKeywords();
        this.queryPatterns = this.buildQueryPatterns();
        
        // 流程创建关键词模式
        this.flowCreationKeywords = [
            // 中文关键词
            '创建流程', '生成流程', '创造流程', '新建流程', '制作流程', '设计流程',
            '建立流程', '构建流程', '开发流程', '编写流程', '做一个流程',
            // 英文关键词
            'create flow', 'generate flow', 'new flow', 'build flow', 'make flow',
            'design flow', 'develop flow', 'write flow', 'construct flow'
        ];
        
        // IoT场景关键词
        this.iotScenarioKeywords = [
            // 设备类型
            '温度传感器', '湿度传感器', '光照传感器', '运动传感器', '门磁传感器',
            '智能开关', '智能插座', '智能灯泡', '摄像头', '报警器',
            'temperature sensor', 'humidity sensor', 'light sensor', 'motion sensor',
            'smart switch', 'smart plug', 'smart bulb', 'camera', 'alarm',
            
            // 应用场景
            '智能家居', '环境监控', '安防系统', '自动化控制', '数据采集',
            '远程监控', '报警通知', '定时控制', '联动控制',
            'smart home', 'environmental monitoring', 'security system', 
            'automation control', 'data collection', 'remote monitoring',
            'alarm notification', 'timer control', 'linkage control',
            
            // 协议和平台
            'mqtt', 'http', 'websocket', 'modbus', 'zigbee', 'wifi',
            'homeassistant', 'openhab', 'influxdb', 'grafana'
        ];
        
        // 提示词模板库
        this.promptTemplates = {
            basic: {
                prefix: `你需要创建一个Node-RED流程。请严格按照以下格式回复：

1. 首先生成完整的Node-RED流程JSON代码，每个node和flow的id用uuid：
\`\`\`json
{流程JSON数据}
\`\`\`

2. 然后详细解释流程中每个节点的作用和配置
3. 最后以"点击Apply按钮进行创建"结束描述

**重要要求：**
- 每个node和flow的id用uuid
- 确保节点之间的连接关系正确
- 包含必要的配置参数

用户原始请求：`,
                examples: []
            },
            
            iot_monitoring: {
                prefix: `你需要创建一个IoT环境监控流程。请严格按照以下格式回复：

1. 首先生成完整的Node-RED流程JSON代码，每个node和flow的id用uuid：
\`\`\`json
{流程JSON数据}
\`\`\`

2. 详细解释每个节点的作用和配置
3. 最后以"点击Apply按钮进行创建"结束描述

**IoT监控流程要点：**
- 包含数据采集节点（如MQTT输入、HTTP请求等）
- 添加数据处理和转换逻辑
- 设置数据存储或转发机制
- 考虑异常处理和报警机制

用户原始请求：`,
                examples: [
                    '温度监控示例：使用MQTT接收温度数据，当温度超过阈值时发送报警',
                    '湿度监控示例：定时读取湿度传感器数据，存储到数据库并显示图表'
                ]
            },
            
            smart_home: {
                prefix: `你需要创建一个智能家居控制流程。请严格按照以下格式回复：

1. 首先生成完整的Node-RED流程JSON代码，每个node和flow的id用uuid：
\`\`\`json
{流程JSON数据}
\`\`\`

2. 详细解释每个节点的作用和配置
3. 最后以"点击Apply按钮进行创建"结束描述

**智能家居流程要点：**
- 设备状态监控和控制
- 场景联动和自动化规则
- 用户界面和交互控制
- 定时任务和条件触发

用户原始请求：`,
                examples: [
                    '智能照明示例：根据光照强度自动调节灯光亮度',
                    '安防联动示例：门磁触发时自动开启摄像头录制并发送通知'
                ]
            },
            
            data_integration: {
                prefix: `你需要创建一个数据集成流程。请严格按照以下格式回复：

1. 首先生成完整的Node-RED流程JSON代码，每个node和flow的id用uuid：
\`\`\`json
{流程JSON数据}
\`\`\`

2. 详细解释每个节点的作用和配置
3. 最后以"点击Apply按钮进行创建"结束描述

**数据集成流程要点：**
- 多数据源接入和格式转换
- 数据清洗和验证逻辑
- 目标系统的数据推送
- 错误处理和重试机制

用户原始请求：`,
                examples: [
                    'API集成示例：从第三方API获取数据，转换格式后存储到本地数据库',
                    '设备数据汇聚示例：收集多个传感器数据，统一格式后发送到云平台'
                ]
            }
        };
    }
    
    /**
     * 加载查询关键字
     * @returns {Array} 查询关键字数组
     */
    /**
     * 动态加载所有语言配置文件中的查询关键字
     * @returns {Array} 所有语言的keywords.key数组
     */
    loadQueryKeywords() {
        const allKeywords = new Set();
        
        try {
            const localesDir = path.join(__dirname, '..', 'config', 'locales');
            
            if (!fs.existsSync(localesDir)) {
                console.warn('配置文件目录不存在:', localesDir);
                return this.getDefaultKeywords();
            }
            
            // 获取所有语言目录
            const languageDirs = fs.readdirSync(localesDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            // 遍历每个语言目录
            languageDirs.forEach(langDir => {
                const scenariosFile = path.join(localesDir, langDir, 'scenarios.json');
                
                if (fs.existsSync(scenariosFile)) {
                    try {
                        const content = fs.readFileSync(scenariosFile, 'utf8');
                        const config = JSON.parse(content);
                        
                        // 收集所有场景中的keywords.key
                        Object.keys(config).forEach(scenarioKey => {
                            const scenario = config[scenarioKey];
                            if (scenario && scenario.keywords && Array.isArray(scenario.keywords)) {
                                scenario.keywords.forEach(keywordObj => {
                                    if (keywordObj.key && Array.isArray(keywordObj.key)) {
                                        keywordObj.key.forEach(keyword => {
                                            if (keyword && typeof keyword === 'string') {
                                                allKeywords.add(keyword.toLowerCase().trim());
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } catch (error) {
                        console.warn(`读取 ${langDir} 配置文件失败:`, error.message);
                    }
                }
            });
            
            const keywordsArray = Array.from(allKeywords).filter(keyword => keyword.length > 0);
            console.log(`FlowCreationDetector: 加载了 ${keywordsArray.length} 个查询关键字`);
            
            return keywordsArray.length > 0 ? keywordsArray : this.getDefaultKeywords();
            
        } catch (error) {
            console.warn('加载查询关键字失败，使用默认模式:', error.message);
            return this.getDefaultKeywords();
        }
    }
    
    /**
     * 获取默认查询关键字
     * @returns {Array} 默认关键字数组
     */
    getDefaultKeywords() {
        return [
            'current node', 'current flow', 'current config', 'current settings',
            'show', 'display', 'get', 'view', 'list', 'see', 'check', 'find',
            '当前节点', '当前流程', '当前配置', '当前设置',
            '显示', '查看', '获取', '列出', '检查', '查找'
        ];
    }
    
    /**
     * 构建查询模式
     * @returns {Array} 查询正则表达式数组
     */
    buildQueryPatterns() {
        if (!this.queryKeywords || this.queryKeywords.length === 0) {
            // 回退到基本模式
            return [/\b(show|display|get|view|list|see|check|find|search|look|examine|inspect|analyze|review|current|existing|what|which|where|how|tell|explain|describe)\b/i];
        }
        
        // 过滤掉单独的流程词汇，避免误判创建意图
        const flowTermsToExclude = [
            'flow', 'フロー', '플로우', 'flujo', 'flux', 'поток', 'fluxo', 'flusso',
            '流程', 'workflow', 'stream'
        ];
        
        // 只保留真正的查询关键字，排除单独的流程词汇
        const filteredKeywords = this.queryKeywords.filter(keyword => {
            const lowerKeyword = keyword.toLowerCase();
            // 排除单独的流程词汇
            if (flowTermsToExclude.some(term => lowerKeyword === term.toLowerCase())) {
                return false;
            }
            // 保留包含查询动词或描述性词汇的关键字
            return true;
        });
        
        // 将关键字按长度排序，长的在前面，避免短词匹配覆盖长词
        const sortedKeywords = filteredKeywords.sort((a, b) => b.length - a.length);
        
        // 将关键字分组，每组最多50个，避免正则表达式过长
        const patterns = [];
        const chunkSize = 50;
        
        for (let i = 0; i < sortedKeywords.length; i += chunkSize) {
            const chunk = sortedKeywords.slice(i, i + chunkSize);
            // 转义特殊字符并创建正则表达式
            const escapedKeywords = chunk.map(keyword => 
                keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );
            const pattern = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'i');
            patterns.push(pattern);
        }
        
        return patterns;
    }
    
    /**
     * 检测用户输入是否包含流程创建意图
     * @param {string} userInput - 用户输入文本
     * @returns {Object} 检测结果
     */
    detectFlowCreationIntent(userInput) {
        const input = userInput.toLowerCase().trim();
        
        // 1. 首先进行精准查询关键字匹配检查
        const isQueryKeyword = this.isExactQueryKeywordMatch(input);
        if (isQueryKeyword) {
            // 如果是查询关键字，直接返回不进行流程创建检测
            return {
                isFlowCreation: false,
                confidence: 0,
                isQueryKeyword: true,
                detectedScenarios: [],
                suggestedTemplate: null,
                keywords: [],
                reason: 'Exact query keyword match detected'
            };
        }
        
        // 2. 关键词模糊匹配
        const hasFlowKeywords = this.flowCreationKeywords.some(keyword => 
            input.includes(keyword.toLowerCase())
        );
        
        // 3. IoT场景检测
        const iotScenarios = this.detectIoTScenarios(input);
        
        // 4. 语义相似度检测（简化版）
        const hasCreationIntent = this.detectCreationIntent(input);
        
        // 5. 上下文分析
        const contextScore = this.analyzeContext(input);
        
        // 综合评分
        let confidence = 0;
        if (hasFlowKeywords) confidence += 0.5;  // 提高关键词权重
        if (hasCreationIntent) confidence += 0.4;  // 提高创建意图权重
        if (iotScenarios.length > 0) confidence += 0.2;
        confidence += contextScore * 0.1;
        
        // 如果同时检测到关键词和创建意图，给予额外加分
        if (hasFlowKeywords && hasCreationIntent) {
            confidence += 0.2;
        }
        
        return {
            isFlowCreation: confidence > 0.4,  // 提高阈值
            confidence: Math.min(confidence, 1.0),
            isQueryKeyword: false,
            detectedScenarios: iotScenarios,
            suggestedTemplate: this.selectTemplate(iotScenarios, input),
            keywords: this.extractKeywords(input),
            reason: confidence > 0.4 ? 'Flow creation intent detected' : 'No flow creation intent'
        };
    }
    
    /**
     * 检查输入是否与查询关键字精准匹配
     * @param {string} input - 用户输入（已转为小写）
     * @returns {boolean} 是否为精准查询关键字匹配
     */
    isExactQueryKeywordMatch(input) {
        if (!this.queryKeywords || this.queryKeywords.length === 0) {
            return false;
        }
        
        const trimmedInput = input.trim();
        
        // 精准匹配查询关键字（完全匹配或包含匹配）
        return this.queryKeywords.some(keyword => {
            const lowerKeyword = keyword.toLowerCase().trim();
            
            // 完全匹配
            if (trimmedInput === lowerKeyword) {
                return true;
            }
            
            // 包含匹配（输入包含关键字）
            if (trimmedInput.includes(lowerKeyword)) {
                return true;
            }
            
            // 词边界匹配（避免部分匹配误判）
            const wordBoundaryRegex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
            if (wordBoundaryRegex.test(trimmedInput)) {
                return true;
            }
            
            return false;
        });
    }
    
    /**
     * 检测IoT应用场景
     * @param {string} input - 用户输入
     * @returns {Array} 检测到的场景列表
     */
    detectIoTScenarios(input) {
        const scenarios = [];
        
        // 检测设备类型
        const deviceKeywords = this.iotScenarioKeywords.filter(keyword => 
            input.includes(keyword.toLowerCase()) && 
            (keyword.includes('sensor') || keyword.includes('传感器') || 
             keyword.includes('smart') || keyword.includes('智能'))
        );
        
        if (deviceKeywords.length > 0) {
            scenarios.push('device_control');
        }
        
        // 检测监控场景
        if (input.includes('监控') || input.includes('monitoring') || 
            input.includes('采集') || input.includes('collection')) {
            scenarios.push('monitoring');
        }
        
        // 检测自动化场景
        if (input.includes('自动') || input.includes('auto') || 
            input.includes('联动') || input.includes('linkage')) {
            scenarios.push('automation');
        }
        
        // 检测数据处理场景
        if (input.includes('数据') || input.includes('data') || 
            input.includes('api') || input.includes('集成')) {
            scenarios.push('data_integration');
        }
        
        return scenarios;
    }
    
    /**
     * 检测创建意图的语义模式
     * @param {string} input - 用户输入
     * @returns {boolean} 是否包含创建意图
     */
    detectCreationIntent(input) {
        // 首先检查是否为查询类请求（应该排除）
        // 使用从配置文件加载的查询关键字
        const inputLower = input.toLowerCase();
        
        // 检查是否匹配任何查询模式
        const isQueryRequest = this.queryPatterns.some(pattern => pattern.test(inputLower));
        
        // 如果匹配查询模式，直接返回false
        if (isQueryRequest) {
            return false;
        }
        
        const creationPatterns = [
            // 中文创建意图模式（更精确）
            /我想(创建|生成|制作|设计|开发|构建).*流程/,
            /我要(创建|生成|制作|设计|开发|构建).*流程/,
            /帮我(创建|生成|制作|设计|开发|构建).*流程/,
            /如何(创建|生成|制作|设计|开发|构建).*流程/,
            /怎么(创建|生成|制作|设计|开发|构建).*流程/,
            /能否(创建|生成|制作|设计|开发|构建).*流程/,
            /请(创建|生成|制作|设计|开发|构建).*流程/,
            /(创建|生成|制作|设计|开发|构建).*流程/,
            
            // 英文创建意图模式
            /i want.*(create|generate|build|make|design|develop).*flow/,
            /i need.*(create|generate|build|make|design|develop).*flow/,
            /help me.*(create|generate|build|make|design|develop).*flow/,
            /how to.*(create|generate|build|make|design|develop).*flow/,
            /can you.*(create|generate|build|make|design|develop).*flow/,
            /please.*(create|generate|build|make|design|develop).*flow/,
            /(create|generate|build|make|design|develop).*flow/,
            
            // 多语言创建模式（更精确的匹配）
            // 日语
            /フローを(作成|生成|構築)/,
            /(作成|生成|構築).*フロー/,
            
            // 韩语 - 更精确的模式
            /플로우를\s*(생성|작성|구축)/,
            /(생성|작성|구축).*플로우/,
            
            // 西班牙语
            /(crear|generar|construir)\s+flujo/,
            /flujo\s+(crear|generar|construir)/,
            
            // 法语
            /(créer|générer|construire)\s+flux/,
            /flux\s+(créer|générer|construire)/,
            
            // 德语
            /flow\s+(erstellen|generieren|bauen)/,
            /(erstellen|generieren|bauen)\s+flow/,
            
            // 俄语
            /(создать|генерировать|построить)\s+поток/,
            /поток\s+(создать|генерировать|построить)/,
            
            // 葡萄牙语
            /(criar|gerar|construir)\s+fluxo/,
            /fluxo\s+(criar|gerar|construir)/,
            
            // 意大利语
            /(creare|generare|costruire)\s+flusso/,
            /flusso\s+(creare|generare|costruire)/
        ];
        
        return creationPatterns.some(pattern => pattern.test(input.toLowerCase()));
    }
    
    /**
     * 分析上下文相关性
     * @param {string} input - 用户输入
     * @returns {number} 上下文评分 (0-1)
     */
    analyzeContext(input) {
        let score = 0;
        
        // 检测Node-RED相关术语
        const nodeRedTerms = ['节点', 'node', '连接', 'wire', '部署', 'deploy'];
        nodeRedTerms.forEach(term => {
            if (input.includes(term)) score += 0.1;
        });
        
        // 检测技术协议
        const protocols = ['mqtt', 'http', 'websocket', 'tcp', 'udp'];
        protocols.forEach(protocol => {
            if (input.includes(protocol)) score += 0.1;
        });
        
        return Math.min(score, 1.0);
    }
    
    /**
     * 选择合适的提示词模板
     * @param {Array} scenarios - 检测到的场景
     * @param {string} input - 用户输入
     * @returns {string} 模板名称
     */
    selectTemplate(scenarios, input) {
        if (scenarios.includes('monitoring')) {
            return 'iot_monitoring';
        }
        if (scenarios.includes('device_control') || scenarios.includes('automation')) {
            return 'smart_home';
        }
        if (scenarios.includes('data_integration')) {
            return 'data_integration';
        }
        return 'basic';
    }
    
    /**
     * 提取关键词
     * @param {string} input - 用户输入
     * @returns {Array} 关键词列表
     */
    extractKeywords(input) {
        const keywords = [];
        
        this.iotScenarioKeywords.forEach(keyword => {
            if (input.toLowerCase().includes(keyword.toLowerCase())) {
                keywords.push(keyword);
            }
        });
        
        return keywords;
    }
    
    /**
     * 生成增强的提示词
     * @param {string} originalPrompt - 原始用户输入
     * @param {Object} detectionResult - 检测结果
     * @returns {string} 增强后的提示词
     */
    enhancePrompt(originalPrompt, detectionResult) {
        const template = this.promptTemplates[detectionResult.suggestedTemplate] || this.promptTemplates.basic;
        
        let enhancedPrompt = template.prefix;
        
        // 添加场景相关的示例
        if (template.examples && template.examples.length > 0) {
            enhancedPrompt += '\n\n**参考示例：**\n';
            template.examples.forEach((example, index) => {
                enhancedPrompt += `${index + 1}. ${example}\n`;
            });
        }
        
        // 添加检测到的关键词提示
        if (detectionResult.keywords.length > 0) {
            enhancedPrompt += `\n\n**检测到的关键技术：** ${detectionResult.keywords.join(', ')}`;
        }
        
        enhancedPrompt += `\n\n${originalPrompt}`;
        
        return enhancedPrompt;
    }
    
    /**
     * 用户意图确认
     * @param {Object} detectionResult - 检测结果
     * @returns {string} 确认消息
     */
    generateConfirmationMessage(detectionResult) {
        if (detectionResult.confidence < 0.5) {
            return null; // 置信度太低，不需要确认
        }
        
        const scenarios = detectionResult.detectedScenarios;
        let message = '我检测到您想要创建一个Node-RED流程';
        
        if (scenarios.length > 0) {
            const scenarioNames = {
                'monitoring': '环境监控',
                'device_control': '设备控制',
                'automation': '自动化',
                'data_integration': '数据集成'
            };
            
            const detectedNames = scenarios.map(s => scenarioNames[s] || s).join('、');
            message += `，主要涉及${detectedNames}场景`;
        }
        
        message += '。是否需要我为您生成相应的流程代码？';
        
        return message;
    }
    
    /**
     * 参数收集引导
     * @param {string} userInput - 用户输入
     * @param {Object} detectionResult - 检测结果
     * @returns {Object} 参数收集结果
     */
    collectParameters(userInput, detectionResult) {
        const missingParams = [];
        const suggestions = [];
        
        // 检查是否缺少关键参数
        if (detectionResult.detectedScenarios.includes('monitoring')) {
            if (!this.hasDataSource(userInput)) {
                missingParams.push('数据源');
                suggestions.push('请指定数据来源（如MQTT主题、HTTP接口、传感器类型等）');
            }
            if (!this.hasDataTarget(userInput)) {
                missingParams.push('数据目标');
                suggestions.push('请指定数据处理方式（如存储到数据库、发送通知、显示图表等）');
            }
        }
        
        if (detectionResult.detectedScenarios.includes('device_control')) {
            if (!this.hasDeviceInfo(userInput)) {
                missingParams.push('设备信息');
                suggestions.push('请指定要控制的设备类型和通信方式');
            }
        }
        
        return {
            isComplete: missingParams.length === 0,
            missingParams,
            suggestions
        };
    }
    
    /**
     * 检查是否包含数据源信息
     */
    hasDataSource(input) {
        const dataSourceKeywords = ['mqtt', 'http', 'api', '传感器', 'sensor', '接口', 'endpoint'];
        return dataSourceKeywords.some(keyword => input.toLowerCase().includes(keyword));
    }
    
    /**
     * 检查是否包含数据目标信息
     */
    hasDataTarget(input) {
        const dataTargetKeywords = ['数据库', 'database', '通知', 'notification', '图表', 'chart', '存储', 'storage'];
        return dataTargetKeywords.some(keyword => input.toLowerCase().includes(keyword));
    }
    
    /**
     * 检查是否包含设备信息
     */
    hasDeviceInfo(input) {
        const deviceKeywords = ['开关', 'switch', '灯', 'light', '插座', 'plug', '传感器', 'sensor'];
        return deviceKeywords.some(keyword => input.toLowerCase().includes(keyword));
    }

    /**
     * 回退机制 - 当意图检测失败时的处理
     * @param {string} originalPrompt - 原始用户输入
     * @param {Object} detectionResult - 检测结果
     * @returns {Object} 回退处理结果
     */
    handleFallback(originalPrompt, detectionResult) {
        // 如果置信度过低，回退到普通对话模式
        if (detectionResult.confidence < 0.3) {
            return {
                shouldFallback: true,
                fallbackReason: 'low_confidence',
                processedPrompt: originalPrompt, // 保持原始提示不变
                suggestions: this.generateFallbackSuggestions(originalPrompt)
            };
        }

        // 如果检测到可能的意图但信息不足
        if (detectionResult.confidence >= 0.3 && detectionResult.confidence < 0.6) {
            return {
                shouldFallback: false,
                needsMoreInfo: true,
                processedPrompt: this.enhancePrompt(originalPrompt, detectionResult),
                guidanceMessage: this.generateGuidanceMessage(detectionResult)
            };
        }

        // 高置信度，正常处理
        return {
            shouldFallback: false,
            needsMoreInfo: false,
            processedPrompt: this.enhancePrompt(originalPrompt, detectionResult)
        };
    }

    /**
     * 生成回退建议
     * @param {string} originalPrompt - 原始输入
     * @returns {Array} 建议列表
     */
    generateFallbackSuggestions(originalPrompt) {
        const suggestions = [];
        
        // 如果包含一些IoT相关词汇，提供相关建议
        if (this.detectIoTScenarios(originalPrompt.toLowerCase()).length > 0) {
            suggestions.push('如果您想创建IoT流程，请明确说明"创建流程"或"生成流程"');
            suggestions.push('您可以描述具体的设备类型和应用场景');
        }
        
        // 通用建议
        suggestions.push('如需创建Node-RED流程，请使用"创建流程"等明确表达');
        
        return suggestions;
    }

    /**
     * 生成引导消息
     * @param {Object} detectionResult - 检测结果
     * @returns {string} 引导消息
     */
    generateGuidanceMessage(detectionResult) {
        let message = '我检测到您可能想要创建流程，';
        
        if (detectionResult.detectedScenarios.length > 0) {
            message += `涉及${detectionResult.detectedScenarios.join('、')}场景。`;
        }
        
        message += '为了更好地帮助您，请提供更多详细信息：\n';
        message += '- 具体的设备类型和数量\n';
        message += '- 期望的功能和逻辑\n';
        message += '- 数据的输入和输出要求';
        
        return message;
    }

    /**
     * 错误恢复机制
     * @param {Error} error - 发生的错误
     * @param {string} originalPrompt - 原始输入
     * @returns {Object} 恢复结果
     */
    handleError(error, originalPrompt) {
        console.error('[FlowCreationDetector] Error occurred:', error);
        
        return {
            shouldFallback: true,
            fallbackReason: 'detection_error',
            processedPrompt: originalPrompt,
            errorMessage: '意图检测过程中出现错误，已回退到普通对话模式',
            suggestions: ['请重新描述您的需求', '确保网络连接正常']
        };
    }
}

module.exports = FlowCreationDetector;