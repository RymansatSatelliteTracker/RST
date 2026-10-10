# 改修タスクリスト

本書は「要求A（実装済み）」と「要求B（実装済み・一部実機確認未実施）」の2部構成。要求Bは本書の末尾を参照。

---

# 要求A: Tx周波数の無線機→RST反映の廃止（完了）

`2_design.md` に基づく実装タスク。上から順に実施する（デッドコードの連鎖削除は依存関係があるため、コード側→テスト側→ドキュメントの順で進める）。

## 1. コード変更

- [x] 1-1. `src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.ts`
  - [x] `applyFromTransceiver` の `uplinkHz` 分岐先を `discardTxFromTransceiver()` に変更
  - [x] `applyTxFromTransceiver` を削除し、`discardTxFromTransceiver` を追加
  - [x] `isFixedSatMode` を削除
  - [x] `logDiscardTxNotification` を削除（ログは `discardTxFromTransceiver` に統合）
  - [x] コンストラクタの `getCorrectionFlags` 引数とJSDocを削除
  - [x] `import type { DopplerShiftCorrectionFlags }` を削除
  - [x] `RecvFreqResolverState` から `txFrequency` / `txFrequencyAdjustment` を削除
  - [x] `logSkipBaseFreqUpdate` の `freqLabel` 引数を削除し、呼び出し元（Rx側1箇所）を追従修正
- [x] 1-2. `src/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.ts`
  - [x] `calcBaseFreqByShiftedTxFreq` を削除
- [x] 1-3. `src/renderer/service/FrequencyTrackService.ts`
  - [x] `calcInvHeteroBaseFreqByTxFreq` を削除
- [x] 1-4. `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts`
  - [x] `TransceiverRecvFreqResolver` 生成箇所から `txFrequency` / `txFrequencyAdjustment` / `getCorrectionFlags` 相当の引数を削除

## 2. テスト変更

- [x] 2-1. `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts`
  - [x] Tx系テスト（AutoOff時、衛星固定モード、送信固定モード、受信固定モードの4ケース）を「モード・AutoOn/Off不問でTxは常に破棄される」テストに統合
  - [x] コンストラクタ呼び出しから `getCorrectionFlags`（`FLAGS_FIXED_*`）引数を削除し、未使用になった `FLAGS_FIXED_SAT`/`FLAGS_FIXED_TX`/`FLAGS_FIXED_RX` 定義を整理（Rx系テストでの使用有無を確認の上、不要なら削除）
  - [x] Rx系テスト（送信固定／受信固定でのRx反映）は変更しない
- [x] 2-2. 以下のテストファイルを削除
  - [x] `src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcBaseFreqByShiftedTxFreq.test.ts`
  - [x] `src/__tests__/renderer/service/FrequencyTrackService_calcInvHeteroBaseFreqByTxFreq.test.ts`
- [x] 2-3. `npm run test` を実行し、全テストがパスすることを確認する

## 3. ドキュメント更新

- [x] 3-1. `doc/30_画面設計/G2_メイン.md`（2.3.2節）
  - [x] 「衛星固定」の記述を、Tx側は無線機通知を取り込まない内容に修正
  - [x] 「受信固定」「送信固定」「サテライトモードOFF」の記述との整合性を確認し、3モード共通でTxが一方向である旨が分かるように調整
- [x] 3-2. `doc/10_アーキテクチャ/10_アーキテクチャ.md`
  - [x] `TransceiverRecvFreqResolver` の役割説明を更新（Rxのみ反映する旨）
  - [x] `TransceiverDopplerCalc` の役割説明を更新（逆ヘテロダイン再算出がRx限定である旨）

## 4. 最終確認

- [x] 4-1. `npm run test`（カバレッジ付き全体実行）がパスすること
- [x] 4-2. 変更差分に対して `npm run format` を実行し、整形崩れがないこと
- [x] 4-3. 受け入れ基準（`1_requirements.md`）を満たすことをコードレベルで再確認
  - 衛星固定・受信固定・送信固定の全モードで、無線機側のTx周波数変化がRST側`txFrequency`・Tx基準周波数に反映されないこと
  - RST→無線機方向のTx送信処理（`sendTxFreq`等）が変更されていないこと
  - Rx周波数の既存同期挙動に変化がないこと

---

# 要求B: TXダイヤル操作後のRX読み取り（実装済み・一部実機確認未実施）

`2_design.md` の要求B（B-1〜B-8）に基づく。**実機ログの確認（B-0）の結果によっては、方針を見直す。**

## B-0. 実機ログによる原因の確認（実装前・完了）

結果: Auto ON・ドップラー再開時間2秒のログで推論どおり再現。メイン／レンダラの待機が同時に解除され、レンダラが古い基準周波数で再算出した値（Tx 145992675 / Rx 437791976）がメインから送信され、`Rx周波数取得要求` は出力されなかった。再開時間3秒の場合は、読み取りがレンダラ再開より先に走り、基準周波数が更新された（タイミング依存）。

- [x] B-0-1. 実機（IC-9700）でTXダイヤル操作を行い、`TransceiverIcomController` のログを取得する
- [x] B-0-2. 待機解除後に `sendAndRecvForMainForLoop Rx周波数取得要求` が出力されているかを確認する
- [x] B-0-3. 出力されない場合、`Rx周波数（RST→無線機）` が先に出力されていないか確認する
- [x] B-0-4. 解除直後に `Tx周波数（RST→無線機）` で元のTxが送り返されていないか確認する
- [x] B-0-5. 結果が `2_design.md` B-1-2 の推論と異なる場合は、設計を見直してからB-1以降へ進む

## B-1. コード変更

- [x] B-1-1. `src/main/service/transceiver/controller/TransceiverIcomState.ts`
  - [x] `isRxReadPending` フィールドを追加
  - [x] `startRxReadPending()` を追加（保留フラグON、`isReqTxFreqUpdate`／`isReqRxFreqUpdate` をOFF、`reqTxFreqHz`／`reqRxFreqHz` を0に戻す）
  - [x] `endRxReadPending()` を追加
  - [x] `resetAll()` で `isRxReadPending` も解除する
- [x] B-1-2. `src/main/service/transceiver/controller/TransceiverIcomController.ts`
  - [x] `handleRecvData` の `case "00"` で、サテライトモードかつサブバンドの場合のみ `startRxReadPending()` を呼ぶ
  - [x] `setFreq` で `isRxReadPending` が true の場合は要求を設定せず、デバッグログを出して終了する
  - [x] `sendAndRecvForMainForLoop` のRx読み取り結果で保留を制御する（応答あり: 解除、`TIMEOUT`: 再試行、連続3回失敗: 解除）
  - [x] （Copilotレビュー対応）`startRxReadPending()` でRx読み取りを予約し、`failRxRead()` を追加
  - [x] （Copilotレビュー対応）メインバンド（Rx）のトランシーブ受信時は保留を解除し、Rx取得の成否判定に `GET_BAND` の結果（`isMain`）を含める
  - [x] （Copilotレビュー対応）保留解除時にRx読み取りの予約も取り消す。読み取り前にレンダラへドップラーシフト待機を通知する（`notifyDopplerShiftWaiting`）
  - [x] （Copilotレビュー対応）`switchMainBand()` が成否を返すようにし、切り替え失敗時は `isMain` を戻してRx取得の成否判定に含める（IC-910は実機がなく未検証）
  - [x] `setSatelliteMode(false)` 実行時と `stop()` でも保留を解除する

## B-2. テスト変更

- [x] B-2-1. `src/__tests__/main/service/transceiver/controller/TransceiverIcomState/` にメソッド単位のテストを追加（`_startRxReadPending` / `_endRxReadPending` / `_failRxRead` / `_resetAll`）
  - [x] `startRxReadPending` で保留フラグが立ち、更新フラグと要求値が初期化されること
  - [x] `startRxReadPending` 後に同じ値で `setReqTxFreqHz`／`setReqRxFreqHz` を呼ぶと更新フラグが立つこと
  - [x] `endRxReadPending`／`resetAll` で保留が解除されること
- [x] B-2-2. `npm run test` を実行し、全テストがパスすることを確認する

## B-3. ドキュメント更新

- [x] B-3-1. `doc/10_アーキテクチャ/10_アーキテクチャ.md` に、TXトランシーブ後のRX読み取りと、保留中のRST要求の破棄を追記
- [x] B-3-2. `doc/30_画面設計/G2_メイン.md`（2.3.2節）に、TXダイヤル操作停止後にRXがRST側へ反映される旨を追記

## B-4. 最終確認

- [x] B-4-1. 実機で、TXダイヤル操作後にRX表示・基準周波数が反映されること（`1_requirements.md` 要求Bの受け入れ基準）
- [x] B-4-2. 実機で、ダイヤル操作中にRX読み取りが走らないこと、および最後のトランシーブがRXだった場合・サテライトモードOFF時に読み取りが走らないこと
- [x] B-4-3. RSTの古いRX／TX値が無線機へ送信されて、ダイヤル操作の結果が上書きされないこと
- [x] B-4-4. `npm run format` で整形崩れがないこと
