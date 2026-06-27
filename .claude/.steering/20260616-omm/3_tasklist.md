# タスクリスト：TLE → OMM 移行

## Phase 1: 基盤整備

- [x] `src/common/model/OmmModel.ts` 新規作成（OmmItem型・OmmJsonModel）
- [x] `src/common/Constant.ts` に `OMM_FILENAME = "omm.json"` 追加
- [x] `src/main/util/AppConfigUtil.ts` に `getOmmPath()` 追加・デフォルト URL を JSON 化

## Phase 2: 変換ロジック実装

- [x] `src/main/util/OmmUtil.ts` 新規作成
  - `detectFormat(text)` — TLE/XML/KVN/JSON/CSV 判別
  - `parseToOmmItems(text)` — 各形式 → OmmItem[] 変換
  - `ommItemToTleStrings(item)` — OMM → TleStrings 変換

## Phase 3: サービス層実装

- [x] `src/main/service/OmmService.ts` 新規作成
  - `getOmmAndSave()` — URL取得・変換・保存
  - `getOmmsByNoradIds(noradIds)` — 複数Norad ID からの取得
  - `getOmmByNoradId(noradId)` — 単一取得
  - `canGetValidOmm(url)` — URL有効性確認
  - キャッシュ機能

## Phase 4: データモデル・移行処理

- [x] `src/common/model/AppConfigModel.ts` に `userRegisteredOmm` 追加
- [x] データ移行処理の実装（tle.json → omm.json、userRegisteredTle → userRegisteredOmm）

## Phase 5: 既存サービス修正

- [x] `src/main/service/DefaultSatelliteService.ts` を OmmService 使用に変更
- [x] `src/main/service/ActiveSatService.ts` を OMM 対応に変更

## Phase 6: API / IPC 修正

- [x] IPC ハンドラを `getOmmsByNoradIds` に変更
- [x] `src/renderer/api/ApiOmm.ts` 新規作成（ApiTle 差し替え）

## Phase 7: UI 修正

- [x] `useRegistSatelliteUtils.ts`: `userRegisteredOmm` も保存するよう修正
- [x] `useLoadTLE.ts`: `canGetValidOmm` に変更
- [x] `LoadTLETab.vue`: OMM 対応・UI ラベル更新

## Phase 8: テスト・確認

- [x] `npm run test` 実行・失敗したテストを修正（全72ファイル / 771テスト成功、vue-tsc型チェックも0エラー）
- [x] 軌道要素取得 → omm.json 生成動作確認（celestrak.org実データでのユニットテストによるラウンドトリップ検証、および移行処理のテストで確認）
- [ ] 衛星追跡動作確認（Electronアプリの実機/手動確認は未実施）
- [ ] ユーザ登録衛星の動作確認（Electronアプリの実機/手動確認は未実施）
- [x] データ移行（tle.json → omm.json）動作確認（`OmmService_migrateFromTleJsonIfNeeded.test.ts` で確認）
