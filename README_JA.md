# Node-RED Make IoT Smart

## 🌐 言語

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md) [![中文](https://img.shields.io/badge/lang-中文-red.svg)](README_ZH.md) [![Deutsch](https://img.shields.io/badge/lang-Deutsch-green.svg)](README_DE.md) [![Español](https://img.shields.io/badge/lang-Español-orange.svg)](README_ES.md) [![Français](https://img.shields.io/badge/lang-Français-purple.svg)](README_FR.md) [![日本語](https://img.shields.io/badge/lang-日本語-yellow.svg)](README_JA.md) [![한국어](https://img.shields.io/badge/lang-한국어-pink.svg)](README_KO.md) [![Português](https://img.shields.io/badge/lang-Português-cyan.svg)](README_PT.md) [![Русский](https://img.shields.io/badge/lang-Русский-brown.svg)](README_RU.md) [![繁體中文](https://img.shields.io/badge/lang-繁體中文-lightblue.svg)](README_TW.md)


---

Node-RED専用に設計されたAIアシスタント拡張機能で、IoT開発をよりスマートで効率的にします。
[![npm version](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart.svg)](https://badge.fury.io/js/@jhe.zheng%2Fnode-red-make-iot-smart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node-RED](https://img.shields.io/badge/Node--RED-2.0%2B-red)](https://nodered.org/)
## 概要

Node-RED Make IoT Smartは、Node-RED開発専用に設計された包括的なAIエージェントです。インテリジェントなコード支援、自動化されたフロー最適化、スマートデバッグ機能を提供し、IoT開発体験を向上させます。この拡張機能は現在、学習、ソリューション、統合、開発、設定、管理の6つの主要シナリオをサポートしています。

## 機能

### 🤖 AIアシスタント

- **インテリジェントコード提案**：Node-REDフローのコンテキスト対応コード推奨。
- **スマートフロー分析**：フローを分析し、最適化提案を提供。
- **自然言語インターフェース**：自然言語コマンドを使用してNode-RED環境と対話。
- **多言語サポート**：中国語、英語、日本語、韓国語などをサポート。Node-REDの言語設定変更に追従。
- **マルチプロバイダーサポート**：LangChain.jsフレームワークベースで、OpenAI、Anthropic、Google、DeepSeekなどのAIモデルをサポート。
- **インテリジェントメモリ管理**：SQLiteベースの短期・長期メモリシステム、会話履歴、ユーザー設定、フローパターンストレージをサポート。
- **シナリオベースプロンプト**：JSON設定によるシナリオベースプロンプト管理、動的パラメータ注入をサポート。
- **MCPツール統合**：Model Context Protocol（MCP）ツール呼び出しをサポートし、AIアシスタントの機能を拡張。


### 🔧 開発ツール

- **リアルタイムコード分析**：Node-REDフローの継続的分析。
- **設定管理**：異なるAIプロバイダーの集中API設定。
- **インタラクティブサイドバー**：Node-REDエディターに統合された専用AIアシスタントパネル。
- **JSONエディター**：シンタックスハイライト付きの統合設定ファイルエディター。
- **MCPツール統合**：Model Context Protocol（MCP）ツール呼び出しをサポートし、AIアシスタントの機能を拡張。
- **LangChainツール管理**：統一ツール管理フレームワーク、内蔵ツールとMCPツールをサポート。
- **シナリオベースサポート**：7つの主要シナリオのカスタマイズサポート：
  - **学習**：ノードと概念を説明し、サンプルフローを提供。
  - **ソリューション**：フローJSONとノードインストールガイドを含む様々なIoTソリューションを提供。
  - **統合**：プロトコル（例：MQTT、Modbus）やソフトウェアの統合を支援。
  - **開発**：既存のフローとファンクションノードコードを最適化。
  - **設定**：Node-RED設定（例：`settings.js`）の変更をガイド。
  - **管理**：リモートアクセス、Git統合、バッチデプロイメントをサポート。

### 🚀 今後の機能

- **リモートデバッグ**：Node-REDフローのAI支援リモートデバッグ。
- **チーム管理**：チーム管理機能付きの協調開発。
- **高度な分析**：IoTシステムパフォーマンスの深い洞察。
- **インテリジェントデプロイメント**：AI主導のIoTアプリケーションデプロイメント戦略。

## インストール

### npmからインストール

```bash
npm install @jhe.zheng/node-red-make-iot-smart
```

### Node-REDパレットマネージャーからインストール

1. Node-REDエディターを開きます。
2. **メニュー → パレットの管理**に移動します。
3. `@jhe.zheng/node-red-make-iot-smart`を検索します。
4. **インストール**をクリックします。
5. インストール後、Node-REDを再起動します。
6. インストール後、Node-REDサイドバーに新しい**AIアシスタント**タブが表示されます。
7. **設定**ボタンをクリックしてAIプロバイダーを設定します。
8. サポートされているプロバイダーから選択します：
   - **DeepSeek**：強力なコーディング能力を持つコスト効率的なオプション。
   - **OpenAI**：業界をリードするGPTモデル。
   - **Anthropic**：Claudeモデルによる高度な推論能力。
9. APIキーを入力し、適切なモデルを選択します。
10. 設定後、AIアシスタントの使用を開始できます。設定を保存した後、NodeREDは自動的に設定ノードを生成することに注意してください。NodeREDはフローの変更を表示し、マージをクリックするだけです。
11. AIアシスタントとの対話を開始しましょう！

## クイックスタート
### 「現在のノードを分析」と入力
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/current-node.gif" width="800" height="450" alt="デモアニメーション" />


### 「サンプルフローを作成」と入力
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/create-flow.gif" width="800" height="450" alt="デモアニメーション" />

### 「ヘルスチェック」と入力
<img src="https://github.com/jimmyfreecoding/node-red-make-iot-smart/raw/main/public/health-check.gif" width="800" height="450" alt="デモアニメーション" />

## 設定

### LangSmithデバッグ設定（オプション）

LangChain実行のより良いデバッグと監視のために、LangSmithサポートを設定できます：

1. `.env.example`ファイルを`.env`にコピーします：
   ```bash
   cp .env.example .env
   ```

2. `.env`ファイルを編集してLangSmith設定を記入します：
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_api_key_here
   LANGCHAIN_PROJECT=your_project_name
   ```

3. Node-REDを再起動して設定を適用します。

4. [LangSmith](https://smith.langchain.com/)にアクセスして詳細な実行トレースとデバッグ情報を確認します。

**注意**：LangSmith設定はオプションであり、基本機能には影響しません。

## 使用方法

### 基本チャットインターフェース

- **AIアシスタント**サイドバータブを開きます。
- 自然言語で質問や指示を入力します。
- コード提案と説明付きのインテリジェントな回答を取得します。

### シナリオ選択

- サイドバーのドロップダウンメニューからシナリオ（学習、ソリューション、統合、開発、設定、管理）を選択します。
- AIは選択されたシナリオに基づいて回答を調整し、関連ツールとフローJSONを提供します。

### JSON/コード処理

- 大きなJSONやコード出力は**JSON/コードを表示**ボタンの後ろに隠されてUIをクリーンに保ちます。
- シンタックスハイライト付きの統合エディターでフローJSONを編集し、変更を直接適用します。

### サポートされているシナリオ

#### シナリオ概要

| シナリオ | 日本語名 | 説明 | サポートツール |
|----------|----------|------|----------------|
| learning | 学習モード | Node-RED学習アシスタント、教育ガイドと知識回答を提供 | get-flows, get-nodes, create-flow, update-flow |
| solution | ソリューションモード | IoTソリューション専門家、技術ソリューションとアーキテクチャアドバイスを提供 | create-flow, update-flow, get-flows, create-subflow |
| integration | 統合モード | システム統合専門家、デバイス接続とデータ統合を処理 | create-flow, update-flow, install-node, get-node-info |
| development | 開発モード | コード開発アシスタント、Node-REDフローの作成と最適化を支援 | create-flow, update-flow, create-subflow, get-node-info, install-node, get-flow |
| configuration | 設定モード | システム設定専門家、Node-RED環境とノード設定を管理 | get_settings, update_settings, install_node, get_node_info, get_diagnostics |
| management | 管理モード | プロジェクト管理アシスタント、フロー組織とプロジェクト計画を支援 | get-flows, create-flow, update-flow, create-subflow |
| general | 一般モード | 一般AIアシスタント、Node-RED関連の様々な質問を処理 | 特定のツール制限なし |

#### 事前定義プロンプト例

| シナリオ | 事前定義プロンプト |
|----------|--------------------|
| **学習モード** | • Node-REDは初めてです。Node-REDの基本概念と主要機能を紹介してください<br>• Node-REDのフロー、ノード、接続について説明してください<br>• Node-REDで最初のシンプルなフローを作成するにはどうすればよいですか？詳細な手順を教えてください<br>• Node-REDでよく使用される主要ノードは何ですか？それぞれの機能は何ですか？ |
| **ソリューションモード** | • スマートホーム制御システムを設計する必要があります。完全なIoTソリューションアーキテクチャを提供してください<br>• Node-REDを使用してIndustry 4.0データ収集・監視システムを構築するにはどうすればよいですか？<br>• センサーデータ収集と自動制御を含む農業IoTソリューションを設計してください<br>• スマートシティ環境監視ネットワークを構築したいのですが、どのような技術ソリューションが必要ですか？ |
| **統合モード** | • Node-REDでMQTTデバイスとHTTP APIを統合するにはどうすればよいですか？詳細な統合ソリューションを提供してください<br>• Modbusデバイスからセンサーデータをクラウドデータベースに送信する必要があります。どのように実装しますか？<br>• JSONをXMLに変換してサードパーティシステムに送信するデータ変換フローの設計を手伝ってください<br>• Node-REDで異なるプロトコルを持つ複数デバイスの統一データ収集と処理を実装するにはどうすればよいですか？ |
| **開発モード** | • 現在のフローの詳細な説明と解説<br>• 現在のノードの詳細な説明と解説<br>• データフィルタリングとフォーマット変換を実装するFunctionノードコードの作成を手伝ってください<br>• Node-REDでカスタムノードを作成するにはどうすればよいですか？完全な開発手順を教えてください |
| **設定モード** | • 現在のNodeRedの設定はどうなっていますか？<br>• 現在のNodeRedの診断はどうなっていますか？<br>• ユーザー認証とHTTPSを含むNode-REDのセキュリティ設定を構成するにはどうすればよいですか？<br>• Node-REDのパフォーマンス設定を最適化し、システム実行効率を向上させるのを手伝ってください<br>• Node-REDでサードパーティノードパッケージをインストール・管理するにはどうすればよいですか？<br>• Node-REDのログ記録と監視を設定する必要があります。どのように設定すればよいですか？ |
| **管理モード** | • IoTプロジェクトの開発計画とマイルストーンの作成を手伝ってください<br>• Node-REDで大規模プロジェクトのフロー構造を整理・管理するにはどうすればよいですか？<br>• 現在のプロジェクトのリスクと品質を評価する必要があります。分析推奨事項を提供してください<br>• チーム協力Node-RED開発標準とベストプラクティスを確立するにはどうすればよいですか？ |
| **一般モード** | • Node-REDとは何ですか？主な特徴と応用シナリオは何ですか？<br>• Node-REDで問題が発生しました。分析と解決策を手伝ってください<br>• Node-RED学習リソースとベストプラクティスを推奨してください<br>• 特定のニーズを解決するために適切なNode-REDシナリオモードを選択するにはどうすればよいですか？ |

#### キーワードによるインテリジェント起動

| シナリオ | キーワード | 起動動作 |
|----------|------------|----------|
| **開発モード** | フロー作成、フロー生成、フロー作成、新しいフロー | 自動的に開発モードに切り替え、完全なNode-REDフローJSONコードを生成し、詳細な説明を提供 |
| **設定モード** | 現在の設定、システム設定、設定情報、設定、現在の設定 | 自動的にget_settingsツールを呼び出して設定情報を取得し、テーブル形式で表示 |
| **設定モード** | 現在の診断、システム診断、診断情報、ヘルスチェック | 自動的にget_diagnosticsツールを呼び出してシステム診断を実行 |

#### 動的入力パラメータ

すべてのシナリオは以下の動的パラメータ注入をサポートします：
- `nodeRedVersion` - Node-REDバージョン情報
- `nodeVersion` - Node.jsバージョン情報
- `currentTime` - 現在のタイムスタンプ
- `selectedFlow` - 現在選択されているフロー
- `selectedNodes` - 現在選択されているノード
- `lang` - 現在の言語パラメータ
- `mcpTools` - 利用可能なMCPツールリスト

各シナリオは特定の動的パラメータもサポートします：
- **学習モード**：`userLevel`（ユーザースキルレベル）
- **ソリューションモード**：`projectRequirements`（プロジェクト要件）
- **統合モード**：`integrationTargets`（統合目標）
- **開発モード**：`developmentTask`（開発タスク）
- **設定モード**：`configurationNeeds`（設定ニーズ）
- **管理モード**：`projectStatus`（プロジェクトステータス）

#### システムプロンプト特性

各シナリオは専門的なシステムプロンプトで設定され、AIアシスタントが以下を確実に実行できます：
1. **役割定位**：特定シナリオでの明確な専門的役割
2. **出力形式**：シナリオ要件に基づく構造化された回答形式
3. **ツール統合**：対応するMCPツールとNode-RED APIのインテリジェント呼び出し
4. **コンテキスト認識**：動的パラメータを使用したパーソナライズされた推奨


| シナリオ | 説明                                                                    |
| --------- | ---------------------------------------------------------------------- |
| 学習 | ノード/概念を説明し、学習用のサンプルフローを提供。        |
| ソリューション | フローJSONとノードインストールガイド付きの様々なIoTソリューションを提供。 |
| 統合 | プロトコル/ソフトウェア統合を支援し、対応するフローを生成。 |
| 開発 | 既存のフローとファンクションノードコードを最適化。                      |
| 設定 | Node-RED設定（例：`settings.js`）の変更をガイド。          |
| 管理 | リモートアクセス、Git統合、バッチデプロイメントをサポート。                 |

## サポートされているAIプロバイダー


| プロバイダー | モデル                                 | 特徴                |
| --------- | --------------------------------------- | ------------------------------ |
| OpenAI    | GPT-3.5, GPT-4, GPT-4o                 | 汎用、幅広い互換性 |
| Anthropic | Claude-3, Claude-3.5                    | 高度な推論、安全性重視 |
| Google    | Gemini Pro, Gemini Flash                | マルチモーダル、高性能   |
| DeepSeek  | deepseek-chat, deepseek-coder           | コスト効率的、コーディング重視 |
| その他     | LangChain.jsでサポートされるすべてのLLMプロバイダー | 高い拡張性、柔軟な設定 |

## API設定

- APIキーはローカルに暗号化されて保存されます。
- 複数プロバイダーの設定をサポート。
- 異なるプロバイダーとモデル間の簡単な切り替え。
- 計画フェーズと実行フェーズの個別モデル設定。

## 開発

### プロジェクト構造

```
├── ai-sidebar.html          # メインサイドバーインターフェース
├── ai-sidebar-config.json   # UI設定
├── make-iot-smart.html      # ノード設定テンプレート
├── make-iot-smart.js        # バックエンドノード実装
├── lib/
│   ├── langchain-manager.js # メインLangChainマネージャー
│   ├── memory-manager.js    # SQLiteメモリ管理
│   └── scenario-manager.js  # シナリオベースプロンプト管理
├── config/
│   └── scenarios.json       # シナリオ設定ファイル
├── data/
│   └── memory.db           # SQLiteデータベースファイル
└── package.json            # パッケージ設定
```

### 技術アーキテクチャ

このプロジェクトは**LangChain.js**フレームワークをベースとし、モジュラーアーキテクチャ設計を使用しています：

- **LangChain Manager**：メインAIモデル管理、複数LLMプロバイダーをサポート
- **Memory Manager**：SQLiteベースのインテリジェントメモリシステム、短期・長期メモリをサポート
- **Scenario Manager**：シナリオベースプロンプト管理、JSON設定と動的パラメータをサポート
- **Tool Manager**：統一ツール管理フレームワーク、MCPツールと内蔵ツールを統合
- **API Layer**：RESTful APIインターフェース、ストリーミングチャットとツール実行をサポート

### 貢献

1. リポジトリをフォークします。
2. 機能ブランチを作成します。
3. 変更を行いコミットします。
4. プルリクエストを提出します。

## ロードマップ

### フェーズ1（完了）

- ✅ AIアシスタント統合
- ✅ マルチプロバイダーサポート
- ✅ インタラクティブサイドバー
- ✅ 設定管理
- ✅ シナリオベースサポート
- ✅ LangChain.jsアーキテクチャ移行
- ✅ SQLiteメモリ管理システム
- ✅ MCPツール統合
- ✅ 統一ツール管理フレームワーク

### フェーズ2（予定）

- 🔄 リモートデバッグ機能
- 🔄 チーム協力機能
- 🔄 高度なフロー分析
- 🔄 インテリジェントデプロイメントツール

### フェーズ3（将来）

- 📋 チーム管理システム
- 📋 エンタープライズ機能
- 📋 高度なセキュリティオプション
- 📋 カスタムモデルトレーニング

## システム要件

- Node.js >= 18.0.0
- Node-RED >= 2.0.0

## ライセンス

MITライセンスの下でライセンスされています。詳細については[LICENSE](LICENSE)ファイルを参照してください。

## サポート
AI開発は技術というより芸術であり、LLMをマスターすることは簡単なタスクではなく、AIモデル、データ、アプリケーションシナリオの深い理解が必要です。各Q&Aセッションは異なる結果を生成する可能性があり、初期バージョンは多くの場合満足のいくものではありませんが、プロンプトエンジニアリングの改善により、ITエンジニアであろうとOTエンジニアであろうと、Node-REDユーザーの日常ニーズを徐々に満たすようになります。より多くの興味のある人々がプロジェクトに参加することを歓迎します。
- **問題報告**：[GitHub Issues](https://github.com/jimmyfreecoding/node-red-make-iot-smart/issues)
- **ドキュメント**：[Wiki](https://github.com/jimmyfreecoding/node-red-make-iot-smart/wiki)
- **ディスカッション**：[GitHub Discussions](https://github.com/jimmyfreecoding/node-red-make-iot-smart/discussions)

## 作者

**Zheng He**
- Email：jhe.zheng@gmail.com
- GitHub：[@jimmyfreecoding](https://github.com/jimmyfreecoding)
- ウェブサイト：[https://www.makeiotsmart.com](https://www.makeiotsmart.com)
---

*AI支援でIoT開発をよりスマートにしましょう！*

---