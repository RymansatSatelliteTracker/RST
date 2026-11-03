# 改修タスクリスト：受信固定／送信固定モードのドリフト修正

設計は [`2_design.md`](./2_design.md) を参照。

## 実装

- [x] `FrequencyTrackService.calcInvHeteroBaseFreqByTxFreq` を復活させる（83e96f19 の削除前の実装）
- [x] `TransceiverDopplerCalc.calcTxFreqKeepingRxFixed` を追加する
- [x] `TransceiverDopplerCalc.calcRxFreqKeepingTxFixed` を追加する
- [x] `TransceiverFreqCoordinator.updateTxFreqKeepingRxFixed` を追加する
- [x] `TransceiverFreqCoordinator.updateRxFreqKeepingTxFixed` を追加する
- [x] `useTransceiverCtrl.ts` の `applyDopplerShiftCorrections` を、受信固定／送信固定（サテライトモードON時）で分岐させる
- [x] 衛星固定モード・サテライトモードOFF時の挙動が従来どおりであることをコード上で確認する

## 単体テスト

- [x] `FrequencyTrackService_calcInvHeteroBaseFreqByTxFreq.test.ts` を追加（83e96f19 で削除したテストを復活）
- [x] `TransceiverDopplerCalc_keepingFixed.test.ts` を追加（受信固定・送信固定の両メソッド）
  - [x] v=0 のとき Tx = txBase となる
  - [x] 係数が変化しても Rx 観測値が R0 に一致する
  - [x] 補正値ありのケース
  - [x] `FrequencyTrackService` 未取得時に `null`
- [x] `TransceiverFreqCoordinator_updateKeepingFixed.test.ts` を追加（2メソッド）
- [x] 既存テストへの影響確認（`npm run test`）

## ドキュメント

- [x] `doc/30_画面設計/G2_メイン.md` の「2.3.2 Dopplerモード」を更新する
- [x] 図を罫線で表現する場合は、全角文字により図が崩れないようスペースを調整する

## 検証

- [x] `npm run test` が通る（80ファイル 834テスト成功）こと（PowerShellで実行）
- [ ] lint／フォーマットが通ること（`npm run format`）
- [ ] 実機／シミュレータで受信固定の1パス分を追尾し、受信キャリアがドリフトしないこと（`rst.log` を修正前と比較）
- [ ] 実機／シミュレータで送信固定の1パス分を追尾し、受信キャリアがドリフトしないこと
- [ ] 衛星固定が従来と同じ挙動であること
- [ ] 受信固定／送信固定でダイヤル操作を行っても、操作終了後に再びドリフトしないこと
- [ ] サテライトモードOFF時の動作が従来と同じであること
