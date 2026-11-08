# 改修タスクリスト：Beacon対応

設計は [`2_design.md`](./2_design.md) を参照。

## 実装

### 新規クラス

- [x] `managers/TransceiverBeaconMgr.ts`：`BeaconSavedState` の記録・取得・破棄、ビーコンのRx基準周波数の設定・取得・ホイール分の反映（設計 3.1、3.2）
- [x] `coordinators/TransceiverBeaconCoordinator.ts`：`start` / `stop`（周期処理を再開しないオプション付き）/ `resumeOnAutoStart`（設計 3.3、3.5、3.8）

### 周波数算出

- [x] `TransceiverDopplerCalc.ts`：`calcRxBaseFreqByShiftedRxFreq` を追加（設計 3.4）
- [x] `TransceiverFreqCoordinator.ts`：`updateRxFreqWithDopplerShift` に基準周波数の引数を追加（省略時は `rxBaseFreq`）
- [x] `TransceiverRecvFreqResolver.ts`：Auto ON かつ Beacon 中は、ビーコンのRx基準周波数だけを更新する（`isBeaconMode` と `TransceiverBeaconMgr` を受け取る）

### モード遷移の整理

- [x] `TransceiverModeCoordinator.ts`：`startBeaconMode` / `stopBeaconMode` / `saveFreqAndOpeModeInModeStart` / `restoreSavedFreqAndOpeMode` を削除。`ModeCoordinatorState` から `isBeaconMode` / `savedTxOpeMode` / `savedRxOpeMode` を削除（設計 3.9）
- [x] `TransceiverModeCoordinator.ts`：`startAutoMode` の引数をオプションオブジェクト（`applyDopplerShiftMode` / `onBeforeAutoOn`）に変更（設計 3.8）
- [x] `TransceiverModeCoordinator.ts`：`syncTransceiverSettingFromActiveSat()` を追加（無線設定の変化を判定。設計 3.7）
- [x] `TransceiverModeSettingResolver.ts`：`resolveOnModeStart` から `isBeaconMode` 引数をなくす。`resolveBeaconModeSetting` を `public` にする。`resolveWhenBeaconOffInAuto` を削除（設計 3.9）

### composable（`useTransceiverCtrl.ts`）

- [x] `TransceiverBeaconMgr` / `TransceiverBeaconCoordinator` を生成し、`toggleBeaconMode()` と `canUseBeacon`（`isBeaconModeAvailable && isSatelliteMode`）を返す
- [x] `watch(isBeaconMode)`、`savedTxOpeMode`、`savedRxOpeMode` を削除
- [x] `applyDopplerShiftCorrections`：Beacon 中は、ビーコンのRx基準周波数でRxを更新する（設計 3.4）
- [x] `onDiffRxFrequencyChanged`：Beacon 中は、ビーコンのRx基準周波数にだけ反映し、Txは連動させない
- [x] `stopAutoMode`：Beacon 中なら、周期処理を再開しない `stop` の後に Auto を停止する（設計 3.7 #1）
- [x] `startAutoMode`：Beacon 中は、衛星設定のサテライトモードが無効なら先に `stop`、有効ならオプションを渡して Beacon を引き継ぐ（設計 3.7 #5、3.8）
- [x] `onChangeSatGrp`：Beacon 中で衛星・無線設定に変化がなければ何もしない。変化があれば `stop` してから既存の処理（設計 3.7 #2、#3）
- [x] サテライトモードの変更関数を追加：Beacon 中は `stop` してから `satelliteMode` を変更する（設計 3.7 #4）

### 画面（`TransceiverCtrl.vue`）

- [x] Beacon ボタン：`:disabled="!canUseBeacon"`、処理中の `:loading` とクリック無視
- [x] `beaconBtnClick`：開発中通知を削除し、`toggleBeaconMode()` を `await` する
- [x] `DopplerShiftModeSelect`：`:disabled="isBeaconMode"`（ルート要素が `v-select` のため属性として引き継がれる。`DopplerShiftModeSelect.vue` は変更なし）
- [x] サテライトモードのボタン：`:mode` と `@update:mode` に分け、composable の変更関数を呼ぶ（`CycleButton` の `defineModel` が、親で値を更新しない場合も表示がずれないことを確認）
- [x] `autoBtnClick` と `watch(autoStore.tranceiverAuto)`：`isBeaconMode.value = false` を削除

## 単体テスト

- [x] `TransceiverBeaconMgr` のテストを追加
- [x] `TransceiverBeaconCoordinator_start` のテストを追加（Auto ON/OFF、ドップラー有効範囲外）
- [x] `TransceiverBeaconCoordinator_stop` のテストを追加（Auto ON の衛星固定/受信固定/送信固定、Auto OFF、周期処理を再開しないオプション）
- [x] `TransceiverBeaconCoordinator_resumeOnAutoStart` のテストを追加
- [x] `TransceiverModeCoordinator_startAutoMode`：オプションのテストを追加し、既存テストを新しい引数の形に合わせる
- [x] `TransceiverModeCoordinator_syncTransceiverSettingFromActiveSat` のテストを追加
- [x] `TransceiverModeSettingResolver_*`：`resolveOnModeStart` の修正、`resolveWhenBeaconOffInAuto` のテスト削除、`resolveBeaconModeSetting` のテスト追加
- [x] `TransceiverRecvFreqResolver_applyFromTransceiver`：Beacon 中のケースを追加
- [x] `TransceiverDopplerCalc`：`calcRxBaseFreqByShiftedRxFreq` のテストを追加
- [x] `TransceiverFreqCoordinator`：`updateRxFreqWithDopplerShift` に基準周波数を渡すケースを追加
- [x] 既存テストへの影響確認（`npm run test`）

## ドキュメント

- [x] `doc/30_画面設計/G2_メイン.md`：2.3.7 Beacon、2.3.2 Dopplerモード、3.3 イベント一覧、5 相関チェックを更新（2.3.8 / 2.3.9 は編集しない）
- [x] 表は全角文字の幅を考慮して列をそろえる

## E2Eテスト（区分A。詳細は [`4_e2e_test.md`](./4_e2e_test.md)）

- [x] `src/main/util/E2eUserDataPath.ts` を追加し、`main.ts` の最初に読み込む（環境変数 `RST_E2E_USER_DATA_DIR` でユーザデータディレクトリを切り替え）
- [x] `fixtures.ts`：`testData` オプション（一時ディレクトリにテストデータを置いて起動）、`ELECTRON_RUN_AS_NODE` の除去
- [x] `helpers/beaconTestData.ts`：テスト用の衛星B/N/S、設定ファイル
- [x] `TransceiverCtrl.vue`：E2E 用の `data-testid` を追加
- [x] `beacon.test.ts`：A-01〜A-06、B-01〜B-09、E-01〜E-03、E-05、E-06
- [x] E2E の実行（既存の2件を含む14件すべて成功）

## 検証

- [x] `npm run test` が通ること（PowerShellで実行）：868件成功、1件失敗。失敗は `OverlapPassesService.test.ts` の1件で、今回の変更を外した状態でも失敗するため対象外
- [x] lint／フォーマットが通ること：変更したファイルで eslint・prettier を確認（`npm run format` は全ファイルを書き換えるため未実行）
- [ ] ビーコン周波数がない衛星、サテライトモードOFFの場合は、Beacon ボタンが非活性
- [ ] Auto OFF：Beacon ON で Rx がビーコン周波数・ビーコン運用モード、固定モードが衛星固定（選択不可）になり、OFF で元に戻る
- [ ] Auto ON・衛星固定：Beacon ON で Rx がビーコン周波数＋ドップラーになり、Rx・Tx とも追尾が続く。OFF で Beacon 前の基準周波数＋ドップラーに戻る
- [ ] Auto ON・受信固定：OFF で Rx が記録した固定値、Tx が受信固定の算出値になり、固定モードが受信固定に戻る
- [ ] Auto ON・送信固定：OFF で Tx が記録した固定値、Rx が送信固定の算出値になり、固定モードが送信固定に戻る
- [ ] Beacon 中に無線機のダイヤルで Rx を微調整すると、その後の追尾に反映され、Tx は連動しない。OFF 後には反映されない
- [ ] Beacon 中に画面で Tx を微調整すると、その後の Tx の追尾に反映され、OFF 後には反映されない
- [ ] Beacon 中に Rx 補正値を変えても、ビーコンの Rx には加わらず、OFF 後の通常追尾に反映される
- [ ] Auto ON・Beacon ON で Auto OFF：Beacon が OFF になり、周波数が従来どおり Auto 開始時に設定した周波数に戻る
- [ ] Auto OFF → Beacon ON → Auto ON：Beacon のまま追尾が始まる。Beacon OFF で衛星設定の周波数＋ドップラーに戻り、固定モードは Beacon ON 時の値に戻る。続けて Auto OFF で、従来どおり Auto 開始時に設定した周波数（衛星設定の周波数）に戻る
- [ ] Beacon 中の衛星切替：Beacon が OFF になり、Auto ON なら新しい衛星で Auto が開始し直される
- [ ] Beacon 中に同一衛星のビーコン周波数を変更して保存：Beacon が OFF になる
- [ ] Beacon 中に、概要のみの保存や最小仰角の変更をしても、Beacon と追尾が続く
- [ ] Beacon 中にサテライトモードを OFF：Beacon が OFF になり、サテライトモードの切替が従来どおり動く
- [ ] Beacon を使わない場合の Auto の動作（各固定モード、衛星切替、ダイヤル操作）が従来と同じ
