# 改修タスクリスト

対象: `npm run lint` の warning/error のうち機械的に対応可能な235件（型安全性系430件は対象外・別タスク）。
方針の詳細は `2_design.md` を参照。

## Phase 0. lint設定の是正
- [x] `tsconfig.eslint.json` を新規作成（`tsconfig.json` を継承し `exclude` を空にする）
- [x] `eslint.config.js` の `parserOptions.project` を `./tsconfig.eslint.json` に変更
- [x] `npm run lint` を実行し、パースエラー（76件）が解消していることを確認
- [x] `npm run ts` / `npm run app:build` に影響がないことを確認

## Phase 1. Promise関連ルール（164件）✅完了
対象ルール: `no-floating-promises` / `require-await` / `no-misused-promises` / `await-thenable` / `unbound-method` / `prefer-promise-reject-errors` / `no-async-promise-executor`

修正方針の適用に伴い、以下のファイルもあわせて修正（Promiseを返さなくなったメソッドのシグネチャ変更に追随するため、ripple的に必要になった箇所）:
`RotatorControllerBase.ts`（main/renderer 両方、`doSetPosition`/`setPosition`のシグネチャを`void | Promise<void>`に拡張）、
`GroundStationService.ts`の`_calculatePassesInRangeAsync`/`_updateUnexploredTime`、
`OrbitLineService.ts`の`_getOrbitLineCachesAsync`、
`OverlapPassesService.ts`のPromise.allラップ除去。

- [x] `src/renderer/components/organisms/setting/RotatorSetting/RotatorConn/useRotatorCtrl.ts`（20件）
- [x] `src/main/common/SerialComm.ts`（12件）
- [x] `src/main/service/TransceiverSerivice.ts`（8件）
- [x] `src/main/initializeIpcEvent.ts`（7件）
- [x] `src/main/service/transceiver/controller/TransceiverIcomController.ts`（5件）
- [x] `src/main/menu.ts`（5件）
- [x] `src/main/main.ts`（4件）
- [x] `src/renderer/api/ApiTransceiver.ts`（4件）
- [x] `src/renderer/components/organisms/Radar/Radar.vue`（4件）
- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts`（4件）
- [x] `src/main/service/rotator/controller/RotatorRspUsbIoController.ts`（3件）
- [x] `src/renderer/components/organisms/OrbitLine/useOrbitLineList.ts`（3件）
- [x] `src/renderer/components/organisms/SatelliteSelectBox/useSatelliteSelectBox.ts`（3件）
- [x] `src/renderer/components/organisms/setting/GroundStationSetting/GroundStationSetting.vue`（3件）
- [x] `src/renderer/components/organisms/setting/RotatorSetting/RotatorSetting.vue`（3件）
- [x] `src/renderer/service/AntennaAutoTrackingService.ts`（3件）
- [x] `src/renderer/service/GroundStationService.ts`（3件）
- [x] `src/renderer/service/OrbitLineService.ts`（3件）
- [x] `src/main/service/rotator/controller/RotatorSerialControllerBase.ts`（2件）
- [x] `src/main/service/rotator/controller/RotatorSimController.ts`（2件）
- [x] `src/main/service/rotator/controller/RotatorSt2Controller.ts`（2件）
- [x] `src/renderer/api/ApiAntennaTracking.ts`（2件）
- [x] `src/renderer/common/hook/useValidate.ts`（2件）
- [x] `src/renderer/components/atoms/DigitTextField/DigitTextField.vue`（2件）
- [x] `src/renderer/components/molecules/RotatorDeviceSelect/useRotatorDevices.ts`（2件）
- [x] `src/renderer/components/molecules/TransceiverDeviceSelect/useTransceiverDevices.ts`（2件）
- [x] `src/renderer/components/organisms/Radar/useTracking.ts`（2件）
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/GroupSatellite/GroupSatellite.vue`（2件）
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/FrequencyEditor/EditFrequencySatelliteInfo/EditFrequencySatelliteInfo.vue`（2件）
- [x] `src/renderer/components/organisms/setting/TransceiverSetting/TransceiverSetting.vue`（2件）
- [x] `src/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.ts`（2件）
- [x] `src/renderer/components/organisms/TransceiverCtrl/TransceiverCtrl.vue`（2件）
- [x] 残り1件のファイル群（各1件）を対応済み:
  `src/__tests__/renderer/service/FrequencyTrackService.test.ts`,
  `src/main/service/I18nService.ts`,
  `src/main/service/rotator/controller/RotatorBtAzElController.ts`,
  `src/main/service/rotator/controller/RotatorControllerFactory.ts`,
  `src/main/service/RotatorService.ts`,
  `src/main/service/transceiver/controller/TransceiverControllerFactory.ts`,
  `src/main/service/transceiver/controller/TransceiverSerialControllerBase.ts`,
  `src/renderer/api/ApiActiveSat.ts`,
  `src/renderer/api/ApiAppConfig.ts`,
  `src/renderer/api/ApiCommon.ts`,
  `src/renderer/App.vue`,
  `src/renderer/components/atoms/ConfirmDialog/ConfirmDialog.vue`,
  `src/renderer/components/molecules/CycleButton/CycleButton.vue`,
  `src/renderer/components/molecules/SerialPortSelect/SerialPortSelect.vue`,
  `src/renderer/components/organisms/Map/useMap.ts`,
  `src/renderer/components/organisms/Radar/useDrawRadar.ts`,
  `src/renderer/components/organisms/Radar/useDrawSatPass.ts`,
  `src/renderer/components/organisms/Satellite/SatelliteLocation/SatelliteLocation.vue`,
  `src/renderer/components/organisms/Satellite/SatelliteLocation/useSatelliteLocation.ts`,
  `src/renderer/components/organisms/Satellite/VisibilityRange/useVisibilityDashRange.ts`,
  `src/renderer/components/organisms/Satellite/VisibilityRange/useVisibilityRange.ts`,
  `src/renderer/components/organisms/SatelliteGroupSelectBox/useSatelliteGroupSelectBox.ts`,
  `src/renderer/components/organisms/SatelliteSelectBox/SatelliteSelectBox.vue`,
  `src/renderer/components/organisms/setting/RotatorSetting/RotatorConn/useRotatorMonitor.ts`,
  `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfo.vue`,
  `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/RegistSatellite.vue`,
  `src/renderer/components/organisms/setting/SatelliteSetting/LoadTLE/LoadTLETab.vue`,
  `src/renderer/components/organisms/setting/SatelliteSetting/LoadTLE/useLoadTLE.ts`,
  `src/renderer/components/organisms/setting/SatelliteSetting/SatelliteSetting.vue`,
  `src/renderer/components/organisms/TransceiverCtrl/useOrbitalPassList.ts`,
  `src/renderer/components/organisms/TransceiverCtrl/useOverlapPassList.ts`,
  `src/renderer/components/pages/dev/RotatorSim/AppRotatorSim.vue`,
  `src/renderer/components/pages/dev/RotatorSim/RotatorSim.vue`,
  `src/renderer/main.ts`,
  `src/renderer/service/OverlapPassesService.ts`,
  `src/renderer/service/rotator/AzElBtController.ts`,
  `src/renderer/service/rotator/DevAntennaController.ts`,
  `src/renderer/service/rotator/RotatorControllerFactory.ts`,
  `src/renderer/service/rotator/St2Controller.ts`
- [x] `npm run lint` を実行し、Phase 1 対象ルールが0件であることを確認（達成）
- [x] `npm run test` を実行し、既存テストが成功することを確認（772件中771件成功。1件の失敗は`DefaultSatelliteService.test.ts`で本改修と無関係な既存の失敗であることを、変更前コードでも同じ失敗が再現することで確認済み）

## Phase 2. 未使用変数・Vue prop型・軽微な構文ルール（71件）✅完了
対象ルール: `no-unused-vars` / `vue/require-prop-types` / `consistent-type-imports` / `eqeqeq` / `no-fallthrough` / `no-useless-escape` / `no-empty-object-type` / `ban-types` / `no-irregular-whitespace` / `no-prototype-builtins` / `no-empty-pattern`

備考: `src/__tests__/playwright/fixtures.ts` の `no-empty-pattern`（`async ({}, use) => {`）は、Playwrightのfixture定義における「依存fixtureなし」を表す慣例的記法のため、構文変更ではなくインラインdisableコメントで対応した。

- [x] `eslint.config.js`: `@typescript-eslint/no-unused-vars` に `ignoreRestSiblings: true` を追加
- [x] `src/main/initializeIpcEvent.ts`（18件、関数引数に `_` プレフィックス）
- [x] `src/__tests__/main/util/FileTransaction.test.ts`（6件）
- [x] `src/main/service/transceiver/controller/TransceiverIcomController.ts`（4件）
- [x] `src/renderer/env.d.ts`（3件、`ban-types`→`no-empty-object-type` へのdisableコメント修正）
- [x] `src/main/preload.ts`（3件）
- [x] `src/renderer/components/organisms/setting/GroundStationSetting/GroundStationSetting.vue`（3件）
- [x] `src/main/main.ts`（2件）
- [x] `src/main/service/rotator/controller/RotatorRspUsbIoController.ts`（2件）
- [x] `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/useValidateTle.ts`（2件）
- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts`（2件）
- [x] 残りのファイル群（各1件）を対応済み:
  `src/__tests__/main/util/OmmUtil.test.ts`,
  `src/__tests__/playwright/fixtures.ts`,
  `src/__tests__/renderer/service/OrbitLineService.test.ts`,
  `src/common/CommonUtil.ts`,
  `src/common/util/DefaultSatelliteUtil.ts`,
  `src/common/util/TransceiverUtil.ts`,
  `src/main/common/SerialComm.ts`,
  `src/main/service/AppConfigImportSerivce.ts`,
  `src/main/service/RepoFrequencyService.ts`,
  `src/main/service/rotator/controller/RotatorBtAzElController.ts`,
  `src/main/service/rotator/controller/RotatorSerialControllerBase.ts`,
  `src/main/service/rotator/controller/RotatorSt2Controller.ts`,
  `src/main/service/transceiver/controller/TransceiverSerialControllerBase.ts`,
  `src/renderer/components/atoms/ConfirmDialog/ConfirmDialog.vue`,
  `src/renderer/components/molecules/CycleButton/CycleButton.vue`,
  `src/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue`,
  `src/renderer/components/molecules/OpeModeSelect/OpeModeSelect.vue`,
  `src/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialogValidate.ts`,
  `src/renderer/components/molecules/TleUrlEditableCheckbox/TleUrlEditableCheckbox.vue`,
  `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/useRegistSatelliteValidate.ts`,
  `src/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConn.vue`,
  `src/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/useTransceiverTestConnect.ts`,
  `src/renderer/main.ts`,
  `src/renderer/service/AntennaAutoTrackingService.ts`,
  `src/renderer/util/AppConfigUtil.ts`,
  `src/renderer/util/CanvasUtil.ts`
- [x] `npm run lint` を実行し、Phase 2 対象ルールが0件であることを確認（達成）
- [x] `npm run test` を実行し、既存テストが成功することを確認（772件中771件成功。1件は本改修と無関係な既存の失敗）

## 完了確認
- [x] `npm run lint` を再実行し、機械的対応対象ルールが0件であることを確認（達成。残存402件はすべて型安全性系の対象外ルール）
- [x] `npm run test` を実行し、全テストが成功することを確認（772件中771件成功。既知の無関係な1件を除く）
- [ ] `/doc` 配下に本改修に関連するドキュメントがあれば更新
