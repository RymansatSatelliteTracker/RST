# 改修プラン

`1_requirements.md` を踏まえた改修プラン。YAESU無線機（FT-991/991A、FT-897/897D）のCAT制御を、既存のICOM(CI-V)制御と同じ構造で追加する。

## 0. 設計方針（要約）

本改修は2フェーズで実施する。
- **フェーズ1：現状のリファクタリング**（§12）。ICOM実装の挙動は変えず、YAESUでも共通利用できる部分（ロック、待機タイマー、通知処理）を切り出す。
- **フェーズ2：CAT対応**（§1〜§10、§13、§14）。フェーズ1で切り出した部品を使ってYAESUコントローラを追加する。

§1〜§10 は、フェーズ1が完了している前提で記述する。

1. 既存の `TransceiverControllerBase`（上位IF）は変更せず、YAESU用コントローラ `TransceiverYaesuController` を追加し、`TransceiverControllerFactory` のYAESU分岐を有効化する。レンダラ側（ドップラー補正、`TransceiverCtrl`配下）は変更しない。
2. 機種ごとにCATの体系が大きく異なる（FT-991：ASCII／AI通知あり、FT-897：5バイトバイナリ／通知なし／VFO切替方式）ため、**制御フロー（スケジューリング・状態管理・待機制御）は共通のController**、**ワイヤレベルのコマンド生成・応答解析は機種別のProtocolクラス**に分離する（Strategyパターン）。FTM/FT-8xx系の追加は、Protocolクラスを追加するだけで済む構造にする。
3. 既存のICOM実装（`TransceiverIcom*`）は、**フェーズ1の範囲（§12）を除いて変更しない**（リグレッション回避）。共通化する処理は、ロックと待機タイマーを部品クラス（継承ではなく合成）に切り出し、通知系のヘルパーを基底クラスへ引き上げるものに限る。ICOMのコマンド送受信（`sendAndSyncRecv`）やバンド制御は共通化せず、YAESU側は `TransceiverYaesuSerialIo` で新規に用意する。
4. 設定画面は、既にメーカー選択・機種選択・ボーレート選択が機種定義ファイル（`transceiver.json`）駆動のため、定義追加とCI-V欄の出し分け、ストップビット対応のみを行う。

### 0.1 既存実装の調査で分かった前提（設計に影響する点）

- `transceiver.json`（機種定義）は **起動ごとに初期データで上書き**される（`AppConfigUtil.initTransceiverJson`）。定義の追加は既存ユーザーにも自動反映される。
- `transceiver.json` には YAESU(`makerId=2`)に FT-847（`transceiverId=1`）が既にあるが、コントローラ未実装のためYAESUを選ぶと `InvalidArgumentError` になる状態。
- `SerialComm` は **ストップビットが 1 固定**（`createSerialPort`）。FT-897は**ストップビット2**が必須のため、対応が必須。
- 設定画面のCI-Vアドレス欄は現状「ICOM以外は `disabled`」で、非表示ではない。接続テスト（`ApiSirial.tryOpen`→`SerialTrialService.open`→`SerialComm`）も別経路でシリアルを開くため、ストップビットの受け渡しが必要。
- 20261010-207-tx-skip の改修により、**無線機→RSTのTx周波数通知はレンダラ側で常に破棄**される。そのため、YAESUコントローラは無線機側のTx周波数・Txモードを読み取る必要がない（FT-897でTx VFOの読み取りにVFO切替が必要な問題が回避できる）。ただしRx側の周波数・モードは読み取りが必要。

## 1. 全体構成

```
TransceiverControllerBase（既存・変更なし）
  └ TransceiverSerialControllerBase（既存・stopBits引数を追加）
       ├ TransceiverIcomController（既存・変更なし）
       └ TransceiverYaesuController（新規）… スケジューリング／状態／待機制御
              │ uses
              ├ TransceiverYaesuState（新規）…… RST側の要求値・無線機側の取得値の保持
              ├ TransceiverYaesuSerialIo（新規）… 送信、応答待ち（排他）、フレーム分割
              └ TransceiverYaesuProtocol（新規・interface）
                    ├ TransceiverYaesuFt991Protocol（新規）
                    │     ├ TransceiverYaesuFt991CmdMaker（新規）
                    │     └ TransceiverYaesuFt991RecvParser（新規）
                    └ TransceiverYaesuFt897Protocol（新規）
                          ├ TransceiverYaesuFt897CmdMaker（新規）
                          └ TransceiverYaesuFt897RecvParser（新規）
```

- YAESU用の新規ファイルは `src/main/service/transceiver/controller/yaesu/` に配置する（ファイル名は `TransceiverYaesu*`）。`controller/` 直下のファイル数が増えすぎるのを避けるためで、既存のICOMファイルは移動しない。テストも `src/__tests__/main/service/transceiver/controller/yaesu/` に配置する。
- フェーズ1で追加する共通部品（`TransceiverLock`、`TransceiverWaitTimer`）は `controller/` 直下に配置する（ICOMとYAESUの両方が使うため）。
- YAESUコントローラは、`TransceiverLock`（排他）と `TransceiverWaitTimer`（無線機側操作後の送信一時停止）を合成して使う。

## 2. 用語・RSTと無線機の対応

| RST側 | 意味 | FT-991 | FT-897 |
| --- | --- | --- | --- |
| Rx（downlink） | 受信周波数 | VFO-A | 接続時に表示されているVFO（以降「Rx VFO」） |
| Tx（uplink） | 送信周波数 | VFO-B | もう一方のVFO（以降「Tx VFO」） |
| サテライトモードON | 衛星運用 | SPLIT ON（`FT3;`、VFO-Bで送信） | SPLIT ON（`02`） |
| サテライトモードOFF | 通常運用 | SPLIT OFF（`FT2;`、RSTのuplinkとして扱う） | SPLIT OFF（`82`、同左） |

- ICOMと同様に、**サテライトモードOFF時は、無線機から受信した周波数／モードをアップリンク（uplink）として通知する**（`procRecvFreqData`/`procRecvOpeMode`の挙動に合わせる）。サテライトモードON時は、Rxの値をダウンリンク（downlink）として通知する。
- FT-897は現在のVFO(A/B)を取得するコマンドがない。そこで **「接続時に表示されているVFOをRx VFOとみなす」** ことで、A/Bを区別せずに運用できる（RSTにとってはRxとTxが区別できればよく、A/Bの別は問題にならない）。ユーザーが運用中にVFOを手動で切り替えた場合はRx/Txが入れ替わるため、制限事項としてドキュメントに記載する（§9）。
- FT-897のSPLIT動作（表示中のVFOで受信し、もう一方のVFOで送信）は実機で確認する（§10の確認事項）。

## 3. 共通コンポーネントの設計

### 3.1 `TransceiverYaesuProtocol`（interface、新規）

機種別のワイヤレベル処理を抽象化する。**VFO切替などの機種固有の手順は各Protocol内部に閉じ込め**、Controllerは「Rx/Txの周波数・モードを設定／Rxを読み取る」という論理操作のみを呼び出す。

```ts
/** バンド（RST側の論理的な区別） */
export type YaesuBand = "RX" | "TX";

/** 無線機から読み取った（または通知された）周波数・モード */
export type YaesuRxStatus = { freqHz: number | null; modeText: string | null };

/** 自動通知（AI）の解析結果 */
export type YaesuNotify =
  | { type: "FREQ"; band: YaesuBand; freqHz: number }
  | { type: "MODE"; band: YaesuBand; modeText: string };

export interface TransceiverYaesuProtocol {
  /** 無線機側の操作を自動通知（AI）で受け取れるか */
  readonly supportsAutoInfo: boolean;

  /** 接続直後の初期化（AI有効化、VFO/SPLITの初期状態設定など） */
  init(io: TransceiverYaesuSerialIo): Promise<void>;
  /** 切断前の終了処理（AI無効化など） */
  term(io: TransceiverYaesuSerialIo): Promise<void>;

  /** 周波数を設定する。成功時true */
  setFreq(io: TransceiverYaesuSerialIo, band: YaesuBand, freqHz: number): Promise<boolean>;
  /** 運用モード（RSTのモード名）を設定する。成功時true */
  setMode(io: TransceiverYaesuSerialIo, band: YaesuBand, modeText: string): Promise<boolean>;
  /** SPLIT（サテライトモード）を設定する */
  setSplit(io: TransceiverYaesuSerialIo, isOn: boolean): Promise<boolean>;
  /** Tx側のCTCSSトーンを設定する（toneHz=nullでOFF） */
  setTone(io: TransceiverYaesuSerialIo, toneHz: number | null): Promise<boolean>;

  /** Rx側（Rx VFO）の周波数・モードを読み取る。失敗時はnull */
  readRx(io: TransceiverYaesuSerialIo): Promise<YaesuRxStatus | null>;

  /** 受信バッファから1フレームずつ切り出す（FT-991：`;`区切り、FT-897：応答長固定のため応答待ち側で処理） */
  extractFrames(buffer: Buffer): { frames: Buffer[]; rest: Buffer };
  /** 自動通知フレームを解析する（通知非対応の機種は空配列） */
  parseNotify(frame: Buffer): YaesuNotify[];
}
```

- ストップビットはProtocolに持たせず、**機種定義（`transceiver.json` の `stopBits`）から取得する**（§6.3）。`transceiver.json` は起動ごとにアプリ同梱の初期データで上書きされるため、アプリのバージョンとずれることはない。

### 3.2 `TransceiverYaesuSerialIo`（新規）

ICOMの `sendAndSyncRecv` 相当の送受信処理を、Controllerから切り出したクラス。

- `send(bytes: Uint8Array): Promise<boolean>`：応答を待たない送信（`TransceiverSerialControllerBase.sendSerial`を使用）。
- `sendAndRecv(bytes, options: { expectBytes?: number; expectPrefix?: string; timeoutMs: number }): Promise<Buffer | null>`：送信して応答を待つ。タイムアウト時は `null`。
  - FT-991（`;`終端）：`expectPrefix`（例：`"FA"`）で始まるフレームが来たら応答とみなす。それ以外のフレームは自動通知として `onNotify` に回す。
  - FT-897（固定長）：`expectBytes`（`03`なら5、`F7`/`E7`なら1）に到達したら応答とみなす。
- `@synchronized()` により、送受信は常に1件ずつ（ICOMの`sendAndSyncRecv`と同様）。
- 受信データは `onRecv(data)` で受け取り、`recvBuffer` に追加→`protocol.extractFrames` で切り出す。応答待ち中でないフレームは `onNotify(frame)` へ渡す（FT-991のAI通知）。
- コマンド間の最小間隔（`interCommandDelayMs`、FT-897向け）をオプションで持つ。初期値はFT-897=50ms（実機で調整、§10）、FT-991=0ms。

### 3.3 `TransceiverYaesuState`（新規）

ICOMの `TransceiverIcomState` から、YAESUでは不要な概念（メイン/サブ切替 `isMain`、データモード分離、Rx読み取り待ち `isRxReadPending`）を除いた簡素版。

- 保持する値：
  - `isSatelliteMode`
  - RST→無線機の要求値：`reqRxFreqHz` / `reqTxFreqHz` / `reqRxMode` / `reqTxMode`（RSTのモード名のまま保持）
  - 要求の更新フラグ：`isReqRxFreqUpdate` / `isReqTxFreqUpdate` / `isReqRxModeUpdate` / `isReqTxModeUpdate`
  - 無線機→RSTの取得値：`recvRxFreqHz`、`currentRxMode`、`currentTxMode`
- メソッド：`setReqRxFreqHz(freq, isForce)` / `setReqTxFreqHz` / `setReqRxMode(mode, isForce)` / `setReqTxMode` / `setRecvRxFreqHz` / `isRxUpdate()` / `isTxUpdate()` / `resetAll()`。
- 仕様はICOMの同名メソッドに合わせる（同一値は `isForce` でない限り更新フラグを立てない）。
- Rx読み取り待ち（`isRxReadPending`）を持たない理由：ICOMでは「Tx（サブ）のダイヤル操作でRxが連動変化し、Rxがトランシーブ通知されない」ために必要だったが、YAESUではTx VFOの変更はRxに影響しない（かつTx周波数の通知は破棄される）ため不要。

### 3.4 `TransceiverYaesuController`（新規）

`TransceiverSerialControllerBase` を継承。ICOMコントローラ（`TransceiverIcomController`）と同じ外部インターフェース・同じ制御の流れを提供する。

#### start()

1. `openSerial()`（`stopBits` は機種定義から取得して渡す。§6.1、§6.3）。
2. `protocol.init(io)`。
3. `setSatelliteMode(false)`（SPLIT OFF）、`readRx` で初期の周波数・モードを取得して通知する（ICOMの`initTranceiver`相当）。
4. `autoTrackingIntervalSec` 間隔で定期処理（§3.4.1）を開始する。

#### 3.4.1 定期処理（ICOMと同様に `isProcessing` ロックで多重実行を防止）

```
ループ（autoTrackingIntervalSec間隔）:
  1. 無線機接続が準備完了でない → シリアル未接続を通知し、タイマー停止
  2. 前回処理中 → スキップ
  3. 無線機側ダイヤル操作の待機中（isWaitSendFreq）:
       - FT-991（AI）：送信せず終了（通知受信で待機タイマーが更新される）
       - FT-897（ポーリング）：送信は行わず、readRx のみ実行し、変化があれば待機を延長（§3.4.3）
  4. Rxの更新要求あり → Rx周波数、Rxモードを設定（setFreq / setMode、band="RX"）
  5. サテライトモードON かつ Txの更新要求あり → Tx周波数、Txモードを設定（band="TX"）
  6. 更新要求がない場合のみ（FT-897のみ）、readRx でRx周波数・モードを取得して変化を検知（§3.4.3）
```

- 設定コマンドを送った直後は、読み取りで同じ値が返る前提で読み取りは行わない（ICOMの「RST側から設定した直後は取得しない」と同じ方針）。
- FT-991のTx側は、周波数は `FB`で直接設定、**モード・トーンはVFO入替（`SV;`）方式**（§4.2）のため、Txモード・トーンが変化したときのみ入替する。周波数の更新のみで入替しない。
- 設定が失敗した場合（`setFreq`/`setMode` が false）、更新フラグは下ろさず次周期で再試行する。リトライは最大3回（`MAX_CMD_SEND_RETRY_COUNT`、ICOMと同値）。

#### 3.4.1.1 起動時の応答タイムアウト判定

ICOMの `checkRecvTimeout` と同様に、接続直後（`RECV_TIMEOUT_SEC_FOR_BOOT`＝2秒）に無線機から一度も応答（FT-991はAI通知含む、FT-897は`03`の応答）がない場合は、ボーレートの設定違いや無線機の電源オフとみなし、以下を行う。

- 定期処理を停止し、シリアルをクローズする。
- `freqCallback` / `modeCallback` に失敗（`SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT`）を通知する。この通知処理は、フェーズ1で基底クラスの共通メソッド `notifyRecvTimeoutError()` に切り出したものを使う（§12）。

#### 3.4.2 FT-991：AI通知の処理（無線機側操作の検知）

- `io.onNotify` で `protocol.parseNotify(frame)` を呼び、結果を処理する。
  - `FREQ`/`MODE` 通知 → ICOMの`procRecvFreqData`/`procRecvOpeMode`相当の処理でRSTへ通知（`freqCallback`/`modeCallback`）。
  - 通知を受けたら `isDopplerShiftWaitingCallback(true)` を呼び、`startTransceiveWaitTimer(TRANSCEIVE_WAIT_MS)`（周波数）／`TRANSCEIVE_MODE_WAIT_MS`（モード）で送信を一時停止する（ICOMと同じ定数を使用）。
- **RST自身の設定による通知の除外**：RSTがCATで設定した周波数・モードが、AIで通知として戻ってくるかは実機で確認が必要（§10）。戻ってくる場合に備え、「直近にRSTが設定した値と同一の通知は、一定時間（500ms）無視する」判定をStateに持たせる（実機で戻ってこないと確認できれば削除可）。
- **VFO入替中（§4.2）の通知は全て除外する**（入替中フラグON中と、解除後500ms間）。
- 通知対象は **Rx側（VFO-A）のみ**（`FA`、`MD0`、`IF`）を処理し、VFO-B（Tx）の通知（`FB`、`OI`）は破棄する（レンダラ側でも破棄されるため）。`?;`（エラー応答）は警告ログのみ。

#### 3.4.3 FT-897：ポーリングによる検知

- `readRx`（`03`コマンド）で取得した周波数・モードを、`state.recvRxFreqHz` / `state.currentRxMode` と比較する。
- **変化あり**（＝無線機側のダイヤル／モード操作）：ICOMのトランシーブ受信と同様に、`freqCallback`/`modeCallback` で通知し、`isDopplerShiftWaitingCallback(true)` ＋ `startTransceiveWaitTimer`。
- **変化なし**かつ待機中でない場合：何もしない。待機中に変化が止まった場合は、待機タイマー満了で自動的に再開する（ICOMと同じ）。
- 周波数分解能：FT-897のCAT周波数は10Hz単位。RST側から設定した値は10Hz単位に丸められるため、比較は10Hz単位に丸めた値で行う（丸めによる誤検知を防止）。

#### 3.4.4 その他メソッド

| メソッド | 処理 |
| --- | --- |
| `stop()` | 定期処理停止、`protocol.term(io)`（AI無効化）、待機タイマー停止、シリアルクローズ |
| `isReady()` | シリアルがオープン中か |
| `initAutoOn(txFreqHz, rxFreqHz, txMode, rxMode, toneHz)` | ロック取得後、Rx周波数／モード、サテライトモードONならTx周波数／モード、およびTxトーン設定を送信（ICOMの`initAutoOnExec`相当。バンド入れ替えは行わない） |
| `autoOff()` | ロック取得後、トーンOFF（`setTone(null)`） |
| `setFreq(model, isForce)` / `setMode(model)` | ICOM同様、`state` に要求値を保持するのみ（送信は定期処理） |
| `setSatelliteMode(isOn)` | `protocol.setSplit`。完了後にRxの周波数・モードを読み取り通知（ICOMの挙動に合わせる） |

- `initAutoOn` のトーン：Txモードが FM / FM-D の場合のみトーン設定を行い、それ以外はトーンOFF（ICOMの`setupTone`と同じ条件）。
- バンド入れ替え（ICOMの`switchBandIfNeed`）：FT-991はVFO-A/Bでバンドを跨げる（Rx=430MHz帯、Tx=145MHz帯など）、FT-897もVFOごとに周波数設定できるため、**不要**。

## 4. FT-991 Protocol

### 4.1 コマンド（`TransceiverYaesuFt991CmdMaker`）

ASCII、`;`終端。マニュアル（`FT-991_CAT_OM_J.pdf` p.2〜18）で確認済み。コマンドは英字2文字＋固定桁数の数字パラメータ＋`;`。

| 論理操作 | コマンド | 備考 |
| --- | --- | --- |
| Rx周波数設定 | `FA` + 9桁Hz + `;`（例：`FA145800000;`） | VFO-A。範囲 30kHz〜470MHz。範囲外は送信せず警告ログ |
| Tx周波数設定 | `FB` + 9桁Hz + `;` | VFO-B。範囲は同上 |
| Rx（VFO-A）の周波数・モード読み取り | `IF;` → `IF` + 3桁(メモリCH) + 9桁(周波数) + 5桁(クラリファイア) + ... + `;`（全28文字） | 周波数（P2）とモード（P6）を1コマンドで取得できる。`FA;`/`MD0;`の2コマンドより通信量が少ない |
| Rx モード設定 | `MD0` + P2(1桁) + `;` | `MD0`はMAIN RXのみ |
| SPLIT ON / OFF | `FT3;` / `FT2;` | `FT3`=VFO-Bで送信（SPLIT）、`FT2`=VFO-Aで送信。専用の`ST`コマンドはない |
| VFO入替 | `SV;` | VFO-AとVFO-Bの内容を入れ替える |
| 送信状態読み取り | `TX;` → `TX` + P1 + `;` | P1：`0`=受信、`1`=CAT送信中、`2`=本体で送信中。`0`以外は送信中と判断 |
| AI ON / OFF | `AI1;` / `AI0;` | |
| CTCSS方式 | `CT0` + P2 + `;` | P2：`2`=CTCSS ENC、`0`=OFF |
| CTCSSトーン番号 | `CN00` + 3桁番号 + `;`（P1=`0`、P2=`0`(CTCSS)、P3=3桁） | 番号は `Constant.Transceiver.ToneFrequency` のインデックス（50種で同じ並び、`000`〜`049`）。周波数ではなく番号で指定する |

- **Setコマンドに応答はない**。エラー時のみ `?;` が返る。そのため、Setコマンドは `io.send`（応答待ちなし）で送信し、後続の `?;` 受信（`onNotify` 経由）を警告ログとして出力する。重要な設定（Rx周波数等）は、次周期の読み取りで値が反映されていることを確認する（ICOMの「設定直後の読み取りを省略」とは異なり、FT-991は応答がないため、設定後の最初の読み取りで確認する）。
- モードのマッピング（`TransceiverYaesuFt991CmdMaker.modeTextToCode` / `RecvParser.codeToModeText`）：

  | RST | MD | 備考 |
  | --- | --- | --- |
  | LSB / USB | `1` / `2` | |
  | CW | `3`（CW-U） | 受信時 `7`（CW-R）もCWとして扱う |
  | FM | `4` | 受信時 `B`（FM-N）もFMとして扱う |
  | AM | `5` | 受信時 `D`（AM-N）もAMとして扱う |
  | RTTY | `6`（RTTY-LSB） | 受信時 `9`（RTTY-USB）もRTTY |
  | LSB-D / USB-D / FM-D | `8` / `C` / `A` | DATA-LSB / DATA-USB / DATA-FM |
  | DV | （設定不可） | 受信時 `E`（C4FM）をDVとして通知 |

### 4.2 Tx（VFO-B）のモード・トーン設定：VFO入替方式

`MD0` はMAIN RX（VFO-A）のモードのみ設定できる（VFO-Bのモードを設定するコマンドはない）。そのため、Tx側のモード、およびトーン（`CT0`/`CN0`はVFO-A側の設定である可能性が高い。§10-9）の設定は、**VFOを入れ替えてVFO-A側で設定し、元に戻す**。

```
setMode(band="TX") / setTone(...) の処理:
  1. TX; で送信中でないことを確認（送信中なら何もせず false を返す）
  2. 入替中フラグON（AI通知を除外する期間の開始）
  3. SV;（VFO-AとVFO-Bを入替）… 入替後、VFO-A＝元のVFO-B（Tx側）
  4. MD0x;（Txモード）／ CT0x; CN00xxx;（トーン）
  5. SV;（元に戻す）… VFO-A＝元のVFO-A（Rx側）
  6. 入替中フラグOFF（一定時間（500ms）は通知除外を継続）
```

- FA/FB の周波数設定（`setFreq`）は、`FA`/`FB`で直接設定でき、VFO入替は不要。
- 入替中にAIが出力する `FA`/`FB`/`IF`/`MD0` などの通知は、RSTの操作に起因するものとして**除外**する（無線機側のダイヤル操作と誤認しない）。
- 入替中、受信周波数は一時的にVFO-B（Tx）の周波数になる（数十〜数百ms）。運用中の頻繁な入替は避けるため、**Txモード・トーンが変化したときのみ**実施する（周波数のみの更新では入替しない）。
- 入替後に `OI;`（VFO-Bの状態）を読み取り、設定したTxモードが反映されていることを確認する（確認用。実機で動作が確認できれば省略可）。

### 4.3 `init` / `term`

- `init`：`AI1;` 送信（以降、無線機側操作が自動通知される）、`FT2;`（SPLIT OFF）。
- `term`：`AI0;` 送信。

### 4.4 受信フレーム

- `extractFrames`：`;` 終端で切り出す。応答待ちでないフレームは `parseNotify` で解析する。
  - 解析対象：`FA`（VFO-A周波数）、`MD0`（モード）、`IF`（VFO-A：周波数＋モード）、`?;`（エラー）。
  - 破棄：`FB`、`OI`（VFO-B）、`FT` その他。
- `readRx`：`IF;` を送信し、`IF` 応答から周波数（P2）とモード（P6）を取得する。
- **AI通知は受信直後に複数のフレームがまとまって届く**場合があるため、`;` で分割して1フレームずつ処理する。

## 5. FT-897 Protocol

### 5.1 コマンド（`TransceiverYaesuFt897CmdMaker`）

マニュアル（`ft-897d_j.pdf` p.56〜57）で確認済み。全て5バイト（DATA1〜DATA4＝P1〜P4、DATA5＝コマンド）。

| 論理操作 | バイト列 | 備考 |
| --- | --- | --- |
| 周波数設定 | `P1 P2 P3 P4 01` | BCD（10Hz単位）。`makeSetFreq(hz)`：`hz/10` を8桁BCDに（例：439.70MHz→`43 97 00 00 01`） |
| モード設定 | `P1 00 00 00 07` | P1：下表 |
| VFO切替 | `00 00 00 00 81` | トグル |
| SPLIT ON/OFF | `00 00 00 00 02` / `82` | |
| トーン方式 | `P1 00 00 00 0A` | `4A`=CTCSS ENC ON、`8A`=OFF |
| トーン周波数 | `P1 P2 P3 P4 0B` | P1P2＝送信用（BCD、0.1Hz単位）、P3P4＝受信用（同じ値を設定） |
| 周波数・モード読み取り | `00 00 00 00 03` | 応答5バイト |
| 送信ステータス読み取り | `00 00 00 00 F7` | 応答1バイト（bit7 PTT：0=送信中） |

- 周波数の丸め：`Math.round(hz / 10)` を8桁BCDへ。入力範囲外（0以下、1GHz以上）は送信しない。
- モードのマッピング：

  | RST | 送信（P1） | 受信時の読み替え |
  | --- | --- | --- |
  | LSB | `00` | `00`→LSB |
  | USB | `01` | `01`→USB |
  | CW | `02` | `02`→CW、`03`(CWR)→CW |
  | AM | `04` | `04`→AM |
  | FM | `08` | `08`→FM、`88`(FMN)→FM、`06`(WFM)→FM |
  | LSB-D / USB-D | `0A`（DIG） | `0A`→**USB-D**（※RST側で直前に設定した値がLSB-Dなら維持。§10-2） |
  | FM-D | `0C`（PKT） | `0C`→FM-D |
  | RTTY / DV | 設定不可（警告ログを出して無視） | － |

- **DIG/PKTの調査結果**（`ft-897d_j.pdf` p.17、p.45、p.47、p.49、p.52。§10-2の提案の根拠）：
  - **DIG**：デジタル運用モード。運用中の側波帯と方式は、メニュー`No-038 DIG MODE`（`RTTY-L`/`RTTY-U`/`PSK-31L`/`PSK-31U`/`USER-L`/`USER-U`、工場出荷時`RTTY-L`）で決まる。説明に「設定したモード（LSBまたはUSB）で送受信を行います」とあり、`-L`＝LSB側、`-U`＝USB側。CATの`07`でDIG（`0A`）を選んでも、LSB/USBの別は指定できない。`USER-L`/`USER-U`ではキャリアポイントを`No-039 DIG SHIFT`、周波数表示のオフセットを`No-036 DIG DISP`で調整する。データ入力レベルは`No-037 DIG GAIN`。
  - **PKT**：パケット運用モード（FM系、1200bps/9600bps）。速度はメニュー`No-073 PKT RATE`、入力レベルは`No-071 PKT 1200`/`No-072 PKT 9600`。ステップ幅はFMと同じ。
  - そのため、RSTの `USB-D` / `LSB-D` は、どちらも `DIG`（`0A`）を送信し、**側波帯は無線機のメニュー`No-038`の設定に依存する**（USB-Dを使うなら`USER-U`等の`-U`、LSB-Dを使うなら`USER-L`等の`-L`にあらかじめ設定しておく）。RSTは側波帯の不一致を検知できないため、制限事項（§9）と設定画面の注記に記載する。`FM-D` は `PKT`（`0C`）に1対1で対応する。
  - DIG受信時（無線機側で操作された場合）は側波帯を判別できないため、RSTが直前に要求したLSB-D/USB-Dを維持し、無ければUSB-Dとして扱う。
  - SPLITの前提（§10-4）の裏付け：マルチファンクション`Q.SPL`の説明に「VFO-Aをディスプレイに表示し、VFO-Bの周波数はVFO-Aより5kHz高い周波数に設定され、VFO-Aで受信VFO-Bで送信を行います」とあり、**表示中のVFOで受信し、もう一方のVFOで送信する**動作が確認できる。

### 5.2 VFO制御（Protocol内部に閉じ込める）

FT-897は「現在表示中のVFOの周波数・モードの設定／読み取り」のみが可能なため、Protocol内部に `isRxVfoDisplayed: boolean`（初期値 true：接続時に表示中のVFO＝Rx VFO）を保持する。

- `ensureVfo(io, band)`：現在の表示が目的のバンドと異なる場合、`81`（VFO切替）を送信して `isRxVfoDisplayed` を反転する。
- `setFreq/setMode(band="RX")`：`ensureVfo("RX")` → 設定。
- `setFreq/setMode(band="TX")`：**送信中（`F7`でPTT ON）でないことを確認**し、`ensureVfo("TX")` → 設定 → `ensureVfo("RX")` で**必ずRx VFOに戻す**（Rxの読み取り・ユーザー操作の対象を常にRx VFOにしておくため）。送信中の場合は設定をスキップし、`false` を返して次周期に再試行する（送信中にVFOを切り替えると、送信周波数が変わってしまうため）。
- `setTone`：Txに対する設定のため、`ensureVfo("TX")` → `0A`/`0B` → `ensureVfo("RX")`（同様に送信中はスキップ）。
- `setSplit(true)`：`02`、`setSplit(false)`：`82`。
- `readRx`：`ensureVfo("RX")` → `03`。応答5バイトを `TransceiverYaesuFt897RecvParser.parseFreqAndMode` で解析。
- 例外が発生した場合や応答タイムアウトで `81` が不確実になった場合の自己修復：`81` 送信後、次に `readRx` で周波数が期待値（Rx VFOの値）と大きく異なる場合は、VFOがずれたと判断して警告ログを出す（無線機側のVFO手動切替の可能性）。自動修復は行わない（誤動作防止）。
- `init`：何も送信しない（VFOは変更しない）。

### 5.3 受信フレーム

- 応答は固定長（`03`=5バイト、`F7`/`E7`=1バイト）。`TransceiverYaesuSerialIo` が `expectBytes` で受け取る。
- 自動通知はなく、`extractFrames` は未使用（応答待ち外の受信データは破棄）。`supportsAutoInfo=false`。

### 5.4 周波数応答の解析（`TransceiverYaesuFt897RecvParser`）

- `parseFreqAndMode(buf)`：DATA1〜DATA4をBCDとして8桁→×10Hz、DATA5をモードコード。例：`43 97 00 00 01` → 439,700,000Hz / USB。
- 不正値（BCDでない桁など）は `null` を返す。

## 6. 既存コードの変更

### 6.1 `SerialComm`（`src/main/common/SerialComm.ts`）

- フェーズ1（§12）で追加した末尾引数 `options?: { stopBits?: 1 | 2 }` を使用する（ここでは変更なし）。

### 6.2 `TransceiverSerialControllerBase`

- `openSerial(stopBits: 1 | 2 = 1)` に引数を追加し、`new SerialComm(..., { stopBits })` に渡す。

### 6.3 接続テスト（シリアル試行）へのストップビット受け渡し

接続テストは `ApiSirial.tryOpen`→IPC `openSerialPortTry`→`SerialTrialService.open`→`SerialComm` の経路で、現状ストップビットを渡していない。

- 機種定義に `stopBits` を持たせる：`AppConfigTransceiverDevice`（`src/common/model/AppConfigTransceiverModel.ts`）に `public stopBits: 1 | 2 = 1`（省略時1）を追加し、`transceiver.json` のFT-991とFT-897に `"stopBits": 2` を指定する（§6.6。マニュアルでどちらもストップビット2と確認済み）。
- 無線機コントローラは `AppConfigUtil.findTransceiverDeviceById(makerId, transceiverId).stopBits` を、接続テストは設定画面で取得済みの機種定義（`ApiAppConfig.getTransceiverConfig()`）から、それぞれ取得する。
- `ApiSirial.tryOpen(comName, baudRate, stopBits = 1)`、`preload.ts`（`openSerialPortTry`）、`initializeIpcEvent.ts`（`openSerialPortTry`）、`SerialTrialService.open` に `stopBits` 引数を追加（末尾・省略可）。
- `useTransceiverTestConnect.ts`：選択中の機種の `stopBits` を渡す。
- ローテータ側の呼び出し（`useRotatorTestConnect.ts`）は変更なし（既定値1）。

### 6.4 `Constant`（`src/common/Constant.ts`）

```ts
public static readonly TransceiverId = class {
  // ICOM IC-910
  static readonly ICOM_IC910 = "4";
  // YAESU FT-991 / FT-991A
  static readonly YAESU_FT991 = "2";
  // YAESU FT-897 / FT-897D
  static readonly YAESU_FT897 = "3";
};
```

- `TransceiverId` は「メーカー内で一意」な値（`transceiver.json`の`transceiverId`）であり、ICOM(`"1"`〜`"4"`)とYAESU(`"1"`〜)で数値が重複するため、**必ず `makerId` と組み合わせて判定する**（コメントに追記）。

### 6.5 `TransceiverControllerFactory`

YAESU分岐を有効化し、機種IDからProtocolを選択する。

```ts
case Constant.Transceiver.MakerId.YAESU:
  AppMainLogger.info(`YAESUの無線機が指定されました。`);
  return new TransceiverYaesuController(transceiverConfig, this.selectYaesuProtocol(transceiverConfig));
```

- `selectYaesuProtocol`：`transceiverId` が `YAESU_FT991` → `TransceiverYaesuFt991Protocol`、`YAESU_FT897` → `TransceiverYaesuFt897Protocol`、それ以外（FT-847含む）は `InvalidArgumentError`（`無効な無線機機種が指定されました。...`）。

### 6.6 機種定義 `resources/data/init-data/transceiver.json`

YAESU(`makerId=2`)の devices を以下にする。

```json
{ "transceiverId": "2", "deviceName": "FT-991 / FT-991A", "civAddress": "", "stopBits": 2 },
{ "transceiverId": "3", "deviceName": "FT-897 / FT-897D", "civAddress": "", "stopBits": 2 }
```

- FT-847（`transceiverId="1"`）は未対応のため**削除する**（§10-3で確認）。

### 6.7 設定画面（`TransceiverConn.vue` ほか）

- `TransceiverConn.vue`：CI-Vアドレス欄を `v-if="form.makerId === Constant.Transceiver.MakerId.ICOM"` で**ICOM選択時のみ表示**に変更（現状は `disabled`）。ラベル・入力欄を含む `div` ごとの出し分け。
- ボーレート選択（`BorateSelect`）はそのまま（YAESU用の選択肢は既存の `4800/9600/19200/38400` に含まれる）。CATレートの設定はユーザーが無線機のメニューと合わせる。
- 無線機側のメニュー設定の案内：設定画面に説明文（注記）を追加する（`I18nMsgs`に追加）。FT-897は `No-020 CAT/LIN/TUN=CAT`、`No-019 CAT RATE`、FT-991は `031 CAT RATE`（USBケーブル使用時。RS-232C使用時は `029 232C RATE`）。いずれも無線機側のメニューの設定値とRSTのボーレート設定を一致させる必要がある（FT-991の工場出荷時は4800bps）。
- `useTransceiverTestConnect.ts`、`useTransceiverCtrl.ts`、`TransceiverSetting.vue` は、CI-Vアドレスの扱いが既に「ICOMのみ」で処理されているため変更不要（確認済み）。
- `AppConfigValidator`：CI-Vアドレスは `zod.string()`（必須チェックなし）のため、YAESU選択時（空文字）でも通る。変更不要。

## 7. ログ・エラー処理

- 応答タイムアウト、`?;`エラー、VFOずれ疑い、送信中スキップは `AppMainLogger.warn`、設定・読取の流れは `debug` で出力（ICOMと同じ粒度）。
- シリアル未接続時は、ICOM同様 `fireSerialNotConnectedMsg()`（`SERIAL_NOT_CONNECTED_TRANSCEIVER`）でレンダラへ通知し定期処理を停止する。

## 8. テスト設計

`src/__tests__/main/service/transceiver/controller/` 配下に、既存ICOMテストと同じ命名（`クラス名/クラス名_メソッド名.test.ts`）で追加する。

| 対象 | ケース |
| --- | --- |
| `TransceiverYaesuFt991CmdMaker` | 周波数コマンド生成（9桁ゼロ詰め、VFO-A/B）、モード変換（全RSTモード、未対応モード）、トーン番号（`ToneFrequency`の各端・範囲外） |
| `TransceiverYaesuFt991RecvParser` | `;`区切りのフレーム切り出し（分割受信、複数フレーム連結、不完全フレームの持ち越し）、`FA`/`FB`/`MD0`の解析、モード読み替え（CW-L→CW等）、エラー応答`?;` |
| `TransceiverYaesuFt897CmdMaker` | BCD変換（10Hz単位、丸め、境界値、範囲外）、モード変換、トーン周波数のBCD（0.1Hz単位）、固定コマンド（VFO切替、SPLIT等） |
| `TransceiverYaesuFt897RecvParser` | `03`応答解析（正常、BCD不正、長さ不正）、モード読み替え（`03`/`88`/`06`/`0A`/`0C`）、`F7`のPTT判定 |
| `TransceiverYaesuFt897Protocol`（IOをモック） | TX設定時にVFO切替(`81`)が「Tx→設定→Rx」の順で送られる、送信中はスキップしてfalse、`readRx`時にRx VFOへ戻る |
| `TransceiverYaesuState` | ICOM Stateと同様：`setReqRxFreqHz`/`setReqTxFreqHz`（同一値は更新しない、`isForce`）、`setReqRxMode`/`setReqTxMode`、`isRxUpdate`/`isTxUpdate`、`resetAll` |
| `TransceiverControllerFactory` | YAESU＋FT-991/FT-897→対応Controller、YAESU＋未対応機種→`InvalidArgumentError` |
| `TransceiverYaesuFt991Protocol`（IOモック） | Tx（VFO-B）のモード設定が `TX;`確認→`SV;`→`MD0x;`→`SV;` の順で送られる、送信中はスキップしてfalse、入替中のAI通知が除外される、Txモード・トーンが変化していない場合は入替しない、範囲外周波数（470MHz超）は送信しない |
| `transceiver.json` | FT-991とFT-897のみ `stopBits=2`、他は省略（1）であること（定義ファイルの内容テスト） |

フェーズ1で追加する部品（`TransceiverLock`、`TransceiverWaitTimer`、`SerialComm`のstopBits）のテストは §12.4 を参照。

- 実機確認（FT-991 / FT-897）はタスクリスト末尾の手順に従い手動で実施する（Controller本体の統合動作は実機で確認する方針）。

## 9. 制限事項（ドキュメントに記載する内容）

- FT-897：運用中にユーザーがVFOを手動で切り替えると、RSTのRx/Txの対応がずれる。RSTでの運用中はVFOの切替操作を行わない。
- FT-897：Txの周波数・モードは無線機から読み取らない（RST→無線機の一方向）。
- FT-897：送信中（PTT ON）はTx側の設定を行わない（次周期に再試行する）。
- FT-897：デジタル系モードのうち、LSB-D/USB-DはDIG、FM-DはPKTに割り当てる。**DIGの側波帯（LSB/USB）は無線機のメニュー`No-038 DIG MODE`（`USER-L`/`USER-U`等）で決まり、RSTからは指定できない**。USB-Dで運用する場合は`-U`、LSB-Dの場合は`-L`にあらかじめ設定しておく（RSTは不一致を検知できない）。PKTの速度（1200/9600bps）はメニュー`No-073 PKT RATE`で設定する。RTTY/DVは設定できない。
- FT-991：AI通知を使用するため、接続中は無線機側の周波数・モード変更が自動的にRSTへ反映される。
- FT-991：周波数範囲は30kHz〜470MHz。1200MHz帯の衛星運用には対応できない（範囲外の周波数は設定せず、警告ログを出力する）。
- FT-991：Tx側のモード・トーンを変更する際、VFOを一時的に入れ替える（数十〜数百ms）。この間、受信周波数が一時的に変わる。送信中は入れ替えを行わない。

## 10. 確認事項（実装前・実装中に確認する項目）

| # | 内容 | 推奨 | 確認方法 |
| --- | --- | --- | --- |
| 1 | ~~FT-991のCATコマンド仕様の最終確認~~ **確認済み**（`FT-991_CAT_OM_J.pdf`）。SPLITは`ST`ではなく`FT2;`/`FT3;`、トーンは`CT0`＋`CN0`（番号指定）、ストップビット2、AIの対象は`FA`/`FB`/`MD`/`IF`/`OI`等、Setに応答なし（エラー時`?;`）。VFO-Bのモードは直接設定できず`SV;`入替が必要。本書§4に反映済み | － | － |
| 2 | FT-897のUSB-D/LSB-D→DIG、FM-D→PKT の割り当てでよいか。DIG受信時の読み替え先 | **確認済み・承認済み**：LSB-D/USB-D→DIG、FM-D→PKT。DIG受信はRSTが直前に要求したLSB-D/USB-Dを維持し、無ければUSB-D。DIGの側波帯（LSB/USB）は無線機のメニュー`No-038 DIG MODE`（`-L`/`-U`）で決まりCATでは指定できないため、事前にメニューを設定する旨を注記する。調査結果は §5.1 の「DIG/PKTの調査結果」を参照 | 承認後、実機で確認 |
| 3 | ~~`transceiver.json` の FT-847 を一覧から削除してよいか~~ **確認済み：削除する**（未対応のため、選択するとエラーになる。ユーザー確認済み） | － | － |
| 4 | FT-897：SPLIT ON時、表示中のVFOで受信・もう一方のVFOで送信されるか | その前提で設計 | 実機で確認 |
| 5 | FT-897：セット系コマンドの応答の有無、コマンド間の必要間隔、`03`応答時間 | 応答なし前提、間隔50ms、タイムアウト300ms | 実機で確認（値は定数化） |
| 6 | FT-991：RSTがCATで設定した周波数・モードがAIで通知として戻ってくるか | 戻る前提で、500ms間の同一値通知を無視 | 実機で確認（戻らなければ除外処理を削除） |
| 7 | FT-897：VFO切替(`81`)後の表示反映までの待ち時間 | 50ms | 実機で確認 |
| 8 | FT-991：`FT3;`（SPLIT）で、受信がVFO-A、送信がVFO-Bの周波数・モードになるか | その前提で設計 | 実機で確認 |
| 9 | FT-991：`CT0`/`CN0` は、VFO-A（MAIN）の設定として扱われるか。VFO-B側のトーンを設定するには`SV;`入替が必要か | 入替が必要な前提で設計（§4.2）。不要と分かれば入替を省略 | 実機で確認（入替なしで設定した後、SPLIT送信時にトーンが付くか） |
| 10 | FT-991：`SV;`入替中の受信音への影響、入替に必要な時間（コマンド間隔）、`SV;`2回でVFO-A/Bの内容（周波数・モード・トーン）が完全に元に戻るか | 間隔50ms、AI通知除外500ms | 実機で確認（値は定数化） |
| 11 | FT-991：Setコマンドの後、AIでRST自身の設定が通知されるか（§3.4.2） | 通知される前提で除外 | 実機で確認 |
| 12 | FT-991：1200MHz帯（範囲外）の扱い | 設定せず警告ログ | 仕様どおり（470MHzまで）。必要ならUIで警告表示を検討（今回の対象外） |

## 12. フェーズ1：現状のリファクタリング

**目的**：YAESU追加の前に、ICOMコントローラ内の汎用処理を部品として切り出し、YAESUで重複実装せずに済む状態にする。**ICOMの動作は変えない**（挙動維持のリファクタリング）。

**前提・リスク**：`TransceiverIcomController` にはユニットテストがない（State/CmdMakerの一部のみ）。そのため、リファクタリングの**前に**、実機なしで検証できる範囲のICOM特性テストを作成する（タスクリスト 1-0）。担保は、①1-0の特性テストを**変更せず**にパスさせる、②切り出す部品に単体テストを付ける、③型チェック・lintを通す、④ICOM実機で回帰確認する（1-0で確認できない項目）、の4点とする。変更は小さく分け、各ステップでビルド・テストを確認する。

**ICOM特性テストの方式（1-0）**：`SerialComm` をフェイク（`FakeSerialComm`）に差し替え、ICOM無線機の応答を模擬するシミュレータ（`IcomRadioSimulator`）を用意する。コントローラの公開メソッド（`start` / `setFreq` / `setMode` / `initAutoOn` 等）の呼び出しと、受信データの注入に対する、送信コマンド列とコールバック呼び出しを検証する。フェイクタイマーで時間経過を制御する。テスト用ヘルパーはフェーズ2のYAESUテストでも再利用する。実機でしか確認できない項目（実シリアルの挙動、機種固有の応答の癖、本体操作との干渉）は対象外とする。

### 12.1 `SerialComm`：オプション引数の追加

- コンストラクタの末尾に `options?: { stopBits?: 1 | 2 }` を追加し、`createSerialPort` の `stopBits` に反映する（省略時1）。位置引数の並びは変更しない（既存の呼び出し4か所は変更不要）。
- 接続ログにストップビットを出力する。

### 12.2 `TransceiverLock`（新規、`controller/TransceiverLock.ts`）

ICOMの `getLock` / `releaseLock` / `isProcessing` を切り出す。

```ts
export default class TransceiverLock {
  private locked = false;
  /** ロック中か（定期処理の「前回処理中」判定用） */
  public isLocked(): boolean;
  /** ロックを取得する。最大3秒（10ms間隔）待機し、タイムアウトしても警告ログを出してロックを取得する（ICOMの現状仕様どおり） */
  public async acquire(comId: number): Promise<void>;  // @synchronized()
  /** ロックを解放する */
  public release(): void;
}
```

- ICOM側：`private isProcessing` / `getLock` / `releaseLock` を削除し、`private lock = new TransceiverLock()` に置き換える。呼び出し箇所（定期処理、`initAutoOn`、`autoOff`）と `if (this.isProcessing)` を `lock.acquire` / `lock.release` / `lock.isLocked()` に変更する。

### 12.3 `TransceiverWaitTimer`（新規、`controller/TransceiverWaitTimer.ts`）

ICOMの `isWaitSendFreq` / `transceiveWaitTimer` / `startTransceiveWaitTimer` を切り出す。

```ts
export default class TransceiverWaitTimer {
  /** 送信を一時停止中か */
  public isWaiting(): boolean;
  /** 一時停止を開始する（既存のタイマーがあればクリアして再設定） */
  public start(waitMs: number): void;
  /** 一時停止を解除する（タイマーもクリア） */
  public release(): void;
}
```

- ICOM側：`isWaitSendFreq`・`transceiveWaitTimer` を削除し、`private waitTimer = new TransceiverWaitTimer()` に置き換える。
  - `startTransceiveWaitTimer(ms)` → `waitTimer.start(ms)`
  - `this.isWaitSendFreq = false`（`handleRecvData` の `03`/`04`/`1a` の各ケース）→ `waitTimer.release()`
  - `stop()` 内のタイマークリア → `waitTimer.release()`
  - 定期処理の `if (this.isWaitSendFreq)` → `if (this.waitTimer.isWaiting())`
- 挙動維持の確認点：元の実装は `isWaitSendFreq=false` にしてもタイマー自体は残る（後で満了して再度falseにするだけ）。新しい `release()` はタイマーもクリアするが、動作上の差は生じない（新しい待機は常に `start()` で既存タイマーをクリアするため）。

### 12.4 通知系ヘルパーの基底クラスへの引き上げ

ICOMの private メソッドのうち、ICOM固有でないものを基底クラスへ移す（ICOM側は削除）。

| メソッド | 移動先 | 内容 |
| --- | --- | --- |
| `fireSerialNotConnectedMsg()` | `TransceiverSerialControllerBase`（protected） | レンダラへ`SERIAL_NOT_CONNECTED_TRANSCEIVER`のトースト通知 |
| `notifyDopplerShiftWaiting()` | `TransceiverControllerBase`（protected） | `isDopplerShiftWaitingCallback(true)`の呼び出し |
| `notifyRecvTimeoutError()`（新規。`checkRecvTimeout`の「タイマー停止とシリアルクローズ以外のコールバック通知部分」） | `TransceiverControllerBase`（protected） | `freqCallback` / `modeCallback` へ `SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT` の失敗を通知 |

- ICOMの `checkRecvTimeout` は、タイマー停止・シリアルクローズ後に `notifyRecvTimeoutError()` を呼ぶ形に変更する（判定ロジックはICOMに残す）。
- 基底クラスに同名のprotectedメソッドを追加するため、ICOMの同名privateメソッドは**同じ変更で必ず削除する**（残すとTypeScriptの型エラーになる）。

### 12.5 テスト（フェーズ1）

| 対象 | ケース |
| --- | --- |
| `TransceiverLock` | 取得／解放、ロック中の再取得は解放まで待つ、3秒タイムアウトでも警告して取得できる（フェイクタイマー）、`isLocked()` |
| `TransceiverWaitTimer` | `start`で待機状態になり指定時間後に解除される、再`start`でタイマーが延長される、`release`で即時解除（フェイクタイマー） |
| `SerialComm` | `stopBits`の既定値1、指定値2が`SerialPort`に渡される（`serialport`をモック） |

### 12.6 フェーズ1の完了条件

- `npm run test`、型チェック（`npm run ts`）、lintがエラーなく通る。
- ICOM実機（IC-910/IC-9700等、あれば）で、接続、Rx/Tx周波数・モード設定、無線機側ダイヤル操作後の待機と再開、AutoOn/Off（トーン含む）が、リファクタリング前と同等に動作する。ICOM実機がない場合は、完了条件を満たしたうえでユーザー報告での確認とする旨を、PR説明に明記する。

## 13. 運用モード選択肢の機種別表示

**目的**：無線機の機種によって、設定できる運用モードや、実際に無線機へ送られるモードが異なる（FT-897：USB-D/LSB-DはDIG、FM-DはPKT、RTTY不可 等）。そこで、衛星設定・メイン画面の運用モード選択肢を、選択中の無線機に応じて**絞り込み、表示ラベルを切り替える**。

### 13.1 方針

- **保存値は変更しない**。衛星設定には従来どおりRST共通のモード名（`USB-D` など）を保存する。既存データの移行は不要。変更するのは画面の**選択肢**と**表示ラベル**のみ。
- 機種定義（`transceiver.json`）に、使えるモードと表示ラベルを持たせる（データ駆動）。ICOMなど定義がない機種は、従来どおり（DV以外の全モード、ラベルなし）とする。
- DIGの側波帯（`No-038 DIG MODE`依存）など、表示では解決できない制約は、設定画面の注記（`I18nMsgs`）で案内する（§6.7）。

### 13.2 機種定義の追加項目（`AppConfigTransceiverDevice`）

```ts
// 使用できる運用モード（RSTのモード名）。省略時は従来どおり全モード（DVを除く）
public supportedModes?: string[];
// 運用モードの表示ラベル（キー：RSTのモード名、値：選択肢に表示する文字列）。省略したモードはモード名をそのまま表示
public modeLabels?: Record<string, string>;
```

`transceiver.json` の設定例：

| 機種 | supportedModes | modeLabels |
| --- | --- | --- |
| ICOM各機種 | 省略（従来どおり） | 省略 |
| FT-991 / FT-991A | `LSB` `USB` `CW` `AM` `FM` `RTTY` `LSB-D` `USB-D` `FM-D` | `LSB-D`→`LSB-D(DATA-LSB)`、`USB-D`→`USB-D(DATA-USB)`、`FM-D`→`FM-D(DATA-FM)` |
| FT-897 / FT-897D | `LSB` `USB` `CW` `AM` `FM` `LSB-D` `USB-D` `FM-D` | `LSB-D`→`LSB-D(DIG)`、`USB-D`→`USB-D(DIG)`、`FM-D`→`FM-D(PKT)` |

- `supportedModes` / `modeLabels` のキー・値は `Constant.Transceiver.OpeMode` の値と一致している必要がある（定義ファイルの内容テストで検証する）。
- DV は、従来どおり選択肢に出さない（無線機からの受信時のみ設定される）。

### 13.3 画面（`OpeModeSelect.vue`）

- `OpeModeSelect` は、選択中の無線機の機種定義（`ApiAppConfig.getAppConfig()` の `transceiver.makerId`/`transceiverId` ＋ `ApiAppConfig.getTransceiverConfig()`）を取得し、選択肢を組み立てる。無線機が未設定の場合は、従来どおりの全モード（DVを除く）・ラベルなしとする。
- 選択肢の組み立ては、画面から切り離した純粋関数 `OpeModeItemsUtil.buildItems(device, currentValue)`（`src/renderer/common/util/`）に実装し、単体テストできるようにする。
  - 返す項目：`{ title: ラベル, value: RSTのモード名 }`。
  - `supportedModes` が指定されている場合は、その順序・内容のみ。
  - **保存済みの値が `supportedModes` に含まれない場合**（例：以前の設定でRTTYを保存、別の機種に切り替えた）は、その値を選択肢の末尾に `RTTY（非対応）` として追加し、選択状態が空表示にならないようにする（保存値は変更しない）。
- 幅が狭い画面（メイン画面の `TransceiverCtrl`）でも崩れないよう、**ドロップダウンの一覧のみ括弧付きのラベル**を表示し、選択後の表示（`v-select` の `#selection` スロット）は、RSTのモード名（`USB-D`）のみとする。衛星設定ダイアログ（`SatelliteInfoEditorDialog`）も同じ `OpeModeSelect` を使うため、同じ挙動となる。
- 無線機の設定を変更した後（`TransceiverSetting` のOK後）に、選択肢が更新されるよう、機種定義の取得は共有のリアクティブ状態（composable `useCurrentTransceiverDevice`）に持たせ、設定保存時に再読込する。再読込の呼び出し箇所は実装時に確認する。

### 13.4 テスト

| 対象 | ケース |
| --- | --- |
| `OpeModeItemsUtil.buildItems` | 機種定義なし（全モード、DV除外）、`supportedModes`指定（絞り込みと順序）、`modeLabels`指定（title切替、valueは不変）、保存済みの値が非対応の場合の末尾追加、空文字（未設定）の値 |
| `transceiver.json` | `supportedModes`/`modeLabels`の値が`Constant.Transceiver.OpeMode`に存在すること、`modeLabels`のキーが`supportedModes`に含まれること |


## 14. ドキュメント更新（`/doc`）

- `doc/10_アーキテクチャ/10_アーキテクチャ.md`：無線機制御の構成図に YAESU コントローラ（Protocol構成）を追加（罫線図は全角文字でずれないよう調整）。
- `doc/30_画面設計/G4-1_無線機設定（接続設定タブ）.md`：CI-Vアドレス欄は「ICOM選択時のみ表示」、YAESU選択時の機種リスト、無線機メニューのCATレート設定の注記、接続テストのストップビット（FT-897=2）を追記。
- 無線機制御の仕様（YAESU）のドキュメントを `doc/` 配下に新設するか、アーキテクチャ文書に節を追加する（対象機種、Rx/Txの対応、制限事項§9）。
