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
