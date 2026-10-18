# 改修プラン

## 概要

`npm run lint` を実行した結果、401件のエラー（警告0件）が検出された。
このうち `src/__tests__/` 配下のファイルは対象外とするため、実質対応対象は **344件**。

要求事項に従い、以下3フェーズの順で対応する。

1. Function関係
2. any関係
3. その他

## lint結果の集計（`src/__tests__/` 配下を除く）

| フェーズ | 該当ルール | 件数 |
| --- | --- | --- |
| 1. Function関係 | `@typescript-eslint/no-unsafe-function-type`（42） + `@typescript-eslint/no-unsafe-call`（`Function`型の値の呼び出し、39） | **81** |
| 2. any関係 | `no-explicit-any` / `no-unsafe-assignment` / `no-unsafe-member-access` / `no-unsafe-return` / `no-unsafe-call`（`any`型の値の呼び出し）/ `no-unsafe-argument` / `no-redundant-type-constituents` | **254** |
| 3. その他 | `no-base-to-string` / `restrict-template-expressions` / `restrict-plus-operands` / SerialComm.ts固有の型解決不能エラー | **9** |
| （対象外）テスト | 上記と同種のルールがテストコードに57件 | 57（対象外） |

合計 344 + 57 = 401件で一致。

---

## フェーズ1: Function関係（81件）

### 内容
`Function` 型（TypeScriptの組み込み汎用関数型）をプロパティ・引数・戻り値の型として使用している箇所（`no-unsafe-function-type`）と、それに起因して当該変数を呼び出す際に発生する `no-unsafe-call`（`Function`型の値の呼び出し）。

### 対応方針
`Function` 型を、実際の呼び出し・代入元の使用実態に合わせた具体的な関数シグネチャ（例: `(data: string) => void`、`(err: Error | null) => void` 等）に置き換える。これにより、型が確定するため関連する `no-unsafe-call` も同時に解消される想定。

### 対象ファイル（16ファイル）
- `src/main/common/SerialComm.ts`
- `src/main/preload.ts`
- `src/main/service/RotatorService.ts`
- `src/main/service/TransceiverSerivice.ts`
- `src/main/service/rotator/controller/RotatorBtAzElController.ts`
- `src/main/service/rotator/controller/RotatorControllerBase.ts`
- `src/main/service/rotator/controller/RotatorRspUsbIoController.ts`
- `src/main/service/rotator/controller/RotatorSimController.ts`
- `src/main/service/rotator/controller/RotatorSt2Controller.ts`
- `src/main/service/transceiver/controller/TransceiverControllerBase.ts`
- `src/main/service/transceiver/controller/TransceiverIcomController.ts`
- `src/renderer/api/ApiActiveSat.ts`
- `src/renderer/api/ApiAntennaTracking.ts`
- `src/renderer/api/ApiAppConfig.ts`
- `src/renderer/api/ApiTransceiver.ts`
- `src/renderer/service/ActiveSatServiceHub.ts`

---

## フェーズ2: any関係（254件）

### 内容
`any` 型の明示的使用、およびそれに起因する波及的なエラー群。

### 対応方針
- 型が判明している場合は、具体的な型・interface・ジェネリクスを付与する（IPC引数、APIレスポンス、モデルクラス等）。
- 外部境界（JSON.parse結果、外部ライブラリ戻り値など）から来る値で型が不明な場合は、`any` を `unknown` に変更し、型ガードで絞り込んでから使用する。
- `no-redundant-type-constituents`（union型内で `any` が他の型を無効化しているケース）は、`any` をunionから除去する。
- 上記の型付けにより、波及的な `no-unsafe-assignment` / `no-unsafe-return` / `no-unsafe-member-access` / `no-unsafe-argument` / `no-unsafe-call`（any型）は連動して解消される想定。

### 対象ファイル（54ファイル）
- `src/common/CommonUtil.ts`
- `src/common/WebClient.ts`
- `src/common/model/DefaultSatelliteModel.ts`
- `src/common/types/types.ts`
- `src/common/util/DefaultSatelliteUtil.ts`
- `src/main/common/SerialComm.ts`（Function関係の対応後も残るany関連分）
- `src/main/initializeIpcEvent.ts`
- `src/main/main.ts`
- `src/main/preload.ts`（Function関係の対応後も残るany関連分）
- `src/main/service/AppConfigImportSerivce.ts`
- `src/main/service/DefaultSatelliteService.ts`
- `src/main/service/FrequencyService.ts`
- `src/main/service/GeoLocationService.ts`
- `src/main/service/RepoFrequencyService.ts`
- `src/main/util/AppConfigUtil.ts`
- `src/main/util/AppMainLogger.ts`
- `src/main/util/FileTransaction.ts`
- `src/main/util/FileUtil.ts`
- `src/main/util/I18nUtil4Main.ts`（any関連分のみ。その他ルール分はフェーズ3）
- `src/main/util/OmmUtil.ts`
- `src/main/validator/AppConfigValidator.ts`
- `src/main/validator/FrequencyValidator.ts`
- `src/renderer/api/ApiAppConfig.ts`（Function関係の対応後も残るany関連分）
- `src/renderer/common/hook/useValidate.ts`
- `src/renderer/common/util/I18nUtil.ts`
- `src/renderer/components/atoms/DigitTextField/DigitTextField.vue`
- `src/renderer/components/atoms/TextArea/TextArea.vue`
- `src/renderer/components/atoms/TextField/TextField.vue`
- `src/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue`
- `src/renderer/components/molecules/RotatorDeviceSelect/useRotatorDevices.ts`
- `src/renderer/components/molecules/TleUrlEditableCheckbox/TleUrlEditableCheckbox.vue`
- `src/renderer/components/molecules/TransceiverDeviceSelect/useTransceiverDevices.ts`
- `src/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue`
- `src/renderer/components/organisms/OrbitLine/OrbitLine.vue`
- `src/renderer/components/organisms/OrbitLine/useOrbitLineList.ts`
- `src/renderer/components/organisms/Radar/Radar.vue`
- `src/renderer/components/organisms/SatelliteGroupSelectBox/useSatelliteGroupSelectBox.ts`
- `src/renderer/components/organisms/SatelliteSelectBox/useSatelliteSelectBox.ts`
- `src/renderer/components/organisms/Satellite/VisibilityRange/VisibilityRange.vue`
- `src/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.ts`
- `src/renderer/components/organisms/setting/RotatorSetting/RotatorConn/RotatorConn.vue`
- `src/renderer/components/organisms/setting/RotatorSetting/RotatorSetting.vue`
- `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/DisplaySatelliteTab.vue`
- `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/FilterableItemList/FilterableItemList.vue`
- `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/GroupSatellite/GroupSatellite.vue`
- `src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/SelectControlledItemList/SelectControlledItemList.vue`
- `src/renderer/components/organisms/setting/SatelliteSetting/FrequencyEditor/FrequencyEditorList/FrequencyEditorList.vue`
- `src/renderer/components/organisms/setting/SatelliteSetting/LoadTLE/LoadTLETab.vue`
- `src/renderer/components/organisms/setting/SatelliteSetting/SatelliteSetting.vue`
- `src/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConn.vue`
- `src/renderer/components/organisms/setting/TransceiverSetting/TransceiverSetting.vue`
- `src/renderer/types/vue-types.ts`
- `src/renderer/util/AppRendererLogger.ts`

---

## フェーズ3: その他（9件）

### 内容と対応方針

| ファイル | 行 | ルール | 内容 | 対応方針 |
| --- | --- | --- | --- | --- |
| `src/renderer/main.ts` | 100, 101 | `no-base-to-string` / `restrict-template-expressions` / `restrict-plus-operands` | catch節の `event`（`string \| Event`）をテンプレートリテラルや `+` 演算子でそのまま文字列結合している | `event instanceof Event` 等で判定し、文字列化可能な形に変換してから結合する |
| `src/main/util/I18nUtil4Main.ts` | 22 | `no-base-to-string` / `restrict-template-expressions` | `msgItem`（`I18nMsgItem`型）をテンプレートリテラルにそのまま埋め込んでいる | `msgItem` の適切なプロパティ（メッセージ文字列）を参照するよう修正 |
| `src/renderer/components/atoms/Button/useButton.ts` | 33 | `restrict-template-expressions` | `never` 型の値をテンプレートリテラルに埋め込んでいる（switch文の網羅性チェック漏れの可能性） | switch文の分岐を確認し、到達し得るケースの型を見直す |
| `src/main/common/SerialComm.ts` | 79 | `no-unsafe-return` / `no-unsafe-member-access`（型解決不能） | `SerialPort.list()` の戻り値の型（`portInfo.path`）が解決できていない | `serialport` パッケージの型定義の解決状況を調査し、必要に応じて型を明示 |

---

## リスク・注意点

- 400件規模の広範囲な修正のため、各ファイル修正後に `npm run lint` と `npm run ts` を実行し、新たなエラーが発生していないか確認する。
- 型を厳密化することで、呼び出し元コードにも修正が波及する可能性がある。
- 挙動を変えないよう、可能な範囲で `npm run test` を実行して既存テストが通ることを確認する。
- `src/__tests__/` 配下は要求により対象外のため、テスト内の `any` 起因エラー（57件）は残る。
