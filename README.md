# RST (Rymansat Satellite Tracker)

## 1. 環境構築

### node環境の構築

#### Windows

- nodeのバージョン管理はnvmを使用した場合の手順を記載する。nvm以外を使用する場合は適宜読み替える事。
- PCにnode, nodistがインストールされている場合、アンインストールする。
- 注意）nodistをアンインストールした後、$HOME\.npmrc 内のnodistの記載を手動で削除する。

- 以下からnvmをインストールする。
  `https://github.com/coreybutler/nvm-windows`

```bash
# nodeのインストール
nvm install v21.7.3
nvm use 21.7.3

# ライブラリなどのインストール
npm i
```

## 2. 実行方法

```bash
# 開発モードで起動する
npm run app:dev

# アプリをビルドし、起動する
npm run app:preview

# プロダクト向けビルド
npm run app:build
  ⇒ releaseフォルダ配下にビルドされたファイルが出力されます。
```

## 3. UT実行

```bash
# すべてのUTを実行
npm run test

# ファイル指定
npm run test -- ファイル名の一部
例） npm run test -- CommonUtil_isEmpty

# テスト名指定
npm run test -- ファイル名の一部 -t "name"
例） npm run test -- CommonUtil_isEmpty -t "empty"
```

### 4. デバッグ

VsCodeでのデバッグ実行の方法です。

#### メインプロセスのデバッグ

1. `npm run app:build` でビルドを行う。
2. `src\electron` 配下のファイルにブレークポイントを設定する。
3. 実行とデバッグ（`Run and Debug (Ctrl+Shift+D)`）にて、`Electron: Main`を選択する。
4. F5でデバッグを開始する。

#### レンダラプロセスのデバッグ

1. `npm run app:dev`でアプリを起動する。
2. `src\renderer` 配下のファイルにブレークポイントを設定する。
3. 実行とデバッグ（`Run and Debug (Ctrl+Shift+D)`）にて、`Electron: Renderer`を選択する。
4. F5でデバッグを開始する。

#### Jest実行でのデバッグ

1. 機能拡張「Jest Runner(firsttris.vscode-jest-runner)」をインストールする
2. 適宜ブレークポイントを設定する。
3. テストケースのファイルの各ケース（メソッド）の上部の「Debug」をクリックする

### 5. ビルド
#### WindowsでWindows向けのビルドを行う場合
1. cmdプロンプトを管理者権限で起動する
2. `npm run app:build` でビルドを行う。

    ※以下が出力された場合
    ```
    cannot execute  cause=exit status 1
                        errorOut=Fatal error: Unable to commit changes
    ```

    以下フォルダを削除して、再度ビルドを行う。
    ```
    C:/Users/user/AppData/Local/electron-builder
    ```

#### WindowsでLinux向けのビルドを行う場合
1. WSL2（ubuntu）で本プロジェクトルートを開く
2. `npm run app:build-linux` でビルドを行う。

### 6. アイコンの作成
#### アイコン編集
Inkscapeで編集を行う。
小さいアイコン向け
　public\assets\アイコン_24.svg
大きいアイコン向け
　public\assets\アイコン_512.svg

#### Windows向けのicoの作成
複数pngをicoファイルに格納するため、以下からImageMagicをダウンロード、インストールする。
https://www.imagemagick.org/script/download.php

以下をコマンドプロンプトで実行する。
```
cd プロジェクトルート\public\assets
magick convert rst_icon_16.png rst_icon_24.png rst_icon_32.png rst_icon_48.png rst_icon_64.png rst_icon_128.png rst_icon_256.png rst.ico

以下のWarningが出力されるが無視する。
WARNING: The convert command is deprecated in IMv7, use "magick" instead of "convert" or "magick convert"
```
rst.ico がWindowsのアイコンファイルとなる。

### 7. その他技術的な特記事項
#### メインプロセスのimportエイリアスについて
以下のようにエイリアスで記載するが、exe化後の実行時に "cannot find module" が発生する。
これに対処するため、tscpathsにて強制的に相対パスへ置換を行っている。

```ts
import AppMainLogger from "@/main/util/AppMainLogger";
```

package.json
```json
"scripts": {
  "app:build": "npm run vite:build && tsc && npm run app:import-replace && electron-builder",
  "app:import-replace": "tscpaths -p tsconfig.json -s ./src -o ./dist/electron",
}
```

以下箇所で相対パスへ置換を行っている。
```json
"tscpaths -p tsconfig.json -s ./src -o ./dist"
```

#### ログファイル
ログは、ユーザディレクトリ配下に出力される。
```
例）Windowsの場合
　C:\Users\username\AppData\Roaming\rst\logs\rst.log
```

- ローテーションは10MB（Constant.tsで設定）
- ローテーションは１世代のみ保持される

# Issue
バグ報告や改善要望は、GitHubのIssuesに登録ください。

# License
The source code is licensed MIT.
