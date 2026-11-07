# 改修タスクリスト：Beacon対応

設計は [`2_design.md`](./2_design.md) を参照。

## 実装

### 新規クラス

- [ ] `managers/TransceiverBeaconMgr.ts`：`BeaconSavedState` の記録・取得・破棄、ビーコンのRx基準周波数の設定・取得・ホイール分の反映（設計 3.1、3.2）
- [ ] `coordinators/TransceiverBeaconCoordinator.ts`：`start` / `stop`（周期処理を再開しないオプション付き）/ `resumeOnAutoStart`（設計 3.3、3.5、3.8）

### 周波数算出

- [ ] `TransceiverDopplerCalc.ts`：`calcRxBaseFreqByShiftedRxFreq` を追加（設計 3.4）
- [ ] `TransceiverFreqCoordinator.ts`：`updateRxFreqWithDopplerShift` に基準周波数の引数を追加（省略時は `rxBaseFreq`）
- [ ] `TransceiverRecvFreqResolver.ts`：Auto ON かつ Beacon 中は、ビーコンのRx基準周波数だけを更新する（`isBeaconMode` と `TransceiverBeaconMgr` を受け取る）

### モード遷移の整理

- [ ] `TransceiverModeCoordinator.ts`：`startBeaconMode` / `stopBeaconMode` / `saveFreqAndOpeModeInModeStart` / `restoreSavedFreqAndOpeMode` を削除。`ModeCoordinatorState` から `isBeaconMode` / `savedTxOpeMode` / `savedRxOpeMode` を削除（設計 3.9）
- [ ] `TransceiverModeCoordinator.ts`：`startAutoMode` の引数をオプションオブジェクト（`applyDopplerShiftMode` / `preAutoFreq` / `onBeforeAutoOn`）に変更（設計 3.8）
- [ ] `TransceiverModeCoordinator.ts`：`syncTransceiverSettingFromActiveSat()` を追加（無線設定の変化を判定。設計 3.7）
- [ ] `TransceiverModeSettingResolver.ts`：`resolveOnModeStart` から `isBeaconMode` 引数をなくす。`resolveBeaconModeSetting` を `public` にする。`resolveWhenBeaconOffInAuto` を削除（設計 3.9）

### composable（`useTransceiverCtrl.ts`）

- [ ] `TransceiverBeaconMgr` / `TransceiverBeaconCoordinator` を生成し、`toggleBeaconMode()` と `canUseBeacon`（`isBeaconModeAvailable && isSatelliteMode`）を返す
- [ ] `watch(isBeaconMode)`、`savedTxOpeMode`、`savedRxOpeMode` を削除
- [ ] `applyDopplerShiftCorrections`：Beacon 中は、ビーコンのRx基準周波数でRxを更新する（設計 3.4）
- [ ] `onDiffRxFrequencyChanged`：Beacon 中は、ビーコンのRx基準周波数にだけ反映し、Txは連動させない
- [ ] `stopAutoMode`：Beacon 中なら、周期処理を再開しない `stop` の後に Auto を停止する（設計 3.7 #1）
- [ ] `startAutoMode`：Beacon 中は、衛星設定のサテライトモードが無効なら先に `stop`、有効ならオプションを渡して Beacon を引き継ぐ（設計 3.7 #5、3.8）
- [ ] `onChangeSatGrp`：Beacon 中で衛星・無線設定に変化がなければ何もしない。変化があれば `stop` してから既存の処理（設計 3.7 #2、#3）
- [ ] サテライトモードの変更関数を追加：Beacon 中は `stop` してから `satelliteMode` を変更する（設計 3.7 #4）

### 画面（`TransceiverCtrl.vue`）

- [ ] Beacon ボタン：`:disabled="!canUseBeacon"`、処理中の `:loading` とクリック無視
- [ ] `beaconBtnClick`：開発中通知を削除し、`toggleBeaconMode()` を `await` する
- [ ] `DopplerShiftModeSelect`：`:disabled="isBeaconMode"`（`v-select` に引き継がれるか確認。引き継がれなければ `DopplerShiftModeSelect.vue` に `disabled` を追加）
- [ ] サテライトモードのボタン：`:mode` と `@update:mode` に分け、composable の変更関数を呼ぶ（`CycleButton` の `defineModel` が、親で値を更新しない場合も表示がずれないことを確認）
- [ ] `autoBtnClick` と `watch(autoStore.tranceiverAuto)`：`isBeaconMode.value = false` を削除

## 単体テスト

- [ ] `TransceiverBeaconMgr` のテストを追加
- [ ] `TransceiverBeaconCoordinator_start` のテストを追加（Auto ON/OFF、ドップラー有効範囲外）
- [ ] `TransceiverBeaconCoordinator_stop` のテストを追加（Auto ON の衛星固定/受信固定/送信固定、Auto OFF、周期処理を再開しないオプション）
- [ ] `TransceiverBeaconCoordinator_resumeOnAutoStart` のテストを追加
- [ ] `TransceiverModeCoordinator_startAutoMode`：オプションのテストを追加し、既存テストを新しい引数の形に合わせる
- [ ] `TransceiverModeCoordinator_syncTransceiverSettingFromActiveSat` のテストを追加
- [ ] `TransceiverModeSettingResolver_*`：`resolveOnModeStart` の修正、`resolveWhenBeaconOffInAuto` のテスト削除、`resolveBeaconModeSetting` のテスト追加
- [ ] `TransceiverRecvFreqResolver_applyFromTransceiver`：Beacon 中のケースを追加
- [ ] `TransceiverDopplerCalc`：`calcRxBaseFreqByShiftedRxFreq` のテストを追加
- [ ] `TransceiverFreqCoordinator`：`updateRxFreqWithDopplerShift` に基準周波数を渡すケースを追加
- [ ] 既存テストへの影響確認（`npm run test`）

## ドキュメント

- [ ] `doc/30_画面設計/G2_メイン.md`：2.3.7 Beacon、2.3.2 Dopplerモード、3.3 イベント一覧、5 相関チェックを更新（2.3.8 / 2.3.9 は編集しない）
- [ ] 図を罫線で表現する場合は、全角文字により図が崩れないようスペースを調整する

## 検証

- [ ] `npm run test` が通ること（PowerShellで実行）
- [ ] lint／フォーマットが通ること（`npm run format`）
- [ ] ビーコン周波数がない衛星、サテライトモードOFFの場合は、Beacon ボタンが非活性
- [ ] Auto OFF：Beacon ON で Rx がビーコン周波数・ビーコン運用モード、固定モードが衛星固定（選択不可）になり、OFF で元に戻る
- [ ] Auto ON・衛星固定：Beacon ON で Rx がビーコン周波数＋ドップラーになり、Rx・Tx とも追尾が続く。OFF で Beacon 前の基準周波数＋ドップラーに戻る
- [ ] Auto ON・受信固定：OFF で Rx が記録した固定値、Tx が受信固定の算出値になり、固定モードが受信固定に戻る
- [ ] Auto ON・送信固定：OFF で Tx が記録した固定値、Rx が送信固定の算出値になり、固定モードが送信固定に戻る
- [ ] Beacon 中に無線機のダイヤルで Rx を微調整すると、その後の追尾に反映され、Tx は連動しない。OFF 後には反映されない
- [ ] Beacon 中に画面で Tx を微調整すると、その後の Tx の追尾に反映され、OFF 後には反映されない
- [ ] Beacon 中に Rx 補正値を変えても、ビーコンの Rx には加わらず、OFF 後の通常追尾に反映される
- [ ] Auto ON・Beacon ON で Auto OFF：Beacon が OFF になり、周波数が Auto ON 前に戻る
- [ ] Auto OFF → Beacon ON → Auto ON：Beacon のまま追尾が始まる。Beacon OFF で衛星設定の周波数＋ドップラーに戻り、固定モードは Beacon ON 時の値に戻る。続けて Auto OFF で Beacon・Auto のどちらも ON にする前の周波数に戻る
- [ ] Beacon 中の衛星切替：Beacon が OFF になり、Auto ON なら新しい衛星で Auto が開始し直される
- [ ] Beacon 中に同一衛星のビーコン周波数を変更して保存：Beacon が OFF になる
- [ ] Beacon 中に、概要のみの保存や最小仰角の変更をしても、Beacon と追尾が続く
- [ ] Beacon 中にサテライトモードを OFF：Beacon が OFF になり、サテライトモードの切替が従来どおり動く
- [ ] Beacon を使わない場合の Auto の動作（各固定モード、衛星切替、ダイヤル操作）が従来と同じ
