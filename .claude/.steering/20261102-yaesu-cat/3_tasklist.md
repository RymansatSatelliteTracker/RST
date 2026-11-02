# 改修タスクリスト

`2_design.md` に基づく実装タスク。2フェーズで実施する。

- **フェーズ1：現状のリファクタリング**（`2_design.md` §11）。ICOMの挙動は変えない。
- **フェーズ2：CAT対応**（`2_design.md` §1〜§10、§12、§13）。

フェーズ1が完了し、動作確認（ICOM回帰）が取れてから、フェーズ2に着手する。

---

# フェーズ1：現状のリファクタリング

ICOMコントローラ内の汎用処理を部品として切り出す。**ICOMの動作は変えない。** 各ステップごとに型チェック・テストを実行して確認しながら進める。

**進め方**：まず1-0でICOM（Parser / CmdMaker / State / Controller）の**特性テスト**（現状の挙動を固定するテスト）を作成し、現状のコードで全てパスすることを確認する。その後1-A以降のリファクタリングを行い、**1-0のテストを一切変更せずに全てパスすること**を、ICOMの挙動が変わっていない根拠とする。

## 1-0. ICOMのユニットテスト作成（リファクタリング前・実機接続なし）

対象は、**実機・実シリアルポートなしで検証できるものに限る**。コントローラは、`SerialComm` を偽物（フェイク）に差し替え、ICOM無線機の応答を模擬するシミュレータで検証する。

**実機でしか確認できないため対象外**：実際のシリアル通信の挙動（タイミング、バッファ、切断）、機種固有の応答の癖（例：IC-9700が電源Offでもコマンドをエコーバックする）、無線機本体の操作（ダイヤル、バンド切替）との実時間での干渉。

### 1-0-1. テスト基盤（共通ヘルパー）

配置先：`src/__tests__/main/service/transceiver/controller/helpers/`（`.test.ts` ではないため、テストとしては実行されない。フェーズ2のYAESUテストでも再利用する）

- [x] 1-0-1-1. `FakeSerialComm.ts`：`SerialComm` の代替クラス。送信データ（Uint8Array）を履歴として記録し、`open` / `close` / `isOpen` / `send` を提供する。コンストラクタ引数の `recvCallback`（`onRecv`）を保持し、テストから受信データを注入できる（`emitRecv(hex)`）。送信時に応答生成関数（シミュレータ）を呼び出して、応答を自動注入できる
- [x] 1-0-1-2. `IcomRadioSimulator.ts`：ICOM無線機の簡易シミュレータ。送信されたCI-Vコマンドに対し、設定系は `FB`（OK）、取得系（周波数／モード／データモード／バンド／サテライトモード）は保持している状態に応じた応答を返す。応答の無効化（タイムアウト再現）、NG（`FA`）応答、他のCI-Vアドレス宛ての応答も指定できる。周波数／モード／メイン・サブ状態を内部で保持する
- [x] 1-0-1-3. （実装：`icomControllerTestUtil.ts` にフェイクタイマーの準備・後始末、各テストファイルに `vi.mock` を記述）`mockControllerDeps.ts`（または各テスト内の `vi.mock`）：`@/main/common/SerialComm.js` をFakeSerialCommに、`@/main/main.js`（`fireIpcEvent`、`getMainWindow`）、`@/main/util/AppMainLogger.js`、`@/main/util/I18nUtil4Main.js` をモックする。フェイクタイマー（`vi.useFakeTimers`）の準備と後始末（`stop()` の呼び出し、保留中の `@synchronized` が残らないこと）を行う
- [x] 1-0-1-4. 既存テストの方針（`vi.mock` を使用した例が `src/__tests__/main` に無い）を踏まえ、`vitest.config` のエイリアス（`@/`）下で `vi.mock` が動作することを最小のテストで確認する

### 1-0-2. `TransceiverIcomRecvParser`（純粋関数）

配置先：`src/__tests__/main/service/transceiver/controller/TransceiverIcomRecvParser/`

- [x] 1-0-2-1. `parseFreq`：BCD周波数の解析（各桁、0、最大値）
- [x] 1-0-2-2. `parseMode`：モードコード→RSTモードの値（全コード、不明コードは`null`）
- [x] 1-0-2-3. `getValueFromDataMode` / `parseDataMode`：データモードの解析（On/Off、不正データ）
- [x] 1-0-2-4. `parseCurrentBand`：メイン／サブの判定
- [x] 1-0-2-5. `parseSatelliteMode`：サテライトモードOn/Offの判定
- [x] 1-0-2-6. `trimRecvData`：先頭`00`の読み捨て、プリアンブル位置からの切り出し

### 1-0-3. `TransceiverIcomCmdMaker`（純粋関数）

配置先：`src/__tests__/main/service/transceiver/controller/TransceiverIcomCmdMaker/`（既存の `geneToneHzStr` テストは変更しない）

- [x] 1-0-3-1. 共通プレフィックス（プリアンブル、CI-Vアドレス、PCアドレス）とポストアンブルの付与（各`make*`のバイト列）
- [x] 1-0-3-2. `makeSetFreq`：BCDエンコード（桁、0、境界値）
- [x] 1-0-3-3. `makeSetOpeMode` / `makeSetDataMode` / `makeGetMode` / `makeGetDataMode`
- [x] 1-0-3-4. `makeSwitchVfoA` / `makeGetBand` / `makeSwitchToMainBand` / `makeSwitchToSubBand` / `makeSetInvertBand` / `makeSetTranceive`
- [x] 1-0-3-5. `makeSetSatelliteMode` / `makeGetSatelliteMode`：IC-910とそれ以外でコマンドが異なること
- [x] 1-0-3-6. `makeSetToneCmd` / `makeSetToneFreqCmd`：On/Off、トーン周波数のバイト列

### 1-0-4. `TransceiverIcomState`（既存テストの不足分）

配置先：`src/__tests__/main/service/transceiver/controller/TransceiverIcomState/`（既存ファイルは変更しない）

- [x] 1-0-4-1. `setReqRxMode` / `setReqTxMode`：null無視、同一値で更新しない、`isForce`、`current*`への反映
- [x] 1-0-4-2. `setRecvRxFreqHz` / `setRecvTxFreqHz`：同一値で更新しない、Tx側の更新フラグ連動
- [x] 1-0-4-3. `isRxUpdate` / `isTxUpdate`
- [x] 1-0-4-4. `resetRx` / `resetTx`

### 1-0-5. `TransceiverIcomController`（FakeSerialComm＋シミュレータ）

配置先：`src/__tests__/main/service/transceiver/controller/TransceiverIcomController/`（1シナリオ1ファイル、`TransceiverIcomController_メソッド・機能名.test.ts`）。コールバック（`freqCallback` / `modeCallback` / `isDopplerShiftWaitingCallback`）は `vi.fn()` で受ける。

- [x] 1-0-5-1. `start` / `stop` / `isReady`
  - [x] 起動時の初期化コマンド順（VFO-A切替、トランシーブOn、周波数・モード取得）
  - [x] 起動時に**サテライトモードOffのコマンドが送信されない**こと（状態の初期値がOffで、`setSatelliteMode(false)` が「同じ値」としてスキップされる現状の挙動を固定する。`2_design.md` §0.1）
  - [x] 起動時に取得した周波数・モードの状態への反映
  - [x] `stop`：シリアルクローズ、コールバック解除、タイマー停止、読み取り待ちの解除
  - [x] `isReady`：シリアルのオープン／クローズ状態
- [x] 1-0-5-2. `setFreq` / `setMode`（要求値の保持と定期処理での送信）
  - [x] 呼び出しただけではコマンドが送信されず、定期処理（インターバル経過）で送信されること
  - [x] 同一値は再送されない、`isForce=true`は再送される
  - [x] モード文字列（LSB / USB / AM / CW / RTTY / FM / USB-D / LSB-D / FM-D / DV）→運用モード・データモードの変換、不定値のデフォルト（LSB）
  - [x] シリアル未接続の場合は何もしない
  - [x] Rx読み取り待ち中のRST周波数要求の破棄
- [x] 1-0-5-3. 定期処理のメイン／サブ制御（サテライトモードOn/Off）
  - [x] サテライトモードOffではメインのみ処理、Onではサブ→メインの順で処理されること
  - [x] 更新がない場合はコマンドを送信しない
  - [x] Rx周波数／モードの要求時の送信（データモード含む）、要求がない場合の取得
  - [x] 前回処理が終わっていない場合のスキップ
  - [x] シリアルが閉じられた場合、未接続メッセージ通知と定期処理の停止
- [x] 1-0-5-4. `setSatelliteMode`
  - [x] On/Offの切替コマンドと、切替後の周波数・モード取得
  - [x] 同じ値の再設定はスキップ
  - [x] シリアル未接続時は`false`を返し、未接続メッセージを通知
- [x] 1-0-5-5. `initAutoOn` / `autoOff`
  - [x] サテライトモードOffのときのRxのみの設定順序
  - [x] サテライトモードOnのときのRx→Txの設定順序（メイン／サブ切替、周波数、モード、データモード）
  - [x] トーン：FM / FM-DでトーンHzありの場合のOn＋周波数、トーンHzなしの場合のOff、FM系以外の場合のOff
  - [x] `autoOff`：サブ→メインの順でトーンOffが送信されること
- [x] 1-0-5-6. バンド入れ替え（`switchBandIfNeed`）
  - [x] RSTとICOMのRxが異なるバンド帯（144／430／1200MHz）の場合に入れ替えコマンドが送信され、再取得されること
  - [x] 同一バンド帯、周波数未設定、アマチュアバンド外では入れ替えないこと
  - [x] サテライトモードOffでは入れ替えないこと
- [x] 1-0-5-7. 受信処理（`onRecv` / `dispatchRecvData`）
  - [x] バイト列の分割受信（`fd`終端まで蓄積）、1回の受信に複数フレームが含まれる場合
  - [x] 先頭`00`の読み捨て
  - [x] 他のCI-Vアドレス宛てのデータは無視される
  - [x] `FB`（OK）/`FA`（NG）、周波数、モード、バンド、データモードの応答種別の振り分け
  - [x] 応答待ちでない受信（無線機起点のデータ）の処理
- [x] 1-0-5-8. 無線機起点のデータ受信（トランシーブ）の処理（`handleRecvData`）
  - [x] 周波数（`00`）：サテライトモードOn/Offおよびメイン／サブに応じて、`freqCallback`に uplink／downlink で通知されること
  - [x] 運用モード（`01`）/モード取得応答（`04`）/データモード（`1a`）：`modeCallback`への通知、同一値のスキップ
  - [x] RSTからの運用モード更新要求がある場合は、無線機→RSTの反映をスキップすること
  - [x] `isDopplerShiftWaitingCallback`が通知されること（周波数トランシーブ時`true`、取得応答時`false`）
- [x] 1-0-5-9. 無線機側操作後の送信一時停止
  - [x] 周波数トランシーブ受信後、`TRANSCEIVE_WAIT_MS`の間は定期処理が送信せず、経過後に再開すること
  - [x] モードトランシーブ受信後は`TRANSCEIVE_MODE_WAIT_MS`の間、一時停止すること
  - [x] 一時停止中に再度受信した場合、待機時間が延長されること
  - [x] 取得応答（`03`/`04`/`1a`）の受信で一時停止が解除されること
- [x] 1-0-5-10. Rx読み取り待ち（サブバンド（Tx）操作後のRx再取得）
  - [x] サテライトモードOnでサブ（Tx）のトランシーブ受信後に読み取り待ちになり、次周期でRxが取得されて解除されること
  - [x] 取得に失敗した場合の再試行、上限（3回）での解除
- [x] 1-0-5-11. タイムアウト・リトライ
  - [x] 応答ありコマンドが無応答の場合、100ms後にタイムアウトとして処理が継続すること
  - [x] モード設定／データモード設定が無応答の場合、最大3回リトライされること
  - [x] 起動時（2秒）に一度も受信がない場合、定期処理が停止し、`freqCallback` / `modeCallback`に失敗（受信タイムアウト）が通知されること
- [x] 1-0-5-12. IC-910固有の挙動
  - [x] 現在のバンドを無線機に問い合わせず、RST側保持の値（`isMain`）を使うこと
  - [x] メインバンド切替の応答が`FB`でない場合、`isMain`を戻して次回再試行されること

### 1-0-6. 確認

- [x] 1-0-6-1. 1-0-1〜1-0-5のテストを、**リファクタリング前の現状コードで全てパスさせる**（テスト作成中に見つかった既存の不具合は修正せず、特性としてテストに記録し、別途報告する）
- [x] 1-0-6-2. `npm run test` で全テストがパスすることを確認（PowerShellで実行）
- [x] 1-0-6-3. カバレッジレポートで `TransceiverIcom*` の網羅状況を確認し、実機でしか確認できない項目をPR説明に記載する
- [x] 1-0-6-4. 1-0のコミット（リファクタリングとは分ける）（ユーザーがコミット済み：`6f20e729 CAT対応（Ph1）`）

#### 1-0 実施メモ
- 成果物：`helpers/`（`FakeSerialComm.ts`、`IcomRadioSimulator.ts`、`icomControllerTestUtil.ts`）、RecvParser 6ファイル、CmdMaker 1ファイル、State 4ファイル、Controller 10ファイル（計191テスト、`src/__tests__/main/service/transceiver` 配下）。
- `vi.mock` は `@/` エイリアス下でも問題なく動作することを確認済み（1-0-1-4）。
- カバレッジ（transceiver配下のテストのみで計測）：`TransceiverIcomController.ts` 命令網羅90%、分岐81%、`TransceiverControllerBase.ts` 89%。
- テストの有効性確認として、ICOMコントローラを一時的に3通り改変（Rx読み取り待ち中の要求破棄の無効化、サテライトモード時のサブ→メインの処理順の入れ替え、トランシーブ後の待機時間の短縮）し、いずれもテストが失敗することを確認後、元に戻した。
- 特性として固定した現状の挙動（不具合の可能性があるもの。修正は今回の対象外）：
  - 起動時にサテライトモードOffのコマンドは送信されない。
  - 起動から2秒以上受信がなくても、RSTからの要求（`setFreq`等）がなければ受信タイムアウトは通知されない。
  - IC-910でメインバンドへの切り替えに失敗しても、Rx周波数の設定は送信され、サブバンド（Tx）側に設定される。
  - `initAutoOn`（サテライトモードOn）の後は、サブバンドが選択されたままになる。
  - サテライトモードOffでは、Tx（アップリンク）周波数の要求は無線機へ送信されない。
- 既存の失敗テスト（1-0とは無関係）：`OverlapPassesService.test.ts` の1件（日照時間の判定）が、変更前から失敗している。

## 1-A. `SerialComm` のオプション引数追加

- [x] 1-A-1. `src/main/common/SerialComm.ts`
  - [x] コンストラクタの末尾に `options?: { stopBits?: 1 | 2 }` を追加（位置引数の並びは変更しない）
  - [x] `createSerialPort` に `stopBits`（省略時1）を反映
  - [x] 接続ログにストップビットを追加
- [x] 1-A-2. 既存の呼び出し4か所（ローテータ2、無線機1、`SerialTrialService`）が変更不要であることを確認

## 1-B. `TransceiverLock` の切り出し

- [x] 1-B-1. `src/main/service/transceiver/controller/TransceiverLock.ts` を新規作成（`isLocked` / `acquire`（最大3秒・10ms間隔・タイムアウトしても警告して取得、`@synchronized`）/ `release`）
- [x] 1-B-2. `TransceiverIcomController.ts`
  - [x] `isProcessing` / `getLock` / `releaseLock` を削除し、`TransceiverLock` に置き換える
  - [x] 呼び出し箇所（定期処理、`initAutoOn`、`autoOff`、「前回処理中」判定）を追従修正

## 1-C. `TransceiverWaitTimer` の切り出し

- [x] 1-C-1. `src/main/service/transceiver/controller/TransceiverWaitTimer.ts` を新規作成（`isWaiting` / `start(waitMs)` / `release`）
- [x] 1-C-2. `TransceiverIcomController.ts`
  - [x] `isWaitSendFreq` / `transceiveWaitTimer` / `startTransceiveWaitTimer` を削除し、`TransceiverWaitTimer` に置き換える
  - [x] `handleRecvData` の `03`/`04`/`1a` ケースの `isWaitSendFreq = false` を `waitTimer.release()` に変更
  - [x] `stop()` のタイマークリアを `waitTimer.release()` に変更
  - [x] 定期処理の待機判定を `waitTimer.isWaiting()` に変更
- 実施メモ：元の `stop()` はタイマーのみをクリアして待機フラグ（`isWaitSendFreq`）を残していたが、`release()` はフラグも解除する。コントローラは接続ごとに新規に生成されるため通常の動作に影響はないが、同じインスタンスを `stop()` → `start()` した場合に、待機が解除されずに残る問題（現状の潜在的な不具合）が解消される。

## 1-D. 通知系ヘルパーの基底クラスへの引き上げ

- [x] 1-D-1. `TransceiverSerialControllerBase.ts`：`fireSerialNotConnectedMsg()`（protected）を追加
- [x] 1-D-2. `TransceiverControllerBase.ts`：`notifyDopplerShiftWaiting()`、`notifyRecvTimeoutError()`（protected）を追加
- [x] 1-D-3. `TransceiverIcomController.ts`
  - [x] private の `fireSerialNotConnectedMsg` / `notifyDopplerShiftWaiting` を削除（同名の残存は型エラーになるため、1-D-1/2と同時に実施）
  - [x] `checkRecvTimeout` のコールバック通知部分を `notifyRecvTimeoutError()` 呼び出しに置き換え（判定ロジック、タイマー停止、シリアルクローズはICOMに残す）
  - [x] 不要になったimportを整理

## 1-E. テスト（フェーズ1）

配置先：`src/__tests__/main/`（ソースをミラーリング）

- [x] 1-E-1. `service/transceiver/controller/TransceiverLock/TransceiverLock_acquire.test.ts`（実施済み。1-Bと同時に作成）：取得／解放、ロック中の再取得は解放まで待つ、3秒タイムアウトでも取得できる（フェイクタイマー）、`isLocked`
- [x] 1-E-2. `service/transceiver/controller/TransceiverWaitTimer/TransceiverWaitTimer_start.test.ts`（実施済み。1-Cと同時に作成）：待機状態になり指定時間後に解除される、再`start`で延長される、`release`で即時解除（フェイクタイマー）
- [x] 1-E-3. `main/common/SerialComm/SerialComm_stopBits.test.ts`（実施済み。1-Aと同時に作成）：`stopBits` 既定値1、指定値2が`SerialPort`に渡される（`serialport`をモック）
- [x] 1-E-4. `npm run test` を実行し、全テストがパスすることを確認（PowerShellで実行）。**1-0で作成したテストは変更せずにパスすること**（変更が必要になった場合は、挙動が変わった可能性があるため、理由を確認してから対応する）（全102ファイル・1002テストがパス。1-0のテストは変更なし）
- [x] 1-E-5. 型チェック（`npm run ts`）とlintのエラー解消（`npm run ts`、`eslint src` ともエラーなし）

## 1-F. 回帰確認

- [x] 1-F-1. 1-0のICOM特性テストが、リファクタリング後も変更なしで全てパスすることを確認（回帰確認の主な根拠）（1-0の特性テストは、1-A〜1-D後も変更なしで全てパス）
- [x] 1-F-2. ICOM実機（あれば）で、1-0では確認できない項目（実際のシリアル通信、機種固有の応答、無線機本体操作との干渉）を含め、接続、Rx/Tx周波数・モード設定、無線機側ダイヤル操作後の待機と再開、AutoOn/Off（トーン含む）がリファクタリング前と同等であることを確認
- [x] 1-F-3. ICOM実機がない場合は、その旨をPR説明に明記し、実機でしか確認できない項目（1-0の対象外）をユーザー報告での確認とする
- [x] 1-F-4. フェーズ1のコミット（1-0、フェーズ2とは分ける）

---

# フェーズ2：CAT対応

## 2-0. 事前確認（実装前）

- [x] 2-0-1. `FT-991_CAT_OM_J.pdf` のCAT章（コマンド一覧、SPLIT/`FT`、`CT`/`CN`、`AI`、応答形式、通信条件）を確認する
- [x] 2-0-2. 2-0-1の結果を `1_requirements.md`、`2_design.md` §4・§10 に反映する（ストップビット2、SPLITは`FT3;`、VFO-Bのモードは`SV;`入替、範囲30kHz〜470MHz 等）
- [x] 2-0-3a. `transceiver.json` の FT-847 削除可否（§10-3）：**削除でOK（確認済み）**
- [x] 2-0-3b. FT-897のDIG/PKT割り当て（§10-2）：**承認済み**（USB-D/LSB-D→DIG、FM-D→PKT。`2_design.md` §5.1）

## 2-1. 機種定義・設定まわり（既存コードの変更）

- [ ] 2-1-1. `src/common/Constant.ts`：`Transceiver.TransceiverId` に `YAESU_FT991 = "2"` / `YAESU_FT897 = "3"` を追加（メーカー内でのみ一意である旨のコメントを追記）
- [ ] 2-1-2. `src/common/model/AppConfigTransceiverModel.ts`：`AppConfigTransceiverDevice` に `stopBits?: 1 | 2`、`supportedModes?: string[]`、`modeLabels?: Record<string, string>` を追加（JSONを型変換するだけでインスタンス化されないため、初期値は書かず、使用側で `stopBits ?? 1` と補う）
- [ ] 2-1-3. `resources/data/init-data/transceiver.json`
  - [ ] YAESU(`makerId=2`)に FT-991（`transceiverId=2`、`"stopBits": 2`）、FT-897（`transceiverId=3`、`"stopBits": 2`）を追加
  - [ ] FT-847（`transceiverId=1`）を削除（確認済み）
  - [ ] FT-991 / FT-897 に `supportedModes` / `modeLabels` を設定（`2_design.md` §12.2の表のとおり。ICOMは省略）
- [ ] 2-1-4. `TransceiverSerialControllerBase.ts`：`openSerial(stopBits: 1 | 2 = 1)` に引数を追加し、`SerialComm` の `options` へ渡す（YAESUコントローラは機種定義の `stopBits ?? 1` を渡す）
- [ ] 2-1-5. 接続テストのストップビット受け渡し
  - [ ] `src/main/service/SerialTrialService.ts`：`open(comName, baudRate, stopBits = 1)`
  - [ ] `src/main/initializeIpcEvent.ts`：`openSerialPortTry` ハンドラに `stopBits` 引数を追加
  - [ ] `src/main/preload.ts`：`openSerialPortTry` に `stopBits` 引数を追加（`rstApi` の型定義も更新）
  - [ ] `src/renderer/api/ApiSirial.ts`：`tryOpen(comName, baudRate, stopBits = 1)`
  - [ ] `useTransceiverTestConnect.ts`：選択中の機種定義の `stopBits ?? 1` を渡す

## 2-2. YAESU制御・共通部分（新規）

配置先：`src/main/service/transceiver/controller/yaesu/`

- [ ] 2-2-1. `TransceiverYaesuProtocol.ts`：interface（`getTxFreqSendThresholdHz` / `pollEveryCycles` / `refreshAutoInfo` を含む）、型（`YaesuBand` / `YaesuRxStatus` / `YaesuNotify`）
- [ ] 2-2-2. `TransceiverYaesuState.ts`：要求値・取得値・更新フラグ・`resetAll`（ICOM Stateの該当メソッドに仕様を合わせる）、Tx送信間引き用の `lastSentTxFreqHz` と判定メソッド
- [ ] 2-2-3. `TransceiverYaesuSerialIo.ts`
  - [ ] `send` / `sendAndRecv`（`expectBytes` / `expectPrefix` / `timeoutMs`、`@synchronized`）
  - [ ] 受信バッファ管理（`protocol.extractFrames`）、応答待ち外フレームの `onNotify` 転送
  - [ ] コマンド間隔（`interCommandDelayMs`）
- [ ] 2-2-4. `TransceiverYaesuController.ts`
  - [ ] `start` / `stop` / `isReady`
  - [ ] 定期処理（待機中の扱い、Rx設定、Tx設定（サテライトモード時）、`pollEveryCycles` に従うRxの定期読み取り（FT-897：毎周期、FT-991：5周期に1回＋`refreshAutoInfo`）。Rx設定を送った周期は読み取らない）
  - [ ] Tx周波数の送信間引き（前回送信値との差が `getTxFreqSendThresholdHz` 未満なら送らない。`initAutoOn`・`isForce`・サテライトモード切替直後・Txモード変更時・前回値未設定は必ず送る）（`2_design.md` §3.4.1.1）
  - [ ] VFOずれ判定（読み取り値のバンド区分が、前回の読み取り値ともRSTの直近のRx要求値とも異なる場合は、警告ログのみでRSTへ通知しない）（`2_design.md` §3.4.3）
  - [ ] 起動時の応答タイムアウト判定（`notifyRecvTimeoutError()` 使用）
  - [ ] `initAutoOn`（Rx/Tx周波数・モード、トーン）/ `autoOff`（トーンOFF）
  - [ ] `setFreq` / `setMode` / `setSatelliteMode`
  - [ ] 無線機側操作の検知処理（FT-991：AI通知、FT-897：ポーリング差分）→ `freqCallback` / `modeCallback` / `notifyDopplerShiftWaiting` / `TransceiverWaitTimer`
  - [ ] サテライトモードOFF時はuplinkとして通知（ICOMの挙動に合わせる）
  - [ ] トーン設定（FM/FM-Dのみ、それ以外はOFF）
  - [ ] `TransceiverLock` による排他、設定失敗時のリトライ（最大3回）
- [ ] 2-2-5. `TransceiverControllerFactory.ts`：YAESU分岐を有効化し、`selectYaesuProtocol`（機種ID→Protocol、未対応機種は`InvalidArgumentError`）を追加

## 2-3. FT-991 Protocol（新規）

- [ ] 2-3-1. `TransceiverYaesuFt991CmdMaker.ts`
  - [ ] 周波数（`FA`/`FB`、9桁Hz、範囲30kHz〜470MHzの検証）、モード（`MD0`）、SPLIT（`FT3;`/`FT2;`）、VFO入替（`SV;`）、送信状態（`TX;`）、AI、CTCSS（`CT0` P2、`CN00`＋3桁番号）、読み取り（`IF;`）
  - [ ] モード変換（RSTモード→MDコード）
  - [ ] トーン周波数→トーン番号（`Constant.Transceiver.ToneFrequency`のインデックス）
- [ ] 2-3-2. `TransceiverYaesuFt991RecvParser.ts`
  - [ ] `;`区切りのフレーム切り出し（複数フレームの連結、分割受信）
  - [ ] `IF`応答の解析（周波数P2、モードP6）、`FA`/`MD0`通知の解析、`TX;`応答の判定
  - [ ] モード読み替え（CW-R/FM-N/AM-N/RTTY-USB/C4FM）
  - [ ] エラー応答`?;`の判定
- [ ] 2-3-3. `TransceiverYaesuFt991Protocol.ts`
  - [ ] `init`（`AI1;`、`FT2;`）/ `term`（`AI0;`）/ `refreshAutoInfo`（`AI1;`）/ `setFreq` / `setMode` / `setSplit` / `setTone` / `readRx`（`IF;`）/ `extractFrames` / `parseNotify`
  - [ ] `pollEveryCycles=5`、`getTxFreqSendThresholdHz` は常に0
  - [ ] **Tx（VFO-B）のモード・トーン設定のVFO入替方式**（`TX;`確認→`SV;`→設定→`SV;`、送信中はスキップ、Txモード・トーンが変化したときのみ実施）
  - [ ] 入替中およびその後500msのAI通知の除外
  - [ ] 範囲外の周波数（470MHz超）は送信せず警告ログ
  - [ ] Rx側（VFO-A：`FA`/`MD0`/`IF`）通知のみ処理し、VFO-B通知（`FB`/`OI`）は破棄、`?;`は警告ログ

## 2-4. FT-897 Protocol（新規）

- [ ] 2-4-1. `TransceiverYaesuFt897CmdMaker.ts`
  - [ ] BCD変換（10Hz単位、丸め、範囲チェック：30kHz未満・470MHz超は送信しない）、周波数／モード／VFO切替／SPLIT／トーン方式／トーン周波数（0.1Hz単位BCD）／読み取り（`03`/`F7`）
  - [ ] モード変換（DIG/PKT割り当て、RTTY/DVは未対応）
- [ ] 2-4-2. `TransceiverYaesuFt897RecvParser.ts`
  - [ ] `03`応答の解析（周波数BCD、モード、不正値は`null`）、モード読み替え、`F7`のPTT判定
- [ ] 2-4-3. `TransceiverYaesuFt897Protocol.ts`
  - [ ] `init`：`82`（SPLIT OFF）を送信（VFOは変更しない）
  - [ ] `isRxVfoDisplayed`保持、`ensureVfo`
  - [ ] `pollEveryCycles=1`、`refreshAutoInfo` は何もしない、`getTxFreqSendThresholdHz`（SSB/CW/DIG系 50Hz、FM系 500Hz）
  - [ ] Tx側設定は「送信中確認→Tx VFOへ切替→設定→Rx VFOへ復帰」
  - [ ] `setTone`（Tx VFOで`0A`/`0B`）、`setSplit`、`readRx`
  - [ ] VFOずれ疑い時の警告ログ

## 2-5. 設定画面

- [ ] 2-5-1. `TransceiverConn.vue`：CI-Vアドレス欄を `v-if`（ICOM選択時のみ表示）に変更
- [ ] 2-5-2. 無線機メニュー設定の注記を追加（`I18nMsgs` に日英メッセージ追加、`TransceiverConn.vue` に選択中の機種に応じて表示）（`2_design.md` §6.7）
  - [ ] FT-991：`031 CAT RATE`（RS-232Cは`029 232C RATE`）をRSTのボーレートと一致させる
  - [ ] FT-897：`No-001 EXT MENU=ON`、`No-020 CAT/LIN/TUN=CAT`、`No-019 CAT RATE`。USB-D/LSB-D（DIG）の側波帯は`No-038 DIG MODE`で決まること、FM-D（PKT）の速度は`No-073 PKT RATE`、運用中はVFOを切り替えないこと
- [ ] 2-5-3. YAESU選択時の画面動作確認（機種リスト、CI-V非表示、接続テスト）

### 運用モード選択肢の機種別表示（`2_design.md` §12）

- [ ] 2-5-4. `src/renderer/common/util/OpeModeItemsUtil.ts`：`buildItems(device, currentValue)`（絞り込み、ラベル切替、DV除外、機種定義なしは従来どおり）
  - [ ] 選択肢に無い保存値の扱い：Vuetify 3 の `v-select` が選択肢に無い値をそのまま表示するかを先に確認し、空表示になる場合のみ `（非対応）` として末尾に追加する。DVは追加しない（ICOMの表示を変えない）
- [ ] 2-5-5. `useCurrentTransceiverDevice`（composable）：現在の無線機の機種定義を取得・保持し、再読込（`refresh`）を提供
- [ ] 2-5-6. `OpeModeSelect.vue`
  - [ ] `buildItems` で選択肢を組み立て（`title`＝ラベル、`value`＝RSTのモード名）
  - [ ] `#selection` スロットで、選択後の表示はRSTのモード名のみとする
  - [ ] 無線機未設定の場合は従来どおり（全モード、DV除外）
- [ ] 2-5-7. 無線機設定の保存後（`TransceiverSetting` のOK後）に、機種定義を再読込して選択肢が更新されるようにする（呼び出し箇所を実装時に確認）
- [ ] 2-5-8. 画面の確認：衛星設定ダイアログ、メイン画面（`TransceiverCtrl`、幅が狭い画面で一覧のみ括弧付き表示になること）、ICOM選択時に表示が変わらないこと（無線機からDVを受信した場合を含む）、保存済みの非対応モードの表示

## 2-6. テスト（Vitest）

配置先：`src/__tests__/main/service/transceiver/controller/yaesu/`（ICOMのテストと同じ命名規則：`クラス名/クラス名_メソッド名.test.ts`）

- [ ] 2-6-1. `TransceiverYaesuFt991CmdMaker/`：周波数、モード、トーン
- [ ] 2-6-2. `TransceiverYaesuFt991RecvParser/`：フレーム切り出し、周波数・モード解析、読み替え、エラー応答
- [ ] 2-6-3. `TransceiverYaesuFt897CmdMaker/`：BCD、モード、トーン、固定コマンド
- [ ] 2-6-4. `TransceiverYaesuFt897RecvParser/`：`03`応答、モード読み替え、`F7`
- [ ] 2-6-5. `TransceiverYaesuFt897Protocol/`（IOモック）：VFO切替の順序、送信中スキップ、Rx VFOへの復帰
- [ ] 2-6-6. `TransceiverYaesuFt991Protocol/`（IOモック）：Txモード設定の送信順（`TX;`→`SV;`→`MD0x;`→`SV;`）、送信中のスキップ、入替中の通知除外、Txモード・トーン未変化時は入替しない、範囲外周波数、`init`で`AI1;`と`FT2;`
- [ ] 2-6-7. `TransceiverYaesuState/`：`setReqRxFreqHz` / `setReqTxFreqHz` / `setReqRxMode` / `setReqTxMode` / `isRxUpdate` / `isTxUpdate` / `resetAll`、Tx送信間引きの判定（閾値未満は不要、閾値以上・`isForce`・前回値未設定は要）
- [ ] 2-6-8. `TransceiverYaesuController/`（FakeSerialComm＋Protocolモック）：Tx周波数の送信間引き、VFOずれ判定（バンドをまたぐ変化は通知しない／同一バンド内は通知して待機／RSTがRxを別バンドへ設定した直後の読み取りはVFOずれにしない）、FT-991の定期読み取り周期（5周期に1回の`IF;`と`AI1;`、Rx設定を送った周期は読み取らない）、起動時の応答タイムアウト
- [ ] 2-6-9. `TransceiverControllerFactory/`：YAESU＋FT-991/FT-897、未対応機種（FT-847の旧設定を含む）
- [ ] 2-6-10. `transceiver.json` の内容テスト（FT-991とFT-897のみ`stopBits=2`、ICOMは省略、`supportedModes`/`modeLabels`の値が`Constant.Transceiver.OpeMode`に存在し、`modeLabels`のキーが`supportedModes`に含まれること）
- [ ] 2-6-11. `src/__tests__/renderer/common/util/OpeModeItemsUtil/OpeModeItemsUtil_buildItems.test.ts`：機種定義なし（従来と同じ選択肢）、`supportedModes`指定、`modeLabels`指定（valueは不変）、保存済みの値が非対応の場合（2-5-4の確認結果に従う）、DVが追加されないこと、未設定（空文字）
- [ ] 2-6-12. `npm run test` を実行し、全テストがパスすることを確認する（PowerShellで実行）
- [ ] 2-6-13. 型チェック（`npm run ts`）とlintのエラー解消

## 2-7. 実機確認

- [ ] 2-7-1. FT-897：接続テスト（4800/9600/38400bps、ストップビット2）
- [ ] 2-7-2. FT-897：Rx周波数・モードの設定／RST反映、無線機側ダイヤル操作の検知とドップラー補正の一時停止・再開
- [ ] 2-7-3. FT-897：サテライトモード（SPLIT）でRx/Txの設定、Tx設定後にRx VFOへ戻ること、送信中にTx設定がスキップされること
- [ ] 2-7-3-1. FT-897：ドップラー補正中のTx周波数の送信間引き（受信の途切れの頻度・受信音、閾値による周波数誤差）を確認し、閾値を調整する（§10-13）
- [ ] 2-7-3-2. FT-897：運用中にVFOを手動で切り替えた場合に「VFOずれ」として警告ログのみとなり、元に戻すと復帰すること。同一バンド内のダイヤル操作は通常どおり検知されること（§10-15）
- [ ] 2-7-3-3. FT-897：起動時に`82`（SPLIT OFF）が送信され、スプリットが解除されること
- [ ] 2-7-4. FT-897：トーン（CTCSS）設定とAutoOff時の解除、セット系コマンドの応答有無・必要間隔の確認（§10-5, 7）
- [ ] 2-7-5. FT-897：応答がない場合（電源オフ、ボーレート違い）に起動時タイムアウトが通知されること
- [ ] 2-7-6. FT-991：接続テスト（ストップビット2、4800bps等）、Rx/Txの周波数・モード設定、SPLIT（`FT3;`）で受信=VFO-A／送信=VFO-Bになること（§10-8）
- [ ] 2-7-7. FT-991：AI通知による無線機側操作の検知、RST設定時のAI通知の戻り有無（§10-11）
- [ ] 2-7-7-1. FT-991：接続中に無線機の電源を入れ直した後、定期読み取り（5周期に1回）でAIが再有効化され、無線機側の操作が検知されること（§10-14）
- [ ] 2-7-8. FT-991：トーン（CTCSS）設定とAutoOff時の解除。`CT0`/`CN0`がVFO-A側の設定か、VFO-B側のトーンに`SV;`入替が必要か（§10-9）
- [ ] 2-7-8-1. FT-991：`SV;`入替の動作（受信音への影響、必要な間隔、2回で元に戻ること、AI通知の除外）（§10-10）
- [ ] 2-7-8-2. FT-991：1200MHz帯など範囲外の周波数を設定しようとしたとき、警告ログのみで設定されないこと
- [ ] 2-7-9. 確認結果を `2_design.md` §10 に反映し、必要に応じて実装を調整する
- [ ] 2-7-10. 既存ICOMの動作に影響がないこと（接続テスト、周波数・モード設定）を再確認する

## 2-8. ドキュメント更新

- [ ] 2-8-1. `doc/10_アーキテクチャ/10_アーキテクチャ.md`：無線機制御の構成図にYAESUコントローラ／Protocol構成と、共通部品（`TransceiverLock` / `TransceiverWaitTimer`）を追加（罫線図は全角文字でずれないよう調整）
- [ ] 2-8-2. `doc/30_画面設計/G4-1_無線機設定（接続設定タブ）.md`：CI-Vアドレス欄の表示条件、YAESU機種リスト、機種別の注記（CATレート、FT-897のDIG/PKT・VFO操作）、接続テストのストップビット（FT-991・FT-897=2）
- [ ] 2-8-2-1. 運用モード選択（`OpeModeSelect`）が機種ごとに絞り込み・ラベル切替される仕様を、衛星設定／メイン画面の設計書（`doc/30_画面設計/` 配下の該当ファイル）に追記
- [ ] 2-8-3. YAESU無線機の制御仕様（対象機種、Rx/Txの対応、制限事項）を `doc/` 配下に記載

---

# 対象外（今回は実施しない）

- ICOMコントローラの分割（`sendAndSyncRecv`、バンド制御、受信ディスパッチ等）と、既存ICOMファイルのサブフォルダへの移動。
