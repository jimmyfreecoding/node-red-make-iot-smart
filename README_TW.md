# Node-RED Make IoT Smart

## 🌐 語言

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md) [![中文](https://img.shields.io/badge/lang-中文-red.svg)](README_ZH.md) [![Deutsch](https://img.shields.io/badge/lang-Deutsch-green.svg)](README_DE.md) [![Español](https://img.shields.io/badge/lang-Español-orange.svg)](README_ES.md) [![Français](https://img.shields.io/badge/lang-Français-purple.svg)](README_FR.md) [![日本語](https://img.shields.io/badge/lang-日本語-yellow.svg)](README_JA.md) [![한국어](https://img.shields.io/badge/lang-한국어-pink.svg)](README_KO.md) [![Português](https://img.shields.io/badge/lang-Português-cyan.svg)](README_PT.md) [![Русский](https://img.shields.io/badge/lang-Русский-brown.svg)](README_RU.md) [![繁體中文](https://img.shields.io/badge/lang-繁體中文-lightblue.svg)](README_TW.md)


---

專為 Node-RED 開發的 AI 助手擴展，讓 IoT 開發更智能、更高效。
[![npm version](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart.svg)](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)
## 概述

Node-RED Make IoT Smart 是專為 Node-RED 開發設計的綜合性 AI 代理。它通過智能代碼輔助、自動流程優化和智能調試功能來增強 IoT 開發體驗。該擴展目前支持 6 個主要場景：學習、解決方案、集成、開發、配置和管理。

## 功能特性

### 🤖 AI 助手

- **智能代碼建議**：為 Node-RED 流程提供上下文相關的代碼推薦。
- **智能流程分析**：分析流程並提供優化建議。
- **自然語言界面**：通過自然語言命令與 Node-RED 環境互動。
- **多語言支持**：支持中文、英文、日文、韓文等多種語言。自動適應 Node-RED 語言設置變更。
- **多提供商支持**：基於 LangChain.js 框架，支持 OpenAI、Anthropic、Google、DeepSeek 等 AI 模型。
- **智能記憶管理**：基於 SQLite 的短期和長期記憶系統，支持對話歷史、用戶偏好和流程模板存儲。
- **場景化提示詞**：通過 JSON 配置的場景化提示詞管理，支持動態參數注入。
- **MCP 工具集成**：支持 Model Context Protocol (MCP) 工具調用，擴展 AI 助手功能。


### 🔧 開發工具

- **實時代碼分析**：持續分析 Node-RED 流程。
- **配置管理**：為不同 AI 提供商提供集中式 API 配置。
- **互動側邊欄**：專用的 AI 助手面板，集成到 Node-RED 編輯器中。
- **JSON 編輯器**：內建配置文件編輯器，具有語法高亮功能。
- **MCP 工具集成**：支持 Model Context Protocol (MCP) 工具調用，擴展 AI 助手功能。
- **LangChain 工具管理**：統一的工具管理框架，支持內建工具和 MCP 工具。
- **場景化支持**：為 7 個主要場景提供定制化支持：
  - **學習**：解釋節點和概念，提供流程示例。
  - **解決方案**：提供各種 IoT 解決方案，包括流程 JSON 和節點安裝指南。
  - **集成**：支持協議（如 MQTT、Modbus）和軟件集成。
  - **開發**：優化現有流程和功能節點代碼。
  - **配置**：指導 Node-RED 配置變更（如 `settings.js`）。
  - **管理**：支持遠程訪問、Git 集成和批量部署。

### 🚀 未來功能

- **遠程調試**：使用 AI 進行 Node-RED 流程的遠程調試。
- **團隊管理**：具有團隊管理功能的協作開發。
- **高級分析**：深入了解 IoT 系統性能。
- **智能部署**：AI 驅動的 IoT 應用部署策略。

## 安裝

### 通過 npm 安裝

```bash
npm install @jhe.zheng/node-red-make-iot-smart
```

### 通過 Node-RED Palette Manager 安裝

1. 打開 Node-RED 編輯器。
2. 前往 **選單 → 管理調色板**。
3. 搜索 `@jhe.zheng/node-red-make-iot-smart`。
4. 點擊 **安裝**。
5. 安裝後重啟 Node-RED。
6. 安裝後，您將在 Node-RED 側邊欄中看到新的 **AI 助手** 標籤。
7. 點擊 **設置** 按鈕配置您的 AI 提供商。
8. 從支持的提供商中選擇：
   - **DeepSeek**：具有強大編碼能力的經濟實惠選擇。
   - **OpenAI**：業界領先的 GPT 模型。
   - **Anthropic**：通過 Claude 模型提供高級推理能力。
9. 輸入您的 API 密鑰並選擇合適的模型。
10. 配置後，您可以使用 AI 助手。請注意，NodeRED 在保存設置後會自動創建配置節點。NodeRED 會顯示流程中的變更，您只需點擊合併即可。
11. 開始與您的 AI 助手互動！

## 快速開始
### 輸入「分析當前節點」
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/current-node.gif" width="800" height="450" alt="演示動畫" />


### 輸入「創建示例流程」
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/create-flow.gif" width="800" height="450" alt="演示動畫" />

### 輸入「健康檢查」
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/health-check.gif" width="800" height="450" alt="演示動畫" />

## 配置

### LangSmith 調試配置（可選）

您可以配置 LangSmith 支持，以便更好地調試和監控 LangChain 執行：

1. 將 `.env.example` 文件複製為 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env` 文件以填入您的 LangSmith 配置：
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_api_key_here
   LANGCHAIN_PROJECT=your_project_name
   ```

3. 重啟 Node-RED 以應用配置。

4. 訪問 [LangSmith](https://smith.langchain.com/) 查看詳細的執行追蹤和調試信息。

**注意**：LangSmith 配置是可選的，不會影響核心功能。

## 使用方法

### 基本聊天界面

- 打開側邊欄中的 **AI 助手** 標籤。
- 用自然語言輸入您的問題或指令。
- 獲得智能回應，包含代碼建議和解釋。

### 場景選擇

- 通過側邊欄下拉選單選擇場景（學習、解決方案、集成、開發、配置、管理）。
- AI 會根據選定的場景調整回應，提供相關工具和流程 JSON。

### JSON/代碼處理

- 大型 JSON 或代碼輸出隱藏在 **顯示 JSON/代碼** 按鈕後面，保持 UI 整潔。
- 在內建編輯器中編輯流程 JSON，具有語法高亮功能，並直接應用變更。

### 支持的場景

#### 場景概覽

| 場景 | 中文名稱 | 描述 | 支持的工具 |
|----------|----------|------|------------|
| learning | 學習模式 | Node-RED 學習助手，提供教育指導和知識解答 | get-flows, get-nodes, create-flow, update-flow |
| solution | 解決方案模式 | IoT 解決方案專家，提供技術解決方案和架構諮詢 | create-flow, update-flow, get-flows, create-subflow |
| integration | 集成模式 | 系統集成專家，處理設備連接和數據集成 | create-flow, update-flow, install-node, get-node-info |
| development | 開發模式 | 代碼開發助手，支持 Node-RED 流程創建和優化 | create-flow, update-flow, create-subflow, get-node-info, install-node, get-flow |
| configuration | 配置模式 | 系統配置專家，管理 Node-RED 環境和節點配置 | get_settings, update_settings, install_node, get_node_info, get_diagnostics |
| management | 管理模式 | 項目管理助手，支持流程組織和項目規劃 | get-flows, create-flow, update-flow, create-subflow |
| general | 通用模式 | 通用 AI 助手，處理各種 Node-RED 相關問題 | 無特定工具限制 |

#### 預定義提示詞示例

| 場景 | 預定義提示詞 |
|----------|----------------------|
| **學習模式** | • 我是 Node-RED 新手，請介紹 Node-RED 的基本概念和主要功能<br>• 請解釋 Node-RED 中的流程、節點和連接<br>• 如何在 Node-RED 中創建我的第一個簡單流程？請提供詳細步驟<br>• Node-RED 中常用的基本節點有哪些？它們各自的功能是什麼？ |
| **解決方案模式** | • 我需要設計一個智能家居控制系統，請提供完整的 IoT 解決方案架構<br>• 如何使用 Node-RED 構建工業 4.0 數據收集和監控系統？<br>• 請設計一個農業 IoT 解決方案，包括傳感器數據收集和自動控制<br>• 我想構建一個智慧城市環境監測網絡，需要什麼技術解決方案？ |
| **集成模式** | • 如何在 Node-RED 中集成 MQTT 設備和 HTTP API？請提供詳細的集成解決方案<br>• 我需要將 Modbus 設備的傳感器數據傳輸到雲端數據庫，如何實現？<br>• 請幫助設計一個數據轉換流程，將 JSON 轉換為 XML 並發送到第三方系統<br>• 如何在 Node-RED 中實現多個不同協議設備的統一數據收集和處理？ |
| **開發模式** | • 詳細解釋和註釋當前流程<br>• 詳細解釋和註釋當前節點<br>• 請幫助編寫功能節點代碼，實現數據過濾和格式轉換<br>• 如何在 Node-RED 中創建自定義節點？請提供完整的開發流程 |
| **配置模式** | • 當前 NodeRED 配置是什麼？<br>• 當前 NodeRED 診斷是什麼？<br>• 如何配置 Node-RED 的安全設置，包括用戶認證和 HTTPS？<br>• 請幫助優化 Node-RED 的性能配置，提高系統運行效率<br>• 如何在 Node-RED 中安裝和管理第三方節點包？<br>• 我需要配置 Node-RED 的日誌記錄和監控，應該如何設置？ |
| **管理模式** | • 請幫助制定 IoT 項目的開發計劃和里程碑<br>• 如何在 Node-RED 中組織和管理大型項目的流程結構？<br>• 我需要評估當前項目的風險和質量，請提供分析建議<br>• 如何在團隊中建立 Node-RED 協作開發標準和最佳實踐？ |
| **通用模式** | • Node-RED 是什麼？它的主要特點和應用場景有哪些？<br>• 我遇到了 Node-RED 問題，請幫助分析和解決<br>• 請推薦一些 Node-RED 學習資源和最佳實踐<br>• 如何選擇合適的 Node-RED 場景模式來解決特定需求？ |

#### 智能關鍵詞觸發

| 場景 | 關鍵詞 | 觸發行為 |
|----------|----------|----------|
| **開發模式** | 創建流程、生成流程、製作流程、新建流程 | 自動切換到開發模式，生成完整的 Node-RED 流程 JSON 代碼並提供詳細解釋 |
| **配置模式** | 當前配置、系統配置、配置信息、配置、當前設置 | 自動調用 get_settings 工具獲取配置信息並以表格形式顯示 |
| **配置模式** | 當前診斷、系統診斷、診斷信息、健康檢查 | 自動調用 get_diagnostics 工具進行系統診斷 |

#### 動態輸入參數

所有場景都支持以下動態參數注入：
- `nodeRedVersion` - Node-RED 版本信息
- `nodeVersion` - Node.js 版本信息
- `currentTime` - 當前時間戳
- `selectedFlow` - 當前選中的流程
- `selectedNodes` - 當前選中的節點
- `lang` - 當前語言設置
- `mcpTools` - 可用的 MCP 工具列表

每個場景還支持特定的動態參數：
- **學習模式**：`userLevel`（用戶技能水平）
- **解決方案模式**：`projectRequirements`（項目需求）
- **集成模式**：`integrationTargets`（集成目標）
- **開發模式**：`developmentTask`（開發任務）
- **配置模式**：`configurationNeeds`（配置需求）
- **管理模式**：`projectStatus`（項目狀態）

#### 系統提示詞特性

每個場景都配置了專業的系統提示詞，確保 AI 助手：
1. **角色定位**：在特定場景中具有清晰的專業角色
2. **輸出格式**：根據場景需求提供結構化的回應格式
3. **工具集成**：智能調用相應的 MCP 工具和 Node-RED API
4. **上下文感知**：利用動態參數提供個性化建議


| 場景 | 描述                                                                 |
| --------- | -------------------------------------------------------------------- |
| 學習 | 解釋節點/概念並提供學習用的流程示例。                                |
| 解決方案 | 提供各種 IoT 解決方案，包含流程 JSON 和節點安裝指南。               |
| 集成 | 支持協議/軟件集成，生成相應的流程。                                 |
| 開發 | 優化現有流程和功能節點代碼。                                         |
| 配置 | 指導 Node-RED 配置變更（例如 `settings.js`）。                      |
| 管理 | 支持遠程訪問、Git 集成和批量部署。                                  |

## 支持的 AI 提供商


| 提供商 | 模型                                    | 特性                     |
| --------- | --------------------------------------- | ------------------------ |
| OpenAI    | GPT-3.5, GPT-4, GPT-4o                 | 通用性強，兼容性廣       |
| Anthropic | Claude-3, Claude-3.5                    | 高級推理，注重安全       |
| Google    | Gemini Pro, Gemini Flash                | 多模態，高性能           |
| DeepSeek  | deepseek-chat, deepseek-coder           | 經濟實惠，專注編碼       |
| 其他      | 所有 LangChain.js 支持的 LLM 提供商     | 高擴展性，靈活配置       |

## API 配置

- API 密鑰本地存儲並加密。
- 支持多提供商配置。
- 輕鬆在不同提供商和模型之間切換。
- 規劃和執行階段的獨立模型配置。

## 開發

### 項目結構

```
├── ai-sidebar.html          # 主側邊欄界面
├── ai-sidebar-config.json   # UI 配置
├── make-iot-smart.html      # 節點配置模板
├── make-iot-smart.js        # 節點後端實現
├── lib/
│   ├── langchain-manager.js # 主要 LangChain 管理器
│   ├── memory-manager.js    # SQLite 記憶管理
│   └── scenario-manager.js  # 場景化提示詞管理
├── config/
│   └── scenarios.json       # 場景配置文件
├── data/
│   └── memory.db           # SQLite 數據庫文件
└── package.json            # 包配置
```

### 技術架構

本項目基於 **LangChain.js** 框架，採用模塊化架構設計：

- **LangChain Manager**：核心 AI 模型管理，支持多個 LLM 提供商
- **Memory Manager**：智能 SQLite 記憶系統，支持短期和長期記憶
- **Scenario Manager**：場景化提示詞管理，支持 JSON 配置和動態參數
- **Tool Manager**：統一工具管理框架，集成 MCP 工具和內建工具
- **API Layer**：RESTful API 接口，支持流式聊天和工具執行

### 貢獻項目

1. Fork 倉庫。
2. 創建功能分支。
3. 進行變更並提交。
4. 提交 Pull Request。

## 路線圖

### 第一階段（已完成）

- ✅ AI 助手集成
- ✅ 多提供商支持
- ✅ 互動側邊欄
- ✅ 配置管理
- ✅ 場景化支持
- ✅ LangChain.js 架構遷移
- ✅ SQLite 記憶管理系統
- ✅ MCP 工具集成
- ✅ 統一工具管理框架

### 第二階段（計劃中）

- 🔄 遠程調試功能
- 🔄 團隊協作功能
- 🔄 高級流程分析
- 🔄 智能部署工具

### 第三階段（未來）

- 📋 團隊管理系統
- 📋 企業級功能
- 📋 高級安全選項
- 📋 自定義模型訓練

## 系統需求

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## 許可證

根據 MIT 許可證授權。詳見 [LICENSE](LICENSE) 文件。

## 支持
AI 開發更像是一門藝術而非技術，掌握 LLM 並非易事，需要對 AI 模型、數據和應用場景有深入理解。每次問答會話可能產生不同結果，早期版本往往不盡人意，但通過提示詞工程的改進，將逐步滿足 Node-RED 用戶的日常需求，無論是 IT 還是 OT 工程師。我們歡迎更多有興趣的人加入項目。
- **問題回報**：[GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **文檔**：[Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **討論**：[GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## 作者

**Zheng He**
- Email: jhe.zheng@gmail.com
- GitHub: [@jimmyfreecoding](https://github.com/jimmyfreecoding)
- Website: [https://www.makeiotsmart.com](https://www.makeiotsmart.com)
---

*讓 AI 驅動的支持使您的 IoT 開發更智能！*

---