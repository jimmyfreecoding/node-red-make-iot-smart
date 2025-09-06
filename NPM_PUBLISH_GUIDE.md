# NPM 发布指南

本指南将帮助您将 `node-red-make-iot-smart` 插件发布到 NPM 上。

## 前置条件

### 1. NPM 账户设置
- 确保您有 NPM 账户：https://www.npmjs.com/signup
- 登录到您的 NPM 账户：`npm login`
- 验证登录状态：`npm whoami`

### 2. 权限确认
- 确保您有发布 `@jimmyfreecoding/node-red-make-iot-smart` 包的权限
- 如果是第一次发布，确保包名未被占用

## 发布方式

### 方式一：手动发布（推荐用于测试）

#### 步骤 1：准备发布
```bash
# 1. 确保代码是最新的
git pull origin main

# 2. 安装依赖
npm install

# 3. 运行测试（如果有）
npm test

# 4. 检查包内容
npm pack --dry-run
```

#### 步骤 2：版本管理
```bash
# 更新版本号（选择其中一种）
npm version patch    # 0.0.4 -> 0.0.5 (bug修复)
npm version minor    # 0.0.4 -> 0.1.0 (新功能)
npm version major    # 0.0.4 -> 1.0.0 (重大更改)

# 或者手动指定版本
npm version 0.0.5
```

#### 步骤 3：发布到 NPM
```bash
# 发布到 NPM
npm publish

# 如果是第一次发布scoped包，使用：
npm publish --access public
```

### 方式二：自动发布（推荐用于生产）

项目已配置 GitHub Actions 自动发布，当创建 Release 时会自动发布到 NPM。

#### 步骤 1：设置 NPM Token
1. 在 NPM 网站生成 Access Token：
   - 登录 https://www.npmjs.com/
   - 点击头像 -> Access Tokens
   - 点击 "Generate New Token"
   - 选择 "Automation" 类型
   - 复制生成的 token

2. 在 GitHub 仓库设置 Secret：
   - 进入 GitHub 仓库
   - Settings -> Secrets and variables -> Actions
   - 点击 "New repository secret"
   - Name: `npm_token`
   - Value: 粘贴您的 NPM token

#### 步骤 2：创建 Release
1. 更新版本号（本地）：
   ```bash
   npm version patch  # 或 minor/major
   git push && git push --tags
   ```

2. 在 GitHub 创建 Release：
   - 进入 GitHub 仓库
   - 点击 "Releases" -> "Create a new release"
   - 选择刚才推送的 tag
   - 填写 Release 标题和描述
   - 点击 "Publish release"

3. GitHub Actions 会自动：
   - 运行测试
   - 发布到 NPM
   - 发布到 GitHub Packages

## 发布检查清单

### 发布前检查
- [ ] 代码已提交并推送到主分支
- [ ] 版本号已正确更新
- [ ] README.md 文档是最新的
- [ ] 依赖项版本合适
- [ ] 测试通过
- [ ] .npmignore 文件正确配置

### 发布后验证
- [ ] 在 NPM 网站确认包已发布：https://www.npmjs.com/package/@jimmyfreecoding/node-red-make-iot-smart
- [ ] 版本号正确
- [ ] 包大小合理
- [ ] 文件列表正确

## 测试安装

发布后，您可以在新的 Node-RED 实例中测试安装：

```bash
# 全局安装（在 Node-RED 用户目录）
npm install @jimmyfreecoding/node-red-make-iot-smart

# 或者在 Node-RED 管理界面中搜索 "make-iot-smart" 安装
```

## 常见问题

### 1. 权限错误
```
npm ERR! 403 Forbidden
```
**解决方案：**
- 确保已登录：`npm login`
- 确保有发布权限
- 对于 scoped 包，使用：`npm publish --access public`

### 2. 版本冲突
```
npm ERR! 409 Conflict
```
**解决方案：**
- 更新版本号：`npm version patch`
- 不能发布已存在的版本

### 3. 包太大
```
npm WARN tarball tarball data for ... seems to be corrupted
```
**解决方案：**
- 检查 .npmignore 文件
- 移除不必要的文件
- 使用 `npm pack --dry-run` 检查包内容

## 版本策略

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **PATCH** (0.0.X)：bug 修复，向后兼容
- **MINOR** (0.X.0)：新功能，向后兼容
- **MAJOR** (X.0.0)：重大更改，可能不向后兼容

## 相关链接

- [NPM 包页面](https://www.npmjs.com/package/@jimmyfreecoding/node-red-make-iot-smart)
- [GitHub 仓库](https://github.com/jimmyfreecoding/node-red-make-iot-smart)
- [Node-RED 插件开发指南](https://nodered.org/docs/creating-nodes/)
- [NPM 发布文档](https://docs.npmjs.com/cli/v8/commands/npm-publish)