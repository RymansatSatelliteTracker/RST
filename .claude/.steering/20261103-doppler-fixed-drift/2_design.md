# 改修プラン：受信固定／送信固定モードのドリフト修正

## 概要

[`1_requirements.md`](./1_requirements.md) の要求は、受信固定／送信固定モードで固定側が実際の電波上でも一定となるよう、固定していない側の周波数に固定側のドップラー変化分を反映する、というもの。

確認事項は下記の方針で確定させた（異論があれば実装前に指摘してもらう）。

| 確認事項 | 方針 |
| -------- | ---- |
| 1. 送信固定用の逆算処理 | 83e96f19 で削除した `FrequencyTrackService.calcInvHeteroBaseFreqByTxFreq` を復活させる（`calcInvHeteroBaseFreqByRxFreq` と対称。式は削除前のものをそのまま使う） |
| 2. 再導出の方式 | 「毎周期、固定側の現在値とSumから、反対側を再導出する」方式とする。パス開始時の係数との差分管理は、状態が増えダイヤル操作・補正値変更との整合が複雑になるため採用しない |
| 3. 実機ログ | 実装後の実機検証タスクとして `3_tasklist.md` に記載する（修正前後で1パス分の追尾ログを比較） |

## 現状分析

### 周期処理での算出（変更対象）

[`useTransceiverCtrl.ts:526-537`](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L526-L537) の `applyDopplerShiftCorrections` は、Dopplerモードにかかわらず次の式で非固定側を算出している。

```
Tx = txBase × fu     (fu = 1 − v/c)
Rx = rxBase × fd     (fd = 1 + v/c)
```

`txBase` / `rxBase` は Auto ON 時（およびダイヤル操作時）に決まる静的な値で、周期処理中は変化しない。これは衛星内周波数を基準値に保つ「衛星固定」の式であり、受信固定／送信固定では固定側のドップラー変化が反対側に伝わらない。

### ダイヤル操作時の算出（既に正しい）

[`TransceiverRecvFreqResolver.applyRxFromTransceiver`](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts#L90-L121) は、受信したRx周波数 `R` から `rxBase = R / fd − rxAdj`、`txBase = Sum − rxBase` を再導出している。これは「Rxが `R` に固定されるようにTx基準周波数を決める」計算そのものであり、**周期処理でもこの式を毎周期適用すれば受信固定の要求を満たす**。

## 数式（逆ヘテロダイン、Sum一定）

記号：`S` = 補正値なし基準周波数の和（`plainRxBase + plainTxBase`）、`fd`/`fu` = 下り／上りドップラー係数、`rxAdj`/`txAdj` = 補正値。衛星内の上り周波数を `u`、下り周波数を `d` とすると `u + d = S` が保たれる。

### 受信固定（Rx = R0 固定）

```
R0 = 現在の rxFrequency（固定値）
plainRx' = R0 / fd − rxAdj
plainTx' = S − plainRx'
Tx       = (plainTx' + txAdj) × fu
```

`fd` が時間とともに変化すると `plainTx'` が追従し、Txが `Δf_down_trans` 分だけ余計に動く。

### 送信固定（Tx = T0 固定）

```
T0 = 現在の txFrequency（固定値）
plainTx' = T0 / fu − txAdj
plainRx' = S − plainTx'
Rx       = (plainRx' + rxAdj) × fd
```

`fu` が時間とともに変化すると `plainRx'` が追従し、Rxが `Δf_up_trans` 分だけ動く。

### 補足

- `plainRx'` / `plainTx'` は **周期処理内の一時値**であり、`TransceiverBaseFreqMgr` へは書き戻さない。書き戻すと、衛星固定へ切り替えた際に基準周波数が時間依存の値になってしまうため。
- ダイヤル操作後の `txFrequency` / `rxFrequency`（固定値の更新）は既存処理で行われており、周期処理は常に「その時点の固定側の表示値」を `R0` / `T0` として使う。ダイヤル操作・固定側再送信の既存仕様と矛盾しない。
- サテライトモードOFFの場合、Rx表示はTxへの同期値になり固定値として意味を持たないため、**サテライトモードON時のみ**新しい式を使い、OFF時は従来式のままとする。
- 衛星固定モードは従来式のまま変更しない。

## 変更内容

### 1. `FrequencyTrackService`

`calcInvHeteroBaseFreqByTxFreq(plainBaseFreqSum, txAdjustFreq, txFreq, txDopplerFactor)` を復活させる（83e96f19 の削除前の実装）。既存の `calcInvHeteroBaseFreqByRxFreq` は変更しない。

### 2. `TransceiverDopplerCalc`

固定側の値から反対側の周波数を算出するメソッドを追加する（Refへの書き込みは行わず、値を返すのみ。既存メソッドと同じ方針）。

```ts
// 受信固定：固定Rxを維持するためのTx周波数
public async calcTxFreqKeepingRxFixed(
  plainRxBaseFreq: number, plainTxBaseFreq: number,
  rxAdjustFreq: number, txAdjustFreq: number,
  fixedRxFreq: number, currentDate: Date, intervalMs: number
): Promise<string | null>

// 送信固定：固定Txを維持するためのRx周波数
public async calcRxFreqKeepingTxFixed(
  plainRxBaseFreq: number, plainTxBaseFreq: number,
  rxAdjustFreq: number, txAdjustFreq: number,
  fixedTxFreq: number, currentDate: Date, intervalMs: number
): Promise<string | null>
```

- `FrequencyTrackService` 未取得時は `null` を返す（既存メソッドと同じ）。
- 前者は `calcDownlinkDopplerFactor` + `calcInvHeteroBaseFreqByRxFreq`、後者は `calcUplinkDopplerFactor` + `calcInvHeteroBaseFreqByTxFreq` を使う。
- 結果は `TransceiverUtil.formatWithDot` で文字列化して返す。

### 3. `TransceiverFreqCoordinator`

既存の `updateTxFreqByInvertingHeterodyne` / `updateRxFreqWithDopplerShift` は残し、次を追加する。`TransceiverBaseFreqMgr` から補正値なし基準周波数を取得できるよう、コンストラクタ引数または呼び出し時引数で渡す（実装時に既存のテストとの整合が取りやすい方を選ぶ）。

```ts
public async updateTxFreqKeepingRxFixed(intervalMs: number): Promise<void>
public async updateRxFreqKeepingTxFixed(intervalMs: number): Promise<void>
```

### 4. `useTransceiverCtrl.ts`

`applyDopplerShiftCorrections` をモード別に分岐させる。

```ts
async function applyDopplerShiftCorrections() {
  const mode = dopplerShiftMode.value;
  const isSat = isSatelliteMode.value;

  if (mode === FIXED_RX && isSat) {
    // 受信固定：Rxは更新せず、Txを固定Rx維持の式で更新
    await freqCoordinator.updateTxFreqKeepingRxFixed(interval);
    return;
  }
  if (mode === FIXED_TX && isSat) {
    // 送信固定：Txは更新せず、Rxを固定Tx維持の式で更新
    await freqCoordinator.updateRxFreqKeepingTxFixed(interval);
    return;
  }
  // 衛星固定／サテライトモードOFF：従来どおり
  ...
}
```

- `execTx/RxDopplerShiftCorrection` フラグと `resolveCorrectionFlags` は、ダイヤル待機後の再送信判定（`resendFixedSideFreqToTransceiver`）などで引き続き使うため変更しない。
- `resendFixedSideFreqToTransceiver`（送信固定のTx再送信）は、既存どおり `txBase × fu` で算出した値を送信し、その値が以降の `T0` になる。ここは変更しない。

## レビュー対応（PR #263 Copilot指摘）

- ビーコンモード中は、ビーコン周波数がトランスポンダのSum関係にないため、固定側維持の算出を適用せず従来の算出経路を使う（`!isBeaconMode.value` を条件に追加）。
- 補正値なし基準周波数は`baseFreqMgr`ではなく、画面の基準周波数（`rxBaseFreq` / `txBaseFreq`）から補正値を除いた値を使う。画面でのホイール操作は画面の基準周波数のみを更新するため、`baseFreqMgr`を使うと次の周期で操作が元に戻る、またはNormal設定で逆方向へ動く。

## 影響範囲・リスク

- 変更は周期処理の算出部分（`TransceiverDopplerCalc` / `TransceiverFreqCoordinator` / `useTransceiverCtrl.ts`）と `FrequencyTrackService` への関数復活に閉じる。無線機との通信（main側）には変更なし。
- 衛星固定モードは分岐に入らないため影響しない。
- 固定側の表示値を `R0` / `T0` として毎周期使うため、**固定側の補正値（Adj）を変更しても固定側の送信値は変わらない**という既存の挙動はそのまま。この点は今回のスコープ外とする。
- 送信固定ではTxが変化しないが、Rxは毎周期変化するため、無線機へのRx送信頻度は衛星固定と同等になる。

## 単体テスト方針

- `FrequencyTrackService.calcInvHeteroBaseFreqByTxFreq`：基本式、補正値あり、丸め、`calcInvHeteroBaseFreqByRxFreq` との対称性（83e96f19 で削除したテストを復活）。
- `TransceiverDopplerCalc.calcTxFreqKeepingRxFixed` / `calcRxFreqKeepingTxFixed`：
  - ドップラー係数 1.0（`v = 0`）のとき、Tx = txBase、Rx = rxBase となること（衛星固定と一致）。
  - 係数が時間変化しても、受信固定では `Rx_観測 = R0`（Tx算出後に衛星内周波数と下り係数から再計算した値）となること。
  - 送信固定でも同様に、`Tx_観測 = T0` となること。
  - 補正値あり。
  - `FrequencyTrackService` 未取得時に `null`。
- `TransceiverFreqCoordinator`：新規2メソッドが `state` の対象Refのみを更新し、固定側を更新しないこと。
- `useTransceiverCtrl.ts` の周期処理は既存でも直接のユニットテストがないため、`npm run app:dev` による実機／シミュレータ検証で担保する。

## ドキュメント更新

[`doc/30_画面設計/G2_メイン.md`](../../../doc/30_画面設計/G2_メイン.md) の「2.3.2 Dopplerモード」の受信固定・送信固定に、次を追記する。

- 受信固定：Rxは固定し、Txは下りのドップラー変化も見越して算出する（受信キャリアがドリフトしない）。
- 送信固定：Txは固定し、Rxは上りのドップラー変化も加味して算出する（受信キャリアがドリフトしない）。
- 上記は逆ヘテロダイン（Sum一定）の式で算出する。
