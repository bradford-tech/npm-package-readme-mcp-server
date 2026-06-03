# package-readme-mcp-server - Developer Guide

MCP server for fetching npm package README and usage information の開発環境セットアップガイド

## 環境要件

- Node.js 18.0.0以上
- npm または yarn
- TypeScript 5.0以上

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発環境での実行

```bash
# TypeScriptファイルを直接実行（開発用）
npm run dev

# ビルドしてから実行
npm run build
npm start
```

## 開発用コマンド

```bash
# 開発サーバー起動（tsx使用）
npm run dev

# TypeScriptビルド
npm run build

# 型チェック（エラーチェックのみ）
npm run typecheck

# ESLintによるコード品質チェック
npm run lint

# テスト実行
npm run test
```

## プロジェクト構造

```
src/
├── index.ts              # エントリーポイント
├── server.ts             # MCPサーバーメイン実装
├── services/             # 外部API・キャッシュサービス
│   ├── cache.ts         # キャッシュ管理
│   ├── github-api.ts    # GitHub API連携
│   ├── npm-registry.ts  # npm registry API連携
│   └── readme-parser.ts # README解析処理
├── tools/               # MCPツール実装
│   ├── get-package-info.ts
│   ├── get-package-readme.ts
│   └── search-packages.ts
├── types/               # 型定義
│   └── index.ts
└── utils/               # ユーティリティ
    ├── error-handler.ts
    ├── logger.ts
    └── validators.ts
```

## 開発環境変数

開発時に設定可能な環境変数：

```bash
# ログレベル設定
export LOG_LEVEL=DEBUG

# キャッシュ有効期限（秒）
export CACHE_TTL=3600

# リクエストタイムアウト（ミリ秒）
export REQUEST_TIMEOUT=30000

# GitHub APIトークン（レート制限回避用）
export GITHUB_TOKEN=your_github_token_here
```

## デバッグ

### ローカルでのMCPサーバー動作確認

```bash
# サーバーを直接起動
npm run dev

# 別ターミナルでJSONRPCリクエストをテスト
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

### ログレベル設定

開発時は詳細なログを確認するため：

```bash
LOG_LEVEL=DEBUG npm run dev
```

## テスト

```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test -- tests/specific-test.spec.ts

# ウォッチモード
npm test -- --watch
```

## コード品質

### ESLint設定

- `@typescript-eslint/eslint-plugin`を使用
- 厳格な型チェックを実装
- コードスタイルの統一

### TypeScript設定

- 厳格モード有効
- ES2020ターゲット
- ESModules使用
- ソースマップ生成

## トラブルシューティング

### よくある問題

1. **TypeScriptコンパイルエラー**
   ```bash
   npm run typecheck
   ```

2. **ESLintエラー**
   ```bash
   npm run lint
   ```

3. **モジュール解決エラー**
   - `tsconfig.json`の`moduleResolution`設定を確認
   - `package.json`の`type: "module"`設定を確認

### デバッグのヒント

- `LOG_LEVEL=DEBUG`でより詳細なログを出力
- キャッシュ問題が疑われる場合は`CACHE_TTL=0`でキャッシュを無効化
- GitHub APIレート制限に達した場合は`GITHUB_TOKEN`を設定

## リリース前チェックリスト

- [ ] `npm run typecheck` - 型エラーなし
- [ ] `npm run lint` - リントエラーなし  
- [ ] `npm run test` - 全テスト通過
- [ ] `npm run build` - ビルド成功
- [ ] バージョン番号更新（package.json）
- [ ] README.md更新（必要に応じて）

## 貢献ガイドライン

1. 新機能追加時は型定義も含めて実装
2. エラーハンドリングを適切に実装
3. ログ出力を適切なレベルで設定
4. テストケースを追加
5. TypeScriptの厳格な型チェックに従う