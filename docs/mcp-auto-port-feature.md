# MCP客户端端口自动检测功能

## 功能概述

MCP（Model Context Protocol）客户端现在支持自动检测Node-RED当前运行的端口，无需手动配置端口号。

## 功能特性

### 🔄 自动端口检测
- 系统会自动获取Node-RED当前运行的端口
- 使用 `RED.settings.uiPort` 来获取当前端口
- 如果无法检测到端口，默认使用1880端口

### ⚙️ 配置灵活性
- 支持手动指定端口（通过mcpEnv配置）
- 向后兼容现有配置
- 环境变量优先级：手动配置 > 自动检测 > 默认值

## 技术实现

### 修改的文件

1. **make-iot-smart.js** - 主要实现文件
   ```javascript
   // 自动获取Node-RED当前运行的端口
   const currentPort = RED.settings.uiPort || 1880;
   node.mcpEnv = config.mcpEnv || `NODE_RED_URL=http://localhost:${currentPort}`;
   ```

2. **.env.example** - 环境变量示例文件
   - 添加了自动端口检测的说明
   - 将NODE_RED_URL设置为可选配置

### 工作原理

1. **端口检测**：系统启动时自动读取 `RED.settings.uiPort`
2. **环境变量生成**：动态生成 `NODE_RED_URL=http://localhost:{port}`
3. **MCP连接**：使用生成的环境变量连接MCP服务器

## 使用方法

### 自动模式（推荐）
无需任何配置，系统会自动检测端口：
```javascript
// 配置节点会自动使用当前Node-RED端口
// 例如：Node-RED运行在1881端口，MCP会自动使用http://localhost:1881
```

### 手动配置模式
如果需要指定特定端口，可以在配置中设置：
```javascript
{
  "mcpEnv": "NODE_RED_URL=http://localhost:3000"
}
```

### 环境变量模式
也可以通过.env文件配置：
```bash
# .env文件
NODE_RED_URL=http://localhost:1880
```

## 测试验证

### 运行测试
```bash
# 基本功能测试
node test/test-auto-port.js

# MCP客户端测试
node test/test-mcp-auto-port.js
```

### 测试覆盖
- ✅ 端口自动检测
- ✅ 多端口场景测试
- ✅ 默认端口回退
- ✅ 环境变量解析
- ✅ MCP客户端集成

## 兼容性

### 向后兼容
- 现有的手动配置继续有效
- 不会影响已有的MCP连接
- 平滑升级，无需修改现有配置

### 支持的端口范围
- 标准端口：1880（Node-RED默认）
- 常用端口：1881, 3000, 8080等
- 自定义端口：任何有效的端口号

## 优势

1. **简化配置**：无需手动设置端口
2. **动态适应**：自动适应不同的运行环境
3. **减少错误**：避免端口配置错误
4. **提升体验**：开箱即用的体验

## 故障排除

### 常见问题

**Q: MCP连接失败怎么办？**
A: 检查以下几点：
- Node-RED是否正常运行
- 端口是否被正确检测（查看日志）
- MCP服务器是否可用

**Q: 如何验证端口检测是否正确？**
A: 运行测试脚本：
```bash
node test/test-mcp-auto-port.js
```

**Q: 如何强制使用特定端口？**
A: 在配置中设置mcpEnv参数：
```javascript
{
  "mcpEnv": "NODE_RED_URL=http://localhost:YOUR_PORT"
}
```

## 更新日志

### v1.0.0
- ✨ 新增MCP客户端端口自动检测功能
- 🔧 更新配置逻辑支持动态端口
- 📝 添加测试用例和文档
- 🔄 保持向后兼容性

---

*此功能让MCP客户端能够自动适应Node-RED的运行环境，提供更好的用户体验。*