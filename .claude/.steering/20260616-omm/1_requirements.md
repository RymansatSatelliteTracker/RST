# 要求内容

## 概要

軌道要素データの取り扱いをTLEからOMMに移行する。

### 現状
- TLEをダウンロードしてtle.jsonに保存している。
- tle.json、および画面入力されたTLEデータを入力として軌道計算などを行っている。

### 今後（改修内容）
- 以下URLの説明の通り、TLEのダウンロードからOMMに移行する。
  - https://zenn.dev/yonda/articles/32b1ac9fa615cd

- tle.json は廃止し、 omm.json で軌道要素データを保持する。

- ダウンロードされた軌道要素データの書式を自動判別し、JSON形式に変換し、omm.jsonに保存する。
  
  http://celestrak.org/NORAD/documentation/gp-data-formats.php

  - TLEまたは3LE：3行の要素セットで、0行目には24文字の衛星名が含まれます。
  - 2LE: 2行の要素セット（0行目に衛星名なし）。
  - XML: CCSDS OMM XML形式（必須要素すべてを含む）。
  - KVN: CCSDS OMM KVNフォーマット（必須要素すべてを含む）。
  - JSON: すべてのGP要素に対応するOMMキーワードをJSON形式で記述。
  - JSON-PRETTY: すべてのGP要素に対応するOMMキーワードをJSON整形形式で表示します。
  - CSV: すべてのGP要素に対応するOMMキーワードをCSV形式で出力します。

- tle.json を参照している箇所は omm.jsonの参照に変更する。

- 画面から入力されたTLEは現状のままapp_config.json userRegisteredTleに保存する。同時にOMMに変換し、のuserRegisteredOmm にもJSON形式で保存する。

- TLEデータを入力としている箇所は、OMMデータの入力に変更する。

- データ移行について
  - 既存のapp_config.jsonのTLE形式のデータはJSONに自動変換する。

## 追加要求１（SatelliteServiceのOMM対応）

- `SatelliteService`（`src/renderer/service/SatelliteService.ts`）のコンストラクタ引数を、現状の`TleStrings`（TLE文字列）から`OmmItem`（OMM JSON相当）に変更する。
- 現状は「OmmService → ActiveSatService → ActiveSatModel → IPC → ApiOmm → ActiveSatHelper/SatelliteServiceFactory」の経路で、内部的に`OmmUtil.ommItemToTleStrings()`によりOMMデータをTLE文字列（指数表記5桁、角度4桁などの固定精度フォーマット）に変換した上で`SatelliteService`に渡し、`satellite.twoline2satrec()`でSatRecを生成している。この変換により、OMMが持つ本来の精度が失われている。
- `satellite.js`は`json2satrec(OMMJsonObject)`によりOMM JSONから直接SatRecを生成する機能を備えており（v6.0.2で利用可能）、TLE文字列化を経由しないため精度劣化を回避できる。
- 上記の経路全体を`OmmItem`で受け渡す形に統一し、`SatelliteService`内で`satellite.json2satrec()`を使用するように変更する。
- なお、ユーザが画面からTLEテキストを直接入力・保存する機能（`userRegisteredTle`、`RegistSatelliteForm`、`TleUtil.orbitElementsToTLE`/`toTleStrings`）は本対応の対象外とし、変更しない。

## 追加要求２
- ダウンロードされた軌道要素データの書式が「2LE」の場合は、omm.jsonの`objectName`には、`noradCatId`の値を設定する。
