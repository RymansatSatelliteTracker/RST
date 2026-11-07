# 改修タスクリスト：衛星設定画面に「固定モード」を追加

設計は [`2_design.md`](./2_design.md) を参照。

## 実装

- [x] `satelliteSettingTypes.ts`：`DefaultSatelliteType` に `dopplerShiftMode` を追加
- [x] `AppConfigModel.ts`：`AppConfigSatellite` に `dopplerShiftMode`（初期値 FIXED_SAT）を追加
- [x] `DefaultSatelliteUtil.ts`：`createDefaultSatellite` に `dopplerShiftMode: FIXED_SAT` を追加
- [x] 保存済みAppConfigに項目が無い場合の補完：`migrationConfig` は衛星配列を要素ごとに補完しないため、読み取り側（`ActiveSatServiceHub`、ダイアログの正規化関数）で FIXED_SAT に補完する
- [x] `I18nMsgs.ts`：`G31_DOPPLER_SHIFT_MODE`（固定モード）を追加
- [x] `SatelliteInfoEditorDialogForm.ts`：`dopplerShiftMode` を追加
- [x] `useSatelliteInfoEditorDialog.ts`：正規化関数と、3つの変換関数への項目追加
- [x] `SatelliteInfoEditorDialog.vue`：「固定モード」ラジオ（衛星固定/送信固定/受信固定、常に活性）を追加
- [x] `ActiveSatServiceHub.ts`：`dopplerShiftMode` を保持し、`getActiveSatTransceiverSetting()` の戻り値へ追加
- [x] `TransceiverModeCoordinator.ts`：`ModeCoordinatorState` へ `dopplerShiftMode` を追加し、`startAutoMode` で設定
- [x] `useTransceiverCtrl.ts`：`dopplerShiftMode` を Coordinator へ渡す
- [x] Copilot指摘対応：`startAutoMode(applyDopplerShiftMode)` を追加し、`onChangeSatGrp` は衛星が変更された場合のみ固定モードを設定する（同一衛星の設定更新では手動選択した固定モードを維持する）

## 単体テスト

- [x] `DefaultSatelliteUtil.test.ts`：FIXED_SAT の生成と、キー無しデータの補完
- [x] 衛星情報編集ダイアログの変換関数のテストを追加（往復、不正値/未定義の正規化）
- [x] `TransceiverModeCoordinator_startAutoMode.test.ts`：固定モードが `state.dopplerShiftMode` へ設定される。`applyDopplerShiftMode=false` の場合は維持される
- [ ] `ActiveSatServiceHub` の `getActiveSatTransceiverSetting` が `dopplerShiftMode` を返す（既存の単体テストが無く、セットアップが重いため未実施）
- [x] 既存テストへの影響確認（`npm run test`）

## ドキュメント

- [x] `doc/30_画面設計/G3-1_衛星設定（表示衛星タブ）.md` に「固定モード」を追加
- [x] `doc/30_画面設計/G2_メイン.md` の固定モードの説明へ、衛星設定が初期値になる旨を追記
- [x] 図を罫線で表現する場合は、全角文字により図が崩れないようスペースを調整する

## 検証

- [x] `npm run test` が通ること（PowerShellで実行）
- [ ] lint／フォーマットが通ること（`npm run format`）
- [ ] 衛星設定画面で固定モードが選択でき、OK/キャンセル/リセットが他項目と同様に動作する
- [ ] 固定モードを受信固定にした衛星で、AutoOn時にメイン画面が受信固定になる
- [ ] AutoOnで固定モードが異なる衛星へ切り替えたとき、メイン画面の固定モードが新しい衛星の値になる
- [ ] AutoOffで固定モードが異なる衛星へ切り替えても、メイン画面の固定モードは変わらない
- [ ] AutoOn中に衛星設定の固定モードを変更しても、追尾に即時反映されず、次回AutoOnで反映される
- [ ] 既存データ（固定モード項目なし）で、衛星固定として動作する
- [ ] 衛星固定の衛星で、AutoOn時の動作が従来と同じである
