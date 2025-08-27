# LangChain アーキテクチャドキュメント

## 概要

本プロジェクトは、LangChain.jsフレームワークをベースとしたインテリジェントなNode-RED AIアシスタントシステムを構築し、多言語、多シナリオ、多ツールのインテリジェント会話機能をサポートするモジュラーアーキテクチャ設計を採用しています。システムは、フロントエンドのキーワード検出、バックエンドのツール呼び出し、ストリーミング応答処理を通じて、プロフェッショナルなNode-RED開発サポートを提供します。

## 全体アーキテクチャ図

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   フロントエンド │    │   バックエンド   │    │   外部サービス  │
│       UI        │    │   処理           │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ ユーザー入力│ │    │ │ HTTPルート   │ │    │ │ LLM         │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ プロバイダー│ │
│        │        │    │        │         │    │ │ (OpenAI等)  │ │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ └─────────────┘ │
│ │ キーワード  │ │    │ │ LangChain    │ │    │ ┌─────────────┐ │
│ │ 検出        │ │    │ │ Manager      │ │    │ │ MCPツール   │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │ サーバー    │ │
│        │        │    │        │         │    │ └─────────────┘ │
│ ┌─────────────┐ │    │        │         │    │                 │
│ │ メッセージ  │ │────┼────────┼─────────┼────┤                 │
│ │ 構築        │ │    │        │         │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
│        │        │    │ ┌──────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ ツール       │ │    │                 │
│ │ ストリーミング│ │    │ │ マネージャー │ │    │                 │
│ │ 応答処理    │ │    │ └──────────────┘ │    │                 │
│ └─────────────┘ │    │        │         │    │                 │
└─────────────────┘    │ ┌──────────────┐ │    │                 │
                       │ │ メモリ       │ │    │                 │
                       │ │ マネージャー │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## エンドツーエンドプロセス概要

### プロセスフロー図

```
ユーザーテキスト入力
     │
     ▼
フロントエンドキーワード検出 ──────┐
     │                           │
     ▼                           ▼
隠しヒューマンプロンプト構築    シナリオ設定取得
     │                           │
     ▼                           │
HTTPリクエスト送信 ◄──────────────┘
     │
     ▼
LangChainマネージャー
     │
     ▼
ツールトリガー検出 ──────┐
     │                   │
     ▼                   ▼
実行モード選択        ツールタイプ判定
     │                   │
     ├───────────────────┼─── 内蔵ツール
     │                   │
     │                   └─── MCPツール
     ▼
ツール実行・結果マージ
     │
     ▼
新しいヒューマンプロンプト構築
     │
     ▼
LLM呼び出し（指定言語）
     │
     ▼
ストリーミング応答返却
```

## コアコンポーネント詳細

### 1. フロントエンドキーワード検出システム

#### 設定ソース
フロントエンドは以下のAPIを通じてキーワード設定を取得します：
```javascript
// 現在の言語のシナリオ設定を取得
const configUrl = `/ai-sidebar/scenarios?lang=${encodeURIComponent(currentLang)}`;
```

#### 検出ロジック
`ai-sidebar.html`の`detectKeywords`関数に配置：

```javascript
async function detectKeywords(message) {
    // 1. 現在の言語設定を取得
    const currentLang = getCurrentLanguage();
    const response = await fetch(`/ai-sidebar/scenarios?lang=${currentLang}`);
    const data = await response.json();
    
    // 2. すべてのシナリオキーワード設定を反復
    const scenarios = data.scenarios || data;
    const lowerMessage = message.toLowerCase();
    
    for (const [scenarioKey, scenarioConfig] of Object.entries(scenarios)) {
        if (scenarioConfig.keywords) {
            for (const keywordConfig of scenarioConfig.keywords) {
                for (const keyword of keywordConfig.key) {
                    if (lowerMessage.includes(keyword.toLowerCase())) {
                        return {
                            scenario: keywordConfig.scenario,
                            newHumanPrompt: keywordConfig.newHumanPrompt,
                            matchedKeyword: keyword
                        };
                    }
                }
            }
        }
    }
    return null;
}
```

#### 特殊キーワード処理
システムは特定のキーワードに対して特別な処理を行います：

1. **"current flow" / "現在のフロー"**：
   - 自動的に`development`シナリオに切り替え
   - `get-flow`ツール呼び出しプロンプトを構築
   - 現在選択されているフローIDを渡す

2. **"current node" / "現在のノード"**：
   - 自動的に`development`シナリオに切り替え
   - `get-node-info`ツール呼び出しプロンプトを構築
   - 選択されたノードの詳細情報を渡す

### 2. LangChainマネージャー（`lib/langchain-manager.js`）

#### 主要責任
- LLMプロバイダー管理（OpenAI、DeepSeek、Anthropic、Google）
- ツール呼び出し調整
- シナリオ管理
- ストリーミング応答処理
- メモリ管理統合

#### 主要メソッド

```javascript
class LangChainManager {
    constructor() {
        this.memoryManager = null;
        this.mcpClient = null;
        this.llmInstances = new Map();
        this.tools = new Map();
        this.scenarios = {};
        this.agents = new Map();
        this.language = 'zh-CN';
    }
    
    // ツールトリガー検出
    detectToolTrigger(message)
    
    // 強制ツールモード判定
    shouldForceToolMode(message, scenario, dynamicData)
    
    // 純粋LLMストリーミングチャット
    executePureLLMChatStream(message, options, onChunk)
    
    // シナリオベースストリーミングチャット
    executeScenarioChatStream(message, options, onChunk)
}
```

#### ツールトリガー検出メカニズム

1. **直接ツール呼び出し形式**：
   ```
   @tools:toolName|['param1','param2',...]
   @tools:toolName
   ```

2. **キーワードトリガー**：
   - `shouldForceToolMode`メソッドによる検出
   - 多言語設定キーワードマッピングに基づく
   - パラメータ抽出とツール推論をサポート

### 3. ツール管理システム

#### ツール分類

**内蔵ツール**：
- `search_memory`: メモリ検索
- `get_user_preferences`: ユーザー設定取得
- `get_flow_templates`: フローテンプレート取得
- `get-flow`: Node-REDフローデータ取得（`global.RED`への直接アクセス）
- `get-node-info`: Node-REDノード情報取得（`global.RED`への直接アクセス）

**MCPツール**：
- `get-settings`: Node-RED設定取得
- `get-diagnostics`: 診断情報取得
- MCPプロトコルを通じて提供されるその他のツール

#### ツール選択ロジック

```javascript
// 特殊ツール直接実行
if (toolName === 'get-node-info') {
    // Node-RED APIの直接使用
    const nodeInfo = this.getNodeInfoDirect(nodeIds);
    result = JSON.stringify(nodeInfo, null, 2);
} else if (toolName === 'get-flow') {
    // MCPパラメータ構築
    mcpArgs = { id: flowId || dynamicData?.flowId };
} else {
    // その他のツールは提供されたパラメータを使用
    mcpArgs = toolTrigger.args;
}
```

### 4. メモリ管理システム（`lib/memory-manager.js`）

#### データベース構造

```sql
-- 短期メモリ（セッション履歴）
CREATE TABLE short_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 長期メモリ（ユーザー設定、ナレッジベース）
CREATE TABLE long_term_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### メモリ取得メカニズム
- セッションIDベースのコンテキスト取得
- セマンティック類似性検索
- 自動期限切れクリーンアップ

### 5. 多言語サポートシステム

#### 設定構造
シナリオ設定ファイルは`locales/{lang}/scenarios.json`に配置：

```json
{
  "scenarios": {
    "development": {
      "name": "開発",
      "description": "Node-REDフロー開発とデバッグ",
      "systemPrompt": "あなたはプロフェッショナルなNode-RED開発アシスタントです...",
      "keywords": [
        {
          "key": ["current config", "現在の設定"],
          "scenario": "development",
          "newHumanPrompt": "get-settingsツールを使用して現在のNode-RED設定情報を取得し、設定状況を分析してください。\n\nユーザーの元のリクエスト: "
        }
      ]
    }
  }
}
```

#### 言語指定メカニズム
ツール実行後、システムは以下の方法でLLM応答言語を指定します：

```javascript
const explanationPrompt = `以下の情報に基づいてユーザーの質問に答えてください：

ユーザーリクエスト: ${userMessage}

ツール実行結果:
${result}

上記のNode-REDフローデータについて、${this.getLanguageMapping(this.language)}で専門的な分析と説明を提供してください...`;
```

言語マッピングテーブル：
```javascript
getLanguageMapping(lang) {
    const mapping = {
        'zh-CN': '中国語',
        'en-US': '英語',
        'ja': '日本語',
        'ko': '韓国語',
        'es-ES': 'スペイン語',
        'pt-BR': 'ポルトガル語',
        'fr': 'フランス語'
    };
    return mapping[lang] || '英語';
}
```

## ユーザーチャットフロー詳細

### 完全なエンドツーエンドプロセス

#### 1. フロントエンドメッセージ送信フェーズ

**ユーザー入力処理**：
- ユーザーがAIサイドバーでメッセージを入力
- システムが現在選択されているフローとノード情報を取得
- 設定ノードの状態とデプロイ状態をチェック

**キーワード検出とメッセージ前処理**：
```javascript
// 特殊キーワード処理
if (sendMessage.includes('current flow') || sendMessage.includes('現在のフロー')) {
    // 自動的に開発シナリオに切り替え
    currentScenario = 'development';
    
    // get-flowツール呼び出しプロンプトを構築
    const promptTemplate = "get-flowツールを使用してフロー引数:{\"id\":\"{flowId}\"}のフローデータを取得し、このフローの機能、ノード接続、動作原理を分析・説明してください。\n\nユーザーの元のリクエスト: {originalMessage}";
    sendMessage = promptTemplate.replace('{flowId}', selectedFlow.id).replace('{originalMessage}', sendMessage);
}

// 一般的なキーワード検出
const keywordDetected = await detectKeywords(sendMessage);
if (keywordDetected) {
    currentScenario = keywordDetected.scenario;
    sendMessage = keywordDetected.newHumanPrompt + sendMessage;
}
```

#### 2. HTTPリクエスト構築

```javascript
const requestBody = {
    message: sendMessage,
    scenario: currentScenario,
    sessionId: sessionId,
    nodeId: nodeId,
    selectedFlow: selectedFlow,
    selectedNodes: selectedNodes,
    flowData: flowData,
    history: history,
    silent: silent,
    dynamicData: dynamicData,
    language: getCurrentLanguage()
};
```

#### 3. バックエンドルート処理

**リクエスト受信**（`make-iot-smart.js`）：
```javascript
RED.httpAdmin.post('/ai-sidebar/stream-chat', async (req, res) => {
    const { message, scenario, sessionId, nodeId, selectedFlow, selectedNodes, flowData, history, silent, dynamicData, language } = req.body;
    
    // SSE応答ヘッダーを設定
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
});
```

**設定ノード取得**：
```javascript
const configNode = RED.nodes.getNode(nodeId);
if (!configNode) {
    return res.status(400).json({ error: '設定ノードが見つかりません' });
}
```

**言語とデータ準備**：
```javascript
if (language) {
    langchainManager.setLanguage(language);
}

const options = {
    scenario: scenario || 'general',
    sessionId: sessionId || 'default',
    config: configNode.config || {},
    selectedFlow,
    selectedNodes,
    flowData,
    history: history || [],
    dynamicData: dynamicData || {}
};
```

#### 4. LangChainマネージャー処理フェーズ

**シナリオ検出**：
```javascript
if (scenario && this.scenarios[scenario]) {
    return await this.executeScenarioChatStream(message, options, onChunk);
} else {
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**ツール呼び出し判定**：

1. **直接ツールトリガー検出**：
```javascript
const toolTrigger = this.detectToolTrigger(message);
if (toolTrigger) {
    // 直接ツール実行
    return await this.executeToolDirectly(toolTrigger, options, onChunk);
}
```

2. **キーワード強制ツールモード**：
```javascript
const shouldForceTools = await this.shouldForceToolMode(message, scenario, dynamicData);
if (shouldForceTools.shouldForce) {
    // ツール呼び出しモードに入る
    return await this.executeToolMode(shouldForceTools, message, options, onChunk);
}
```

#### 5. 実行モード選択

**純粋LLMモード**：
- セッションコンテキストを取得
- シナリオプロンプトを構築
- 直接LLM呼び出しで応答生成

**ツール呼び出しモード**：
- ツールタイプを決定（内蔵 vs MCP）
- ツール呼び出しを実行
- ツール結果をマージ
- 説明プロンプトを構築
- LLMを呼び出して自然言語説明

#### 6. ツール呼び出し実行フェーズ

**利用可能なツールタイプ**：

1. **内蔵ツール**：
   - `get-flow`: `global.RED.nodes.getFlows()`への直接アクセス
   - `get-node-info`: `global.RED.nodes`への直接アクセス
   - `search_memory`: メモリ検索
   - `get_user_preferences`: ユーザー設定

2. **MCPツール**：
   - `get-settings`: Node-RED設定
   - `get-diagnostics`: 診断情報
   - その他の拡張ツール

**ツール実行フロー**：
```javascript
if (toolTrigger.directExecution) {
    let result;
    
    if (toolName === 'get-node-info') {
        // 内蔵ツール：直接実行
        const nodeIds = this.extractNodeIds(message) || dynamicData?.selectedNodes?.map(n => n.id) || [];
        const nodeInfo = this.getNodeInfoDirect(nodeIds);
        result = JSON.stringify(nodeInfo, null, 2);
    } else {
        // MCPツール：MCPクライアント経由で実行
        result = await this.mcpClient.callTool(toolName, mcpArgs);
    }
    
    // ツール結果を送信
    onChunk({ type: 'tool_result', tool: toolName, result });
    
    // 説明プロンプトを構築
    const explanationPrompt = `以下の情報に基づいてユーザーの質問に答えてください：\n\nユーザーリクエスト: ${userMessage}\n\nツール実行結果:\n${result}\n\n上記のNode-REDフローデータについて、${this.getLanguageMapping(this.language)}で専門的な分析と説明を提供してください...`;
    
    // LLMを呼び出して説明
    return await this.executePureLLMChatStream(explanationPrompt, options, onChunk);
}
```

**特殊ツール処理**：

1. **get-flowツール**：
```javascript
if (toolName === 'get-flow') {
    mcpArgs = {
        id: toolTrigger.args?.id || dynamicData?.flowId
    };
}
```

2. **get-settingsとget-diagnosticsツール**：
```javascript
if (['get-settings', 'get-diagnostics'].includes(toolName)) {
    mcpArgs = {}; // パラメータ不要
}
```

#### 7. ストリーミング応答処理フェーズ

**イベントタイプ**：
- `token`: テキストコンテンツフラグメント
- `tool_call`: ツール呼び出し情報
- `tool_result`: ツール実行結果
- `error`: エラー情報
- `done`: 応答完了

**データフロー**：
```javascript
// バックエンド送信
onChunk({ type: 'token', content: '部分応答コンテンツ' });
onChunk({ type: 'tool_call', tool: 'get-flow', params: { id: 'flow-id' } });
onChunk({ type: 'tool_result', tool: 'get-flow', result: '{...}' });
onChunk({ type: 'done' });

// フロントエンド受信
eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'token':
            appendToCurrentMessage(data.content);
            break;
        case 'tool_call':
            showToolCall(data.tool, data.params);
            break;
        case 'tool_result':
            showToolResult(data.tool, data.result);
            break;
        case 'done':
            finalizeMessage();
            break;
    }
};
```

**フロントエンドストリーミング処理**：
```javascript
function appendToCurrentMessage(content) {
    if (currentMessageElement) {
        currentMessageElement.innerHTML += content;
        // 下部にスクロール
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
```

#### 8. メモリ管理

**会話保存**：
```javascript
// ユーザーメッセージを保存
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'human',
    originalMessage,
    { scenario, selectedFlow, selectedNodes }
);

// AI応答を保存
await this.memoryManager.saveToShortTermMemory(
    sessionId,
    'ai',
    fullResponse,
    { tools_used: toolsUsed, language: this.language }
);
```

**セッションコンテキスト管理**：
```javascript
const conversationHistory = await this.memoryManager.getConversationHistory(sessionId, 10);
const messages = conversationHistory.map(entry => ({
    role: entry.message_type === 'human' ? 'user' : 'assistant',
    content: entry.content
}));
```

**メモリ取得**：
```javascript
const searchResults = await this.memoryManager.searchMemory(query, {
    category: 'flow_templates',
    limit: 5
});
```

#### 9. エラー処理と耐障害性

**API認証エラー**：
```javascript
try {
    const response = await llm.invoke(messages);
} catch (error) {
    if (error.message.includes('API key')) {
        onChunk({ type: 'error', message: '無効なAPIキーです。設定を確認してください' });
    }
}
```

**ネットワークエラー**：
```javascript
try {
    const result = await this.mcpClient.callTool(toolName, args);
} catch (error) {
    onChunk({ type: 'error', message: `ツール呼び出しに失敗しました: ${error.message}` });
    // 純粋LLMモードにフォールバック
    return await this.executePureLLMChatStream(message, options, onChunk);
}
```

**ツール呼び出しエラー**：
```javascript
if (!result || result.error) {
    onChunk({ 
        type: 'error', 
        message: `ツール ${toolName} の実行に失敗しました: ${result?.error || '不明なエラー'}` 
    });
    return;
}
```

#### 10. パフォーマンス最適化

**キャッシュメカニズム**：
```javascript
// LLMインスタンスキャッシュ
getLLM(provider, model, config) {
    const cacheKey = `${provider}-${model}-${JSON.stringify(config)}`;
    if (this.llmInstances.has(cacheKey)) {
        return this.llmInstances.get(cacheKey);
    }
    // 新しいインスタンスを作成してキャッシュ
}
```

**ストリーミング処理**：
```javascript
// ストリーミングAPIを使用してレイテンシを削減
const stream = await llm.stream(messages);
for await (const chunk of stream) {
    onChunk({ type: 'token', content: chunk.content });
}
```

**非同期処理**：
```javascript
// 複数のツール呼び出しの並列処理
const toolPromises = tools.map(tool => this.executeTool(tool));
const results = await Promise.allSettled(toolPromises);
```

#### 11. 多言語サポート

**シナリオ設定**：
- 各言語が独立した`scenarios.json`設定ファイルを持つ
- 言語固有のキーワードとプロンプトをサポート
- 自動言語検出と切り替え

**インターフェースローカライゼーション**：
```javascript
// ローカライズされたテキストを取得
function _(key) {
    const lang = getCurrentLanguage();
    return RED._(key, { lang });
}
```

#### 12. セキュリティ考慮事項

**入力検証**：
```javascript
// メッセージ長制限
if (message.length > 10000) {
    return res.status(400).json({ error: 'メッセージが長すぎます' });
}

// 機密情報フィルタリング
const sanitizedMessage = message.replace(/api[_-]?key|password|token/gi, '[編集済み]');
```

**APIキー保護**：
```javascript
// 設定ノードでの暗号化キー保存
const encryptedKey = RED.util.encryptCredentials(apiKey);

// ランタイム復号化
const apiKey = RED.util.decryptCredentials(configNode.credentials).apiKey;
```

**アクセス制御**：
```javascript
// ユーザー権限チェック
if (!RED.auth.needsPermission('flows.write')) {
    return res.status(403).json({ error: '権限が不足しています' });
}
```

### まとめ

全体のエンドツーエンドプロセスは、ユーザー入力からAI応答までの完全なパイプラインを実装し、フロントエンドのキーワード検出、バックエンドのツール呼び出し、ストリーミング応答処理を通じて、インテリジェントなNode-RED開発サポートを提供します。システムの特徴：

1. **インテリジェンス**: 自動ユーザー意図検出、適切なツールとシナリオ選択
2. **多言語**: 複数言語でのキーワード検出と応答生成をサポート
3. **拡張性**: モジュラー設計、新しいツールとシナリオの追加が容易
4. **高性能**: ストリーミング処理、キャッシュメカニズム、非同期実行
5. **セキュリティ**: 入力検証、キー保護、権限制御
6. **ユーザーフレンドリー**: リアルタイム応答、エラー処理、コンテキスト認識

## APIインターフェースドキュメント

### RESTful APIエンドポイント

```
POST /ai-sidebar/stream-chat       # ストリーミングチャット
GET  /ai-sidebar/scenarios         # シナリオ設定取得
POST /ai-sidebar/execute-tool      # ツール実行
GET  /ai-sidebar/memory-stats      # メモリ統計
GET  /ai-sidebar/history/:sessionId # セッション履歴
POST /ai-sidebar/search            # メモリ検索
GET  /ai-sidebar/templates         # フローテンプレート
```

### リクエスト/レスポンス形式

**ストリーミングチャットリクエスト**：
```json
{
  "message": "ユーザーメッセージ",
  "scenario": "development",
  "sessionId": "session-uuid",
  "nodeId": "config-node-id",
  "selectedFlow": {
    "id": "flow-id",
    "label": "フロー名"
  },
  "selectedNodes": [
    {
      "id": "node-id",
      "type": "inject",
      "name": "ノード名"
    }
  ],
  "dynamicData": {
    "flowId": "flow-id"
  },
  "language": "ja"
}
```

**ストリーミングレスポンス形式**：
```
data: {"type": "token", "content": "部分"}
data: {"type": "token", "content": "応答"}
data: {"type": "tool_call", "tool": "get-flow", "params": {"id": "flow-id"}}
data: {"type": "tool_result", "tool": "get-flow", "result": "{...}"}
data: {"type": "done"}
```

## 設定管理

### 環境変数

```bash
# AIプロバイダー設定
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key

# データベース設定
MEMORY_DB_PATH=./data/memory.db
MEMORY_RETENTION_DAYS=30

# MCP設定
MCP_TOOLS_ENABLED=true
MCP_SERVER_PATH=./mcp-server
```

### Node-RED設定ノード

```javascript
{
  "provider": "openai",
  "model": "gpt-4",
  "apiKey": "encrypted_key",
  "temperature": 0.7,
  "maxTokens": 4000,
  "enableMemory": true,
  "enableTools": true,
  "scenarios": ["learning", "solution", "development"]
}
```

## 拡張開発

### 新しいLLMプロバイダーの追加

```javascript
// langchain-manager.jsに追加
case 'custom':
    const { CustomLLM } = await import('@custom/langchain');
    llm = new CustomLLM({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature
    });
    break;
```

### 新しい内蔵ツールの追加

```javascript
// initializeToolsメソッドに追加
const customTool = new DynamicTool({
    name: "custom_tool",
    description: "カスタムツールの説明",
    func: async (input) => {
        // ツール実装ロジック
        return result;
    }
});

this.tools.set('custom_tool', customTool);
```

### 新しいシナリオ設定の追加

`locales/{lang}/scenarios.json`に追加：

```json
{
  "scenarios": {
    "custom_scenario": {
      "name": "カスタムシナリオ",
      "description": "シナリオの説明",
      "systemPrompt": "あなたはプロフェッショナルな...",
      "tools": ["tool1", "tool2"],
      "keywords": [
        {
          "key": ["keyword1", "keyword2"],
          "scenario": "custom_scenario",
          "newHumanPrompt": "ツールを使用してください...\n\nユーザーの元のリクエスト: "
        }
      ]
    }
  }
}
```

## トラブルシューティング

### よくある問題

1. **ツール呼び出し失敗**
   - MCPサーバーの状態を確認
   - ツールパラメータ形式を検証
   - エラーログを確認

2. **キーワード検出が機能しない**
   - シナリオ設定ファイルの存在を確認
   - キーワードの大文字小文字の区別をチェック
   - 言語設定を確認

3. **ストリーミング応答の中断**
   - ネットワーク接続を確認
   - APIキーを検証
   - ブラウザコンソールエラーを確認

### デバッグモード

```bash
# 詳細ログを有効化
DEBUG=langchain:*,mcp:* node-red

# ツール呼び出しログを有効化
TOOL_DEBUG=true node-red
```

## パフォーマンス最適化推奨事項

1. **キャッシュ戦略**
   - LLMインスタンスキャッシュ
   - シナリオ設定キャッシュ
   - ツール結果キャッシュ

2. **並行制御**
   - 同時会話数の制限
   - ツール呼び出しキュー管理
   - リソース使用量監視

3. **メモリ管理**
   - 期限切れセッションの定期クリーンアップ
   - 履歴レコード長の制限
   - メモリ使用量監視

---

*このドキュメントは実際のコード実装に基づいて作成され、プロジェクトの更新とともに継続的にメンテナンスされています*