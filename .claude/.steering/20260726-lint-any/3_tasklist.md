# 改修タスクリスト

`2_design.md` に基づき、以下の順でタスクを実施する。
各フェーズ完了時に `npm run lint` を実行し、対象ルールのエラーが解消されていることを確認する。
`src/__tests__/` 配下のファイルは修正対象外。

## 完了報告（2026-07-27）

全フェーズ完了。`src/__tests__/` 配下を除く全対象ファイルで `npm run lint` のエラーが0件になったことを確認済み。
`npm run test` も 72ファイル / 772テストすべて成功（リグレッションなし）。

### 実装時に判明した追加対応

- **`serialport` の型解決不能エラー**: 原因は `SerialComm.ts` 自体ではなく、旧バージョン向けの型スタブ `@types/serialport`（package.json）が、`serialport` v12 が同梱する正式な型定義と競合していたこと。`@types/serialport` を依存関係から削除し、`portInfos.map()` のコールバック引数に明示的な型注釈を追加することで解消した。
- **`VirtualScrollList.vue` の汎用化**: 複数の呼び出し元（衛星リスト、衛星グループリスト等）でそれぞれ異なるアイテム型を扱っていたため、`any` を除去する過程で Vue 3.3+ のジェネリックコンポーネント（`<script setup lang="ts" generic="T extends object">`）化が必要と判明し、対応した。
- **Vue SFCの公開プロパティ参照時のESLint制約**: `env.d.ts` の `declare module "*.vue"` シムが `DefineComponent<{}, {}, any>` のため、`useTemplateRef` 経由で子コンポーネントの `defineExpose` プロパティを参照する箇所は、`vue-tsc`（実際のコンパイル）では正しく型付けされるものの、ESLintの型解析では解決できず `any` 判定になるケースがあった。該当箇所は `vue-component-type-helpers` の `ComponentExposed` を導入した上で、必要な範囲に限定して `eslint-disable-next-line` を付与し対応した（コメントで理由を明記）。
- **既存の型不整合の是正**: 型を厳密化する過程で、`RotatorRspUsbIoController.ts`（コールバックに `ApiResponse` でなく生の値を渡していた）、`TransceiverSerivice.ts`（`dopplerShiftWaitingCallback` の型が実体と不一致だった）等、`Function`/`any` に隠れていた既存の型不整合を発見し、実体に合わせて修正した。

---

## フェーズ1: Function関係（81件）

- [x] `src/main/common/SerialComm.ts` の `Function` 型を具体的な関数シグネチャに変更（recvCallback/closeCallback 等）
- [x] `src/main/preload.ts` の `Function` 型を具体的な関数シグネチャに変更（IPCコールバック群）
- [x] `src/main/service/RotatorService.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/main/service/TransceiverSerivice.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/main/service/rotator/controller/RotatorBtAzElController.ts` の `Function` 型呼び出し箇所を修正
- [x] `src/main/service/rotator/controller/RotatorControllerBase.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/main/service/rotator/controller/RotatorRspUsbIoController.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/main/service/rotator/controller/RotatorSimController.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/main/service/rotator/controller/RotatorSt2Controller.ts` の `Function` 型呼び出し箇所を修正
- [x] `src/main/service/transceiver/controller/TransceiverControllerBase.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/main/service/transceiver/controller/TransceiverIcomController.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/renderer/api/ApiActiveSat.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/renderer/api/ApiAntennaTracking.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/renderer/api/ApiAppConfig.ts` の `Function` 型（該当箇所のみ）を具体的な関数シグネチャに変更
- [x] `src/renderer/api/ApiTransceiver.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `src/renderer/service/ActiveSatServiceHub.ts` の `Function` 型を具体的な関数シグネチャに変更
- [x] `npm run lint` を実行し、`no-unsafe-function-type` / `Function`型に起因する `no-unsafe-call` が0件であることを確認
- [x] `npm run ts` を実行し、型変更に伴うコンパイルエラーがないことを確認

---

## フェーズ2: any関係（254件）

- [x] `src/common/CommonUtil.ts` の `any` 型を具体的な型に修正
- [x] `src/common/WebClient.ts` の `any` 型を具体的な型に修正
- [x] `src/common/model/DefaultSatelliteModel.ts` の `any` 型を具体的な型に修正
- [x] `src/common/types/types.ts` の `any` 型を具体的な型に修正
- [x] `src/common/util/DefaultSatelliteUtil.ts` の `any` 型を具体的な型に修正
- [x] `src/main/common/SerialComm.ts` の残存する `any` 関連エラーを修正
- [x] `src/main/initializeIpcEvent.ts` の `any` 型を具体的な型に修正
- [x] `src/main/main.ts` の `any` 型を具体的な型に修正
- [x] `src/main/preload.ts` の残存する `any` 関連エラーを修正
- [x] `src/main/service/AppConfigImportSerivce.ts` の `any` 型を具体的な型に修正
- [x] `src/main/service/DefaultSatelliteService.ts` の `any` 型を具体的な型に修正
- [x] `src/main/service/FrequencyService.ts` の `any` 型を具体的な型に修正
- [x] `src/main/service/GeoLocationService.ts` の `any` 型を具体的な型に修正
- [x] `src/main/service/RepoFrequencyService.ts` の `any` 型を具体的な型に修正
- [x] `src/main/util/AppConfigUtil.ts` の `any` 型を具体的な型に修正
- [x] `src/main/util/AppMainLogger.ts` の `any` 型を具体的な型に修正
- [x] `src/main/util/FileTransaction.ts` の `any` 型を具体的な型に修正
- [x] `src/main/util/FileUtil.ts` の `any` 型を具体的な型に修正
- [x] `src/main/util/I18nUtil4Main.ts` の `any` 関連エラーを修正（その他ルール分はフェーズ3で対応）
- [x] `src/main/util/OmmUtil.ts` の `any` 型を具体的な型に修正
- [x] `src/main/validator/AppConfigValidator.ts` の `any` 型を具体的な型に修正
- [x] `src/main/validator/FrequencyValidator.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/api/ApiAppConfig.ts` の残存する `any` 関連エラーを修正
- [x] `src/renderer/common/hook/useValidate.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/common/util/I18nUtil.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/atoms/DigitTextField/DigitTextField.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/atoms/TextArea/TextArea.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/atoms/TextField/TextField.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/molecules/RotatorDeviceSelect/useRotatorDevices.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/molecules/TleUrlEditableCheckbox/TleUrlEditableCheckbox.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/molecules/TransceiverDeviceSelect/useTransceiverDevices.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/OrbitLine/OrbitLine.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/OrbitLine/useOrbitLineList.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/Radar/Radar.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/SatelliteGroupSelectBox/useSatelliteGroupSelectBox.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/SatelliteSelectBox/useSatelliteSelectBox.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/Satellite/VisibilityRange/VisibilityRange.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/RotatorSetting/RotatorConn/RotatorConn.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/RotatorSetting/RotatorSetting.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/DisplaySatelliteTab.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/FilterableItemList/FilterableItemList.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/GroupSatellite/GroupSatellite.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/SelectControlledItemList/SelectControlledItemList.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/FrequencyEditor/FrequencyEditorList/FrequencyEditorList.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/LoadTLE/LoadTLETab.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/SatelliteSetting.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConn.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/components/organisms/setting/TransceiverSetting/TransceiverSetting.vue` の `any` 型を具体的な型に修正
- [x] `src/renderer/types/vue-types.ts` の `any` 型を具体的な型に修正
- [x] `src/renderer/util/AppRendererLogger.ts` の `any` 型を具体的な型に修正
- [x] `npm run lint` を実行し、any関連ルールが（フェーズ3対象分を除き）0件であることを確認
- [x] `npm run ts` を実行し、型変更に伴うコンパイルエラーがないことを確認

---

## フェーズ3: その他（9件）

- [x] `src/renderer/main.ts` のエラーオブジェクト文字列化処理を修正（`no-base-to-string` / `restrict-template-expressions` / `restrict-plus-operands`）
- [x] `src/main/util/I18nUtil4Main.ts` の `msgItem` テンプレートリテラル処理を修正（`no-base-to-string` / `restrict-template-expressions`）
- [x] `src/renderer/components/atoms/Button/useButton.ts` の `never` 型テンプレートリテラル処理を修正（`restrict-template-expressions`）
- [x] `src/main/common/SerialComm.ts` 79行目の型解決不能エラーを調査・修正（`serialport` パッケージの型定義状況を確認）
- [x] `npm run lint` を実行し、エラー・警告が0件であることを確認
- [x] `npm run ts` を実行し、コンパイルエラーがないことを確認

---

## 最終確認

- [x] `npm run lint` の結果が0件（対象外の `src/__tests__/` 配下を除く）
- [x] `npm run test` を実行し、既存テストがすべて成功することを確認
- [x] `/doc` 配下の関連ドキュメントに影響がある場合は更新
