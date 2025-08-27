#!/usr/bin/env node

/**
 * LangChain End-to-End Test Startup Script
 * Provides environment checking, dependency installation, test execution and other functions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check environment configuration
function checkEnvironment() {
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, '.env.example');
    
    if (!fs.existsSync(envPath)) {
        console.log('🔧 .env file not found, creating...');
        
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            console.log('✅ .env file created from .env.example');
            console.log('⚠️  Please edit .env file and set necessary environment variables (especially OPENAI_API_KEY)');
            console.log('');
        } else {
            console.error('❌ .env.example file not found');
            process.exit(1);
        }
    }
    
    // Load environment variables
    require('dotenv').config({ path: envPath });
    
    // Check key environment variables
    const requiredVars = ['TEST_FLOW_ID', 'TEST_NODE_ID'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.warn(`⚠️  Warning: The following environment variables are not set: ${missingVars.join(', ')}`);
        console.warn('   Default values will be used, but it is recommended to set them in .env file');
    }
    
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  Warning: OPENAI_API_KEY not set, will use simulated LLM responses');
        console.warn('   To test real LLM calls, please set OPENAI_API_KEY in .env file');
    }
}

// Check dependencies
function checkDependencies() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.error('❌ package.json file not found');
        process.exit(1);
    }
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const requiredDeps = ['express', 'dotenv'];
        const missingDeps = [];
        
        for (const dep of requiredDeps) {
            if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
                missingDeps.push(dep);
            }
        }
        
        if (missingDeps.length > 0) {
            console.log(`📦 Installing missing dependencies: ${missingDeps.join(', ')}`);
            try {
                execSync(`npm install ${missingDeps.join(' ')}`, { 
                    stdio: 'inherit',
                    cwd: path.join(__dirname, '..')
                });
                console.log('✅ Dependencies installation completed');
            } catch (error) {
                console.error('❌ Dependencies installation failed:', error.message);
                process.exit(1);
            }
        }
    } catch (error) {
        console.error('❌ Error checking dependencies:', error.message);
        process.exit(1);
    }
}

// Show help information
function showHelp() {
    console.log(`
🚀 LangChain End-to-End Test Tool

Usage:
  node run-e2e-test.js [options]

Options:
  --help, -h          Show this help information
  --check, -c         Only check environment configuration, do not run tests
  --web-only, -w      Only start web server (requires existing test results)
  --real-llm, -r      Enable real LLM calls (requires valid API key)
  --port <port>       Specify web server port (default: 3001)
  --verbose, -v       Verbose output mode

Examples:
  node run-e2e-test.js                    # Run complete test
  node run-e2e-test.js --check            # Only check environment
  node run-e2e-test.js --real-llm         # Use real LLM API
  node run-e2e-test.js --port 8080        # Specify port

Environment Configuration:
  Please ensure necessary environment variables are set in .env file.
  Refer to .env.example file for required configuration.
`);
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        help: false,
        checkOnly: false,
        webOnly: false,
        realLLM: false,
        port: null,
        verbose: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--help':
            case '-h':
                options.help = true;
                break;
            case '--check':
            case '-c':
                options.checkOnly = true;
                break;
            case '--web-only':
            case '-w':
                options.webOnly = true;
                break;
            case '--real-llm':
            case '-r':
                options.realLLM = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--port':
                if (i + 1 < args.length) {
                    options.port = parseInt(args[++i]);
                    if (isNaN(options.port)) {
                        console.error('❌ Port number must be a number');
                        process.exit(1);
                    }
                } else {
                    console.error('❌ --port 选项需要指定端口号');
                    process.exit(1);
                }
                break;
            default:
                console.error(`❌ 未知选项: ${arg}`);
                console.log('使用 --help 查看可用选项');
                process.exit(1);
        }
    }
    
    return options;
}

// 主函数
async function main() {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        return;
    }
    
    console.log('🔍 Checking environment configuration...');
    checkEnvironment();
    
    console.log('📦 Checking dependencies...');
    checkDependencies();
    
    if (options.checkOnly) {
        console.log('✅ Environment check completed!');
        return;
    }
    
    // 设置环境变量
    if (options.realLLM) {
        process.env.ENABLE_REAL_LLM_CALLS = 'true';
        console.log('🤖 Real LLM calls enabled');
    }
    
    if (options.port) {
        process.env.TEST_WEB_PORT = options.port.toString();
    }
    
    if (options.verbose) {
        process.env.DEBUG_MODE = 'true';
        process.env.LOG_LEVEL = 'debug';
    }
    
    // 导入并运行测试
    try {
        const testModule = require('./end-to-end-langchain-test');
        
        if (options.webOnly) {
            console.log('🌐 Starting web server only...');
            
            // 检查是否有测试结果
            const resultsPath = path.join(__dirname, 'test-results', 'langchain-e2e-test-results.json');
            if (!fs.existsSync(resultsPath)) {
                console.error('❌ Test results file not found, please run complete test first');
                process.exit(1);
            }
            
            testModule.startWebServer();
        } else {
            console.log('🚀 Starting end-to-end test...');
            await testModule.runAllTests();
        }
        
    } catch (error) {
        console.error('❌ Test run failed:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise rejection:', reason);
    process.exit(1);
});

// Run main function
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Startup failed:', error.message);
        process.exit(1);
    });
}

module.exports = { main, parseArgs, checkEnvironment, checkDependencies };