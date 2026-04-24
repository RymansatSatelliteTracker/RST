# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code)へのガイダンスを提供します。

## プロジェクト概要

RST (Rymansat Satellite Tracker) は、衛星追跡およびアンテナ制御のためのElectronベースのデスクトップアプリケーションです。
フロントエンド（レンダラープロセス）にはVue 3 + TypeScript + Vuetify、バックエンド（メインプロセス）にはNode.js + TypeScriptを使用して構築されています。

## 設計ドキュメント
- `/doc` 配下のファイルを参照してください。
- 図を罫線で表現する場合は、全角文字により図が崩れないようにスペースを調整してください。

## 開発コマンド

### 開発
```bash
# 開発モード起動（TypeScriptビルド + Vite開発サーバー実行 + Electron起動）
npm run app:dev

# Vite開発サーバーのみ実行
npm run vite:dev

# TypeScriptコンパイルのみ監視
npm run watch
```

### テスト
```bash
# 全てのJestユニットテストをカバレッジ付きで実行
npm run test

# 特定のテストファイルを実行
npm run test -- FileName_part

# ファイル内の特定のテストを実行
npm run test -- FileName_part -t "test name"

# PlaywrightでE2Eテスト実行
npm run test:e2e
```

### ビルド
```bash
# プレビュー用ビルド（Viteビルド + TypeScriptコンパイル + Electron実行）
npm run app:preview

# 全プラットフォーム向けプロダクションアプリビルド
npm run app:build

# プラットフォーム固有ビルド
npm run app:build-win
npm run app:build-mac
npm run app:build-linux

# フロントエンドのみビルド
npm run vite:build

# TypeScriptのみコンパイル
npm run ts
```

### コードフォーマット
```bash
# Prettierで全コードをフォーマット
npm run format
```

## テスト

### ユニットテスト（Jest）
- `src/__tests__/`にソースをミラーリングした構造で配置
- TypeScriptサポートのためにts-jestを使用
- カバレッジレポートを自動生成
- `moduleNameMapper`でパスエイリアスを設定

### E2Eテスト（Playwright）
- `src/__tests__/playwright/`に配置
- アプリケーション全体のワークフローをテスト

## 開発ツール

### Nodeバージョン管理
- Node.jsバージョン管理にVoltaを使用（package.jsonで設定）
- 対象Node.jsバージョン: 22.18.0

### VSCodeデバッグ
- **メインプロセス**: ビルド後に"Electron: Main"設定を使用
- **レンダラープロセス**: app:dev実行中に"Electron: Renderer"設定を使用
- **Jestテスト**: 個別テストデバッグのためのJest Runner拡張機能をインストール

## ビルドプロセス

1. `vite:build` - Vueフロントエンドをビルド
2. `tsc` - メインプロセス用TypeScriptをコンパイル
3. `app:import-replace` - tscpathsを使用してパスエイリアスを相対インポートに変換
4. `electron-builder` - アプリケーションをパッケージ

## 重要な注意事項

- ログファイルはユーザーディレクトリに保存（例: Windows の `%APPDATA%/rst/logs/rst.log`）
- TLE（Two-Line Element）データは衛星追跡のために外部ソースから取得
- アプリケーションはハードウェア制御のためのシリアルポート通信を処理
- UIコンポーネントにVuetify、Material Designアイコンを使用
- I18nサービスを通じた多言語サポート
