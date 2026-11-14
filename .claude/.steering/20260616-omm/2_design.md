# 改修プラン：TLE → OMM 移行

## 概要

軌道要素データを TLE 形式から OMM（Orbit Mean-elements Message）JSON 形式に移行する。
Celestrak 推奨の OMM JSON フォーマットを内部ストレージとして採用することで、
複数フォーマットのデータソースに対応しつつ、衛星追跡精度を維持する。

## データフロー（変更後）

```
ダウンロード（TLE / JSON / XML / KVN / CSV）
       ↓
OmmUtil.detectFormat() → 形式自動判別
       ↓
OmmUtil.parseToOmmItems() → OmmItem[] に変換
       ↓
OmmService.getOmmAndSave() → omm.json に保存（NoradID キー）
       ↓
OmmService.getOmmsByNoradIds() → OmmItem 取得
       ↓
OmmUtil.ommItemToTleStrings() → TleStrings 変換
       ↓
SatelliteService.constructor(TleStrings) ← 変更なし
```

## omm.json データ構造

```json
{
  "ommItemMap": {
    "25544": {
      "objectName": "ISS (ZARYA)",
      "noradCatId": "25544",
      "epoch": "2023-01-01T00:00:00.000",
      "meanMotion": 15.49003236,
      "eccentricity": 0.0003447,
      "inclination": 51.6441,
      "raOfAscNode": 36.8256,
      "argOfPericenter": 22.0267,
      "meanAnomaly": 337.0083,
      "bstar": 0.000019399,
      "meanMotionDot": 0.00002208,
      "meanMotionDdot": 0,
      "isInLatestOmm": true
    }
  }
}
```

## satellite.js との互換性維持

`SatelliteService` は `TleStrings` を入力とする構造を維持する。
OMM JSON → TLE 変換は `OmmUtil.ommItemToTleStrings()` が担う。
既存の `TleUtil.calculateChecksum()` / `TleUtil.formatBStar()` / `TleUtil.formatEpoch()` を再利用する。

## 新規作成ファイル

| ファイル | 役割 |
|---|---|
| `src/common/model/OmmModel.ts` | OmmItem 型・OmmJsonModel クラス定義 |
| `src/main/service/OmmService.ts` | ダウンロード・保存・取得ロジック（TleService 置き換え） |
| `src/main/util/OmmUtil.ts` | 形式判別・各形式→OMM変換・OMM→TLE変換 |
| `src/renderer/api/ApiOmm.ts` | レンダラー側 OMM API |

## 修正ファイル

| ファイル | 変更内容 |
|---|---|
| `src/common/Constant.ts` | `OMM_FILENAME = "omm.json"` 追加 |
| `src/common/model/AppConfigModel.ts` | `AppConfigSatellite` に `userRegisteredOmm: string` 追加 |
| `src/main/util/AppConfigUtil.ts` | `getOmmPath()` 追加・デフォルト URL を `FORMAT=JSON` 化 |
| `src/main/service/DefaultSatelliteService.ts` | OmmService 使用に変更 |
| `src/main/service/ActiveSatService.ts` | `userRegisteredOmm` から TleStrings 生成 |
| `src/renderer/components/.../useRegistSatelliteUtils.ts` | TLE入力時に `userRegisteredOmm` も保存 |
| `src/renderer/components/.../useLoadTLE.ts` | OMM 形式の URL 検証に対応 |
| `src/renderer/components/.../LoadTLETab.vue` | OMM 形式対応（UI ラベル含む） |
| IPC ハンドラ | `getTlesByNoradIds` → `getOmmsByNoradIds` に変更 |

## データ移行方針

アプリ起動時に以下を自動実行:

1. `omm.json` 未存在 かつ `tle.json` 存在 → `tle.json` を OMM 形式に変換して `omm.json` 保存
2. `app_config.json` の各衛星の `userRegisteredTle` が存在し `userRegisteredOmm` が空 → TLE を OMM JSON に変換して保存

## URL 変更方針

Celestrak URL の `FORMAT=TLE` を `FORMAT=JSON` に変更する。
AMSAT の URL は TLE 形式しか提供していないため TLE のまま維持し、形式自動判別でパースする。

## 追加設計：SatelliteService の OMM 対応（TLE 文字列経由の廃止）

### 背景・決定事項

当初設計では「`SatelliteService` は `TleStrings` を入力とする構造を維持する」としていたが、これは
`OmmItem → TleStrings`（`OmmUtil.ommItemToTleStrings()`、TLE固定精度フォーマットへの変換）という
精度劣化を伴う変換を経由する設計だった。

`satellite.js`（v6.0.2、本プロジェクトの既存依存）は `json2satrec(jsonobj: OMMJsonObject, opsmode?)` を提供しており、
OMM JSONから直接 `SatRec` を生成できる（TLE文字列化を経由しないため、エポックや軌道要素の精度劣化が無い）。
ライブラリのコメントにも "the epoch date in OMM format is more accurate than TLE format!" と明記されている。

この機能を使い、`SatelliteService` のコンストラクタ引数を `TleStrings` → `OmmItem` に変更し、
データ受け渡し経路全体を `OmmItem` に統一する。

### 変更後のデータフロー（アクティブ衛星 → SatelliteService）

```
omm.json (OmmItemMap)
  ↓
OmmService.getOmmByNoradId/getOmmsByNoradIds → OmmItem（変換なし、そのまま返却）
  ↓
ActiveSatService.getActiveSatOmmBySatId → OmmItem
  ↓
ActiveSatModel.mainSatelliteOmm / ActiveSatelliteModel.omm: OmmItem
  ↓（IPC: getOmmsByNoradIds の戻り値も OmmItem[] に変更）
ApiOmm.getOmmsByNoradIds → OmmItem[]
  ↓
ActiveSatHelper.fetchActiveSats → ActiveSatelliteModel.omm: OmmItem
  ↓
SatelliteServiceFactory.createByActiveSat/createBySatGroup
  ↓
new SatelliteService(OmmItem) → satellite.json2satrec(OMMJsonObject) → SatRec
```

### 命名方針

OMMデータを保持するフィールド/変数は、プロジェクトの既存命名規則（`OmmService`/`OmmModel`/`ApiOmm`等）に合わせ、
「Tle」ではなく「Omm」を用いる名前にリネームする。

| 旧 | 新 |
|---|---|
| `ActiveSatModel.mainSattelliteTle` | `mainSatelliteOmm` |
| `ActiveSatelliteModel.tle` | `omm` |
| `ActiveSatService.getActiveSatTleBySatId()` | `getActiveSatOmmBySatId()` |
| `useHome.ts` の `tleStrings` (ref) | `ommItems` |

### 修正ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/renderer/service/SatelliteService.ts` | コンストラクタ引数を `OmmItem` に変更。`satellite.json2satrec()` で `SatRec` を生成。入力チェックも `tleLine1/2` の空判定 → `noradCatId`/`epoch` の空判定に変更 |
| `src/common/model/ActiveSatModel.ts` | `mainSattelliteTle`→`mainSatelliteOmm`、`tle`→`omm`。型を `OmmItem` に変更 |
| `src/main/service/OmmService.ts` | `getOmmByNoradId`/`getOmmsByNoradIds`/`findOmmByNoradId` の戻り値を `OmmItem`/`OmmItem[]` に変更（`ommItemToTleStrings()` 呼び出しを削除）。`cachedTleStringMap` は変換不要になるため削除（`ommItemMap` から直接返却） |
| `src/main/service/ActiveSatService.ts` | `getActiveSatTleBySatId`→`getActiveSatOmmBySatId` にリネームし `OmmItem` を返却。`userRegisteredOmm` は `JSON.parse` のみ、`userRegisteredTle` フォールバックは `OmmUtil.parseToOmmItems()` で `OmmItem` 化 |
| `src/main/preload.ts` | `getOmmsByNoradIds` の戻り値型を `Promise<OmmItem[]>` に変更 |
| `src/renderer/api/ApiOmm.ts` | `getOmmsByNoradIds` の戻り値型を `Promise<OmmItem[]>` に変更 |
| `src/renderer/common/util/ActiveSatHelper.ts` | `satModel.tle`→`satModel.omm`。`ommItemToTleStrings()` 呼び出しを削除し `OmmItem` を直接設定 |
| `src/renderer/components/pages/Home/useHome.ts` | `tleStrings`→`ommItems`（型は `OmmItem[]`） |
| `src/renderer/common/util/SatelliteServiceFactory.ts` | `mainSatelliteOmm`/`activeSat.omm` を `OmmItem` のまま `SatelliteService` に渡す |

変更不要（対象外）：`TleUtil.ts`、`OmmUtil.ommItemToTleStrings()`、`userRegisteredTle`/`RegistSatelliteForm` 関連（`useRegistSatelliteUtils.ts`等）。
これらはユーザーのTLEテキスト直接入力・保存機能で使用しており、本対応とは独立した既存機能のため変更しない。

### json2satrec へのマッピング

`OmmItem` のフィールドは Celestrak OMM キーワードに対応しているため、`SatelliteService` 内で以下のように
`satellite.js` の `OMMJsonObject` 型へ直接マッピングする（新規ユーティリティは不要、`SatelliteService` 内に
プライベートメソッドとして実装する）。

```ts
{
  OBJECT_NAME: item.objectName,
  OBJECT_ID: item.objectId,
  EPOCH: item.epoch,
  MEAN_MOTION: item.meanMotion,
  ECCENTRICITY: item.eccentricity,
  INCLINATION: item.inclination,
  RA_OF_ASC_NODE: item.raOfAscNode,
  ARG_OF_PERICENTER: item.argOfPericenter,
  MEAN_ANOMALY: item.meanAnomaly,
  EPHEMERIS_TYPE: item.ephemerisType,
  CLASSIFICATION_TYPE: item.classificationType,
  NORAD_CAT_ID: item.noradCatId,
  ELEMENT_SET_NO: item.elementSetNo,
  REV_AT_EPOCH: item.revAtEpoch,
  BSTAR: item.bstar,
  MEAN_MOTION_DOT: item.meanMotionDot,
  MEAN_MOTION_DDOT: item.meanMotionDdot,
}
```

### テストへの影響・リスク

- `src/__tests__/renderer/service/TleDataHelper.ts` は実際のTLE文字列を使ったテストフィクスチャ（ISS, DAICHI等）を保持しており、
  多数のテストファイルから参照されている。`OmmUtil.parseToOmmItems()` で既存のTLE文字列から `OmmItem` を生成し、
  `new SatelliteService(OmmItem)` を構築する形に変更する（TLE文字列定数自体は変更しない）。
- TLE文字列 → `OmmItem`（ISO日時文字列のEPOCH）→ `json2satrec` 内で再度エポック日数を算出、という変換を経由するため、
  従来の `twoline2satrec` 直接変換とはエポック計算の浮動小数点誤差レベルでわずかに異なる可能性がある。
  既存テストの期待値が厳密一致（`toBe`等）の場合は影響が出る可能性があるため、`npm run test` 実行時に確認し、
  必要であれば許容誤差（`toBeCloseTo`等）の調整を行う。
- `FrequencyTrackService_calcInvHeteroBaseFreqBy{Rx,Tx}Freq.test.ts` 等の `{ tleLine1: "dummy", ... }` ダミーデータは、
  `OmmItem` のダミーデータ（`noradCatId`/`epoch`等に有効な最小値を設定したもの）に置き換える。

## 追加設計：2LE形式のobjectNameフォールバック

### 背景・決定事項

`OmmUtil.parseToOmmItems()` はTLE/3LE/2LEを自動判別して `OmmItem` に変換する（`detectFormat()`は3LE/2LEをまとめて`"TLE"`と判定し、`parseTleFormat()`内で衛星名行の有無により3LE/2LEを区別している）。
現状、2LE（衛星名行なし）の場合は `tleLinesToOmmItem()` 内で `item.objectName = line0 ? TleUtil.getName(line0) : ""` となり、`objectName` が空文字のまま保存される。

`objectName` が空文字だと、一覧表示など衛星名を表示する箇所で空欄になり視認性が悪い。2LEの場合のフォールバック値として `noradCatId`（NORAD ID）を `objectName` に設定する。

### 変更内容

`src/main/util/OmmUtil.ts` の `tleLinesToOmmItem()`（151行目〜201行目付近）を以下のように変更する。

- `item.noradCatId = line1.substring(2, 7).trim();` を `item.objectName` の代入より先に行う（値の算出順序の入れ替え）。
- `item.objectName` の算出を `line0 ? TleUtil.getName(line0) : item.noradCatId` に変更する（2LEの場合のみ `noradCatId` をフォールバックとして使用）。

3LE（衛星名行あり）の挙動・他形式（JSON/XML/KVN/CSV）の挙動は変更しない。

```ts
private static tleLinesToOmmItem(line0: string, line1: string, line2: string): OmmItem {
  const item = new OmmItem();
  item.noradCatId = line1.substring(2, 7).trim();
  item.objectName = line0 ? TleUtil.getName(line0) : item.noradCatId;
  item.classificationType = line1.substring(7, 8).trim() || "U";
  item.objectId = line1.substring(9, 17).trim();
  // ...以下変更なし
}
```

### 修正ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/main/util/OmmUtil.ts` | `tleLinesToOmmItem()` の `objectName` 算出ロジックを変更（2LEの場合は `noradCatId` をフォールバックとして設定） |
| `src/__tests__/main/util/OmmUtil.test.ts` | 「2LE形式(衛星名なし)からOmmItemに変換できる(衛星名は空)」テスト（167〜173行目）のテスト名・期待値を修正。`objectName` が `""` ではなく `noradCatId`（`"25544"`）と一致することを検証するように変更 |

### 影響範囲・リスク

- `omm.json` に保存される2LE由来のデータの `objectName` が、従来の `""` から `noradCatId` の値に変わる。既存の `omm.json` に保存済みの2LEデータ（`objectName: ""`）は本変更では遡って更新されない（再ダウンロード・再パース時にのみ新しいロジックが適用される）。
- `ommItemToTleStrings()` は `item.objectName || noradId` というフォールバックを既に持っているため、この変更後は `objectName` が空になるケース自体がTLE起源のデータでは無くなる（動作への影響なし、むしろ一貫性が向上する）。
- JSON/XML/KVN/CSV形式の `fieldsToOmmItem()` 経由のデータは対象外（`OBJECT_NAME` フィールドが提供される前提のため変更しない）。

## 追加設計：XML形式のobjectNameのXMLエスケープ解除

### 背景・決定事項

`OmmUtil.parseXmlFormat()` はCCSDS OMM XML形式のテキストを `extractXmlTag()` でタグごとに正規表現抽出し、`fieldsToOmmItem()` に渡している。
`extractXmlTag()` は抽出した文字列をそのまま返しており、XMLエスケープ（`&amp;`/`&lt;`/`&gt;`/`&apos;`/`&quot;`や数値文字参照`&#38;`/`&#x26;`など）の解除を行っていない。
このため、衛星名に `&` を含む場合（例: `AMSAT-OSCAR &amp; ...`）、`objectName` にエスケープされた文字列 `&amp;` がそのまま保存されてしまう。

### 変更内容

`src/main/util/OmmUtil.ts` に、XMLエスケープを解除する共通処理を追加し、`extractXmlTag()` の戻り値に適用する。

- 新規プライベートメソッド `unescapeXml(text: string): string` を追加する。
  - 対応するエスケープ：`&lt;` → `<`、`&gt;` → `>`、`&apos;` → `'`、`&quot;` → `"`、数値文字参照 `&#NN;`/`&#xHH;`、および `&amp;` → `&`（`&amp;` は他のエスケープ解除後の二重アンエスケープを避けるため最後に処理する）。
- `extractXmlTag()` の `return match ? match[1].trim() : "";` を `return match ? this.unescapeXml(match[1].trim()) : "";` に変更する。
  - `extractXmlTag()` はXML形式の全フィールド抽出で共通利用されている（`OBJECT_NAME`だけでなく`OBJECT_ID`等の文字列フィールドにも同様に適用され、数値フィールドはエスケープを含まないため影響なし）。この共通化により要求の対象である`objectName`はもちろん、他の文字列フィールドも一貫してアンエスケープされる。

XML以外の形式（TLE/JSON/KVN/CSV）は本対応の対象外（変更しない）。KVN/CSVはXMLエスケープの対象ではなく、JSONは`JSON.parse()`が自身でエスケープ解除を行うため。

### 修正ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/main/util/OmmUtil.ts` | `unescapeXml()` プライベートメソッドを新規追加。`extractXmlTag()` の戻り値にこれを適用 |
| `src/__tests__/main/util/OmmUtil.test.ts` | XMLエスケープ（`&amp;`等）を含む`OBJECT_NAME`のテストケースを追加し、`objectName`がアンエスケープされることを検証 |

### 影響範囲・リスク

- `extractXmlTag()` は `parseXmlFormat()` 内の全フィールド抽出で共通利用されているため、`OBJECT_NAME`以外のフィールド（`OBJECT_ID`等）にもアンエスケープが適用されるが、通常これらの値にXMLエスケープ対象文字は含まれないため実害はない。
- 既存の`omm.json`に保存済みのXML由来データでエスケープが残っているものは、本変更では遡って更新されない（再ダウンロード・再パース時にのみ新しいロジックが適用される）。
