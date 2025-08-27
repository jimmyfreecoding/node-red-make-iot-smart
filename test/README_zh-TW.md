# LangChain 端到端測試

這是一個全面的 LangChain 端到端測試套件，用於測試多語言環境下的 AI 對話功能。

## 檔案結構

```
test/
├── end-to-end-langchain-test.js    # 主要測試腳本
├── run-e2e-test.js                  # 測試執行器
├── README.md                        # 說明文件
├── test-results/                    # 測試結果目錄
│   ├── langchain-e2e-test-report.html    # Web 測試報告
│   └── langchain-e2e-test-results.json   # JSON 測試資料
└── mock-tools/                      # 模擬工具目錄
    ├── mock-weather-tool.js         # 模擬天氣工具
    ├── mock-calculator-tool.js      # 模擬計算器工具
    └── mock-search-tool.js          # 模擬搜尋工具
```

## 快速開始

### 環境配置

1. 確保已安裝 Node.js (版本 14 或更高)
2. 設定必要的環境變數（詳見下方環境變數說明）
3. 安裝相依套件：
   ```bash
   npm install
   ```

### 執行測試

```bash
# 執行完整測試並生成報告
node run-e2e-test.js

# 僅生成 Web 報告（不執行測試）
node run-e2e-test.js --web-only

# 直接執行測試腳本
node end-to-end-langchain-test.js
```

## 檢視測試報告

測試完成後，可以透過以下方式檢視結果：

1. **Web 報告**：開啟 `test-results/langchain-e2e-test-report.html`
2. **JSON 資料**：檢視 `test-results/langchain-e2e-test-results.json`

## 測試內容

### 測試語言

測試涵蓋以下語言環境：
- 英文 (en-US)
- 簡體中文 (zh-CN)
- 繁體中文 (zh-TW)
- 日文 (ja-JP)
- 韓文 (ko)
- 西班牙文 (es-ES)
- 法文 (fr)
- 德文 (de)
- 葡萄牙文 (pt-BR)
- 俄文 (ru)

### 測試用例

每種語言環境包含以下測試場景：

1. **基本對話測試**
   - 簡單問候和回應
   - 基本資訊查詢

2. **工具呼叫測試**
   - 天氣查詢工具
   - 計算器工具
   - 搜尋工具

3. **複雜對話測試**
   - 多輪對話
   - 上下文理解
   - 語言特定的文化內容

### 記錄的關鍵資訊

每個測試用例記錄以下資訊：
- 測試語言和地區
- 使用者輸入
- 系統提示詞
- LLM 回應
- 回應時間
- 測試狀態（成功/失敗）
- 錯誤資訊（如有）

## 環境變數說明

### 必需配置

```bash
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here

# 或者使用其他 LLM 提供商
# ANTHROPIC_API_KEY=your_anthropic_key_here
# GOOGLE_API_KEY=your_google_key_here
```

### 可選配置

```bash
# 測試配置
TEST_TIMEOUT=30000          # 測試超時時間（毫秒）
TEST_RETRIES=3              # 失敗重試次數
TEST_CONCURRENT=5           # 並發測試數量

# 輸出配置
TEST_OUTPUT_DIR=./test-results    # 測試結果輸出目錄
TEST_VERBOSE=true                 # 詳細輸出模式
```

## 測試報告

### Web 報告

HTML 報告包含：
- 測試概覽和統計資訊
- 按語言分組的詳細結果
- 互動式篩選和搜尋功能
- 回應時間圖表
- 錯誤詳情和堆疊追蹤

### JSON 資料

JSON 檔案包含：
- 完整的測試結果資料
- 詳細的時間戳記
- 結構化的錯誤資訊
- 效能指標

## 技術架構

### 測試流程

1. **初始化階段**
   - 載入環境配置
   - 初始化 LangChain 元件
   - 設定模擬工具

2. **測試執行階段**
   - 按語言順序執行測試
   - 記錄每個測試的詳細資訊
   - 處理錯誤和重試邏輯

3. **報告生成階段**
   - 彙總測試結果
   - 生成 HTML 和 JSON 報告
   - 計算統計資訊

### 模擬元件

測試使用模擬工具來確保一致性和可重複性：

- **模擬天氣工具**：返回預定義的天氣資料
- **模擬計算器**：執行基本數學運算
- **模擬搜尋工具**：返回模擬的搜尋結果

## 故障排除

### 常見問題

1. **API 金鑰錯誤**
   ```
   錯誤：Invalid API key
   解決方案：檢查 OPENAI_API_KEY 環境變數是否正確設定
   ```

2. **網路連線問題**
   ```
   錯誤：Network timeout
   解決方案：檢查網路連線，增加 TEST_TIMEOUT 值
   ```

3. **記憶體不足**
   ```
   錯誤：JavaScript heap out of memory
   解決方案：減少 TEST_CONCURRENT 值或增加 Node.js 記憶體限制
   ```

### 除錯模式

啟用詳細輸出：
```bash
TEST_VERBOSE=true node run-e2e-test.js
```

檢視詳細日誌：
```bash
DEBUG=langchain* node run-e2e-test.js
```

## 擴展開發

### 新增新語言

1. 在 `config/locales/` 目錄中新增語言配置檔案
2. 在測試腳本中新增對應的測試用例
3. 更新語言清單和測試邏輯

### 新增新測試用例

1. 在 `end-to-end-langchain-test.js` 中定義新的測試場景
2. 新增相應的斷言和驗證邏輯
3. 更新報告模板以顯示新的測試結果

### 自訂工具模擬

1. 在 `mock-tools/` 目錄中建立新的模擬工具
2. 實作必要的介面和方法
3. 在主測試腳本中註冊新工具

## 許可證

本專案採用 MIT 許可證。詳見 LICENSE 檔案。

## 貢獻

歡迎提交 Issue 和 Pull Request！請確保：

1. 遵循現有的程式碼風格
2. 新增適當的測試用例
3. 更新相關文件
4. 確保所有測試通過

---

如有問題或建議，請透過 GitHub Issues 聯絡我們。