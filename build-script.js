const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 读取.npmignore文件
function readNpmIgnore() {
    const npmignorePath = path.join(__dirname, '.npmignore');
    if (!fs.existsSync(npmignorePath)) {
        return [];
    }
    
    const content = fs.readFileSync(npmignorePath, 'utf8');
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            // 处理glob模式
            if (line.endsWith('/')) {
                return line.slice(0, -1); // 移除末尾的/
            }
            return line;
        });
}

// 检查文件是否应该被忽略
function shouldIgnore(filePath, ignorePatterns) {
    const relativePath = path.relative(__dirname, filePath);
    
    // 首先检查是否有明确的包含规则（以!开头）
    const includePatterns = ignorePatterns.filter(p => p.startsWith('!'));
    for (const pattern of includePatterns) {
        const cleanPattern = pattern.substring(1); // 移除!
        if (relativePath === cleanPattern || relativePath.startsWith(cleanPattern + path.sep)) {
            return false; // 明确包含，不忽略
        }
    }
    
    // 然后检查忽略规则
    const excludePatterns = ignorePatterns.filter(p => !p.startsWith('!'));
    for (const pattern of excludePatterns) {
        if (pattern.includes('*')) {
            // 处理通配符模式
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            if (regex.test(relativePath)) {
                return true;
            }
        } else if (relativePath === pattern || relativePath.startsWith(pattern + path.sep)) {
            return true;
        }
    }
    
    return false;
}

// 递归复制文件
function copyFiles(src, dest, ignorePatterns) {
    if (!fs.existsSync(src)) {
        return;
    }
    
    const stat = fs.statSync(src);
    
    if (stat.isDirectory()) {
        // 检查目录是否应该被忽略
        if (shouldIgnore(src, ignorePatterns)) {
            console.log(`忽略目录: ${path.relative(__dirname, src)}`);
            return;
        }
        
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        for (const file of files) {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            copyFiles(srcPath, destPath, ignorePatterns);
        }
    } else {
        // 检查文件是否应该被忽略
        if (shouldIgnore(src, ignorePatterns)) {
            console.log(`忽略文件: ${path.relative(__dirname, src)}`);
            return;
        }
        
        // 确保目标目录存在
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(src, dest);
        console.log(`复制文件: ${path.relative(__dirname, src)} -> ${path.relative(__dirname, dest)}`);
    }
}

// 主构建函数
function build() {
    console.log('开始构建Node-RED节点包...');
    
    const distDir = path.join(__dirname, 'dist');
    
    // 清理dist目录
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
        console.log('清理dist目录');
    }
    
    // 创建dist目录
    fs.mkdirSync(distDir, { recursive: true });
    
    // 读取忽略模式
    const ignorePatterns = readNpmIgnore();
    console.log('忽略模式:', ignorePatterns);
    
    // 添加一些默认忽略项
    ignorePatterns.push('dist', 'node_modules', 'build-script.js');
    
    // 复制所有文件（除了被忽略的）
    const files = fs.readdirSync(__dirname);
    for (const file of files) {
        const srcPath = path.join(__dirname, file);
        const destPath = path.join(distDir, file);
        copyFiles(srcPath, destPath, ignorePatterns);
    }
    
    console.log('\n构建完成！');
    console.log(`输出目录: ${distDir}`);
    console.log('\n可以使用以下命令安装:');
    console.log(`cd ${distDir} && npm pack`);
    console.log('或者直接在Node-RED中安装:');
    console.log(`npm install ${distDir}`);
}

// 运行构建
try {
    build();
} catch (error) {
    console.error('构建失败:', error.message);
    process.exit(1);
}