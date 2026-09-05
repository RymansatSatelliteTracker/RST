# タスクリスト：無線機ダイヤル操作時の周波数固定挙動の改善

## Phase 1: ロジック実装

- [x] `src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts` を修正
  - コンストラクタに現在の補正要否フラグを返すgetter（`getCorrectionFlags: () => DopplerShiftCorrectionFlags`）を追加
  - `applyTxFromTransceiver`の先頭で、Auto ON中に`!getCorrectionFlags().execTxDopplerShiftCorrection`（＝Txが固定側）の場合は画面表示・基準周波数のどちらも更新せず即終了する
  - `applyRxFromTransceiver`も対称に実装（`execRxDopplerShiftCorrection`で判定）
  - 基準周波数再計算後、もう一方の側が固定側（execフラグがfalse）の場合は、Sum維持のために計算された値を採用せず、既存の`plainBaseFreq`を維持する
- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts` を修正
  - `TransceiverRecvFreqResolver`のコンストラクタ呼び出しに `() => dopplerModeResolver.resolveCorrectionFlags(dopplerShiftMode.value)` を追加

## Phase 2: 単体テスト追加

- [x] `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts` を拡充
  - 送信固定モード：Tx通知受信時、表示・基準周波数とも変化しないこと
  - 送信固定モード：Rx通知受信時、Rx表示・Rx基準周波数は更新され、Tx基準周波数は変化しないこと
  - 受信固定モードの対称ケース（Rx通知は破棄、Tx通知でTxのみ更新されRx基準周波数は不変）
  - 衛星固定モード：従来通り両側とも更新されること（リグレッション防止）
  - Auto OFF時：固定判定を行わず、従来通り画面表示のみ更新されること

## Phase 3: テスト・型チェック

- [x] `npm run test` で新規テストを含む全テストが成功することを確認（73ファイル/780テスト成功）
- [x] `npm run ts` / `vue-tsc --noEmit` で型チェックエラーが無いことを確認

## Phase 4: ドキュメント更新

- [x] `doc/30_画面設計/G2_メイン.md` の「2.3.2 Dopplerモード」制御条件に、受信固定/送信固定それぞれのダイヤル操作時の挙動（固定側は無線機からの通知を反映しない）を追記する

## Phase 5: 固定側の周波数を無線機へ再送信する対応（追加要求）

- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts` を修正
  - `updateFreq()`の外側（クロージャ内）に、ダイヤル待機の立ち下がりを検出するローカル変数`wasDopplerWaiting`を追加
  - `updateFreq()`内、`dopplerWaitCoordinator.isWaiting`がtrueの間は`wasDopplerWaiting = true`として早期return、AutoOff時は`wasDopplerWaiting = false`にリセット
  - 待機解除直後（`wasDopplerWaiting`がtrueだった場合）、`resendFixedSideFreqToTransceiver()`を呼び出してから`applyDopplerShiftCorrections()`を実行する
  - `resendFixedSideFreqToTransceiver()`を新規実装：`execTxDopplerShiftCorrection`/`execRxDopplerShiftCorrection`がfalseの側（固定側）について、現在の`txFrequency`/`rxFrequency`を`freqCoordinator.sendTxFreq`/`sendRxFreq`で無線機へ直接送信する（Refは変更せず二重送信を避ける）。Rx側は既存の`isSatelliteMode`ガードに合わせる
- [x] `npm run test` / `npm run ts` / `vue-tsc --noEmit` で確認（73ファイル/780テスト成功、型エラーなし）
- [x] `doc/30_画面設計/G2_メイン.md`「2.3.2 Dopplerモード」に、ダイヤル操作後は固定側の周波数を無線機へ再送信して上書きする旨を追記

## Phase 6: 動作確認

- [x] `npm run app:dev` でアプリを起動し、Auto ON状態を作る
- [x] （無線機接続環境がある場合）送信固定選択時：ダイヤルでRxを変更→Rxのみ追従し、Tx表示・基準周波数が一切変化しないことを確認
- [x] （無線機接続環境がある場合）受信固定選択時：上記の送受対称のケースを確認
- [ ] （無線機接続環境がある場合）固定されている側自体をダイヤル操作した場合に、RST側の表示・基準周波数が変化しないことを確認
- [x] （無線機接続環境がある場合）ダイヤル操作で無線機側の固定側周波数がズレた場合に、ダイヤル操作終了後、無線機側の固定側周波数がRSTの値に上書きされることを確認 → 実機検証の結果、固定側が送信されない不具合を発見（Phase 7で対応）

## Phase 7: 固定側の再送信がメインプロセス側で握りつぶされる不具合の修正（実機検証結果を受けた追加対応）

実機検証の結果、Phase 5の対応だけでは固定側の周波数が無線機へ送信されないことが判明した。原因は[`TransceiverIcomState.setReqTxFreqHz`/`setReqRxFreqHz`](../../../src/main/service/transceiver/controller/TransceiverIcomState.ts)が「前回RSTが無線機に要求した値」と同一の場合に送信要求フラグを立てずスキップする最適化を持っており、固定側はRST内部の値が変化しないため常にこのスキップに該当していたため。詳細は[`2_design.md`](./2_design.md)「実機検証で判明した根本原因と追加対応（isForce化）」を参照。

- [x] `src/main/service/transceiver/controller/TransceiverIcomState.ts` を修正
  - `setReqTxFreqHz`/`setReqRxFreqHz`に`isForce: boolean = false`引数を追加し、`true`の場合は同一値チェックをスキップして送信要求フラグを立てる（`setReqTxMode`/`setReqRxMode`の既存`isForce`パターンを踏襲）
- [x] `isForce`を以下の経路で末端まで貫通させる
  - `src/main/service/transceiver/controller/TransceiverControllerBase.ts`（`setFreq`抽象メソッドのシグネチャ）
  - `src/main/service/transceiver/controller/TransceiverIcomController.ts`（`setFreq`）
  - `src/main/service/TransceiverSerivice.ts`（`setTransceiverFrequency`）
  - `src/main/initializeIpcEvent.ts`（`setTransceiverFrequency`のIPCハンドラ）
  - `src/main/preload.ts`（`setTransceiverFrequency`）
  - `src/renderer/api/ApiTransceiver.ts`（`setTransceiverFrequency`）
  - `src/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator.ts`（`sendTxFreq`/`sendRxFreq`）
- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts` の `resendFixedSideFreqToTransceiver()` から `sendTxFreq`/`sendRxFreq` を呼ぶ際に `isForce: true` を指定する
- [x] 単体テスト追加・更新
  - `TransceiverFreqCoordinator_sendTxFreq.test.ts`/`sendRxFreq.test.ts`：`isForce`が`ApiTransceiver.setTransceiverFrequency`にそのまま渡ることを検証するケースを追加（既存ケースも呼び出し引数の期待値を更新）
  - `TransceiverIcomState_setReqTxFreqHz.test.ts`/`setReqRxFreqHz.test.ts`（新規）：同一値の場合は抑止されること、`isForce`指定時は抑止されないことを検証
- [x] `npm run test`（Transceiver関連：34ファイル/111テスト成功。全体では本改修と無関係な`OverlapPassesService.test.ts`の1件が日付依存で失敗するのみで、既存事象と判断）
- [x] `npm run ts` / `vue-tsc --noEmit` で型チェックエラーが無いことを確認

## Phase 8: 動作確認（再送信の実機確認）

- [x] `npm run app:dev` でアプリを起動し、Auto ON状態を作る
- [x] （無線機接続環境がある場合）ダイヤル操作で無線機側の固定側周波数がズレた場合に、ダイヤル操作終了後、無線機側の固定側周波数がRSTの値に上書き送信されることを実機で再確認する
  → 初回検証時は未解消と判断されたが、Phase 9で追加した診断ログにより、実際には`isForce`化した再送信が正しく動作していることをログで確認（`91：Rx周波数（RST→無線機） 437800000`）。**解消済み**。

## Phase 9: 診断ログの追加（原因切り分け・解決確認用）

実装（`isForce`によるメインプロセスの重複送信抑止バイパス）自体はコードレビュー上正しく見えたが、実機での見た目上の未解消報告を受け、ログで確実に切り分けるため以下を追加した。

- レンダラー側の`resendFixedSideFreqToTransceiver()`が実際に呼ばれているか、どちらの分岐（Tx/Rx/該当なし）を通ったか
- メインプロセス側で実際に`SET_FREQ`コマンドが送信されたか（Rx/Tx）
- メインプロセス自身の送信一時停止（`isWaitSendFreq`、`TRANSCEIVE_WAIT_MS`=2000ms）とレンダラー側の待機解除（`dopplerResumeDelaySec`=3000ms）の開始・解除タイミングの前後関係

- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts`：`resendFixedSideFreqToTransceiver()`に、どの分岐を通ったか（Tx固定/Rx固定/該当なしとそのフラグ値）を出力するデバッグログを追加
- [x] `src/main/service/transceiver/controller/TransceiverIcomController.ts`：
  - `sendAndRecvForMainForLoop`/`sendAndRecvForSubForLoop`のRx/Tx周波数送信分岐（`isReqRxFreqUpdate`/`isReqTxFreqUpdate`）に送信値のデバッグログを追加（取得側の分岐には既存ログがあったが送信側には無かったため）
  - `startTransceiveWaitTimer`に、送信一時停止の開始・解除のデバッグログを追加
  - 定期送受信タイマーが`isWaitSendFreq`によりスキップされた場合のデバッグログを追加
- [x] `npm run test` / `npm run ts` で確認（Transceiver関連34ファイル/111テスト成功、型エラーなし）
- [x] ユーザーに再現・ログ取得（`%APPDATA%/rst/logs/rst.log`）を依頼し、ログで解決を確認
  - ログ抜粋：無線機Auto On→Txダイヤル操作検知（無線機への送信を一時停止）→一時停止解除→レンダラー側「ダイヤル操作終了検知：固定側(Rx)の周波数を再送信します。0437.800.000」→メインプロセス側「91：Rx周波数（RST→無線機） 437800000」で実際に送信されたことを確認
  - 途中、無線機側でリバーストランスポンダによりRxが437812148Hzへドリフトしていたことも「Rxは固定側のため、無線機からの周波数通知を破棄します。」のログで確認でき、破棄→再送信の一連の流れが設計通り機能していることを確認
