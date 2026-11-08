# 改修プラン：再起動時のアクティブ衛星の不一致修正

要求は [`1_requirements.md`](./1_requirements.md) を参照。

## A. 起動時のアクティブ衛星の復元

### 対象

- `src/renderer/components/organisms/SatelliteSelectBox/useSatelliteSelectBox.ts`

### 変更内容

`restoreSelectedSatId()` の候補決定順を次のとおりとする。

| 優先 | 条件                                                                | 選択する衛星             |
| ---- | ------------------------------------------------------------------- | ------------------------ |
| 1    | `prevSelectedSatIdMap` に当該グループの記録があり、選択肢に存在する | 前回選択した衛星         |
| 2    | 当該グループの記録がなく、`mainSatelliteId` が選択肢に存在する      | 保存済みのアクティブ衛星 |
| 3    | 上記以外                                                            | 先頭の衛星               |

- 起動時は優先2となり、`selectedSatId` と同値になるため、AppConfig の更新・変更通知は発生しない。
- 優先1で記録の衛星が削除されていた場合は、従来どおり先頭の衛星（優先3）とする。

## B. ActiveSatServiceHub の通知取りこぼし・並行実行の防止

### 対象

- `src/renderer/service/ActiveSatServiceHub.ts`

### 変更内容

1. `start()` で、`ApiActiveSat.onChangeActiveSatelliteGroup()` のリスナ登録を、初回の `onChangeSatGrp()` より前に行う。
2. `onChangeSatGrp()` を Promise チェーンで直列化する。
   - 従来の処理本体は `refreshActiveSat()`（private）へ移す。
   - `onChangeSatGrp()` は、前回の処理の完了後に `refreshActiveSat()` を実行するようチェーンに積む。
   - 例外発生時もチェーンが途切れないよう、チェーン保持側では例外を握りつぶす（呼び出し元には例外を返す）。
   - 各実行は開始時点の AppConfig を読み込むため、最後に積まれた実行が最新の AppConfig を反映し、最終状態となる。

```
変更通知1 ──▶ refreshActiveSat()#1 ──▶ 完了
変更通知2 ───────────────(待機)──────▶ refreshActiveSat()#2 ──▶ 完了（最終状態）
```

## ドキュメント

- `doc/30_画面設計/G2_メイン.md` の「2.1.2 衛星選択」の制御条件に、起動時の選択復元ルールを追記する。
- `doc/10_アーキテクチャ/10_アーキテクチャ.md` に ActiveSatServiceHub の記述は少ないため、変更なし。

## テスト

- `src/__tests__/renderer/components/organisms/SatelliteSelectBox/useSatelliteSelectBox.test.ts`
  - 起動時、保存済みのアクティブ衛星（2つ目）が選択され、AppConfig が更新されないこと。
  - 起動時、保存済みのアクティブ衛星が選択肢にない場合、先頭が選択され AppConfig が更新されること。
- `src/__tests__/renderer/service/ActiveSatServiceHub.test.ts`
  - `start()` で、初回取得より前に IPC リスナが登録されること。
  - 初回取得中に変更通知が来ても、取得処理が直列に実行され、最後の通知時点の衛星が最終状態になること。
