# TLE → OMM(JSON) 全面移行 設計

## Context

`requirements.md` に記載の要求:
- 現在は外部URLからTLE(2行形式)テキストをダウンロードし `tle.json` に保存している
- TLEカタログ番号(5桁)の枯渇問題等を背景に、CelestrakはOMM(Orbit Mean-Elements Message)形式への移行を推奨している
- OMMはXML/CSV/JSONの複数形式があるが、本対応では **JSON形式** で取得・保存したい

ヒアリングで以下を確定:
- **スコープ**: 全面移行。`TleStrings`型・`TleItem`をOMM JSONベースに置き換え、`SatelliteService`は`satellite.js`の`json2satrec()`を使用する
- **amsat.org** (`nasabare.txt`、TLEテキストのみ)は取得元として維持し、TLE→OMM変換して取り込む

調査済み事項:
- `satellite.js` v6.0.2 (`node_modules/satellite.js`)には既に `twoline2satrec(line1,line2)` と `json2satrec(ommJsonObj)` が実装済みで、`OMMJsonObjectV3`型がパッケージルートからexportされている(`import type { OMMJsonObjectV3 } from "satellite.js"`が可能)
- CelestrakのOMM JSONは `https://celestrak.org/NORAD/elements/gp.php?GROUP=xxx&FORMAT=JSON` で取得可能

---

## 全体方針

| 項目 | 現状 | 移行後 |
|---|---|---|
| 保存ファイル | `tle.json` (`{tleItemMap:{...}}`) | `omm.json` (`{ommItemMap:{...}}`) |
| データモデル | `TleModel.ts` (`TleItem{id,name,epoch,line1,line2,isInLatestTLE}`) | `OmmModel.ts` (`OmmItem extends OMMJsonObjectV3 {isInLatestOmm}`) |
| Celestrak URL | `FORMAT=TLE` | `FORMAT=JSON` |
| amsat.org URL | 変更なし(TLEテキスト) → 取得後 `TleUtil.tleToOmmItem()` でOMM化して同じマップに統合 |
| 衛星生成 | `satellite.twoline2satrec(line1,line2)` | `satellite.json2satrec(ommData)` |
| IPC越え型 | `TleStrings{satelliteName,tleLine1,tleLine2}` | `SatelliteOmmData = OMMJsonObjectV3 & {satelliteName}` |
| 手動衛星登録UI(RegistSatellite) | TLE2行テキスト入力・保存(`userRegisteredTle`) | **変更なし**。SatelliteServiceに渡す直前に`TleUtil.tleToOmmItem()`でOMM変換 |

---

## 1. データモデル: `src/common/model/OmmModel.ts` (新規、`TleModel.ts`は削除)

```ts
import type { OMMJsonObjectV3 } from "satellite.js";

export class OmmJsonModel {
  public ommItemMap: OmmItemMap = {};
}

export type OmmItemMap = { [key: string]: OmmItem };

// OMMJsonObjectV3をそのまま保持し、最新フラグを追加
export interface OmmItem extends OMMJsonObjectV3 {
  isInLatestOmm: boolean; // 旧 isInLatestTLE 相当
}
```

- マップキーは`String(item.NORAD_CAT_ID).padStart(5, "0")`で正規化する。これは「5桁未満のIDは0埋めして5桁にし、5桁以上のIDはそのまま(切り詰めない)」という意味であり、固定長5桁を強制するものではない。既存の`tleItem.id`(TLE由来、常に5桁)との後方互換を保ちつつ、OMMで想定される6桁以上のNORAD ID(カタログ番号枯渇後の番号)も一意なキーとして扱える
- `EPOCH`(ISO文字列)を`new Date(...)`でDate化し、新旧比較に使う(旧: `epoch:number(YYDDD.DDDDDDDD)`比較)

> **補足(NORAD ID桁数について)**: マップキー自体は上記の通り6桁以上のIDでも問題なく機能する。一方、調査の結果、衛星登録/編集UIのNORAD ID入力バリデーションが**正確に5桁固定**の正規表現になっており、6桁以上のIDを拒否してしまうことが判明した。OMM移行の目的(5桁枯渇問題への対応)と整合させるため、本対応のスコープに含め、14章で対応する。

---

## 2. `TleUtil` への TLE→OMM 変換関数追加: `src/main/util/TleUtil.ts`

amsat.orgのTLEテキスト、および手動登録TLE(`userRegisteredTle`)をOMM化するための共通関数を追加する。

- `TleUtil.tleEpochToOmmEpoch(line1): string` — TLEのepochyr/epochdaysから`json2satrec`の逆算でISO日時文字列を生成
- `TleUtil.tleToOmmItem(line0, line1, line2): OmmItem` — TLE3行→OMMアイテム変換。各フィールドは下記マッピング:
  - `OBJECT_NAME`=衛星名, `OBJECT_ID`=国際識別符号をYYYY-NNNA形式に変換
  - `MEAN_MOTION`/`ECCENTRICITY`/`INCLINATION`/`RA_OF_ASC_NODE`/`ARG_OF_PERICENTER`/`MEAN_ANOMALY` はTLEの値をそのまま(度・rev/dayは単位互換)
  - `BSTAR`/`MEAN_MOTION_DDOT` はTLEの指数表記をデコード(既存`twoline2satrec`と同じ式を再利用するヘルパー`parseTleExpField`を追加)
  - `NORAD_CAT_ID`(number化), `ELEMENT_SET_NO`, `REV_AT_EPOCH`, `EPHEMERIS_TYPE=0`, `CLASSIFICATION_TYPE`
- `TleUtil.tleTextToOmmArray(tlesText): OmmItem[]` — 複数衛星のTLEテキスト(3行ブロック)を`OmmItem[]`に変換(既存`createTleData`の3行ブロック検出ロジックを移植)

### 検証用テスト(新規): `src/__tests__/main/util/TleUtil_tleToOmmItem.test.ts`
既存TLEサンプル(`TleDataHelper`)を`tleToOmmItem`でOMM化し、`twoline2satrec(line1,line2)`と`json2satrec(ommItem)`で生成した`SatRec`の主要プロパティ(`bstar,ecco,argpo,inclo,mo,no,nodeo,jdsatepoch`)が近似一致すること、および`propagate()`結果(position/velocity)が同等になることを確認する。これによりTLE→OMM変換の数値整合性を裏付ける。

---

## 3. `WebClient`: `src/common/WebClient.ts`

CelestrakのOMM JSONは`Content-Type: application/json`で返るため、axiosが自動的に`response.data`をobject/arrayにパースする(amsat.orgのTLEテキストは現状通りstring)。

- `AppHttpResponse.data` の型を `string` → `unknown` に変更（コンストラクタ引数も`unknown`）
- 呼び出し側(`OmmService`)で `typeof res.data === "string"` か否かで分岐して処理する

---

## 4. `AppConfigUtil.ts`

- `DEFAULT_TLE_URL`: celestrak.orgの各URLを `FORMAT=TLE`/`FORMAT=tle` → `FORMAT=JSON` に変更。amsat.orgのURLは変更しない
- `getTlePath()` → `getOmmPath()` にリネーム。返すファイル名を `Constant.Tle.OMM_FILENAME`("omm.json")に変更
- `migrationConfig()` に2つのマイグレーション処理を追加:
  1. `config.tle.urls`内のcelestrak.org URLで`FORMAT=tle`(大小区別なし)を含むものを`FORMAT=JSON`に書き換える(amsat.orgは対象外)
  2. `omm.json`が存在しない場合、`config.tle.lastRetrievedDate`を`0`にリセットし、次回起動時に即時OMM再取得が走るようにする(`TLE_GET_INTERVAL_MS`待ちを回避)

---

## 5. `Constant.ts`

`Constant.Tle`クラス内:
- `TLE_FILENAME = "tle.json"` → `OMM_FILENAME = "omm.json"` にリネーム・値変更
- `TLE_GET_INTERVAL_MS`, `TLE_EXPIRATION_DAYS` はOMMにも適用される概念のため名称はそのまま維持(リネーム不要)

---

## 6. `TleService.ts` → `OmmService.ts` (全面改修・リネーム)

`src/main/service/TleService.ts` を `src/main/service/OmmService.ts` に置き換える。

- `getOmmAndSave()`(旧`getTleAndSave`): 各URLから取得→`mergeOmmData`でマージ→`omm.json`保存→`AppConfigUtil.saveTleLastRetrievedDate()`
- `fetchOmmArrayByUrl(url, webClient)`(旧`getTleTextByUrl`): レスポンスを判定
  - object/array(JSON自動パース済み) → `OmmItem[]`に正規化(各要素に`isInLatestOmm:true`付与)
  - string かつ `[`/`{`始まり → `JSON.parse`して同様に正規化
  - string かつ TLE形式(`1 `/`2 `始まり2行ブロックを含む) → `TleUtil.tleTextToOmmArray()`で変換
  - 上記いずれでもない/空 → `null`
- `mergeOmmData(newItems, baseOmmItemMap)`(旧`createTleData`): NORAD_CAT_IDをキーに、既存`isInLatestOmm`を一旦falseにし、`EPOCH`(Date比較)が新しい場合のみ上書き、該当ID全てに`isInLatestOmm=true`を立てる
- `canTakeOmm()`(旧`canTakeTle`、ロジック変更なし。`Constant.Tle.TLE_GET_INTERVAL_MS`継続使用)
- `getOmmDataByNoradIds(noradIds)` / `getOmmDataByNoradId(noradId)` / `findOmmByNoradId`(旧`getTlesByNoradIds`/`getTlesByNoradId`/`findTleByNoradId`): `OmmItemMap`から`SatelliteOmmData`(`{...ommItem, satelliteName: ommItem.OBJECT_NAME}`)を構築して返す。キャッシュ機構(`cachedOmmJsonModel`/`cachedOmmDataMap`/`ommFileUpdateDate`)は維持
- `canGetValidOmm(url, webClient)`(旧`canGetValidTle`): `fetchOmmArrayByUrl()`が1件以上の有効な`OmmItem`を返せばtrue

---

## 7. `SatelliteService.ts`: `src/renderer/service/SatelliteService.ts`

- コンストラクタ引数を`TleStrings`→`SatelliteOmmData`に変更
- `satellite.twoline2satrec(tleLine1,tleLine2)` → `satellite.json2satrec(ommData)`
- バリデーション: `tleLine1`/`tleLine2`の空チェック → `OBJECT_NAME`/`EPOCH`等の必須フィールドチェック
- `_satelliteName = ommData.satelliteName`
- `getSgp4Epoc()`等、`_satRec.epochyr/epochdays`を使う箇所は変更不要(`json2satrec`も同じフィールドをsatrecに設定するため)

---

## 8. 型定義: `src/renderer/types/satellite-type.ts`

- `TleStrings`型を削除
- 新規追加:
```ts
import type { OMMJsonObjectV3 } from "satellite.js";

export type SatelliteOmmData = OMMJsonObjectV3 & {
  satelliteName: string; // OBJECT_NAMEのコピー(既存コードの`.satelliteName`参照との互換のため保持)
};
```

---

## 9. IPC・型置き換え(ファイル一覧)

| ファイル | 変更内容 |
|---|---|
| `src/renderer/api/ApiTle.ts` → `ApiOmm.ts` | `getTlesByNoradIds`→`getOmmDataByNoradIds`、`canGetValidTle`→`canGetValidOmm`。戻り値`SatelliteOmmData[]` |
| `src/main/preload.ts` (L17, L149-152, L355-358) | `import type {TleStrings}`→`SatelliteOmmData`、IPC名称・型を上記に統一 |
| `src/main/initializeIpcEvent.ts` (L17, L97-98, L309-310, L337, L366) | `TleService`→`OmmService`、`ipcMain.handle("getTlesByNoradIds"...)`→`"getOmmDataByNoradIds"`、`"canGetValidTle"`→`"canGetValidOmm"`、`removeHandler`も同様に名称変更 |
| `src/common/model/ActiveSatModel.ts` | `ActiveSatelliteGroupModel.mainSattelliteTle: TleStrings\|null` → `mainSatelliteOmmData: SatelliteOmmData\|null`。`ActiveSatelliteModel.tle` → `ommData` |
| `src/main/service/ActiveSatService.ts` (L63-86) | `getActiveSatTleBySatId`→`getActiveSatOmmBySatId`。デフォルト衛星は`OmmService.getOmmDataByNoradId()`。手動登録衛星は`userRegisteredTle`(2行)を`TleUtil.tleToOmmItem()`でOMM化し`{...item, satelliteName}`を返す |
| `src/renderer/common/util/ActiveSatHelper.ts` (L56-69, 75-88) | `getSatByUserReg`: `userRegisteredTle`を`TleUtil.tleToOmmItem()`でOMM化。`getSatByAppConfig`: `ApiOmm.getOmmDataByNoradIds()`使用 |
| `src/renderer/common/util/SatelliteServiceFactory.ts` | `satGrp.mainSattelliteTle`→`mainSatelliteOmmData`、`activeSat.tle`→`activeSat.ommData` |
| `src/renderer/components/pages/Home/useHome.ts` (L8,L18,L70,L74) | `TleStrings`→`SatelliteOmmData`、`tleStrings`変数→`ommDataList`等、`sat.tle`→`sat.ommData` |
| `src/common/model/DefaultSatelliteModel.ts` (L1,L57-79) | `TleItemMap`→`OmmItemMap`、`getSatelliteIdentifer(ommItemMap)`内`tleItem.id`→`String(ommItem.NORAD_CAT_ID).padStart(5,"0")` |
| `src/main/service/DefaultSatelliteService.ts` (L5,L8,L44,L59-60,L85,L184,L222-237) | `TleItemMap`→`OmmItemMap`、`TleService`→`OmmService`、`getLatestTLE()`→`getLatestOmm()`(`getOmmPath()`/`ommItemMap`/`isInLatestOmm`/`OBJECT_NAME`/`NORAD_CAT_ID`使用)、`getTleAndSave()`→`getOmmAndSave()` |

---

## 10. 手動TLE登録(RegistSatellite)との接続

- `src/common/model/AppConfigModel.ts`の`AppConfigSatellite.userRegisteredTle: string`(2行TLE)は**変更しない**
- `RegistSatellite`配下の`useValidateTle.ts`(`parseTle`/`validateParsedTle`/`tleToOrbitalElements`)、`useRegistSatelliteUtils.ts`、`TleUtil.orbitElementsToTLE()`は**変更不要**(TLE文字列での入力・保存フローを維持)
- OMM変換が必要な箇所は2箇所のみ(上表9参照):
  - `ActiveSatService.getActiveSatOmmBySatId()`
  - `ActiveSatHelper.getSatByUserReg()`
  いずれも`userRegisteredTle.split("\n")`で2行を取り出し、`TleUtil.tleToOmmItem(satelliteName, line1, line2)`でOMM化

---

## 11. テスト改修

| 対象 | 改修内容 |
|---|---|
| `src/__tests__/main/service/TleService_createTleData.test.ts` | `OmmService_mergeOmmData.test.ts`へ改名。OMMアイテム配列でのマージ・`isInLatestOmm`フラグ・EPOCH比較によるupsertをテスト |
| `src/__tests__/main/service/TleService_canGetValidTle.test.ts` | `OmmService_canGetValidOmm.test.ts`へ改名。Celestrak JSON(配列/単一オブジェクト)、amsat TLEテキスト、無効データの3パターンをモックして検証 |
| `src/__tests__/main/util/TleUtil.test.ts` | `tleToOmmItem`/`tleEpochToOmmEpoch`/`tleTextToOmmArray`のテストケース追加(既存テストはそのまま) |
| `src/__tests__/main/util/TleUtil_tleToOmmItem.test.ts`(新規) | 上記2章のsatrec数値一致検証 |
| `src/__tests__/renderer/service/TleDataHelper.ts` | 各衛星のTLE定義(`tleLine1/2`)は変換元として残し、`TleUtil.tleToOmmItem()`で`SatelliteOmmData`化したものを`new SatelliteService(...)`に渡すよう変更。既存`SatelliteService`系テストの期待値が`json2satrec`化による誤差で許容範囲を超える場合は`toBeCloseTo`精度を調整 |
| `src/__tests__/common/model/data_DefaultSatelliteModel/tle.json` 等、`refresh{1-4}/tle.json` | `omm.json`へ変換。`{ommItemMap:{...}}`構造、`OmmItem`形式(`OBJECT_NAME`,`NORAD_CAT_ID`,`EPOCH`,`isInLatestOmm`等) |
| `src/__tests__/common/model/DefaultSatelliteModel.test.ts` | `getTlePath`→`getOmmPath`、`Constant.Tle.TLE_FILENAME`→`OMM_FILENAME`、`tleItemMap`→`ommItemMap`、`TleItemMap`→`OmmItemMap` |
| `src/__tests__/main/service/DefaultSatelliteService.test.ts` | 同上 + `tleService.getTlesByNoradId`→`ommService.getOmmDataByNoradId` |

---

## 12. `/doc`配下ドキュメント更新

- `doc/10_アーキテクチャ/10_アーキテクチャ.md`: 衛星追跡フロー図の「TLE管理サービス」→「OMM管理サービス」、データファイル一覧の`tle.json`→`omm.json`説明を更新。OMM/`json2satrec`使用、amsat.orgのTLE→OMM変換についての注記を追加
- `doc/30_画面設計/G3-2_衛星設定（TLE読み込みタブ）.md`: 画面名・URL設定項目は維持。入力チェック仕様の文言を「TLEまたはOMMとして取得できるか確認する」に更新し、内部的にOMM JSON形式で取得・保存する旨を備考に追記
- 上記2ファイル以外で`TLE`/`TleStrings`/`getTlesByNoradIds`等の旧名称を記載しているドキュメントがあれば名称更新(`grep -ri "tle" doc/`で洗い出し)

---

## 13. 既存ユーザーの`tle.json`キャッシュ

マイグレーション処理は行わない(再ダウンロードで`omm.json`を新規生成)。旧`tle.json`は放置(削除しない)。4章の`migrationConfig()`変更により、`omm.json`が存在しない場合は次回起動時に即座にOMM再取得が走る。

---

## 14. NORAD ID入力バリデーションの5桁固定解消

OMM移行はNORAD ID(NORAD_CAT_ID)が将来5桁を超える(カタログ番号枯渇問題)ことへの対応が目的の一つであるため、UI側のNORAD ID入力バリデーションも6桁以上を許容するよう修正する。

調査の結果、以下2箇所が「正確に5桁」の正規表現になっている:

| ファイル | 現状 | 修正後 |
|---|---|---|
| [useSatelliteInfoEditorDialogValidate.ts:85](src/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialogValidate.ts#L85) | `/^(?!00000$)[0-9]{5}$/` (`CHK_ERR_NUM`, "5") | `/^(?!0{5,}$)[0-9]{5,}$/` (5桁以上、全ゼロは不可) |
| [useRegistSatelliteValidate.ts:259](src/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/useRegistSatelliteValidate.ts#L259) | `/^\d{5}$/` (`CHK_ERR_NUM`, "5") | `/^(?!0{5,}$)\d{5,}$/` |

- `src/common/I18nMsgs.ts`に新規メッセージ`CHK_ERR_NUM_MIN_DIGITS`を追加する:
  ```ts
  public static readonly CHK_ERR_NUM_MIN_DIGITS: I18nMsgItem = {
    en: "Please enter a number with at least {0} digits",
    ja: "{0}桁以上の数字で入力してください",
  };
  ```
- 上記2箇所のエラーメッセージを`I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM, "5")`から`I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_DIGITS, "5")`に変更する
- `src/__tests__/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialogValidate.test.ts`等、関連テストに6桁NORAD ID(例: `"123456"`)の正常系ケース、`"00000"`/`"000000"`の異常系ケースを追加する

---

## 検証方法

```bash
npm run ts          # main側TypeScriptコンパイル確認
npm run vite:build  # renderer側ビルド確認
npm run test        # 全Vitestユニットテスト(カバレッジ付き)
npx vitest run src/__tests__/main/util/TleUtil_tleToOmmItem.test.ts
npx vitest run src/__tests__/main/service/OmmService_mergeOmmData.test.ts
npx vitest run src/__tests__/main/service/OmmService_canGetValidOmm.test.ts
npx vitest run src/__tests__/common/model/DefaultSatelliteModel.test.ts
npx vitest run src/__tests__/main/service/DefaultSatelliteService.test.ts
npx vitest run src/__tests__/renderer/service/
```

- `grep -rn "TleStrings\|TleItemMap\|TleJsonModel\|tle\.json\|getTlesByNorad\|canGetValidTle\|getTlePath\|mainSattelliteTle\|TleService"` で旧名称の残存がゼロであることを確認
- `grep -rn "\[0-9\]{5}\|\\\\d{5}"` で5桁固定の正規表現が残っていないことを確認(14章)
- `npm run app:dev`で起動し、初回起動時に`omm.json`が生成されること、衛星設定画面のTLE読み込みタブでURL検証(`canGetValidOmm`)が機能すること、メイン画面で軌道計算(位置・方位角/仰角)が正常に表示されることを目視確認
