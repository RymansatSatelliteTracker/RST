# RST (Rymansat Satellite Tracker)

## 0. バイナリの保管場所

最新のバイナリは[releases](https://github.com/RymansatSatelliteTracker/RST/releases)からダウンロードできます。

## 1. 環境構築

### node環境の構築

#### Windows

- nodeのバージョン管理はfnmを使用した場合の手順を記載する。fnm以外を使用する場合は適宜読み替える事。
- PCにnode, nodist, Voltaがインストールされている場合、アンインストールする。
- 注意）nodistをアンインストールした後、$HOME\.npmrc 内のnodistの記載を手動で削除する。

```bash
# fnmのインストール
winget install Schniz.fnm

# fnmの初期化（PowerShell）
## プロファイルを開く
notepad $PROFILE
## 以下の1行を追記
fnm env --use-on-cd | Out-String | Invoke-Expression
## 保存後に反映
. $PROFILE

# nodeのインストール
fnm install 22
fnm use 22
fnm default 22

# ライブラリなどのインストール
npm ci
```

##### fnmの初期化（Windows Git Bashを使用する場合）

- Windows Git Bashを利用する場合は、以下を設定してください。

```bash
# .bashrcを開く
nano ~/.bashrc
# 以下の1行を追記して保存
eval "$(fnm env --use-on-cd)"
```

#### Mac

- PCにnode, nodebrew, Voltaがインストールされている場合、アンインストールする

```bash
# fnmのインストール
brew install fnm

# fnmの初期化
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc

# nodeのインストール
fnm install 22
fnm use 22
fnm default 22

# ライブラリなどのインストール
npm ci
```

## 2. 実行方法

```powershell
# 開発モードで起動する
npm run app:dev

# プロダクト向けビルド
npm run app:build
  ⇒ releaseフォルダ配下にビルドされたファイルが出力されます。
```

## 3. UT実行

```powershell
# すべてのUTを実行
npm run test

# ファイル指定
npm run test -- ファイル名の一部
例） npm run test -- CommonUtil_isEmpty

# テスト名指定
npm run test -- ファイル名の一部 -t "name"
例） npm run test -- CommonUtil_isEmpty -t "empty"
```

### E2Eテスト実行（Playwright）

E2Eテストは、ビルド済みのアプリ（`dist` 配下）を起動して画面を操作します。
`npm run test:e2e` は、実行前に自動でビルド（`npm run vite:build`、`npm run ts`）を行います（`pretest:e2e` → `scripts/e2e-prebuild.mjs`）。
ただし、前回このビルドを行ってからソースが変わっていない場合は、ビルドを省略します。

- 判定の対象：`src`（`src/__tests__` を除く）、`index.html`、`vite.config.mjs`、`tsconfig.json`、`package.json`、`package-lock.json`、`public`
- 前回のビルドの後に `dist` が別の手段（手動のビルド、`npm run app:dev` など）で更新された場合も、ビルドし直します。
- 判定の記録は `dist/.e2e-build-stamp.json` に保存されます。

```powershell
# ビルドしてから（ソースに変更がなければビルドを省略して）、すべてのE2Eテストを実行
npm run test:e2e

# 常にビルドしてから実行する（PowerShell）
$env:E2E_FORCE_BUILD = "1"; npm run test:e2e; Remove-Item Env:E2E_FORCE_BUILD

# 以下の npx playwright test はビルドを行わないため、ソースを変更した場合は先にビルドする
npm run vite:build
npm run ts

# ファイル指定
npx playwright test ファイル名の一部
例） npx playwright test beacon

# テスト名指定
npx playwright test ファイル名の一部 -g "name"
例） npx playwright test beacon -g "E-01"

# 実行せずに、対象のテストを一覧表示する
npx playwright test ファイル名の一部 --list
```

- ファイル・テスト名を指定する場合は、`npm run test:e2e -- ファイル名の一部` ではなく `npx playwright test` を使ってください。
  `test:e2e` にはテストフォルダ全体が指定されているため、ファイル名を追加しても絞り込まれず、すべてのテストが実行されます。

- E2Eテストは、一時ディレクトリをアプリのユーザディレクトリとして起動するため、ユーザの実データ（`%APPDATA%\rst`）には影響しません。
  起動時の設定・衛星データは、`fixtures.ts` の `testData`（`test.use` で指定）で用意します。未指定の場合は、衛星なしの基本の設定で起動します。
- RSTを起動したままでも実行できます（ユーザディレクトリが分かれるため、二重起動の判定に当たりません）。
- 無線機・ローテータは接続しません。無線機の接続が必要な操作（Auto ONなど）は、E2Eテストの対象外です。

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

#### Vitest実行でのデバッグ

1. 機能拡張「Vitest Runner(firsttris.vscode-jest-runner)」をインストールする
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

- 小さいアイコン向け
  - public\assets\アイコン\_24.svg
- 大きいアイコン向け
  - public\assets\アイコン\_512.svg

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

### 7. 地図データの作成方法

1. [Natural Earth III – Texture Maps]から地図画像データをDL

- [2. Earth without clouds](https://www.shadedrelief.com/natural3/pages/textures.html)の[16,200 x 8,100 JPEG (30 MB)]をDLする。
- [Projection information and world (.tfw) files (4 KB)]をDLする。  
  ※ 2. Earth without cloudsと同一ページの最下部にDLリンクあり。

2. ファイル名変更&ユーザーフォルダ配下への格納

- [16,200 x 8,100 JPEG (30 MB)]のファイル名を[natural_earth.jpg]に変更する。
- [16200x8100.tfw]のファイル名を[natural_earth.tfw]に変更する。
- ユーザーフォルダ配下に[EPSG4326]フォルダを新規作成して、[natural_earth.jpg]、[natural_earth.tfw]を格納する。

3. 以下からQGISをダウンロード、インストールする。  
   https://qgis.org/download/

4. OSGeo4W Shellを起動して地図タイルを生成

- 以下をOSGeo4W Shellで実行する。

```
cd C:\Users\ユーザーフォルダ\EPSG4326
gdal_translate -a_srs EPSG:4326 -a_ullr -180 90 180 -90 natural_earth.jpg temp.tif
gdalinfo temp.tif
gdal2tiles -p geodetic -z 1-6 --tilesize=512 --tiledriver=JPEG --jpeg-quality=85 temp.tif tiles
for /r "C:\Users\ユーザーフォルダ\EPSG4326\tiles" %f in (*.kml) do del "%f"
```

### 8. その他技術的な特記事項

#### メインプロセスのimportエイリアスについて

以下のようにエイリアスで記載するが、exe化後の実行時に "cannot find module" が発生する。
これに対処するため、tsc-aliasにて強制的に相対パスへ置換を行っている。

```ts
import AppMainLogger from "@/main/util/AppMainLogger.js";
```

package.json

```json
"scripts": {
  "app:build": "npm run vite:build && tsc && npm run app:import-replace && electron-builder",
  "app:import-replace": "tsc-alias -p tsconfig.json",
}
```

以下箇所で相対パスへ置換を行っている。

```json
"tsc-alias -p tsconfig.json"
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
