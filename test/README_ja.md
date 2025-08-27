# LangChain エンドツーエンドテスト

このディレクトリには、フロントエンドのユーザー入力からLLMレスポンスまでの完全なプロセスを検証するための、完全なLangChainアーキテクチャエンドツーエンドテストスクリプトが含まれています。

## 📁 ファイル構造

```
test/
├── end-to-end-langchain-test.js    # メインテストスクリプト
├── run-e2e-test.js                 # テスト起動スクリプト
├── .env.example                    # 環境設定例
├── .env                           # 実際の環境設定（作成が必要）
├── test-results/                  # テスト結果ディレクトリ
│   ├── langchain-e2e-test-results.json
│   └── langchain-e2e-test-report.html
└── README.md                      # このドキュメント
```

## 🚀 クイックスタート

### 1. 環境設定

初回実行前に、環境変数を設定する必要があります：

```bash
# 環境設定例をコピー
cp .env.example .env

# .envファイルを編集し、必要な設定を行う
# 特にOPENAI_API_KEY（実際のLLM呼び出しをテストする場合）
```

### 2. テスト実行

```bash
# 完全なエンドツーエンドテストを実行
node run-e2e-test.js

# 環境設定のみをチェック
node run-e2e-test.js --check

# 実際のLLM呼び出しを有効化（有効なAPIキーが必要）
node run-e2e-test.js --real-llm

# Webサーバーポートを指定
node run-e2e-test.js --port 8080

# 詳細出力モード
node run-e2e-test.js --verbose
```

### 3. テストレポートの表示

テスト完了後、テストレポートを表示するWebサーバーが自動的に起動します：

- デフォルトアクセスURL: http://localhost:3001
- APIエンドポイント: http://localhost:3001/api/test-results

## 📊 テスト内容

### テスト言語

テストは以下の7つの言語をカバーします：
- 中国語 (zh-CN)
- 英語 (en-US) 
- 日本語 (ja)
- 韓国語 (ko)
- スペイン語 (es-ES)
- ポルトガル語 (pt-BR)
- フランス語 (fr)

### テストケース

各言語には5つのテストケースが含まれます：

1. **get-flowツールトリガー** - "現在のフロー"キーワードのテスト
2. **get-node-infoツールトリガー** - "現在のノード"キーワードのテスト
3. **get-settingsツールトリガー** - "現在の設定"キーワードのテスト
4. **get-diagnosticsツールトリガー** - "現在の診断"キーワードのテスト
5. **自然言語会話** - "Node-REDを紹介"のテスト（ツールトリガーなし）

### 記録される重要な情報

各テストケースは以下の情報を記録します：

- **a. ユーザー入力テキスト** - ページでユーザーが入力したシミュレートされた元のテキスト
- **b. 検出されたキーワード** - LangChainが受信し識別したキーワード
- **c. ツール呼び出しの判定** - システムがツールを呼び出すかどうかの決定
- **d. ツールタイプと戻り内容** - 呼び出された具体的なツールとその戻り結果
- **e. LLMに送信される連結されたnewHumanプロンプト** - LLMに送信される最終的なユーザープロンプト
- **f. LLMに送信されるシステムプロンプト** - システムレベルのプロンプト
- **g. LLMの応答** - 大規模言語モデルの応答結果

## 🔧 環境変数の説明

### 必須設定

```bash
# OpenAI APIキー（実際のLLM呼び出し用）
OPENAI_API_KEY=your_openai_api_key_here

# Node-RED環境のシミュレート
TEST_FLOW_ID=test-flow-123
TEST_NODE_ID=test-node-456
TEST_CONFIG_NODE_ID=test-config-node
```

### オプション設定

```bash
# LLMプロバイダー設定
TEST_LLM_PROVIDER=openai
TEST_LLM_MODEL=gpt-3.5-turbo

# Webサーバーポート
TEST_WEB_PORT=3001

# 実際のLLM呼び出しを有効にするかどうか
ENABLE_REAL_LLM_CALLS=false

# デバッグ設定
DEBUG_MODE=true
LOG_LEVEL=info
```

## 📈 テストレポート

### Webレポート

テスト完了後に生成されるHTMLレポートには以下が含まれます：

- **テスト概要** - 全体的な統計情報
- **言語別テーブル** - 各言語の詳細なテスト結果
- **ステータス表示** - 成功/失敗ステータス
- **レスポンシブデザイン** - 異なる画面サイズに対応

### JSONデータ

生のテストデータはJSON形式で保存され、以下の用途に使用できます：

- 自動化分析
- CI/CDパイプラインへの統合
- カスタムレポートの生成

## 🛠️ 技術アーキテクチャ

### テストプロセス

1. **環境初期化** - 設定、依存関係、環境変数のチェック
2. **フロントエンドシミュレーション** - ユーザー入力とキーワード検出のシミュレート
3. **バックエンド処理** - LangChain Managerを呼び出してリクエストを処理
4. **ツール実行** - 関連ツールのシミュレートまたは実際の実行
5. **LLM相互作用** - プロンプトの構築とLLM応答の取得
6. **結果記録** - 完全な処理チェーン情報の保存
7. **レポート生成** - WebレポートとJSONデータの生成

### シミュレーションコンポーネント

- **Mock Node-RED** - Node-RED実行環境のシミュレート
- **Mock Tools** - ツール実行結果のシミュレート
- **Mock LLM** - オプションのLLM応答シミュレート

## 🔍 トラブルシューティング

### よくある問題

1. **環境変数が設定されていない**
   ```bash
   # .envファイルが存在し、正しく設定されているかチェック
   node run-e2e-test.js --check
   ```

2. **依存関係の不足**
   ```bash
   # 必要な依存関係をインストール
   npm install express dotenv
   ```

3. **無効なAPIキー**
   ```bash
   # シミュレーションモードでテスト
   node run-e2e-test.js
   # またはENABLE_REAL_LLM_CALLS=falseを設定
   ```

4. **ポートが使用中**
   ```bash
   # 他のポートを指定
   node run-e2e-test.js --port 8080
   ```

### デバッグモード

```bash
# 詳細出力を有効化
node run-e2e-test.js --verbose

# または.envで設定
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📝 拡張開発

### 新しい言語の追加

1. `TEST_CONFIG.languages`に言語コードを追加
2. `TEST_CONFIG.testCases`に対応するテストケースを追加
3. 対応する言語設定ファイルが存在することを確認

### 新しいテストケースの追加

```javascript
// 対応する言語のテストケースに追加
{ 
    keyword: '新しいキーワード', 
    expectedTool: 'new-tool', 
    description: '新しいテストケースの説明' 
}
```

### カスタムツールシミュレーション

`executeTestCase`関数の`mockToolResults`オブジェクトに新しいツールのシミュレーション結果を追加します。

## 📄 ライセンス

このテストスクリプトはメインプロジェクトと同じライセンスに従います。

## 🤝 貢献

テストスクリプトの改善のためのIssueやPull Requestの提出を歓迎します！

---

**注意**: このテストスクリプトは`LANGCHAIN_ARCHITECTURE.md`ドキュメントで説明されているアーキテクチャ設計に基づいており、完全なユーザー相互作用プロセスのテストカバレッジを確保しています。