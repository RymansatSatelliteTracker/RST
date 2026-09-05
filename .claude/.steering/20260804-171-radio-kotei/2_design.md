# 改修プラン：無線機ダイヤル操作時の周波数固定挙動の改善

## 概要

[`1_requirements.md`](./1_requirements.md) の要求は、Dopplerモードが「受信固定」「送信固定」の場合に、無線機側のダイヤル操作に対するRSTの追従を固定していない側だけに限定する、というもの。

ユーザー確認の結果、下記の方針で確定した。

- 固定側については、無線機からトランシーブされた周波数変化をRST側に一切反映しない（表示も基準周波数も更新しない）。
- 固定されているはずの側自体がダイヤル操作された場合（想定外操作）も同様に読み捨てる。
- ダイヤル操作終了の判定は既存の`dopplerResumeDelaySec`タイマーをそのまま流用する（変更なし）。
- 衛星固定（`FIXED_SAT`）モードは対象外。現状の動作（両側とも常時ドップラー追従、Sum維持のまま両側再計算）を変更しない。

以上を踏まえ、**待機解除後に固定側を追いつかせる（ジャンプさせる）仕組みは不要**であり、代わりに**無線機からの通知受信時点で「今どちらが固定側か」を判定し、固定側に関する通知は画面表示・基準周波数の両方について完全に無視する**という、より単純な設計に変更する。

## 現状分析

### 無線機からの周波数反映（変更対象）

[`TransceiverRecvFreqResolver.applyTxFromTransceiver`/`applyRxFromTransceiver`](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts#L85-L150) は、現在のDopplerモードに関わらず、無線機からトランシーブされた周波数を無条件に画面表示へ反映し、[`TransceiverDopplerCalc.calcBaseFreqByShiftedRxFreq`/`calcBaseFreqByShiftedTxFreq`](../../../src/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.ts#L80-L142) でSumを保ったまま**両方**の基準周波数（`plainRxBaseFreq`/`plainTxBaseFreq`）を再計算している。

この「モードを見ずに常に両方の基準周波数を書き換える」処理が、要求の「固定側は反映しない」に反する部分であり、今回の改修対象となる。

### ドップラーモードと固定側の判定（既存・流用）

[`TransceiverDopplerModeResolver.resolveCorrectionFlags`](../../../src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverDopplerModeResolver.ts#L24-L33) は、Dopplerモードから「Tx/Rxそれぞれをドップラー補正するか」のフラグを返す。このフラグの`false`側が、まさに「今固定されている側」を意味する。

```ts
execTxDopplerShiftCorrection:  // false の場合 Txが固定側（送信固定モード）
  dopplerShiftMode === FIXED_SAT || dopplerShiftMode === FIXED_RX,
execRxDopplerShiftCorrection:  // false の場合 Rxが固定側（受信固定モード）
  dopplerShiftMode === FIXED_SAT || dopplerShiftMode === FIXED_TX,
```

このフラグ算出ロジックは既存のまま流用し、`TransceiverRecvFreqResolver`からも参照できるようにする。

### ダイヤル操作中の待機（既存・変更不要）

[`TransceiverDopplerWaitCoordinator`](../../../src/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverDopplerWaitCoordinator.ts) と[`updateFreq()`](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L452-L474) の周期処理は今回変更しない。固定側は無線機からの通知自体を受け付けなくなるため、待機解除後の周期処理は従来通り「固定側はexecフラグがfalseなので触らない」という既存の動きのままで要求を満たす。

## 変更内容

### 1. `TransceiverRecvFreqResolver` に現在の固定側判定を注入する

`useTransceiverCtrl.ts`で既に生成済みの`dopplerModeResolver`（[useTransceiverCtrl.ts:112](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L112)）と`dopplerShiftMode`（[useTransceiverCtrl.ts:71](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L71)）を使い、現在の補正要否フラグを返すgetterを`TransceiverRecvFreqResolver`のコンストラクタに追加で渡す。

```ts
// useTransceiverCtrl.ts
const recvFreqResolver = new TransceiverRecvFreqResolver(
  { txFrequency, rxFrequency, txFrequencyAdjustment, rxFrequencyAdjustment, txBaseFreq, rxBaseFreq },
  autoStore,
  baseFreqMgr,
  currentDate,
  () => coordinator.autoTrackingIntervalMsec,
  calcBaseFreqWithAdjust,
  getBaseFreqSum,
  () => dopplerModeResolver.resolveCorrectionFlags(dopplerShiftMode.value) // 追加
);
```

### 2. 固定側の通知を破棄する

`TransceiverRecvFreqResolver.applyTxFromTransceiver`/`applyRxFromTransceiver` の先頭で、Auto ON中に自分の側が固定側であれば、画面表示・基準周波数のどちらも更新せず即座に処理を終了する。

```ts
private async applyTxFromTransceiver(recvTxFreq: number): Promise<void> {
  if (this.autoStore.tranceiverAuto && !this.getCorrectionFlags().execTxDopplerShiftCorrection) {
    // Txが固定側のため、無線機からの通知は破棄する（ダイヤル操作されていても表示・基準周波数を変更しない）
    this.logDiscardFixedSide("Tx");
    return;
  }

  // 以降、既存の画面表示反映・基準周波数再計算処理
  ...
}
```

`applyRxFromTransceiver`も対称に実装する。

- Auto OFF時は判定を行わず、従来通り無線機からの通知をそのまま画面へ反映する（Dopplerモードによる固定は、Auto ON中のみ意味を持つ既存の設計に合わせる）。
- 衛星固定（`FIXED_SAT`）モードでは`execTxDopplerShiftCorrection`/`execRxDopplerShiftCorrection`が共に`true`のため、この分岐には入らず、既存動作のまま変わらない（要確認事項4を満たす）。

### 3. 反対側（非固定側）の基準周波数再計算で、固定側の値を書き換えない

分岐を抜けた後（＝自分の側は固定されていない）、基準周波数の再計算では、現行通りSum維持の計算式（`calcBaseFreqByShiftedTxFreq`/`calcBaseFreqByShiftedRxFreq`）を呼び出すが、その結果のうち「もう一方の側」の値を採用するかどうかを、もう一方が固定側かどうかで分岐する。

```ts
private async applyRxFromTransceiver(recvRxFreq: number): Promise<void> {
  const flags = this.getCorrectionFlags();
  if (this.autoStore.tranceiverAuto && !flags.execRxDopplerShiftCorrection) {
    this.logDiscardFixedSide("Rx");
    return;
  }

  this.state.rxFrequency.value = TransceiverUtil.formatWithDot(recvRxFreq);

  if (!this.autoStore.tranceiverAuto) {
    return;
  }

  const { plainRxBaseFreq, plainTxBaseFreq } = this.baseFreqMgr.getPlainBaseFreqs();
  const { newRxBaseFreq, newTxBaseFreq } = await this.dopplerCalc.calcBaseFreqByShiftedRxFreq(
    plainRxBaseFreq, plainTxBaseFreq, adjustRxFreq, recvRxFreq, this.currentDate.value, this.getAutoTrackingIntervalMsec()
  );

  // Txが固定側の場合は、Sum維持のために計算されたTx基準周波数を採用せず、既存値を維持する
  const finalTxBaseFreq = flags.execTxDopplerShiftCorrection ? newTxBaseFreq : plainTxBaseFreq;
  this.baseFreqMgr.setPlainBaseFreqs(newRxBaseFreq, finalTxBaseFreq);

  this.calcBaseFreqWithAdjust();
  this.logUpdatedBaseFreq();
}
```

`applyTxFromTransceiver`側も対称に、`finalRxBaseFreq = flags.execRxDopplerShiftCorrection ? newRxBaseFreq : plainRxBaseFreq` として実装する。

- 衛星固定モードでは両フラグが`true`のため、常に計算結果をそのまま採用する既存動作のままになる。
- 受信固定/送信固定モードでは、固定側の`plainBaseFreq`は一切書き換えられなくなり、非固定側だけが実測ダイヤル値から再計算される。以降の周期処理（`updateFreq()`）でも固定側のexecフラグは`false`のままなので、表示も一切動かない。

## 影響範囲・リスク

- 変更は`TransceiverRecvFreqResolver`とそのコンストラクタ呼び出し元（`useTransceiverCtrl.ts`）に閉じる。`TransceiverDopplerWaitCoordinator`・`TransceiverFreqCoordinator`には変更を加えない（後述の追加要求に伴い`useTransceiverCtrl.ts`の周期処理には変更が入る）。
- 衛星固定モードのみを使っているユーザーへの影響はない（`execTxDopplerShiftCorrection`/`execRxDopplerShiftCorrection`が常に`true`のため、新設した分岐に入らない）。
- Auto OFF時の無線機からの周波数反映（通常のマニュアル操作の追従）には影響しない。

## 追加要求：ダイヤル操作後、固定側の周波数を無線機へ再送信する

[`1_requirements.md`](./1_requirements.md) に追記された要求より、上記の「固定側の通知を破棄する」だけでは不十分であることが判明した。

無線機自体の内部処理（サテライトモードの追尾機能等）により、ダイヤル操作時に**無線機側の固定側の周波数も物理的に変化してしまう**。RST側は固定側の通知を破棄して自身の状態は正しく保つが、無線機の実機の周波数はズレたままになる。そのため、ダイヤル操作終了後にRSTが保持している固定側の周波数を無線機へ明示的に送信し、無線機側の値を上書き修正する必要がある。

### 現状分析

- `useTransceiverCtrl.ts`には`watch(txFrequency, ...)`/`watch(rxFrequency, ...)`（[useTransceiverCtrl.ts:324](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L324), [:372](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L372)）があり、画面の周波数Refが変化するたびに`freqCoordinator.sendTxFreq`/`sendRxFreq`で無線機へ送信している。非固定側（ドップラー追従側）は`updateFreq()`の周期処理で`txFrequency`/`rxFrequency`が毎回更新されるため、このwatch経由で継続的に無線機へ送信され続けている。
- 一方、固定側は今回の改修で表示・基準周波数とも一切変更されなくなったため、このwatchが発火せず、無線機への送信も一切行われない。無線機側の固定側の値がダイヤル操作で物理的にズレても、RSTからは何も送られず補正されない。

### 変更内容

`useTransceiverCtrl.ts`の`updateFreq()`に、ダイヤル待機（`dopplerWaitCoordinator.isWaiting`）の立ち下がり（＝ダイヤル操作終了）を検出する処理を追加し、そのタイミングで固定側の現在値（RST側では変化していない、Auto ON時または前回の再送信時点のまま）を無線機へ明示的に再送信する。

```ts
let wasDopplerWaiting = false;

async function updateFreq(appConfig: AppConfigModel) {
  if (!autoStore.tranceiverAuto) {
    wasDopplerWaiting = false;
    return;
  }
  if (!(await freqCoordinator.isWithinDopplerShiftActiveRange(appConfig))) {
    return;
  }
  if (dopplerWaitCoordinator.isWaiting) {
    wasDopplerWaiting = true;
    return;
  }

  updateDopplerShiftCorrectionFlags();

  // ダイヤル操作終了直後は、無線機側でズレた可能性のある固定側の周波数をRST側の値で上書き送信する
  if (wasDopplerWaiting) {
    await resendFixedSideFreqToTransceiver();
    wasDopplerWaiting = false;
  }

  await applyDopplerShiftCorrections();
  logDopplerShiftResult();
}

/**
 * 固定側（execフラグがfalseの側）の現在の周波数を無線機へ再送信する
 * ダイヤル操作により無線機側で固定側の周波数がズレた場合に、RST側の値で上書きする
 * RST側の周波数自体は変化していないため、通常の送信では同一値として送信がスキップされる。
 * そのため、無線機への送信を強制する（isForce: true）
 */
async function resendFixedSideFreqToTransceiver() {
  if (!execTxDopplerShiftCorrection.value) {
    await freqCoordinator.sendTxFreq(TransceiverUtil.parseNumber(txFrequency.value), true);
  } else if (!execRxDopplerShiftCorrection.value && isSatelliteMode.value) {
    await freqCoordinator.sendRxFreq(TransceiverUtil.parseNumber(rxFrequency.value), true);
  }
}
```

- `sendTxFreq`/`sendRxFreq`を直接呼び出すことで、`txFrequency`/`rxFrequency`のRef自体は変更せずに送信のみを行う（既存の`txFrequencyAdjustment`監視[useTransceiverCtrl.ts:335](../../../src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts#L335)と同じパターン）。Refを変更しないため、`watch(txFrequency/rxFrequency, ...)`は発火せず、二重送信は起きない。
- 衛星固定（`FIXED_SAT`）モードでは両フラグが`true`のため`resendFixedSideFreqToTransceiver`は何もしない（現状動作を変更しない）。
- Rx側の送信は既存の`watch(rxFrequency, ...)`と同様に`isSatelliteMode.value`のガードを合わせる。
- 何度ダイヤルを操作していても、待機解除のタイミングで1回だけ送信すれば十分（RST側の固定側の値自体は変わっていないため）。

### 実機検証で判明した根本原因と追加対応（isForce化）

上記の実装のみでは、実機検証の結果**固定側の周波数が無線機へ送信されない**ことが判明した。原因は`sendTxFreq`/`sendRxFreq`より下流、メインプロセス側の以下の重複送信抑止ロジックにあった。

[`TransceiverIcomState.setReqTxFreqHz`/`setReqRxFreqHz`](../../../src/main/service/transceiver/controller/TransceiverIcomState.ts#L54-L73)は、「前回RSTが無線機に設定要求した値」と同一であれば、無線機への送信要求フラグ（`isReqTxFreqUpdate`/`isReqRxFreqUpdate`）を立てずに処理を終了する（不要なバンド切り替え抑止のための最適化）。

```ts
public setReqTxFreqHz(freq: number): void {
  if (this.reqTxFreqHz === freq) {  // 前回の"要求値"とだけ比較している（無線機の実際の値ではない）
    return;
  }
  this.reqTxFreqHz = freq;
  this.isReqTxFreqUpdate = true;
}
```

固定側はRST内部の値（`txFrequency.value`等）がAuto ON以降ずっと変化しないため、`resendFixedSideFreqToTransceiver()`が送ろうとする値は常に「前回の要求値」と同一になり、この最適化によって送信要求自体が握りつぶされていた。無線機の実機がダイヤル操作で物理的にズレていても、RST側はそれを検知する手段がない（比較対象が無線機の実際の値ではなく、RSTが最後に要求した値であるため）。

#### 対応

`TransceiverIcomState.setReqTxFreqHz`/`setReqRxFreqHz`に、同一値でも強制的に送信要求フラグを立てる`isForce`引数を追加する（[`setReqTxMode`/`setReqRxMode`](../../../src/main/service/transceiver/controller/TransceiverIcomState.ts#L79-L123)に既存の`isForce`パターンを踏襲）。この`isForce`を以下の経路で末端まで貫通させる。

```
useTransceiverCtrl.ts (resendFixedSideFreqToTransceiver: isForce=true)
  → TransceiverFreqCoordinator.sendTxFreq/sendRxFreq(freq, isForce)
    → ApiTransceiver.setTransceiverFrequency(model, isForce)
      → preload.ts (ipcRenderer.invoke)
        → initializeIpcEvent.ts (ipcMain.handle)
          → TransceiverService.setTransceiverFrequency(model, isForce)
            → TransceiverControllerBase.setFreq / TransceiverIcomController.setFreq(model, isForce)
              → TransceiverIcomState.setReqTxFreqHz/setReqRxFreqHz(freq, isForce)
```

`isForce`のデフォルトは`false`とし、既存の全呼び出し箇所（`watch(txFrequency/rxFrequency, ...)`等の通常送信）は挙動を変えない。`resendFixedSideFreqToTransceiver()`からの呼び出しのみ`true`を指定する。

### 単体テスト方針（追加分）

- `updateFreq()`本体は既存でも直接のユニットテストがないcomposable内クロージャのため、新規ユニットテストは追加せず、`npm run app:dev`および無線機（実機/シミュレータ）での動作確認で担保する。
- `TransceiverFreqCoordinator.sendTxFreq`/`sendRxFreq`の既存テストに、`isForce`引数がそのまま`ApiTransceiver.setTransceiverFrequency`へ渡されることを検証するケースを追加する。
- `TransceiverIcomState.setReqTxFreqHz`/`setReqRxFreqHz`の新規ユニットテストを追加し、同一値の場合の抑止・`isForce`指定時に抑止されないことを検証する（IPC/シリアルに依存しないメインプロセス側の純粋なクラスのため単体テスト可能）。

## 単体テスト方針

- `TransceiverRecvFreqResolver`には現状ユニットテストが無いため、本改修を機に以下をカバーするテストを新規追加する。
  - 送信固定モードでTxの通知を受けた場合：画面表示・基準周波数のいずれも変化しないこと
  - 送信固定モードでRxの通知を受けた場合：Rx表示・Rx基準周波数は更新され、Tx基準周波数は変化しないこと
  - 受信固定モードの対称ケース
  - 衛星固定モードでは従来通り両側とも更新されること（リグレッション防止）
  - Auto OFF時は固定判定を行わずそのまま画面表示のみ更新されること

## ドキュメント更新

[`doc/30_画面設計/G2_メイン.md`](../../../doc/30_画面設計/G2_メイン.md) の「2.3.2 Dopplerモード」の制御条件に、ダイヤル操作時の挙動を追記する。

追記イメージ：

```
- 受信固定：無線機側のダイヤル操作でTx（送信）周波数を変更した場合のみRSTのTx表示・基準周波数に反映する。
  Rx（受信）周波数側でダイヤル操作や無線機からの周波数変化があっても、RSTのRx表示・基準周波数は変更しない。
- 送信固定：無線機側のダイヤル操作でRx（受信）周波数を変更した場合のみRSTのRx表示・基準周波数に反映する。
  Tx（送信）周波数側でダイヤル操作や無線機からの周波数変化があっても、RSTのTx表示・基準周波数は変更しない。
```
