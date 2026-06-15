# TLE → OMM(JSON) 全面移行 タスクリスト

詳細は `design.md` を参照。`design.md`の章番号を各タスクに記載する。

## 1. データモデル・型の追加(設計1, 8)
- [ ] `src/common/model/OmmModel.ts` 新規作成(`OmmJsonModel`, `OmmItemMap`, `OmmItem extends OMMJsonObjectV3 {isInLatestOmm}`)
- [ ] `src/renderer/types/satellite-type.ts` に `SatelliteOmmData = OMMJsonObjectV3 & {satelliteName: string}` を追加(この時点では`TleStrings`は残す)

## 2. TleUtil へのTLE→OMM変換関数追加 + 検証テスト(設計2)
- [ ] `src/main/util/TleUtil.ts` に `tleEpochToOmmEpoch`, `tleToOmmItem`, `tleTextToOmmArray`, `parseTleExpField` を追加
- [ ] `src/__tests__/main/util/TleUtil_tleToOmmItem.test.ts` 新規作成(`twoline2satrec`と`json2satrec(tleToOmmItem(...))`のSatRec数値一致を検証)
- [ ] `npx vitest run src/__tests__/main/util/TleUtil_tleToOmmItem.test.ts` で数値整合性を確認(後続作業の前提)

## 3. WebClientのレスポンス型緩和(設計3)
- [ ] `src/common/WebClient.ts`: `AppHttpResponse.data` の型を `string` → `unknown` に変更(コンストラクタ引数も)

## 4. AppConfigUtil / Constant改修(設計4, 5)
- [ ] `src/common/Constant.ts`: `Constant.Tle.TLE_FILENAME` → `OMM_FILENAME = "omm.json"` にリネーム
- [ ] `src/main/util/AppConfigUtil.ts`:
  - [ ] `DEFAULT_TLE_URL` のcelestrak.org URLを `FORMAT=TLE`/`FORMAT=tle` → `FORMAT=JSON` に変更(amsat.orgは変更しない)
  - [ ] `getTlePath()` → `getOmmPath()` にリネームし `Constant.Tle.OMM_FILENAME` を返すよう変更
  - [ ] `migrationConfig()` に以下を追加:
    - [ ] 既存`config.tle.urls`のcelestrak.org URLの`FORMAT=tle`(大小区別なし)を`FORMAT=JSON`に書き換え(amsat.orgは対象外)
    - [ ] `omm.json`が存在しない場合に`config.tle.lastRetrievedDate`を`0`にリセット

## 5. OmmService新規作成(設計6)
- [ ] `src/main/service/OmmService.ts` 新規作成(`TleService.ts`からロジック移植・改修)
  - [ ] `getOmmAndSave()`
  - [ ] `fetchOmmArrayByUrl(url, webClient)`(JSON配列/オブジェクト/TLEテキストの3パターン対応)
  - [ ] `mergeOmmData(newItems, baseOmmItemMap)`(EPOCH比較upsert、`isInLatestOmm`管理)
  - [ ] `canTakeOmm()`
  - [ ] `getOmmDataByNoradIds(noradIds)` / `getOmmDataByNoradId(noradId)` / `findOmmByNoradId`
  - [ ] `canGetValidOmm(url, webClient)`
- [ ] `src/main/service/TleService.ts` 削除

## 6. SatelliteServiceのjson2satrec化(設計7)
- [ ] `src/renderer/service/SatelliteService.ts`:
  - [ ] コンストラクタ引数を`TleStrings`→`SatelliteOmmData`に変更
  - [ ] `satellite.twoline2satrec(...)` → `satellite.json2satrec(ommData)`
  - [ ] バリデーションを`OBJECT_NAME`/`EPOCH`等の必須フィールドチェックに変更
  - [ ] `_satelliteName = ommData.satelliteName`

## 7. IPC層改修(設計9)
- [ ] `src/renderer/api/ApiTle.ts` → `ApiOmm.ts` にリネーム(`getOmmDataByNoradIds`, `canGetValidOmm`)
- [ ] `src/main/preload.ts`(L17, L149-152, L355-358): `TleStrings`→`SatelliteOmmData`、IPC名称変更
- [ ] `src/main/initializeIpcEvent.ts`(L17, L97-98, L309-310, L337, L366): `OmmService`使用、`"getOmmDataByNoradIds"`/`"canGetValidOmm"`へのハンドラ名変更(handle/removeHandler両方)

## 8. アクティブ衛星関連の改修(設計9, 10)
- [ ] `src/common/model/ActiveSatModel.ts`: `mainSattelliteTle`→`mainSatelliteOmmData`、`tle`→`ommData`
- [ ] `src/main/service/ActiveSatService.ts`(L63-86): `getActiveSatTleBySatId`→`getActiveSatOmmBySatId`。デフォルト衛星は`OmmService.getOmmDataByNoradId()`、手動登録衛星は`userRegisteredTle`を`TleUtil.tleToOmmItem()`でOMM化
- [ ] `src/renderer/common/util/ActiveSatHelper.ts`(L56-69, 75-88): `getSatByUserReg`(`tleToOmmItem`使用)、`getSatByAppConfig`(`ApiOmm.getOmmDataByNoradIds()`使用)
- [ ] `src/renderer/common/util/SatelliteServiceFactory.ts`: `mainSattelliteTle`→`mainSatelliteOmmData`、`activeSat.tle`→`activeSat.ommData`
- [ ] `src/renderer/components/pages/Home/useHome.ts`(L8,L18,L70,L74): `TleStrings`→`SatelliteOmmData`、`tleStrings`→`ommDataList`、`sat.tle`→`sat.ommData`

## 9. デフォルト衛星関連の改修(設計9)
- [ ] `src/common/model/DefaultSatelliteModel.ts`(L1,L57-79): `TleItemMap`→`OmmItemMap`、`getSatelliteIdentifer`内のキー算出を`String(ommItem.NORAD_CAT_ID).padStart(5,"0")`に変更
- [ ] `src/main/service/DefaultSatelliteService.ts`(L5,L8,L44,L59-60,L85,L184,L222-237): `OmmService`使用、`getLatestTLE()`→`getLatestOmm()`、`getTleAndSave()`→`getOmmAndSave()`

## 10. 旧型・旧ファイルの削除(設計1, 8)
- [ ] `src/renderer/types/satellite-type.ts` から `TleStrings` 型を削除
- [ ] `src/common/model/TleModel.ts` 削除
- [ ] `grep -rn "TleStrings\|TleItemMap\|TleJsonModel\|tle\.json\|getTlesByNorad\|canGetValidTle\|getTlePath\|mainSattelliteTle\|TleService"` で残存ゼロを確認

## 11. テスト改修(設計11)
- [ ] `src/__tests__/main/service/TleService_createTleData.test.ts` → `OmmService_mergeOmmData.test.ts` に改修
- [ ] `src/__tests__/main/service/TleService_canGetValidTle.test.ts` → `OmmService_canGetValidOmm.test.ts` に改修
- [ ] `src/__tests__/main/util/TleUtil.test.ts` に変換関数のテストケース追加
- [ ] `src/__tests__/renderer/service/TleDataHelper.ts`: `tleToOmmItem()`で`SatelliteOmmData`を生成するよう変更
- [ ] テストデータ`tle.json`(`data_DefaultSatelliteModel`, `refresh{1-4}`等)を`omm.json`(`OmmItemMap`形式)に変換
- [ ] `src/__tests__/common/model/DefaultSatelliteModel.test.ts` を`getOmmPath`/`OMM_FILENAME`/`OmmItemMap`に合わせて改修
- [ ] `src/__tests__/main/service/DefaultSatelliteService.test.ts` を`OmmService`に合わせて改修

## 12. ドキュメント更新(設計12)
- [ ] `doc/10_アーキテクチャ/10_アーキテクチャ.md`: フロー図・データファイル一覧を更新、OMM/`json2satrec`・amsat変換の注記追加
- [ ] `doc/30_画面設計/G3-2_衛星設定（TLE読み込みタブ）.md`: 検証文言を更新
- [ ] `grep -ri "tle" doc/` で他に更新が必要な箇所を確認・修正

## 13. NORAD ID入力バリデーションの5桁固定解消(設計14)
- [ ] `src/common/I18nMsgs.ts`: `CHK_ERR_NUM_MIN_DIGITS`(`{0}桁以上の数字で入力してください` / `Please enter a number with at least {0} digits`)を新規追加
- [ ] [useSatelliteInfoEditorDialogValidate.ts:85](src/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialogValidate.ts#L85): `noradIdSchema`の正規表現を`/^(?!0{5,}$)[0-9]{5,}$/`に変更、メッセージを`CHK_ERR_NUM_MIN_DIGITS`に変更
- [ ] [useRegistSatelliteValidate.ts:259](src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/useRegistSatelliteValidate.ts#L259): `satelliteNumber`の正規表現を`/^(?!0{5,}$)\d{5,}$/`に変更、メッセージを`CHK_ERR_NUM_MIN_DIGITS`に変更
- [ ] 関連テスト(`useSatelliteInfoEditorDialogValidate.test.ts`等)に6桁NORAD ID正常系・全ゼロ異常系のケースを追加

## 14. 最終検証
- [ ] `npm run ts`
- [ ] `npm run vite:build`
- [ ] `npm run test`
- [ ] `npm run app:dev` で起動確認(`omm.json`生成、TLE読み込みタブのURL検証、メイン画面の軌道計算表示)
- [ ] `grep -rn "\[0-9\]{5}\|\\d{5}"` で5桁固定の正規表現が残っていないことを確認
