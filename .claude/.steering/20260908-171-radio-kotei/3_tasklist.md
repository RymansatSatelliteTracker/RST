# タスクリスト：送信固定/受信固定モードにおけるダイヤル操作の反映方法の是正

## Phase 1: ロジック実装

- [x] `src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts` を修正
  - `applyTxFromTransceiver`/`applyRxFromTransceiver`先頭の固定側破棄判定（`isTxFixedSide`/`isRxFixedSide`によるガード）を削除し、Auto ON中でも無条件に画面表示・基準周波数の更新処理へ進むようにする
  - 基準周波数の再計算後、もう一方の基準周波数を「固定側なら据え置く」分岐（`finalTxBaseFreq`/`finalRxBaseFreq`の三項演算子部分）を両関数から削除し、常に`newTxBaseFreq`/`newRxBaseFreq`をそのまま採用するようにする
  - 不要になった`isTxFixedSide`/`isRxFixedSide`ヘルパーメソッドと`logDiscardFixedSide`ログメソッドを削除する
  - 不要になったコンストラクタの`getCorrectionFlags: () => DopplerShiftCorrectionFlags`引数と`isSatelliteMode: Ref<boolean>`引数を削除する
- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts` を修正
  - `new TransceiverRecvFreqResolver(...)`呼び出しから、削除した`getCorrectionFlags`（`() => dopplerModeResolver.resolveCorrectionFlags(...)`）と`isSatelliteMode`の2引数を除去する
  - `resendFixedSideFreqToTransceiver()`の各分岐に、送信前の再算出処理を追加する
    - Tx分岐：`freqCoordinator.sendTxFreq(...)`の前に`await freqCoordinator.updateTxFreqByInvertingHeterodyne(coordinator.autoTrackingIntervalMsec)`を呼び、`txFrequency`を現在の基準周波数から再算出してから送信する
    - Rx分岐：`freqCoordinator.sendRxFreq(...)`の前に`await freqCoordinator.updateRxFreqWithDopplerShift(coordinator.autoTrackingIntervalMsec)`を呼び、`rxFrequency`を現在の基準周波数から再算出してから送信する
  - 分岐条件（execフラグ・`isSatelliteMode`ガード）、`isForce: true`での送信、`updateFreq()`内の呼び出し順序は変更しない

## Phase 2: 単体テスト更新

- [x] `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts` を更新
  - 「送信固定モードでTx周波数を受信した場合」の期待値を反転し、「Txが更新され、Sumを保ったままRx基準周波数も更新されること」に変更する
  - 「送信固定モードでRx周波数を受信した場合」の期待値を、「Rxが更新され、Sumを保ったままTx基準周波数も更新されること」に変更する
  - 「受信固定モードでRx周波数を受信した場合」の期待値を反転し、「Rxが更新され、Sumを保ったままTx基準周波数も更新されること」に変更する
  - 「受信固定モードでTx周波数を受信した場合」の期待値を、「Txが更新され、Sumを保ったままRx基準周波数も更新されること」に変更する
  - 「受信固定モードでもサテライトモードOFF時はRx周波数受信を破棄せず画面表示を更新すること」のケースを削除、または「サテライトモードOFF時でも通常どおりRxが反映されること」程度に簡略化する
  - 「Rx周波数受信かつAutoOn時（衛星固定相当）、基準周波数を算出すること」「Tx周波数受信かつAutoOff時、固定側判定を行わず画面周波数のみ更新すること」の2ケースは変更なしで維持する（回帰確認）
  - 各テストケースの`TransceiverRecvFreqResolver`インスタンス化箇所から、削除した`getCorrectionFlags`/`isSatelliteMode`引数を除去する

## Phase 3: テスト・型チェック

- [x] `npm run test` で新規・修正テストを含む全テストが成功することを確認する
- [x] `npm run ts` / `vue-tsc --noEmit` で型チェックエラーが無いことを確認する

## Phase 4: ドキュメント更新

- [x] `doc/30_画面設計/G2_メイン.md` の「2.3.2 Dopplerモード」（L161-187付近）を、受信固定・送信固定のいずれも「ダイヤル操作された側（Tx/Rxどちらでも）がそのままRST側に反映され、もう一方はSumを保って再計算される。ダイヤル操作終了後、周期処理の対象外側の周波数を再算出したうえで無線機へ送信し、現在のモードを継続する」という内容に書き直す

## Phase 5: 動作確認

- [ ] `npm run app:dev` でアプリを起動し、Auto ON状態を作る
- [ ] （無線機接続環境がある場合）送信固定選択時：ダイヤルでRxを変更→Rxが追従し、ダイヤル操作終了後にTx表示・基準周波数がSumを保ったまま更新され、無線機のTx周波数も上書き送信されることを確認する
- [ ] （無線機接続環境がある場合）受信固定選択時：上記と対称のケース（ダイヤルでRxを変更した場合の反映、ダイヤル操作終了後のRx再送信）を確認する
- [ ] （無線機接続環境がある場合）衛星固定モードでは、従来どおりTx/Rxとも常時ドップラー追従することを確認する（リグレッション防止）

## Phase 6: Rxダイヤル操作に伴うTx側自動変化をRSTに取り込まない対応（要求追記への対応）

- [x] `src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts` を修正
  - `DopplerShiftCorrectionFlags`型のimportを復活させる
  - コンストラクタに`getCorrectionFlags: () => DopplerShiftCorrectionFlags`引数を再度追加する（`isSatelliteMode`は追加しない）
  - `isFixedSatMode(flags): boolean`（`flags.execTxDopplerShiftCorrection && flags.execRxDopplerShiftCorrection`）を追加する
  - `applyTxFromTransceiver`の先頭に、AutoOn中かつ`!isFixedSatMode(this.getCorrectionFlags())`の場合はTx通知を画面表示・基準周波数とも反映せず破棄するガードを再度追加する（ログメソッド`logDiscardTxNotification`等を追加）
  - `applyRxFromTransceiver`は変更しない（Rxは引き続き常に受け付ける）
- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts` を修正
  - `new TransceiverRecvFreqResolver(...)`呼び出しに`() => dopplerModeResolver.resolveCorrectionFlags(dopplerShiftMode.value)`を再度渡す
  - `resendFixedSideFreqToTransceiver()`は変更しない（既にこの要求を満たしている）
- [x] `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts` を更新
  - 「送信固定モードでTx周波数を受信した場合」「受信固定モードでTx周波数を受信した場合」を、「画面表示・基準周波数のいずれも変化しないこと（Tx通知は破棄される）」に戻す
  - 「衛星固定モードでTx周波数を受信した場合、画面表示・基準周波数とも反映されること」の新規ケースを追加する
  - コンストラクタ生成箇所に、再度追加した`getCorrectionFlags`引数を反映する
- [x] `npm run test` / `npm run ts` で全テスト成功・型エラーなしを確認する
- [x] `doc/30_画面設計/G2_メイン.md` の「2.3.2 Dopplerモード」を、「送信固定・受信固定では、無線機側のダイヤル操作はRx側としてのみ受け付け、Tx側の無線機通知（ダイヤル操作に伴う自動変化を含む）は取り込まない」という記載に修正する
- [ ] （無線機接続環境がある場合）送信固定・受信固定のいずれでも、Rxダイヤル操作により無線機側のTx周波数が自動的にズレても、RST側のTx表示・基準周波数が変化しないことを実機で確認する
