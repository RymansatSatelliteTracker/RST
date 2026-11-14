# タスクリスト：無線機制御「受信固定」「送信固定」対応

## Phase 1: ロジックのテスト容易性リファクタ

- [x] `src/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverDopplerModeResolver.ts` を新規作成
  - `resolveCorrectionFlags(dopplerShiftMode: string): DopplerShiftCorrectionFlags` を実装（`useTransceiverCtrl.ts` の `updateDopplerShiftCorrectionFlags()` と同一のFIXED_SAT/FIXED_RX/FIXED_TX判定ロジック）
- [x] `src/renderer/components/organisms/TransceiverCtrl/useTransceiverCtrl.ts` を修正
  - `TransceiverDopplerModeResolver` をインポート・インスタンス化
  - `updateDopplerShiftCorrectionFlags()` の中身をresolver呼び出し＋Ref反映に置き換え（呼び出し箇所・関数シグネチャは変更しない）

## Phase 2: 単体テスト追加

- [x] `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverDopplerModeResolver_resolveCorrectionFlags.test.ts` を新規作成
  - `FIXED_SAT` → Tx/Rx双方 `true`
  - `FIXED_RX` → `execTx=true` / `execRx=false`
  - `FIXED_TX` → `execTx=false` / `execRx=true`
  - 未知モード → Tx/Rx双方 `false`（防御的なケースとして追加）

## Phase 3: UI変更（セレクトボックス活性化）

- [x] `src/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue` を修正
  - `dopplerShiftModeRange` の各項目から `props: { disabled: ... } }` とTODOコメントを削除し、「受信固定」「送信固定」を選択可能にする

## Phase 4: ドキュメント更新

- [x] `doc/30_画面設計/G2_メイン.md` の「2.3 無線機制御パネル主要項目」に「2.3.2 Dopplerモード」セクションを追加し、以降の見出し番号（2.3.2〜2.3.12）を2.3.3〜2.3.13へ繰り下げる
  - モード別（衛星固定/受信固定/送信固定）のAuto ON時の周波数設定・ドップラーシフト補正適用有無を制御条件として記載する

## Phase 5: 動作確認

- [x] `npm run test` を実行し、新規テストを含む全テストが成功することを確認（73ファイル/776テスト成功）
- [x] `npm run ts`（メインプロセス）・`vue-tsc --noEmit`（レンダラー）で型チェックエラーが無いことを確認
- [ ] `npm run app:dev` でアプリを起動し、Dopplerモードのセレクトボックスで「受信固定」「送信固定」が選択可能になっていることを目視確認
  - 本環境では自動化されたElectron起動確認（Playwright E2E含む）が `ELECTRON_RUN_AS_NODE=1` によりブロックされており実施不可（本改修と無関係な既存の環境制約。既存の `startup.test.ts` も同様に失敗することを確認済み）。ユーザー側での実機確認が必要。
- [ ] （無線機接続環境がある場合）受信固定選択時：Auto ON後にRx周波数が選択中衛星の受信周波数に固定され、Tx周波数のみドップラー追従することを確認
- [ ] （無線機接続環境がある場合）送信固定選択時：Auto ON後にTx周波数が選択中衛星の送信周波数に固定され、Rx周波数のみドップラー追従することを確認
