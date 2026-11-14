# 要求内容

## 概要

- アクティブ衛星を衛星グループ内の2つ目以降にした状態でアプリを終了し、再起動すると、衛星選択ボックスは1つ目の衛星になる一方、地図上の衛星軌道は2つ目の衛星のまま表示される不具合を修正する。
- 再起動後は、終了時のアクティブ衛星（2つ目）が衛星選択ボックス・地図の軌道・その他のアクティブ衛星を参照する表示のすべてで一致して復元されること。

## 再現手順

1. アクティブ衛星を衛星グループ内の2つ目の衛星にして、アプリを終了する。
2. 再度アプリを起動する。
3. 衛星選択ボックスでは1つ目の衛星が選択されているが、地図上の衛星軌道は2つ目の衛星で表示される。

## 原因（調査結果）

### 原因①：起動時に衛星選択ボックスが保存済みのアクティブ衛星を無視し、先頭の衛星を選び直している

- `useSatelliteSelectBox.ts` の `updateSatItems()` は、起動時は `prevItems` が空のため `isUpdateItems()` が常に `true` になる。
- `restoreSelectedSatId()` は `prevSelectedSatIdMap`（グループ切替時に前回選択した衛星を復元するためのマップ）が空のため、先頭の衛星IDを返す。
- その結果、保存済みのアクティブ衛星（`mainSatelliteId`）と異なるため、画面の選択を先頭衛星に変更し、`updateAppConfig()` で AppConfig を先頭衛星へ書き換え、`refreshAppConfig()` で変更通知を発火する。

### 原因②：起動直後の変更通知を ActiveSatServiceHub が取りこぼす

- `ActiveSatServiceHub.start()` は、初回の `onChangeSatGrp()` の完了を待ってから IPC の変更通知リスナ（`onChangeActiveSatelliteGroup`）を登録している。
- 子コンポーネント（`SatelliteSelectBox`）の `onMounted` は、親（Home）の `init()` → `Hub.start()` と並行して動作するため、原因①の変更通知がリスナ登録前に届き、取りこぼされる。
- Hub の初回 `onChangeSatGrp()` は AppConfig の書き換え前に2つ目の衛星を読み込んでいるため、軌道（`OrbitLineService`）をはじめ Hub を参照する表示が2つ目のまま残る。
- また、仮に通知を受け取れても `onChangeSatGrp()` が並行実行され、古い呼び出しが後から結果を上書きするおそれがある。

## 要求仕様

### A. 起動時のアクティブ衛星の復元

- 起動時（当該衛星グループで前回選択した衛星の記録がない場合）は、保存済みのアクティブ衛星（`mainSatelliteId`）が選択肢に存在すれば、その衛星を選択する。
- 保存済みのアクティブ衛星が選択肢に存在しない場合は、従来どおり先頭の衛星を選択し、AppConfig を更新する。
- 衛星グループ切替時の「前回選択した衛星の復元」動作は従来どおりとする。

### B. ActiveSatServiceHub の通知取りこぼし・並行実行の防止

- `start()` では、IPC の変更通知リスナを初回のアクティブ衛星情報取得より前に登録する。
- `onChangeSatGrp()` は直列に実行し、複数の変更通知が重なっても、最後の通知時点の AppConfig の内容が最終状態になること。

## 対象外

- `updateSatChoiceMinEl()`（最小仰角変更）の並行実行対策。
- 衛星グループ選択ボックス（`useSatelliteGroupSelectBox.ts`）の動作変更。
