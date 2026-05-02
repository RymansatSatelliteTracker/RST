# satelliteMode値統一リファクタリング計画

## 背景

現在の `satelliteMode` は、保存データと画面表示の間で次のような不整合を含んでいる。

- 初期値や配布JSONでは `"1"` が使われている
- 画面上の選択肢は `NORMAL / REVERSE` を使っている
- 画面から保存した場合は `NORMAL / REVERSE` で保存される
- 既存の `"1"` はアプリ内で明示的に `NORMAL` として正規化されておらず、結果としてUI上は未選択になりうる

今回の主目的は、`satelliteMode` の保存値を `NORMAL / REVERSE` に統一することである。

---

## 本計画で扱う方針

### 1. 保存値は `NORMAL / REVERSE` に統一する

今後新しく生成・保存・配布される `satelliteMode` は、数値文字列ではなく以下のみを使う。

- `NORMAL`
- `REVERSE`

### 2. 旧値 `"1"` はエラーにしない

旧値 `"1"` を持つデータが残っていても、アプリはエラーにしない。

ただし、旧値をファイル上で自動変換するマイグレーション機能は作らない。

### 3. UI表示は `REVERSE` だけを特別扱いする

画面表示用の解釈は次のルールにする。

- `NORMAL` なら `NORMAL`
- `REVERSE` なら `REVERSE`
- それ以外は `NORMAL`

つまり実装方針としては、**`REVERSE` 以外は `NORMAL` 扱い** とする。

### 4. import時の変換は行わない

- `app_config.json` import 時の特別な変換は行わない
- 新旧マイグレーション機能も追加しない
- 更新後アプリの正規形は `NORMAL / REVERSE` とする

---

## 確認できた現状整理

### 1. `app_config.json` は画面保存時に `NORMAL / REVERSE` になる

以下の経路により、画面から保存した場合は `form.satelliteMode` の値がそのまま保存される。

- `src/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialog.vue`
  - ラジオ値は `Constant.Transceiver.TrackingMode.NORMAL / REVERSE`
- `src/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialog.ts`
  - `targetAppConfig.satelliteMode = srcForm.satelliteMode`
- `src/main/util/AppConfigUtil.ts`
  - `storeConfigSatSetting()` 経由で保存

したがって、`app_config.json` の主問題は「画面保存後の値」ではなく、**初期値と古い配布データ**である。

### 2. `frequency.json` は配信データとして更新される

- `satellite_data/frequency.json` は配信元データである
- 日付が更新されていればアプリに自動反映される

したがって、ここは配信データを `NORMAL / REVERSE` に修正すれば追従可能である。

### 3. `default_satellite.json` は再生成される

- `default_satellite.json` は初期配置される
- TLE URL設定更新時などに再生成される

そのため、一時的に古い値が残ることは許容しつつ、今後生成される初期値は `NORMAL` に揃える。

---

## 実装方針

### A. 変更するもの

#### 初期値

- `src/common/model/AppConfigModel.ts`
- `src/common/util/DefaultSatelliteUtil.ts`
- `src/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialogForm.ts`

現在の `"1"` を `NORMAL` に変更する。

#### 配布JSON

- `resources/data/init-data/default_satellite.json`
- `satellite_data/frequency.json`

現在の `"1"` を `"NORMAL"` に変更する。

#### UI表示用の正規化

- `src/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialog.ts`

フォームへ変換する際、次のルールで表示値を正規化する。

- `REVERSE` -> `REVERSE`
- それ以外 -> `NORMAL`

### B. 現時点では変更しないもの

- `app_config.json` import 時の変換処理
- 起動時のマイグレーション処理
- 旧値をファイルへ書き戻す処理

---

## リスク整理

### 許容するリスク

- 既存の `"1"` がファイル上に残ること自体は許容する
- 旧値を持つファイルを自動的に新値へ書き換えることはしない

### 避けたいこと

- 旧値 `"1"` を読んだだけでエラーになること
- 画面上でラジオボタンが未選択になること

そのため、保存値の正規化とUI表示時の正規化を優先する。

---

## テスト方針

### 基本方針

- まずは**ブラックボックステストを優先**する
- モックが多くなる箇所は無理に自動テスト化せず、手動確認に留める
- テストコードは `@src/__tests__/main/util/AppConfigUtil.test.ts` を参考に、**AAAパターン（準備 / 実行 / 検証）** で記述する

### 自動テストの最優先対象

対象:

- `src/__tests__/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialog.test.ts`

理由:

- モデル -> フォーム変換のブラックボックステストが書きやすい
- モックがほぼ不要
- 今回守りたい「UI表示時の正規化仕様」を直接検証できる

### 追加したい自動テスト

#### 1. 旧値 `"1"` はフォームで `NORMAL` になる

- 準備: `satelliteMode = "1"` を持つ入力データを作る
- 実行: `transformDefSatToForm()` を呼ぶ
- 検証: `form.satelliteMode === NORMAL`

#### 2. `REVERSE` はフォームで `REVERSE` のままになる

- 準備: `satelliteMode = REVERSE` を持つ入力データを作る
- 実行: `transformDefSatToForm()` を呼ぶ
- 検証: `form.satelliteMode === REVERSE`

#### 3. 想定外の値はフォームで `NORMAL` になる

- 準備: `satelliteMode = "UNKNOWN"` などを持つ入力データを作る
- 実行: `transformDefSatToForm()` を呼ぶ
- 検証: `form.satelliteMode === NORMAL`

#### 4. フォームから `AppConfigSatellite` へ保存する際に `NORMAL` がそのまま保存される

- 準備: `form.satelliteMode = NORMAL`
- 実行: `transformFormToAppConfig()` を呼ぶ
- 検証: `target.satelliteMode === NORMAL`

#### 5. フォームから repo frequency 用データへ保存する際に `REVERSE` がそのまま保存される

- 準備: `form.satelliteMode = REVERSE`
- 実行: `transformFormToRepoFrequencySatellite()` を呼ぶ
- 検証: `target.satelliteMode === REVERSE`

### 今回は自動テスト追加を見送る対象

#### `useTransceiverCtrl.ts`

- APIモック
- watcher
- ref
- 非同期制御

が多く、ブラックボックスで簡潔に守るにはコストが高い。

#### `ActiveSatServiceHub.ts`

- 依存が多く、内部状態の検証が白箱寄りになりやすい

そのため今回は手動確認を優先する。

---

## 手動確認方針

自動テスト化しない部分は、以下を手動確認する。

### 1. 旧値 `"1"` を持つ設定を開いた時のUI表示

- 既存データに `satelliteMode: "1"` を持たせる
- 衛星設定ダイアログを開く
- **Normal が選択済みで表示される**ことを確認する

### 2. Normal 保存

- ダイアログで Normal を選択して保存する
- 保存後の `app_config.json` が `"NORMAL"` になることを確認する

### 3. Reverse 保存

- ダイアログで Reverse を選択して保存する
- 保存後の `app_config.json` が `"REVERSE"` になることを確認する

### 4. frequency.json の反映

- `satellite_data/frequency.json` に `NORMAL` / `REVERSE` を設定したデータを用意する
- 更新後データがアプリに反映され、画面上で意図どおりに表示されることを確認する

### 5. 実行時挙動

- `REVERSE` のときだけ reverse 動作になること
- それ以外は normal 扱いになること

---

## 変更対象候補ファイル

### 実装候補

- `src/common/model/AppConfigModel.ts`
- `src/common/util/DefaultSatelliteUtil.ts`
- `src/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialogForm.ts`
- `src/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialog.ts`
- `resources/data/init-data/default_satellite.json`
- `satellite_data/frequency.json`

### 自動テスト候補

- `src/__tests__/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialog.test.ts`

---

## タスクリスト

### 計画整理

- [x] `satelliteMode` の現状仕様を整理する
- [x] `app_config.json` / `frequency.json` / `default_satellite.json` の扱いを整理する
- [x] マイグレーションを行わない方針を確認する
- [x] UI表示は `REVERSE` 以外 `NORMAL` 扱いとする方針を確認する

### テスト計画

- [x] `useSatelliteInfoEditorDialog.test.ts` に追加するブラックボックステストケースを確定する
- [x] AAAパターンでのテスト記述方針を明文化する
- [x] 自動テスト対象外の手動確認項目を確定する

### 実装前準備

- [x] 初期値を `NORMAL` に統一する対象ファイルを確定する
- [x] 配布JSONを `NORMAL / REVERSE` に統一する対象ファイルを確定する
- [x] UI表示正規化の実装箇所を確定する

### 実装

- [x] 初期値を `NORMAL` に変更する
- [x] 配布JSONの `satelliteMode` を `NORMAL / REVERSE` に変更する
- [x] UI表示時の `satelliteMode` 正規化を実装する

### テスト・確認

- [x] `useSatelliteInfoEditorDialog.test.ts` にAAAパターンのテストを追加する
- [x] 追加した自動テストを実行する
- [x] 手動確認項目を実施する

### 完了条件

- [x] 新規保存データの `satelliteMode` が `NORMAL / REVERSE` に統一されている
- [x] 旧値 `"1"` を読んでもエラーにならない
- [x] 旧値 `"1"` を読んだ場合でもUI上は Normal が選択される
- [x] `REVERSE` のときだけ reverse 扱いとなる
