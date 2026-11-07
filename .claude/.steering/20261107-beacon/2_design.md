# 改修プラン：Beacon対応

要求は [`1_requirements.md`](./1_requirements.md) を参照。

## 1. 方針

- Beacon の ON/OFF 処理は、新しく作る `TransceiverBeaconCoordinator` にまとめる。現在 `TransceiverModeCoordinator` にある `startBeaconMode` / `stopBeaconMode` は削除する。
- Beacon ON 前の状態（固定モード、周波数、Rx運用モード、基準周波数）とビーコンのRx基準周波数は、新しく作る `TransceiverBeaconMgr` で持つ。
- ビーコンのRx基準周波数は、通常の基準周波数（`rxBaseFreq` / `txBaseFreq` / `TransceiverBaseFreqMgr`）とは別に持つ。
  - ビーコンは、トランスポンダの送受信周波数の和（Sum）の関係にない。通常の基準周波数を書き換えると、Txの算出（逆ヘテロダイン）や Beacon OFF 後の復元が壊れるため、分けて持つ。
  - Beacon ON 中のTxは「衛星固定」の通常経路（`txBaseFreq` × ドップラーファクター）で追尾する。
- Beacon の ON/OFF は、`watch(isBeaconMode)` ではなく関数を直接呼んで行う（`await` で順序を保証する）。
  - 現状は `isBeaconMode.value = false; await stopAutoMode();` のように書いているが、watch は後から非同期で動くため、Beacon OFF と Auto OFF の処理順が保証されない。
- Auto ON 中の ON/OFF では、周期処理（`updateFreq`）をいったん止めてから周波数を切り替え、その後に再開する。周期処理が古い基準周波数で周波数を上書きしないようにするため（`startAutoMode` と同じやり方）。
- 無線機（main プロセス）側は変更しない。周波数・運用モードの送信は、既存の watch（`rxFrequency`、`rxOpeMode` など）を通して行う。

## 2. 確認事項の反映結果

| #  | 結果                                                     | 設計への反映                                                                                                   |
| -- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1  | Auto OFFでも活性                                         | 活性条件に Auto は含めない（3.6）。Auto OFF 中は周波数を切り替えるだけ（3.3）                                  |
| 2  | Beacon中のRxは周期的に追尾                               | `updateFreq` で、ビーコンのRx基準周波数 × 下りドップラーファクターを設定（3.4）                                |
| 3  | Beacon中のTxは衛星固定で追尾                             | Beacon中は固定モードが衛星固定のため、既存の `updateTxFreqByInvertingHeterodyne` がそのまま動く（3.4）         |
| 4  | OFF時の戻り先はBeacon ON直前の基準周波数                 | ON時に、画面の基準周波数から補正値を除いた値を記録し、OFF時に戻す（3.3、3.5）                                  |
| 5  | OFF時は固定モードも戻す                                  | ON時に固定モードを記録し、OFF時に戻す（3.5）                                                                   |
| 6  | Beacon中は固定モードを選択できない                       | `DopplerShiftModeSelect` に `:disabled="isBeaconMode"`（3.6）                                                  |
| 7  | Beacon中の衛星切替は強制OFF                              | `onChangeSatGrp` で強制OFFしてから Auto を開始し直す（3.7）                                                    |
| 8  | Auto OFF → Beacon ON → Auto ON は Beacon 継続            | `startAutoMode` に、Beacon を引き継ぐためのオプションを追加（3.8）                                            |
| 9  | サテライトモードON時のみ                                 | 活性条件に `isSatelliteMode` を追加。サテライトモードのボタン操作時に強制OFF（3.6、3.7）                       |
| 10 | Rx補正値はビーコンに加えない                             | ビーコンのRx基準周波数は補正値と無関係に持つ（3.2）                                                            |
| 11 | ビーコン周波数の微調整は既存の入力欄                     | 衛星設定画面は変更しない                                                                                       |
| 12 | Rx運用モードはビーコン運用モードに切り替え、OFFで戻す    | ON時に記録し、OFF時に戻す（3.3、3.5）                                                                          |
| 13 | Txの微調整はBeacon中は反映し、OFFで破棄                  | Beacon中は `txBaseFreq` をそのまま使い、OFF時に記録した基準周波数へ戻す（3.4、3.5）                            |
| 14 | 同一衛星の設定保存は強制OFF                              | #16 の条件付きで強制OFF（3.7）                                                                                 |
| 15 | F1のOFF時の戻り先は衛星設定の周波数                      | Auto 開始時に、Auto 側の基準周波数・固定周波数・Rx運用モードを記録し直す（3.8）                                |
| 16 | 衛星も無線設定も変わらない通知では Beacon を継続         | 無線設定のスナップショットを比較し、変化がなければ Auto を開始し直さない（3.7）                                |

## 3. 変更内容

### 3.1 新規クラス

| ファイル（`src/renderer/components/organisms/TransceiverCtrl/` 配下） | 役割                                                                                           |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `managers/TransceiverBeaconMgr.ts`                                  | Beacon ON 前の状態（`BeaconSavedState`）と、ビーコンのRx基準周波数を持つ                        |
| `coordinators/TransceiverBeaconCoordinator.ts`                      | Beacon の開始・停止・強制停止、Auto 開始時の引き継ぎを行う                                     |

`BeaconSavedState`（Beacon ON 前の記録）：

| 項目                | 内容                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| `dopplerShiftMode`  | Beacon ON 前の固定モード                                                               |
| `txFrequency`       | Beacon ON 前の画面のTx周波数（送信固定の固定値、Auto OFF 時の戻り先）                   |
| `rxFrequency`       | Beacon ON 前の画面のRx周波数（受信固定の固定値、Auto OFF 時の戻り先）                   |
| `rxOpeMode`         | Beacon ON 前のRx運用モード                                                             |
| `plainTxBaseFreq`   | Beacon ON 前のTx基準周波数（補正値なし）。Auto ON 時のみ有効                            |
| `plainRxBaseFreq`   | Beacon ON 前のRx基準周波数（補正値なし）。Auto ON 時のみ有効                            |

- 補正値なしの基準周波数は、`TransceiverBaseFreqMgr` ではなく、画面の基準周波数（`rxBaseFreq` / `txBaseFreq`）から補正値を引いて求める。
  - 画面のホイール操作による調整は `rxBaseFreq` / `txBaseFreq` にしか反映されないため（`applyDopplerShiftCorrections` と同じ求め方）。

`TransceiverBeaconMgr` の主なメソッド：

| メソッド                              | 内容                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `save(state)` / `getSaved()`          | Beacon ON 前の状態を記録する／取得する                     |
| `setBeaconRxBaseFreq(hz)`             | ビーコンのRx基準周波数を設定する                           |
| `getBeaconRxBaseFreq()`               | ビーコンのRx基準周波数を取得する                           |
| `shiftBeaconRxBaseFreq(diff)`         | 画面のホイール操作分をビーコンのRx基準周波数に反映する     |
| `clear()`                             | 記録をすべて破棄する（Beacon OFF 時）                      |

### 3.2 ビーコンのRx基準周波数

- Beacon ON 時に、衛星設定のビーコン周波数（`beaconHz`）を設定する。Rx補正値は加えない。
- 次の操作で更新する（Auto ON 中のみ）。
  - 無線機のダイヤル操作：受信したRx周波数 ÷ 下りドップラーファクター（3.4）
  - 画面のRx周波数のホイール操作：変化量をそのまま反映し、Txは連動させない（3.4）
- Beacon OFF 時に破棄する。次の Beacon ON では、また衛星設定のビーコン周波数から始める。

### 3.3 Beacon ON（`TransceiverBeaconCoordinator.start`）

```
  1. 活性条件を満たさない場合は通知して終了（CHK_ERR_NO_BEACON_FREQ）
  2. Auto ON の場合は周期処理を停止（ModeCoordinator.stopUpdateFreq）
  3. Beacon ON 前の状態を記録（BeaconSavedState）
  4. isBeaconMode = true
  5. 固定モード = 衛星固定、Rx運用モード = ビーコン運用モード
  6. ビーコンのRx基準周波数 = beaconHz
  7. Rx周波数を設定
       Auto ON  ：beaconHz × 下りドップラーファクター
                  （ドップラーシフトの有効範囲外の場合は beaconHz）
       Auto OFF ：beaconHz
  8. Auto ON の場合は周期処理を再開
```

- Txは、Beacon ON の時点では変更しない。Auto ON の場合は、次の周期処理から衛星固定として追尾する。

### 3.4 Beacon ON 中の動作

| 処理                                                      | 変更内容                                                                                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useTransceiverCtrl.applyDopplerShiftCorrections`         | Beacon 中は、Rxを「ビーコンのRx基準周波数 × 下りドップラーファクター」で更新する。Txは既存の衛星固定の経路のまま（受信固定/送信固定の分岐には入らない。既存どおり） |
| `TransceiverFreqCoordinator.updateRxFreqWithDopplerShift` | 基準周波数を引数で渡せるようにする（省略時は従来どおり `rxBaseFreq`）                                                                                          |
| `TransceiverRecvFreqResolver.applyRxFromTransceiver`      | Auto ON かつ Beacon 中は、通常の基準周波数（`TransceiverBaseFreqMgr`）を再算出しない。代わりに、ビーコンのRx基準周波数を「受信値 ÷ 下りドップラーファクター」で更新する |
| `TransceiverDopplerCalc`                                  | `calcRxBaseFreqByShiftedRxFreq(rxFreq, currentDate, intervalMs)` を追加（受信値 ÷ 下りドップラーファクター）                                                   |
| `useTransceiverCtrl.onDiffRxFrequencyChanged`             | Beacon 中は、変化量をビーコンのRx基準周波数にだけ反映し、Txは連動させない                                                                                      |
| Txのホイール操作（`watch(diffTxFrequency)`）              | 変更なし。Beacon 中も `txBaseFreq` に反映され、Txの追尾に使われる。OFF 時に記録した基準周波数へ戻るため、破棄される                                             |
| Rx/Tx補正値の変更                                         | 変更なし。補正値は `txBaseFreq` / `rxBaseFreq` にだけ反映され、ビーコンのRx基準周波数には影響しない。OFF 時は、その時点の補正値で基準周波数を計算し直す        |

- ダイヤル操作の待機（`TransceiverDopplerWaitCoordinator`）は既存のまま。Beacon 中は衛星固定のため、待機解除後の固定側の再送信（`resendFixedSideFreqToTransceiver`）は動かない。
- 無線機側のTxダイヤル操作は、既存の仕様どおり取り込まない（`discardTxFromTransceiver`）。Txの微調整は、画面のTx周波数の操作で行う。

### 3.5 Beacon OFF（`TransceiverBeaconCoordinator.stop`）

```
  1. Auto ON の場合は周期処理を停止
  2. isBeaconMode = false
  3. 固定モード、Rx運用モードを記録した値に戻す
  4. 周波数を戻す
       Auto ON ：
         a. TransceiverBaseFreqMgr.setPlainBaseFreqs(記録した基準周波数)
         b. calcBaseFreqWithAdjust()（現在の補正値で基準周波数を計算し直す）
         c. 固定モードに応じて固定側の周波数を戻す（下表）
         d. ドップラーシフトの有効範囲内なら、すぐに補正を1回実行する
            （updateDopplerShiftCorrectionFlags → applyDopplerShiftCorrections）
            範囲外の場合は、固定側以外を基準周波数（ドップラーなし）にする
       Auto OFF：Rx周波数を記録した値に戻す
  5. Beacon の記録を破棄（TransceiverBeaconMgr.clear）
  6. Auto ON の場合は周期処理を再開（強制OFFのオプションで省略できる）
```

| 戻す固定モード | 4-c で戻す値                     | 4-d で計算される値              |
| -------------- | -------------------------------- | ------------------------------- |
| 衛星固定       | なし                             | Rx、Tx（基準周波数＋ドップラー）|
| 受信固定       | Rx = 記録したRx周波数            | Tx（受信固定の通常の算出）      |
| 送信固定       | Tx = 記録したTx周波数            | Rx（送信固定の通常の算出）      |

- Beacon 中のダイヤル・ホイールによる調整は、基準周波数を記録値に戻すことで破棄される。

### 3.6 画面（`TransceiverCtrl.vue`）

| 箇所                       | 変更                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Beacon ボタン              | `:disabled="!canUseBeacon"`。`canUseBeacon` = `isBeaconModeAvailable && isSatelliteMode`（composable の computed）。処理中は `:loading` を付け、クリックを無視する |
| `beaconBtnClick`           | 開発中通知を削除し、composable の `toggleBeaconMode()` を `await` する                                                                       |
| `DopplerShiftModeSelect`   | `:disabled="isBeaconMode"`（`v-select` へ属性として引き継がれることを実装時に確認する。引き継がれない場合は、コンポーネントに `disabled` を追加する） |
| サテライトモードのボタン   | `v-model:mode` を `:mode` と `@update:mode` に分ける。Beacon 中は Beacon を OFF にしてから `satelliteMode` を変更する（3.7）                 |
| `autoBtnClick`（Auto OFF） | `isBeaconMode.value = false` を削除する。composable の `stopAutoMode` の中で Beacon を停止する（3.7）                                        |
| `watch(autoStore.tranceiverAuto)` | 同上                                                                                                                                  |

- `NOTICE_UNDER_DEVELOPMENT` は他で使われていないが、メッセージ定義は残す。

### 3.7 Beacon の強制OFF

| # | 契機                                           | 実装箇所                                   | 処理                                                                                                                                                                       |
| - | ---------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Auto OFF                                       | `useTransceiverCtrl.stopAutoMode`          | Beacon 中なら、周期処理を再開しない `stop` を実行した後に `coordinator.stopAutoMode()`。周波数は Auto OFF の処理で Auto ON 前（3.8 の場合は Beacon ON 前）の値に戻る。運用モードは従来どおり戻さない |
| 2 | アクティブ衛星の切替                           | `useTransceiverCtrl.onChangeSatGrp`        | 周期処理を再開しない `stop` を実行した後、Auto ON なら `startAutoMode` を実行する                                                                                          |
| 3 | 同一衛星の無線設定の変更                       | `useTransceiverCtrl.onChangeSatGrp`        | #2 と同じ                                                                                                                                                                  |
| 4 | サテライトモードのボタン操作                   | `TransceiverCtrl.vue` / `useTransceiverCtrl` | `stop` を実行してから `satelliteMode` を変更する。Beacon ON 前の状態に戻してから、既存のサテライトモード切替（状態の保存・読込）を動かすため                              |
| 5 | Auto ON で、衛星設定のサテライトモードが無効   | `useTransceiverCtrl.startAutoMode`         | Beacon 中なら、Auto 開始前に（Auto OFF として）`stop` を実行する                                                                                                          |

`onChangeSatGrp` の判定：

```
  isSatChanged     = NoradId が変わったか（既存）
  isSettingChanged = 無線設定が変わったか（新規）
  if (Beacon中) {
    if (!isSatChanged && !isSettingChanged) return   ← Beacon と追尾を継続（Autoを開始し直さない）
    await stopBeacon(周期処理の再開なし)
  }
  （以降は既存の処理）
```

- `isSettingChanged` は、`TransceiverModeCoordinator` に `syncTransceiverSettingFromActiveSat()` を追加して求める。`getActiveSatTransceiverSetting()` の戻り値を JSON 文字列にして前回の値と比べる（`syncCurrentNoradIdFromActiveSat` と同じ形）。
- 最小仰角の更新（`updateSatChoiceMinEl`）では無線設定を読み直さないため、`isSettingChanged` は `false` になる。
- Beacon OFF 中の動作（Auto ON なら Auto を開始し直す）は、従来から変えない。

### 3.8 Auto OFF → Beacon ON → Auto ON（Beacon を引き継ぐ Auto 開始）

`TransceiverModeCoordinator.startAutoMode` の引数をオプションオブジェクトに変える。

```ts
startAutoMode(options?: {
  applyDopplerShiftMode?: boolean;            // 既存の引数（既定 true）
  preAutoFreq?: { tx: string; rx: string };   // Auto ON 前として記録する周波数（Beacon 中は Beacon ON 前の値）
  onBeforeAutoOn?: () => Promise<void>;       // transceiverInitAutoOn の直前に呼ぶ処理
})
```

composable の `startAutoMode` は、Beacon 中の場合に以下を渡す。

| オプション              | 渡す値                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `applyDopplerShiftMode` | `false`（衛星固定のままにする。衛星設定の固定モードは使わず、Beacon ON 時に記録した固定モードを OFF 時の戻り先にする）                   |
| `preAutoFreq`           | Beacon ON 前に記録した画面の Tx/Rx 周波数（Auto OFF で、Beacon・Auto のどちらも ON にする前の周波数に戻すため）                          |
| `onBeforeAutoOn`        | `TransceiverBeaconCoordinator.resumeOnAutoStart`                                                                                         |

`resumeOnAutoStart` の処理（Auto 開始で衛星設定の周波数・運用モードが設定され、基準周波数が更新された後に呼ばれる）：

```
  1. 記録を Auto 側の値で更新する（固定モードは Beacon ON 時の値のまま）
       基準周波数   ：TransceiverBaseFreqMgr の補正値なし基準周波数（＝衛星設定の周波数）
       Tx/Rx周波数  ：画面の値（＝衛星設定の周波数。受信固定/送信固定の固定値になる）
       Rx運用モード ：画面の値（＝衛星設定のダウンリンク運用モード）
  2. Rx運用モード = ビーコン運用モード
  3. ビーコンのRx基準周波数 = beaconHz
  4. Rx周波数 = beaconHz × 下りドップラーファクター（範囲外の場合は beaconHz）
```

- この後、`transceiverInitAutoOn` にはビーコン側の Rx 周波数・運用モードが渡されるため、無線機の Rx が一時的にダウンリンクへ切り替わることはない。

### 3.9 `TransceiverModeCoordinator` / `TransceiverModeSettingResolver` の整理

| 対象                                             | 変更                                                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `TransceiverModeCoordinator.startBeaconMode` / `stopBeaconMode` | 削除（`TransceiverBeaconCoordinator` へ移す）                                                                                  |
| `saveFreqAndOpeModeInModeStart` / `restoreSavedFreqAndOpeMode`  | 削除（Beacon 用の退避は `TransceiverBeaconMgr` へ移す）                                                                         |
| `setFreqAndOpeModeInModeStart`                   | Auto の設定だけを解決する（`isBeaconMode` による分岐をなくす）                                                                              |
| `ModeCoordinatorState`                           | `isBeaconMode`、`savedTxOpeMode`、`savedRxOpeMode` を削除                                                                                    |
| `useTransceiverCtrl`                             | `savedTxOpeMode`、`savedRxOpeMode`、`watch(isBeaconMode)` を削除                                                                             |
| `TransceiverModeSettingResolver.resolveOnModeStart` | `isBeaconMode` 引数をなくし、Auto 設定の解決専用にする                                                                                    |
| `TransceiverModeSettingResolver.resolveBeaconModeSetting` | `public` にし、Beacon ON / `resumeOnAutoStart` で使う                                                                               |
| `TransceiverModeSettingResolver.resolveWhenBeaconOffInAuto` | 削除（OFF 時は記録した値に戻すため不要）                                                                                          |
| `canUseBeaconMode`                               | 変更なし（サテライトモードの条件は composable の computed で加える）                                                                         |

### 3.10 ドキュメント

| ファイル                       | 変更                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doc/30_画面設計/G2_メイン.md` | 2.3.7 Beacon（説明・制御条件を本仕様に更新。Rx運用モードの切替もここに書く）、2.3.2 Dopplerモード（Beacon 中は非活性）、3.3 イベント一覧、5 相関チェック（開発中通知を削除） |

- 2.3.8 Rxモード・2.3.9 Txモードの「⑤制御条件」は、`feature/260-yaesu-cat` が同じ行を変更しているため、編集しない（マージ時の衝突を避ける）。

## 4. 状態遷移

```
                     Beacon ON                      Beacon OFF
  [通常]  ───────────────────────────▶  [Beacon]  ───────────────────────────▶  [通常]
   固定モード：任意                       固定モード：衛星固定（選択不可）        固定モード：記録値
   Rx：通常の基準周波数                   Rx：ビーコンのRx基準周波数              Rx/Tx：記録した基準周波数
                                          Tx：通常のTx基準周波数（衛星固定）            または固定値

  強制OFF：Auto OFF / 衛星切替 / 無線設定の変更 / サテライトモードの操作 /
           Auto ON 時に衛星設定のサテライトモードが無効
```

## 5. テスト方針

| 対象                                                     | 内容                                                                                                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TransceiverBeaconMgr`（新規）                           | 記録・取得・破棄、ビーコンのRx基準周波数の設定・ホイール分の反映                                                                                           |
| `TransceiverBeaconCoordinator_start`（新規）             | Auto ON/OFF それぞれで、固定モード・Rx運用モード・Rx周波数が設定され、記録が取られる。Auto ON では周期処理の停止・再開が呼ばれる。ドップラー有効範囲外の場合 |
| `TransceiverBeaconCoordinator_stop`（新規）              | Auto ON で、衛星固定/受信固定/送信固定の戻り方（3.5 の表）。Auto OFF で Rx が戻る。Beacon 中の調整が破棄される。周期処理を再開しないオプション            |
| `TransceiverBeaconCoordinator_resumeOnAutoStart`（新規） | 記録が Auto 側の値で更新され、固定モードは Beacon ON 時の値のまま。Rx がビーコン側になる                                                                    |
| `TransceiverModeCoordinator_startAutoMode`               | オプション（`preAutoFreq`、`onBeforeAutoOn`、`applyDopplerShiftMode`）。既存テストを新しい引数の形に合わせる                                               |
| `TransceiverModeCoordinator_syncTransceiverSettingFromActiveSat`（新規） | 無線設定の変化の有無を返す                                                                                                                  |
| `TransceiverModeSettingResolver_*`                       | `resolveOnModeStart` の引数変更に合わせて修正。`resolveWhenBeaconOffInAuto` のテストを削除。`resolveBeaconModeSetting` のテストを追加                      |
| `TransceiverRecvFreqResolver_applyFromTransceiver`       | Beacon 中は、ビーコンのRx基準周波数が更新され、`TransceiverBaseFreqMgr` は変わらない                                                                       |
| `TransceiverDopplerCalc`                                 | `calcRxBaseFreqByShiftedRxFreq`                                                                                                                            |
| `TransceiverFreqCoordinator`                             | `updateRxFreqWithDopplerShift` に基準周波数を渡した場合                                                                                                    |

- `useTransceiverCtrl`（`onChangeSatGrp`、`updateFreq`、`stopAutoMode`）と `TransceiverCtrl.vue` には既存の単体テストがないため、実機（またはシミュレータ）での確認で検証する（タスクリストの「検証」）。

## 6. 影響しないこと

- main プロセス（無線機コントローラ、IPC）は変更しない。
- 衛星設定画面、`ActiveSatServiceHub`、設定ファイルの形式は変更しない。
- Beacon を使わない場合の Auto の動作（受信固定/送信固定の算出、ダイヤル操作の待機、衛星切替時の Auto の再開始）は変えない。
