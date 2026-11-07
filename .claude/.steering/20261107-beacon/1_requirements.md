# 要求内容

## 概要

Beaconに対応する。
ビーコン周波数（中心周波数とは違い少し離れたところにビーコンが出ている周波数がある）
ICOM無線機側のビーコンの操作説明は「ICOM無線機のビーコンの説明.png」を参照。

## 背景・現状

- メイン画面（無線機制御パネル）に「Beacon」ボタン、衛星設定画面に「ビーコン周波数」（周波数・運用モード 1組）は既に存在する。
- 現状、Beaconボタンを押すと「開発中通知」が表示される（`TransceiverCtrl.vue` の `beaconBtnClick`）。
- Beacon ON時はRx周波数・Rx運用モードをビーコン設定に切り替え、OFF時は元に戻す処理が一部実装済み（`TransceiverModeCoordinator.startBeaconMode / stopBeaconMode`）。ただし、以下は未対応。
  - ドップラーシフトの加味（基準周波数の切替）
  - 固定モードとの連携
  - Beacon OFF時の戻り先（Auto中は衛星設定のダウンリンク周波数に戻しており、Beacon ON前の調整が失われる）
- ボタンの活性条件は「ビーコン周波数・運用モードが設定済み」のみ（`TransceiverModeSettingResolver.canUseBeaconMode`）。

## 原文（要求元のメモ）

- Auto：ON 且つ Beacon：ONの状態でAuto:OFFにする場合はBeaconも強制OFFする。
- Beacon周波数が設定されていない衛星は「Beacon」ボタンは非活性とする。
- 固定モードに関する事項
  - Beaconボタンをクリックしたときに衛星固定に変更する。
  - 送信固定、受信固定の場合でBeaconを押した場合は押す前の固定周波数を記録しておきBeaconが解除されたから固定値を読み出す。
- ドップラーシフトに関する事項
  - BeaconがOnの状態で無線機側のダイヤルを操作した場合、調整量をBeacon解除した周波数にも入れるかどうかについては、シフト量の反映は必要なし。
  - Beaconボタンを押しオンにした場合、基準周波数＋押した時点のBeacon周波数側のドップラーシフトを加味してRx周波数に設定する。（無線機のダイヤルにて微調整可能）
  - Beaconボタンを再度押しオフにした場合、以前設定されていた周波数に戻った時点の戻った周波数側のドップラーシフトを加味してRx周波数に設定する。（Beacon中のダイヤル微調整は無視）
- 運用対応する事項
  - 元々のBeacon周波数が公開されている周波数とずれているものは衛星の設定画面で微調整する。

## 要求仕様（詳細化）

### 要求A: Beaconボタンの活性条件

1. 以下をすべて満たす場合のみ「Beacon」ボタンを活性とする。
   - アクティブ衛星にビーコン周波数・ビーコン運用モードが設定されている。
   - サテライトモードがONである。
2. Auto ON/OFF は活性条件に含めない（Auto OFFでもBeacon ONにできる）。
3. 「開発中通知」の表示は削除する。

### 要求B: Beacon ON時の動作

1. 固定モード
   - Beacon ON時に、メイン画面の固定モードを「衛星固定」に変更する。
   - Beacon ON前の固定モードを記録する。
   - 送信固定・受信固定の場合は、Beacon ON前の固定側の周波数（送信固定ならTx、受信固定ならRx）も記録する。
   - Beacon ON中は、固定モードのセレクトボックスを非活性にする。
2. Rx周波数・運用モード
   - Beacon ON前のRx基準周波数（それまでのダイヤル微調整・補正値による調整を含む）と、Rx運用モードを記録する。
   - Rx運用モードを、衛星設定のビーコン運用モードに切り替える。Tx運用モードは変更しない。
   - Auto ON時は、Rx周波数を「ビーコン周波数＋Beacon ON時点のビーコン周波数側のドップラーシフト」に設定する。
   - Auto OFF時は、Rx周波数をビーコン周波数に設定する（ドップラーシフトは加味しない）。
3. メイン画面のRx周波数補正値（補正値セレクトボックス）は、ビーコン周波数には加算しない。補正値自体は保持し、Beacon OFF後の通常追尾で引き続き使用する。

### 要求C: Beacon ON中の動作（Auto ON時）

1. Rx
   - ビーコン周波数を基準周波数として、Autoの更新周期ごとにドップラーシフト補正を継続する。
   - 無線機のダイヤルで微調整した量は、Beacon ON中の追尾に引き継ぐ。
   - ビーコンはトランスポンダの送受信周波数の和（Sum）の関係にないため、Txとの和を維持する計算（逆ヘテロダイン）には使用しない。
2. Tx
   - 衛星固定として、Beacon ON前のアップリンク基準周波数をもとに、Tx単独でドップラーシフト補正を継続する。
   - 無線機のダイヤルで微調整した量は、Beacon ON中の追尾に引き継ぐ。

### 要求D: Beacon OFF時の動作

1. 固定モード
   - 固定モードを、Beacon ON前に記録した固定モードに戻す。
   - 固定モードのセレクトボックスを活性に戻す。
2. Rx運用モードを、Beacon ON前に記録した運用モードに戻す。
3. 周波数（Auto ON時）
   - Beacon ON前に記録した基準周波数に戻す。そのうえで、OFF時点の戻り先周波数側のドップラーシフトを加味して設定する。
   - Beacon ON中のダイヤル微調整（Rx・Txとも）は破棄し、戻り先には反映しない。
   - 固定モードごとの戻り方は以下のとおり。

     | Beacon ON前の固定モード | Rx                                         | Tx                                                     |
     | ----------------------- | ------------------------------------------ | ------------------------------------------------------ |
     | 衛星固定                | 記録した基準周波数＋OFF時点のドップラー    | 記録した基準周波数＋OFF時点のドップラー                |
     | 受信固定                | 記録した固定Rx周波数                       | 固定Rxを維持するように算出（受信固定の通常算出）       |
     | 送信固定                | 固定Txを維持するように算出（送信固定の通常算出） | 記録した固定Tx周波数                             |

4. 周波数（Auto OFF時）
   - Beacon ON前に記録したRx周波数に戻す（ドップラーシフトは加味しない）。

### 要求E: Beaconの強制OFF

以下の場合は、Beaconを強制的にOFFにする（要求Dの処理を行う）。

| # | 契機                                                    | 強制OFF後の動作                                                                 |
| - | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1 | Auto ON かつ Beacon ON の状態で Auto OFF にした         | 従来どおりAuto OFFの処理を行い、Beacon・Auto のどちらもONにする前の周波数に戻す。運用モードは従来のAuto OFFと同様に戻さない（Rx運用モードは、Beacon OFFの処理でビーコン運用モードから元に戻る） |
| 2 | Beacon ON中にアクティブ衛星を切り替えた                 | Auto ONの場合は、新しい衛星の通常の周波数でAutoを開始し直す                     |
| 3 | Beacon ON中に、アクティブ衛星の無線設定（周波数・運用モード・サテライトモードなど）を変更して保存した（衛星は同じ） | Auto ONの場合は、更新後の設定でAutoを開始し直す。無線設定が変わらない更新（概要のみの保存、最小仰角の変更など）では、Beaconを継続する |
| 4 | Beacon ON中にサテライトモードをOFFにした                | -                                                                               |

### 要求F: Auto と Beacon の組み合わせ

1. Auto OFF で Beacon ON にした後に Auto ON にした場合は、Beacon ONを維持したままAutoを開始する。
   - 固定モードは衛星固定のままとする。Beacon ON時に記録した固定モード・固定周波数を、Beacon OFF時の戻り先とする。
   - Rxはビーコン周波数を基準にドップラー追尾を開始し、Txは衛星固定として追尾を開始する（要求C）。
   - Auto開始時に衛星設定の固定モードをメイン画面に設定する既存処理（#262）は、Beacon ON中は行わない。記録済みの固定モードをBeacon OFF時の戻り先とする。
2. Auto ON で Beacon ON にした場合は、要求B・Cのとおりとする。

### 要求G: 運用で対応する事項（実装対象外）

1. 実際のビーコン周波数が公開値からずれている衛星は、衛星設定画面の既存の「ビーコン周波数」入力欄で値を書き換えて調整する。画面項目は追加しない。
2. ビーコン周波数を書き換えた後は、Beaconを一度OFFにしてから再度ONにすると新しい値が反映される（Beacon ON中に衛星設定を保存すると、要求E#3により自動でOFFになる）。

### 要求H: ドキュメント

1. `doc/30_画面設計/G2_メイン.md` の「2.3.7 Beacon」「イベント一覧」「相関チェック」の記述（開発中通知、Auto OFF時は利用不可）を本仕様に合わせて更新する。

## 確認事項の結果

| #  | 確認事項                                   | 結果                                                                                 |
| -- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1  | Beaconボタンの活性条件（Auto）             | Auto OFFでも活性（Auto OFF時は周波数切替のみで、ドップラー追尾なし）                 |
| 2  | Beacon ON中のRx追尾                        | ビーコン周波数を基準に周期的に追尾を継続する（ダイヤル微調整も引き継ぐ）             |
| 3  | Beacon ON中のTx                            | 衛星固定として、Beacon ON前のアップリンク基準周波数でTx単独の追尾を継続する          |
| 4  | Beacon OFF時のRx戻り先                     | Beacon ON直前の基準周波数（Beacon前の調整を含む）＋OFF時点のドップラー               |
| 5  | Beacon OFF時の固定モード                   | Beacon ON前の固定モードに戻す                                                        |
| 6  | Beacon ON中の固定モード選択                | 非活性にする                                                                         |
| 7  | Beacon ON中のアクティブ衛星切替            | Beaconを強制OFFにする                                                                |
| 8  | Auto OFFでBeacon ON → Auto ON              | Beacon ONを維持したまま追尾を開始する                                                |
| 9  | サテライトモードOFF時のBeacon              | 利用不可（ボタン非活性。ON中にサテライトモードをOFFにしたらBeaconも強制OFF）         |
| 10 | Rx周波数補正値（補正値セレクトボックス）   | ビーコン周波数には加算しない                                                         |
| 11 | ビーコン周波数の微調整方法                 | 既存のビーコン周波数入力欄で書き換える（運用対応・画面変更なし）                     |
| 12 | Beacon ON中のRx運用モード                  | ビーコン運用モードに切り替え、OFFで元に戻す（Tx運用モードは変更しない）              |
| 13 | Beacon ON中のTxダイヤル微調整              | Beacon中の追尾には反映し、OFF時は破棄する（Rxと同じ扱い）                            |
| 14 | Beacon ON中の同一衛星の設定保存            | Beaconを強制OFFにする                                                                |
| 15 | Auto OFF → Beacon ON → Auto ON 後のBeacon OFF の戻り先 | 衛星設定のアップリンク/ダウンリンク周波数（通常のAuto開始と同じ値）を基準周波数とし、そこへ戻す。固定モードはBeacon ON時に記録したものに戻す |
| 16 | Beacon ON中に、衛星も無線設定も変わらない更新通知が来た場合 | Beaconを継続する（Autoを開始し直さない）。無線設定が変わった場合のみ強制OFF |

## 影響範囲（調査結果）

| 区分             | 対象                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 画面             | `src/renderer/components/organisms/TransceiverCtrl/TransceiverCtrl.vue`（Beaconボタン、固定モードセレクトの活性制御、開発中通知の削除） |
| 画面ロジック     | `useTransceiverCtrl.ts`（`isBeaconMode` の監視、`onChangeSatGrp`、`updateFreq` / `applyDopplerShiftCorrections`）           |
| モード遷移       | `coordinators/TransceiverModeCoordinator.ts`（`startBeaconMode` / `stopBeaconMode` / `startAutoMode` / `stopAutoMode`）    |
| 周波数算出       | `coordinators/TransceiverFreqCoordinator.ts`、`calculators/TransceiverDopplerCalc.ts`、`managers/TransceiverBaseFreqMgr.ts` |
| 解決クラス       | `resolvers/TransceiverModeSettingResolver.ts`（`canUseBeaconMode`、`resolveWhenBeaconOffInAuto`）、`resolvers/TransceiverDopplerModeResolver.ts`、`resolvers/TransceiverRecvFreqResolver.ts`（Beacon中のダイヤル操作） |
| 固定モード選択   | `src/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue`（非活性対応）                        |
| ドキュメント     | `doc/30_画面設計/G2_メイン.md`                                                                                             |
| テスト           | `src/__tests__/renderer/components/organisms/TransceiverCtrl/` 配下（既存の `TransceiverModeSettingResolver_*` テストの更新を含む） |
