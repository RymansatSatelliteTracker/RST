# 改修タスクリスト：再起動時のアクティブ衛星の不一致修正

設計は [`2_design.md`](./2_design.md) を参照。

## 実装

- [x] A: `useSatelliteSelectBox.ts` の `restoreSelectedSatId()` で、記録がない場合は `mainSatelliteId` を優先する
- [x] B-1: `ActiveSatServiceHub.start()` で IPC リスナを初回取得より前に登録する
- [x] B-2: `ActiveSatServiceHub.onChangeSatGrp()` を直列化する（本体を `refreshActiveSat()` へ移動）

## 単体テスト

- [x] `useSatelliteSelectBox.test.ts` を追加
- [x] `ActiveSatServiceHub.test.ts` を追加
- [x] 既存テストへの影響確認（`npm run test`）※ OverlapPassesService.test.ts の1件は修正前から失敗（本改修とは無関係）

## ドキュメント

- [x] `doc/30_画面設計/G2_メイン.md` の「2.1.2 衛星選択」を更新する

## 検証

- [x] `npm run test` で本改修による失敗がないこと（89ファイル 873テスト中、既存失敗1件のみ）
- [x] 実機で、2つ目の衛星をアクティブにして終了→再起動し、選択ボックス・地図の軌道（E2E No.1で自動確認）・レーダー・AOS が2つ目で一致すること
- [ ] 衛星グループを切り替えて戻したとき、前回選択した衛星が復元されること
- [ ] アクティブ衛星を衛星設定で削除して再起動したとき、先頭の衛星が選択され、軌道も一致すること

## E2Eテスト

詳細は [`4_e2e_test.md`](./4_e2e_test.md) を参照。

- [x] `e2eTestData.ts` に `makeTle()`（軌道傾斜角を指定可能）を移動し、`beaconTestData.ts` から利用する
- [x] `activeSatRestoreTestData.ts` を追加
- [x] `activeSatRestore.test.ts` を追加（3件）
- [x] `npm run test:e2e` が通ること（19件成功）
- [x] 修正前のコードで No.1・2 が失敗することを確認
