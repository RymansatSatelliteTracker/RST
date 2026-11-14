# 改修プラン

本書は「要求A: Tx周波数の無線機→RST反映の廃止（実装済み）」と「要求B: TXダイヤル操作後のRX読み取り（実装済み・一部実機確認未実施）」の2部構成。

---

# 要求A: Tx周波数の無線機→RST反映の廃止（実装済み）

`1_requirements.md` を踏まえた改修プラン。変更が必要なのは「衛星固定モードでTx側の無線機通知を取り込んでいる」処理のみであり、取り込みロジックを削除すると、それに付随する逆ヘテロダイン再計算処理一式が全てデッドコードになる。そのため本改修は「Tx側無線機通知の取り込み処理の削除」と「それに伴う連鎖的なデッドコードの削除」の2段で構成する。

## 1. 変更方針

1. `TransceiverRecvFreqResolver.applyTxFromTransceiver` を、モード判定を行わず常に無線機からのTx周波数通知を破棄する処理に置き換える。
2. 上記に伴い不要となる以下を連鎖的に削除する（使用箇所がこの1箇所のみであることをコード調査済み）。
   - `TransceiverRecvFreqResolver.isFixedSatMode`
   - `TransceiverRecvFreqResolver` コンストラクタの `getCorrectionFlags` 引数、および `DopplerShiftCorrectionFlags` 型の参照
   - `RecvFreqResolverState.txFrequency` / `txFrequencyAdjustment`（このクラス内で読み書きする箇所がなくなるため）
   - `TransceiverDopplerCalc.calcBaseFreqByShiftedTxFreq`
   - `FrequencyTrackService.calcInvHeteroBaseFreqByTxFreq`
3. 呼び出し元 `useTransceiverCtrl.ts` の `TransceiverRecvFreqResolver` 生成箇所を上記シグネチャ変更に追従させる。
4. Rx側（`applyRxFromTransceiver`、`TransceiverSyncCoordinator`、`TransceiverFreqCoordinator`等）は変更しない。

## 2. 詳細設計

### 2.1 `src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts`

- `applyFromTransceiver`：`uplinkHz` 受信時の分岐先を `applyTxFromTransceiver` → `discardTxFromTransceiver`（新設、引数なし・同期メソッド）に変更。
- `applyTxFromTransceiver` を削除し、代わりに以下を追加する。

  ```ts
  /**
   * 無線機から受信したTx周波数は、モードにかかわらず取り込まない
   * Tx周波数の同期はRST→無線機の一方向のみとするため、RST側の値を常に正とする
   */
  private discardTxFromTransceiver(): void {
    AppRendererLogger.debug(
      "Tx周波数の無線機→RST反映は行わない方針のため、無線機からの周波数通知を破棄します。"
    );
  }
  ```

- `isFixedSatMode` メソッドを削除。
- コンストラクタの `getCorrectionFlags: () => DopplerShiftCorrectionFlags` 引数を削除。JSDocの該当行も削除。
- `import type { DopplerShiftCorrectionFlags } from ".../TransceiverDopplerModeResolver.js";` を削除。
- `RecvFreqResolverState` インターフェースから `txFrequency` / `txFrequencyAdjustment` を削除（クラス内で読み書きしなくなるため）。`txBaseFreq`はログ出力（`logSkipBaseFreqUpdate`/`logUpdatedBaseFreq`）で使用するため維持。
- `logDiscardTxNotification` を削除（`discardTxFromTransceiver`のログに統合）。
- `logSkipBaseFreqUpdate(freqLabel: "Tx" | "Rx")` の呼び出しはRx側のみになるため、引数を削除して `"Rx"` 固定のログ文言に簡略化する（呼び出し元1箇所）。

### 2.2 `src/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.ts`

- `calcBaseFreqByShiftedTxFreq` メソッドを削除（呼び出し元が無くなるため）。
- `calcBaseFreqByShiftedRxFreq`、`calcNewTxFreqWithDoppler`（RST→無線機算出用。`calcUplinkDopplerFactor`を使用）等、他メソッドは変更なし。

### 2.3 `src/renderer/service/FrequencyTrackService.ts`

- `calcInvHeteroBaseFreqByTxFreq` メソッドを削除（`calcBaseFreqByShiftedTxFreq`の削除により呼び出し元が無くなるため）。
- `calcInvHeteroBaseFreqByRxFreq`、`calcUplinkDopplerFactor`（RST→無線機算出で使用中）等、他メソッドは変更なし。

### 2.4 `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts`

- `TransceiverRecvFreqResolver` 生成箇所（169行目付近）
  - 第1引数の状態オブジェクトから `txFrequency`、`txFrequencyAdjustment` を削除。
  - 最終引数 `() => dopplerModeResolver.resolveCorrectionFlags(dopplerShiftMode.value)` を削除。
  - `dopplerModeResolver.resolveCorrectionFlags` 自体は `updateDopplerShiftCorrectionFlags`（521行目）で別途使用中のため、メソッド自体の削除は不要。

## 3. テスト方針

### 3.1 `TransceiverRecvFreqResolver_applyFromTransceiver.test.ts`

- 削除・置き換え対象
  - 「Tx周波数受信かつAutoOff時、モードに関わらず画面周波数のみ更新し基準周波数は再算出しないこと」（72-97行目）→ **AutoOff/AutoOnに関わらずTxは常に破棄される**テストに置き換え。
  - 「Tx周波数受信かつAutoOn時（衛星固定モード）、Txが更新され...」（179-221行目）→ 削除（衛星固定モードでもTxが更新されないことを示すテストに置き換え）。
  - 「送信固定モードでTx周波数を受信した場合...」「受信固定モードでTx周波数を受信した場合も...」（223-288行目）→ 衛星固定モードのケースを含め、3モード共通の「Tx周波数はいかなるモード・AutoOn/Off状態でも破棄される」テストに統合。
- `FLAGS_FIXED_SAT` / `FLAGS_FIXED_TX` / `FLAGS_FIXED_RX` の使い分けはTxテストでは不要になる（`getCorrectionFlags` 引数自体が削除されるため、コンストラクタ呼び出しも変更）。
- Rx系テスト（99-177行目）は変更なし。

### 3.2 削除するテストファイル

- `src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcBaseFreqByShiftedTxFreq.test.ts`
- `src/__tests__/renderer/service/FrequencyTrackService_calcInvHeteroBaseFreqByTxFreq.test.ts`

### 3.3 影響確認

- `npm run test` 全体を実行し、上記以外のテスト（Rx系、ModeCoordinator系等）にリグレッションがないことを確認する。

## 4. ドキュメント更新

### 4.1 `doc/30_画面設計/G2_メイン.md`（2.3.2節 制御条件）

- 「衛星固定」の記述（現173-174行目）を変更：

  - 変更前：「無線機側のダイヤル操作でRx/Tx周波数が変化した場合も、双方ともRST側の表示・基準周波数に反映する。」
  - 変更後：Rxは従来通り反映する一方、Tx側は受信固定・送信固定と同様に「無線機側のダイヤル操作（無線機内部処理による自動変化を含む）は取り込まず、RST側で算出した値を常に正とする」旨に修正し、3モード共通の挙動として記述を統一する。
- 受信固定・送信固定の記述（176-186行目）は「Tx側の無線機通知を取り込まない」という点で変更なしだが、衛星固定と記述を揃える（「3モード共通でTxは一方向」であることが分かるように、節全体の構成を見直す）。
- サテライトモードOFF時の記述（187行目）も内容的に変更なし（送信固定モードの動作に追従する旨の記載を維持）。

### 4.2 `doc/10_アーキテクチャ/10_アーキテクチャ.md`

- `TransceiverRecvFreqResolver` の役割説明（97行目）を「無線機から受信した周波数の反映（Rxのみ。Tx周波数はRST→無線機の一方向のため無線機からの通知は破棄する）」に更新。
- `TransceiverDopplerCalc` の役割説明（99行目）から「無線機周波数変更時の逆ヘテロダイン再算出」の記述をRx限定である旨に修正（Tx側の逆ヘテロダイン再算出が削除されるため）。

## 5. 影響がないことの確認事項

- Tx周波数のRST→無線機への送信（`TransceiverFreqCoordinator.sendTxFreq`、`updateTxFreqByInvertingHeterodyne`）、および`calcNewTxFreqWithDoppler`（`calcUplinkDopplerFactor`使用）は変更しない。
- 無線機からのTx周波数変更通知のIPC購読（`ApiTransceiver.onChangeTransceiverFrequency`）自体は継続する（`1_requirements.md`のスコープ外事項通り、受信はするが反映しないのみ）。
- 運用モード（OpeMode）同期ロジック（`TransceiverOpeModeResolver`等）は対象外。

---

# 要求B: TXダイヤル操作後のRX読み取り（実装済み・一部実機確認未実施）

## B-1. 現状分析（コード調査の結果）

### B-1-1. メインプロセスには、RX読み取りの仕掛けが既にある

- サブバンド（Tx）のトランシーブを受信すると、`procRecvFreqData` が `state.setRecvTxFreqHz()` を呼ぶ。`TransceiverIcomState.setRecvTxFreqHz`（[TransceiverIcomState.ts:144](../../../src/main/service/transceiver/controller/TransceiverIcomState.ts#L144)）は、値が変わっていれば `isRecvRxFreqUpdate = true` も立てる。コメントにも「無線機での周波数変更は片側の変更のみが通知されるため、Rx側の周波数も更新されたものとして、データ取得対象としておく」とあり、本件と同じ事象を想定している。
- トランシーブ受信時は `startTransceiveWaitTimer(TRANSCEIVE_WAIT_MS = 2000ms)` で `isWaitSendFreq` を立て、定期ループ（[TransceiverIcomController.ts:111](../../../src/main/service/transceiver/controller/TransceiverIcomController.ts#L111)）をスキップする。タイマーはトランシーブのたびに再設定される。
- 待機解除後の最初のループで `sendAndRecvForMainForLoop` が走り、`isRecvRxFreqUpdate` が立っていれば、メインバンドに切り替えて `GET_FREQ` を送り、`handleRecvData` → `procRecvFreqData` → `freqCallback`（`downlinkHz`）でレンダラへ通知する（[TransceiverIcomController.ts:454](../../../src/main/service/transceiver/controller/TransceiverIcomController.ts#L454)）。
- レンダラは `applyRxFromTransceiver` でRX表示とAutoOn時の基準周波数に反映する。

→ 「待機解除時にRXを無線機から読み取る」処理自体は、新規作成ではなく既存の仕掛けでほぼ成立している。

### B-1-2. 反映が失敗する原因（推定）: RST側の古い要求値が優先・上書きされる

実機未検証のコード上の推論。実装前に実機ログで確認する（B-6参照）。

1. `sendAndRecvForMainForLoop` は `if (isReqRxFreqUpdate) { RSTのRxを送信 } else if (isRecvRxFreqUpdate) { 無線機から読み取り }` の構造のため、RST→無線機の送信要求が1件でも残っていると、読み取りが行われずRSTの値が送信される。
2. サブ（Tx）側も同様で、`sendAndRecvForSubForLoop`（各周期でメインより先に実行）が `isReqTxFreqUpdate` の古いTx値を送信すると、ユーザーがダイヤルしたTxが元の値に戻される。戻された時点で無線機のトラッキングによりRXも動き、ユーザーの操作結果が消える。
3. レンダラ側の待機（`dopplerResumeDelaySec`、既定2秒）とメイン側の待機（2000ms固定）はほぼ同時に解除される。レンダラ側はRXの基準周波数が更新される前の古い基準周波数から周波数を再算出し、`watch(txFrequency/rxFrequency)` 経由で `setFreq` を呼ぶため、メイン側にTx/Rxの要求が積まれる。

## B-2. 変更方針

1. **読み取り方式**: 新規の読み出しコマンド（`0x25`）は追加せず、既存の定期ループによる読み取り（バンド切り替え＋`makeGetFreq`）を使う。待機解除時点ではユーザーのダイヤル操作が止まっており、定期ループは通常でも周期ごとにメイン／サブを切り替えているため、操作への干渉が小さい。機種依存のコマンド追加も不要になる。
2. **保護**: サブバンド（Tx）のトランシーブを受信したら「RX読み取り待ち」状態にし、読み取り完了まで、RSTからの周波数要求（Tx・Rxの両方）を無線機へ送らない。保留中の要求は破棄する。
3. **読み取り完了の判定**: 有効なRx応答を処理できた時点で「RX読み取り待ち」を解除する。`GET_FREQ` がタイムアウトした場合は保留を維持して次の周期で再試行し、連続3回失敗した場合は、RSTの要求を破棄し続けないよう解除する。コールバックによるレンダラへの通知は、`handleRecvData` で済んでいる。
4. **送信再開**: 解除後にレンダラが基準周波数更新後の値を新たに要求し、それが通常どおり無線機へ送られる。TXは、RXの変化からSum維持で再算出された値が送られる。
5. **対象範囲**: `TransceiverIcomController` は全ICOM機種で共通のため、サテライトモード対応のICOM機種すべてが対象になる。IC-9700専用の分岐は作らない。
6. **レンダラ側は変更しない**: 既存の `applyRxFromTransceiver` をそのまま使う。

## B-3. 詳細設計

### B-3-1. `src/main/service/transceiver/controller/TransceiverIcomState.ts`

- フィールド追加: `public isRxReadPending = false;`（サブバンドのトランシーブ受信後、RX読み取りが完了するまで true）
- メソッド追加: `startRxReadPending(): void`
  - `isRxReadPending = true`
  - 保留中のRST→無線機の周波数要求を破棄する: `isReqTxFreqUpdate = false`、`isReqRxFreqUpdate = false`
  - 要求値を未設定に戻す: `reqTxFreqHz = 0`、`reqRxFreqHz = 0`
    - 理由: 要求値が残ったままだと、解除後に同じ値が再要求された際に `setReqTxFreqHz`／`setReqRxFreqHz` の重複判定で送信されず、無線機側の値（ユーザーのダイヤル値）とRST側の認識がずれたままになる。
    - `switchBandIfNeed` は要求値が0の場合は入れ替えを行わないため、副作用はない。
  - Rxの読み取りを予約する（`isRecvRxFreqUpdate = true`）。受信したTx周波数が前回と同一で `setRecvTxFreqHz()` がフラグを立てなかった場合でも、必ず読み取りが行われるようにする。
  - 失敗回数をリセットする。
- メソッド追加: `endRxReadPending(): void` — 保留中であれば、保留中に予約されたRx読み取り（`isRecvRxFreqUpdate`）も取り消し、`isRxReadPending = false`、失敗回数をリセット。保留中でない場合は通常のトランシーブで立ったフラグを変更しない。
- メソッド追加: `failRxRead(): boolean` — 読み取り失敗を記録する。保留中であれば `isRecvRxFreqUpdate = true` に戻して再試行を予約する。失敗が上限（3回）に達した場合は、読み取りを再予約せずに保留を解除し（`endRxReadPending()`）、`true` を返す。
- `resetAll()` で `isRxReadPending = false` も解除する。

### B-3-2. `src/main/service/transceiver/controller/TransceiverIcomController.ts`

1. `handleRecvData` の周波数トランシーブ（`case "00"`）で、`procRecvFreqData` の後、サテライトモードかつサブバンド（`!this.state.isMain`）の場合のみ `this.state.startRxReadPending()` を呼ぶ。
   - サテライトモードかつメインバンド（Rx）のトランシーブだった場合は、Rx値を受信済みのため `endRxReadPending()` で保留を解除する（直前にTxのトランシーブで保留が立っていた場合に、不要な保留が残らないようにする）。
   - `case "03"`（読み出し応答）では呼ばない。定期ループ自身の読み出しで保留を立てないため。
   - RX（メイン）のトランシーブでは呼ばない。RX値は通知済みで、読み取りが不要なため。
2. `setFreq` の先頭（シリアル接続確認後）で、`this.state.isRxReadPending` が true なら、要求を設定せずに処理を終了する。破棄したことをデバッグログに残す。
3. `sendAndRecvForMainForLoop` のRx読み取り（`GET_FREQ`）の結果で保留を制御する。
   - 有効なRxを処理できた場合（メインバンドへの切り替えに成功し、`GET_FREQ` の応答があり、かつ追加の `GET_BAND` でメインバンドと判定できた場合）: `isRecvRxFreqUpdate = false`、`endRxReadPending()`。
   - 有効なRxを処理できなかった場合（メインバンドへの切り替えの失敗（タイムアウト、NG応答）、`GET_FREQ` のタイムアウト、または `GET_BAND` の失敗で `isMain=false` となり、取得値がTxとして通知された場合）かつ保留中: `failRxRead()` で再試行を予約し、保留を維持する（警告ログを出力）。上限に達した場合のみ保留を解除する。
   - `switchMainBand()` は成否を返し、切り替えコマンドの応答が成功（コマンド部 `fb`）でない場合（タイムアウト、NG応答 `fa` など）は `isMain` を元に戻す。IC-910は `GET_BAND` に対応せず、`isMain` のキャッシュ値を現在のバンドとして扱うため、切り替えに失敗したままTx値をRxと誤判定するのを防ぐ（IC-910は実機がなく未検証）。
   - 保留中のRx読み取りの直前に、レンダラへドップラーシフト待機を通知する（`notifyDopplerShiftWaiting()`）。読み取ったRxがレンダラで基準周波数へ反映される前に、レンダラの周期処理が古い基準周波数で要求を出し、保留の解除後に受け付けられるのを防ぐ（待機通知は、Rx通知より先にレンダラへ届く）。
   - `startRxReadPending()` がRx読み取りを予約するため、保留中は必ず `isRxUpdate()` が true となり、読み取りなしで保留だけ解除されることはない。
4. 状態の取りこぼし防止として、`setSatelliteMode(false)` 実行時と `stop()` でも `endRxReadPending()`（または `resetAll()` 相当）を呼ぶ。

### B-3-3. レンダラ側

- 変更なし。副作用として、読み取り完了までの間（最大でトランシーブの最終受信から約2秒＋ループ周期）、レンダラが古い基準周波数から再算出したRX表示が一瞬出る可能性がある。`applyRxFromTransceiver` が無線機の値に更新するため、ちらつき程度の影響として許容する。

## B-4. 処理シーケンス（TXダイヤル操作）

```
ユーザー          無線機            メイン(Controller)                レンダラ
  │ TXダイヤル      │                      │                              │
  │───────────────▶│ RXも自動で連動        │                              │
  │                │ TXをトランシーブ       │                              │
  │                │─────────────────────▶│ startRxReadPending()          │
  │                │                      │  ・保留中の周波数要求を破棄    │
  │                │                      │  ・isWaitSendFreq = true      │
  │                │                      │ 待機コールバック(true)─────────▶│ 待機開始
  │                │ （操作中は繰り返し）   │  ※setFreqは破棄される          │
  │ ダイヤル停止    │                      │                              │
  │                │                      │ 2000ms経過で待機解除           │
  │                │◀─────────────────────│ サブ読み出し／メイン切替       │
  │                │◀─────────────────────│ Rx GET_FREQ                   │
  │                │─────────────────────▶│ procRecvFreqData              │
  │                │                      │ freqCallback(downlinkHz)──────▶│ applyRxFromTransceiver
  │                │                      │ endRxReadPending()            │ （RX表示・基準周波数を更新）
  │                │                      │◀───────────────────────────────│ 新しいTx/Rxを要求
  │                │◀─────────────────────│ 通常どおり送信                 │
```

## B-5. 影響とリスク

- **ダイヤル操作中の保持**: 保留中に破棄するRST要求は、ダイヤル操作中のみ発生する。待機はもともとRSTからの送信を止める目的であり、挙動の方向性は変わらない。
- **保留の長さ**: 通常は最後のトランシーブから約2秒＋ループ周期（`autoTrackingIntervalSec`）。読み取りが失敗した場合は、最大でさらに再試行2回分（ループ周期×2）延びる。シリアル切断時は `stop()` で解除される。
- **読み取りの失敗**: タイムアウト時は再試行し、連続3回失敗した場合は保留を解除する（RX表示は更新されないが、RSTの要求を破棄し続けて固着することはない）。
- **進行中のレンダラ周期処理との競合（既知・対応しない）**: レンダラへのドップラーシフト待機の通知は、通知の時点で待機判定を通過済みの `updateFreq()` を止められない。その処理が古い基準周波数のまま計算を続け、メイン側の保留解除後に要求が届くと、無線機のRxを一時的に古い値で上書きする可能性がある（Copilotレビュー指摘）。窓は通知から保留解除までの数十ミリ秒に限られ、その後のレンダラは更新後の基準周波数から再算出して送るため、最大でも1周期（約1秒）で正しい値に戻る。レンダラ側の世代番号管理やRx反映完了ACKは変更が大きいため、今回は対応せず、実機で問題が確認された場合に再検討する。
- **TX受信の無駄な読み出し**: `setRecvRxFreqHz` が `isRecvTxFreqUpdate` も立てるため、Rxトランシーブ後にTxの読み出しが走る既存の動作は変更しない（本件のスコープ外）。

## B-6. 実装前の確認事項（実機）

- 実機（IC-9700）で、TXダイヤル操作後の `TransceiverIcomController` ログを取り、次を確認する。
  1. 待機解除後に `sendAndRecvForMainForLoop Rx周波数取得要求` が出力されているか（既存の読み取りが動いているか）。
  2. 出力されない場合に、`Rx周波数（RST→無線機）` が先に出力されていないか（B-1-2の上書き推論の裏付け）。
  3. 解除直後に `Tx周波数（RST→無線機）` で元のTxが送り返されていないか。
- 上記の結果がB-1-2の推論と異なる場合は、B-3の方針を見直してから実装する。

## B-7. テスト方針

- `src/__tests__/main/service/transceiver/controller/TransceiverIcomState/` に `TransceiverIcomState_rxReadPending.test.ts` を追加する。
  - `startRxReadPending` で保留フラグが立ち、`isReqTxFreqUpdate`／`isReqRxFreqUpdate` と要求値が初期化されること。
  - `startRxReadPending` 後に同じ値で `setReqTxFreqHz`／`setReqRxFreqHz` を呼ぶと、更新フラグが立つこと（重複判定でスキップされないこと）。
  - `endRxReadPending`／`resetAll` で保留が解除されること。
- `TransceiverIcomController` は既存の単体テストがなく、シリアルI/Oに依存するため、`setFreq` の保留中破棄と保留解除タイミングは実機での動作確認（B-6のログ）で検証する。

## B-8. ドキュメント更新

- `doc/10_アーキテクチャ/10_アーキテクチャ.md`: 無線機制御（メインプロセス）に、TXトランシーブ後のRX読み取りと、保留中のRST要求の破棄を追記する。
- `doc/30_画面設計/G2_メイン.md`（2.3.2節）: 「無線機側でTXダイヤルを操作すると連動してRXが変化するが、ダイヤル操作停止後にRST側のRXへ反映される」旨を追記する。
