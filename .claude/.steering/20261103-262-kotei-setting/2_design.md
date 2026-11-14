# 改修プラン：衛星設定画面に「固定モード」を追加

要求は [`1_requirements.md`](./1_requirements.md) を参照。

## 1. 方針

- 衛星ごとの固定モードを `dopplerShiftMode` というフィールド名で持たせる（メイン画面の `dopplerShiftMode` と同名・同値域）。値は既存の `Constant.Transceiver.DopplerShiftMode`（`FIXED_SAT` / `FIXED_RX` / `FIXED_TX`）を使う。
- 保存先は `DefaultSatelliteType`（frequency.json）と `AppConfigSatellite` の2か所。`satelliteMode`（トラッキングモード）と同じ流れで追加する。
- メイン画面への反映は、`TransceiverModeCoordinator.startAutoMode` の1か所のみで行う。
  - AutoOn開始時に設定される。
  - AutoOn状態でアクティブ衛星を切り替えた場合は、`onChangeSatGrp` から `startAutoMode` が再実行されるため、新しい衛星の値が設定される。
  - `onChangeSatGrp` は、同一衛星の設定更新（衛星設定の保存、最小仰角の更新など）でも呼ばれる。この場合に手動選択した固定モードを上書きしないよう、`startAutoMode(applyDopplerShiftMode)` の引数で制御する。`onChangeSatGrp` は衛星が変更された場合のみ `true` を渡す（Auto ONボタンからの開始は既定の `true`）。
  - AutoOff状態でアクティブ衛星を切り替えても、メイン画面の固定モードは変更しない。
- ドップラー補正ロジック（Resolver/Coordinator/Calc）は変更しない。

## 2. 確認事項の反映結果

| # | 結果                                       | 設計への反映                                                                     |
| - | ------------------------------------------ | -------------------------------------------------------------------------------- |
| 1 | ラジオは常に活性                           | `SatelliteInfoEditorDialog.vue` で `disabled` を付けない                         |
| 2 | FM衛星の強制衛星固定はスコープ外           | 対応しない                                                                       |
| 3 | 並び順：衛星固定 → 送信固定 → 受信固定     | ラジオを画像どおりの順で記述（`Constant` の定義順は変更しない）                  |
| 4 | AutoOn中の変更は次回AutoOn/衛星切替時に反映 | 設定変更を監視する処理は追加しない（反映箇所は `startAutoMode` のみ）            |
| 5 | frequency.jsonの既存衛星はすべて衛星固定   | frequency.json は編集しない。`normalizeData` のテンプレート値（衛星固定）で補完  |
| 6 | AutoOff時の衛星切替ではメイン画面は変更しない | `onChangeSatGrp` は、衛星が変わっていない場合は `startAutoMode(false)` で固定モードを更新しない |

## 3. 変更内容

### 3.1 型/モデル/デフォルト

| ファイル                                    | 変更                                                                                                |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/common/types/satelliteSettingTypes.ts` | `DefaultSatelliteType` に `dopplerShiftMode: string` を追加（`satelliteMode` の次）                  |
| `src/common/model/AppConfigModel.ts`        | `AppConfigSatellite` に `dopplerShiftMode = Constant.Transceiver.DopplerShiftMode.FIXED_SAT` を追加 |
| `src/common/util/DefaultSatelliteUtil.ts`   | `createDefaultSatellite` に `dopplerShiftMode: FIXED_SAT` を追加                                    |

- 既存の frequency.json は `initializeDefaultSatellites` → `normalizeData` で、キーが無い場合にテンプレート値（FIXED_SAT）が補完される。
- 既存の AppConfig（保存済みの対象衛星）の補完は、実装時に `AppConfigUtil` の読み込み処理を確認する。補完されない場合は、読み込み時に未定義を FIXED_SAT へ補完する処理を追加する（タスクに記載）。
- 不正値（FIXED_SAT/RX/TX 以外）は、画面表示用の正規化関数で FIXED_SAT として扱う（`normalizeSatelliteModeForUi` と同様）。

### 3.2 衛星情報編集ダイアログ

| ファイル                           | 変更                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `SatelliteInfoEditorDialogForm.ts` | `dopplerShiftMode: string = FIXED_SAT` を追加                                                                                                 |
| `useSatelliteInfoEditorDialog.ts`  | `normalizeDopplerShiftModeForUi` を追加。`transformToForm`、`transformFormToAppConfig`、`transformFormToRepoFrequencySatellite` に項目を追加 |
| `SatelliteInfoEditorDialog.vue`    | 「サテライトモード」行と「概要」行の間に「固定モード」行を追加（`v-radio-group`、衛星固定/送信固定/受信固定の順、常に活性）                    |
| `src/common/I18nMsgs.ts`           | 項目名用に `G31_DOPPLER_SHIFT_MODE`（en: "Fixed Mode"、ja: "固定モード"）を追加。ラジオのラベルは既存の `G2_FIXED_SAT/TX/RX` を再利用する     |

- `EditFrequencySatelliteInfo.vue`（リポジトリ周波数編集）と `EditSatelliteInfo.vue`（アプリ設定編集）は共通ダイアログを使うため、ダイアログ側の変更で両方に反映される。
- Reset/マニュアル設定判定は `form` 全体の watch のため、追加の対応は不要。
- 入力チェックは不要（3択のラジオのため）。

画面イメージ：

```
  サテライトモード   [ ] 有効   (o) ノーマル  ( ) リバース
  固定モード         (o) 衛星固定   ( ) 送信固定   ( ) 受信固定
  概要
```

### 3.3 メイン画面への反映

| ファイル                                      | 変更                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderer/service/ActiveSatServiceHub.ts` | `dopplerShiftMode` フィールドを追加。アクティブ衛星設定の読み込み処理で `appConfigSatellite.dopplerShiftMode`（不正値/未定義は FIXED_SAT）を保持。`getActiveSatTransceiverSetting()` の戻り値へ追加 |
| `coordinators/TransceiverModeCoordinator.ts`  | `ModeCoordinatorState` に `dopplerShiftMode: Ref<string>` を追加。`startAutoMode` で `transceiverSetting.dopplerShiftMode` を `state.dopplerShiftMode` へ設定                                      |
| `useTransceiverCtrl.ts`                       | `ModeCoordinatorState` の生成箇所へ `dopplerShiftMode` を渡す。`onChangeSatGrp` で衛星変更の有無を判定し、`startAutoMode` の `applyDopplerShiftMode` に渡す                  |

反映の流れ：

```
  衛星設定画面（OK）
      │ AppConfigSatellite.dopplerShiftMode を保存
      ▼
  ActiveSatServiceHub（アクティブ衛星設定の読み込み）
      │ dopplerShiftMode を保持
      ├─ AutoOn開始 ───────────────▶ startAutoMode ─▶ dopplerShiftMode（メイン画面）
      ├─ AutoOn中の衛星切替 ─▶ onChangeSatGrp ─▶ startAutoMode ─▶ dopplerShiftMode（メイン画面）
      └─ AutoOff中の衛星切替 ─▶ 変更しない
```

- アプリ起動時やAutoOff中は、メイン画面の固定モードは従来どおり衛星固定（初期値）のままで、AutoOn時に衛星設定の値が設定される。
- AutoOn中の衛星設定変更は監視しない。AutoOn中に衛星設定画面でアクティブ衛星の固定モードを変更しても、次回のAutoOn開始時または衛星切替時に反映される。
- AutoOff中に衛星設定の固定モードを変更した場合や、アクティブ衛星を切り替えた場合も、メイン画面には反映されず、次回のAutoOn開始時に反映される。
- AutoOn後にメイン画面で手動変更した固定モードは、衛星設定へ保存しない。

### 3.4 ドキュメント

| ファイル                                           | 変更                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `doc/30_画面設計/G3-1_衛星設定（表示衛星タブ）.md` | 衛星情報編集ダイアログの項目表へ「固定モード」を追加                                 |
| `doc/30_画面設計/G2_メイン.md`                     | 固定モードの説明へ「衛星設定の固定モードがAutoOn開始時（AutoOn中の衛星切替時を含む）に設定される」を追記 |

## 4. テスト方針

| 対象                                               | 内容                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `DefaultSatelliteUtil.test.ts`                     | `createDefaultSatellite` が FIXED_SAT を持つ。キー無しのデータが `normalizeData` で FIXED_SAT に補完される |
| `useSatelliteInfoEditorDialog` の変換関数          | 3つの変換関数で `dopplerShiftMode` が往復する。不正値/未定義が FIXED_SAT になる                            |
| `TransceiverModeCoordinator_startAutoMode.test.ts` | `startAutoMode` でアクティブ衛星の固定モードが `state.dopplerShiftMode` へ設定される                       |
| `ActiveSatServiceHub` の無線設定                   | `getActiveSatTransceiverSetting()` が `dopplerShiftMode` を返す（未定義時は FIXED_SAT）                    |

## 5. 影響しないこと

- `TransceiverDopplerModeResolver`、`TransceiverFreqCoordinator`、`TransceiverDopplerCalc`、`FrequencyTrackService` は変更しない。
- main プロセス（`RepoFrequencyService`、`FrequencyValidator`）は固定モード項目に依存しない（`satelliteMode` と同様に透過的に保存される）。
- frequency.json、`resources/data/init-data/default_satellite.json` は変更しない。
