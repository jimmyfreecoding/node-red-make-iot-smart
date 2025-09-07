# Node-RED Make IoT Smart

## 🌐 語言 | Languages

[English](README.md) | [中文](README_ZH.md) | [Deutsch](README_DE.md) | [Español](README_ES.md) | [Français](README_FR.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Português](README_PT.md) | [Русский](README_RU.md) | [繁體中文](README_TW.md)

---

一個專為Node-RED設計的強大AI助手，讓IoT開發更智慧、更高效。基於**LangChain.js**框架構建，採用模組化架構設計，支援多種LLM提供商、智慧記憶體管理和全面的工具整合。

[![npm version](https://badge.fury.io/js/node-red-make-iot-smart.svg)](https://badge.fury.io/js/node-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)

## 概述

Node-RED Make IoT Smart是專為Node-RED開發者設計的智慧助手。它整合了先進的AI功能，幫助您：

- **更快學習Node-RED** - 透過互動式教學和智慧指導
- **更高效開發流程** - 使用AI輔助的程式碼生成和最佳化
- **解決複雜的IoT挑戰** - 提供專家解決方案建議
- **無縫整合各種系統** - 智慧協定處理
- **更好地管理專案** - 自動化規劃和最佳實務

## 功能特色

### AI助手
- 🤖 **多LLM支援**：相容於OpenAI、Anthropic、Google、Ollama等
- 💬 **互動式聊天介面**：直覺的側邊欄，提供流暢的AI互動
- 🧠 **智慧記憶體**：基於SQLite的記憶體系統，支援上下文感知對話
- 🔧 **工具整合**：全面的MCP（Model Context Protocol）工具支援
- 🎯 **情境式協助**：針對不同開發需求的專業模式

### 開發工具
- 📝 **流程生成**：AI輔助的Node-RED流程建立和最佳化
- 🔍 **程式碼分析**：智慧流程除錯和效能最佳化
- 🔗 **系統整合**：裝置和API整合的專家指導
- 📚 **學習支援**：互動式教學和最佳實務建議
- ⚙️ **設定管理**：自動化系統設定和最佳化

### 即將推出的功能
- 🌐 **遠端除錯**：分散式系統的進階除錯功能
- 👥 **團隊協作**：多使用者支援與共享工作區
- 📊 **進階分析**：深度流程分析和效能洞察
- 🚀 **智慧部署**：智慧部署工具和環境管理

## 安裝

### 方法1：透過Node-RED Palette Manager安裝

1. 在瀏覽器中開啟Node-RED
2. 前往選單 → 管理調色盤
3. 點選「安裝」標籤
4. 搜尋`node-red-make-iot-smart`
5. 點選「安裝」

### 方法2：透過npm安裝

```bash
npm install node-red-make-iot-smart
```

### 方法3：從原始碼安裝

```bash
git clone https://github.com/jimmyfreecoding/node-red-make-iot-smart.git
cd node-red-make-iot-smart
npm install
npm link
cd ~/.node-red
npm link node-red-make-iot-smart
```

## 設定

### 基本設定

1. **新增節點**：從調色盤將「Make IoT Smart」節點拖曳到您的流程中
2. **設定AI提供商**：雙擊節點開啟設定
3. **設定API金鑰**：輸入您的LLM提供商API金鑰
4. **選擇模型**：選擇適合您需求的模型
5. **部署**：點選部署按鈕以啟用

## 授權

MIT授權 - 詳情請參閱[LICENSE](LICENSE)檔案。

## 貢獻

歡迎貢獻！請閱讀我們的[貢獻指南](CONTRIBUTING.md)以了解詳情。

## 支援

- 📖 [文件](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- 🐛 [回報問題](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- 💬 [討論](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

---

**為Node-RED社群用❤️開發**