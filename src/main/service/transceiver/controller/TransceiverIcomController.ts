import CommonUtil from "@/common/CommonUtil";
import { synchronized } from "@/common/decorator/synchronized";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";
import TransceiverUtil from "@/common/util/TransceiverUtil";
import TransceiverIcomCmdMaker from "@/main/service/transceiver/controller/TransceiverIcomCmdMaker";
import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser";
import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState";
import TransceiverSerialControllerBase from "@/main/service/transceiver/controller/TransceiverSerialControllerBase";
import AppMainLogger from "@/main/util/AppMainLogger";

// 受信タイムアウト（秒）
const FIRST_RECV_TIEOUT_SEC = 2;
const RECV_TIEOUT_MSEC = 1000;

// コマンド種別
type CommandType = "GET_FREQ" | "GET_MODE" | "SET_FREQ" | "SET_MODE" | "SWITCH";

// 受信コールバックの制御用
type RecvCallBackType = {
  reqCommandType: CommandType;
  isResponsive: boolean;
};

// 無線機から応答があるコマンド種別
const responsiveCmds = ["GET_FREQ", "GET_MODE", "SET_MODE", "SWITCH"];

/**
 * ICOM無線機のコントローラ
 */
export default class TransceiverIcomController extends TransceiverSerialControllerBase {
  // 無線機の操作タイマー（setInterval向け）
  private sendAndRecvTimer: NodeJS.Timeout | null = null;

  // ICOM無線機のCI-Vアドレス
  private civAddress: number = 0;

  // コマンド生成
  private cmdMaker: TransceiverIcomCmdMaker;

  // 無線機から受信したデータ
  private recvBuffer = "";

  // 無線機からの受信コールバック制御用
  private recvCallbackType: RecvCallBackType | null = null;
  private recvCallback: Function | null = null;

  // RST側と無線機側の周波数、モードの状態の保持
  private state = new TransceiverIcomState();

  // 受信タイムアウト制御用
  private startSec = 0;
  private isReceived = false;

  // 無線機への送信間隔制御
  private prevSendTimeMsec = 0;

  public constructor(transceiverConfig: AppConfigTransceiver) {
    super(transceiverConfig);
    this.state.resetAll();
    this.civAddress = parseInt(transceiverConfig.civAddress.toLowerCase(), 16);
    this.cmdMaker = new TransceiverIcomCmdMaker(this.civAddress, transceiverConfig.transceiverId);
  }

  /**
   * デバイスの接続を開始する
   */
  public override async start(): Promise<ApiResponse<void>> {
    this.recvCallbackType = null;
    this.recvCallback = null;

    // シリアルオープン
    await this.openSerial();

    // タイムアウト制御用
    this.startSec = new Date().getTime() / 1000;
    this.isReceived = false;

    // 無線機の初期化
    await this.initTranceiver();

    // メイン/サブの処理を切り替える用
    let isProcMain = true;
    let isProcessing = false;

    // 一定間隔で無線機の周波数取得コマンドを送信する
    // 間隔が1秒の場合は、メイン0.5s、サブ0.5sで交互に処理を行う
    const interval = (parseFloat(this.transceiverConfig.autoTrackingIntervalSec) * 1000) / 2;
    this.sendAndRecvTimer = setInterval(async () => {
      // 前回処理が終わっていない場合はスキップ
      if (isProcessing) {
        return;
      }
      isProcessing = true;

      // データの送信と受信
      await this.sendAndRecv(isProcMain);

      // メイン、サブ切り替え
      isProcMain = !isProcMain;
      isProcessing = false;
    }, interval);

    AppMainLogger.info(`無線機の監視と送信準備完了。制御間隔：${this.transceiverConfig.autoTrackingIntervalSec}Sec`);

    return new ApiResponse(true);
  }

  /**
   * デバイスの切断などを行う
   */
  public override async stop(): Promise<void> {
    this.unsetCallback();

    await super.stop();

    // 定期コマンド送信を停止
    this.cancelTimer();
  }

  /**
   * AutoOn時の初期処理
   */
  public override async initAutoOn(txFreqHz: number, rxFreqHz: number): Promise<void> {
    // メインバンドの周波数を元に、必要であればメインとサブの周波数帯の入れ替えを行う
    await this.switchBandIfNeed();
  }

  /**
   * 無線機の初期化を行う
   */
  private async initTranceiver() {
    // VFO-Aに切り替え
    const cmdData = this.cmdMaker.switchVfoA();
    await this.sendAndWaitRecv(cmdData, "SWITCH");

    // トランシーブOn
    await this.sendAndWaitRecv(this.cmdMaker.setTranceive(0x01), "SWITCH");

    // 無線機側のサテライトモードの取得
    const recvData = await this.sendAndWaitRecv(this.cmdMaker.getSatelliteMode(), "GET_MODE");
    this.state.isSatelliteMode = TransceiverIcomRecvParser.parseSatelliteMode(recvData);

    // 現状の周波数データ取得
    this.getFreqFromIcom();
  }

  /**
   * 無線機側の周波数データを取得する
   */
  private async getFreqFromIcom() {
    // メイン側のデータ取得
    this.state.isMain = true;
    await this.sendAndWaitRecv(this.cmdMaker.switchToMainBand(), "SWITCH");
    // メイン・周波数
    const recvDataMainFreq = await this.sendAndWaitRecv(this.cmdMaker.getFreq(), "GET_FREQ");
    this.state.setRecvRxFreqHz(TransceiverIcomRecvParser.parseFreq(recvDataMainFreq));

    // サテライトモードでない場合は、サブ側のデータ取得は不要
    if (!this.state.isSatelliteMode) {
      return;
    }

    // サブ側のデータ取得
    this.state.isMain = false;
    await this.sendAndWaitRecv(this.cmdMaker.switchToSubBand(), "SWITCH");
    // メイン・周波数
    const recvDataSubFreq = await this.sendAndWaitRecv(this.cmdMaker.getFreq(), "GET_FREQ");
    this.state.setRecvTxFreqHz(TransceiverIcomRecvParser.parseFreq(recvDataSubFreq));
  }

  /**
   * 定期コマンド送信を停止
   */
  private cancelTimer() {
    // 定期コマンド送信を停止
    if (this.sendAndRecvTimer) {
      clearInterval(this.sendAndRecvTimer);

      AppMainLogger.info(`無線機の監視とデータの送信を停止しました。`);
    }
  }

  /**
   * 無線機と送受信を行う
   * @param isProcMain メインバンド側の処理か？
   * @returns
   */
  @synchronized()
  private async sendAndRecv(isProcMain: boolean) {
    if (isProcMain) {
      await this.sendAndRecvForMain();
    }

    // サテライトモードでない場合は、処理終了（サブバンドの処理は不要）
    if (!this.state.isSatelliteMode) {
      return;
    }

    if (!isProcMain) {
      await this.sendAndRecvForSub();
    }
  }

  /**
   * メインバンドの周波数、モードを設定、取得する
   */
  private async sendAndRecvForMain() {
    // メイン（Rx）の周波数、モードの更新がない場合は処理終了
    if (!this.state.isRxUpdate()) {
      return;
    }

    // メインへ切り替え
    this.state.isMain = true;
    await this.sendAndWaitRecv(this.cmdMaker.switchToMainBand(), "SWITCH");

    // メインバンドの周波数を元に、必要であればメインとサブの周波数帯の入れ替えを行う
    await this.switchBandIfNeed();

    // Rx周波数の設定
    if (this.state.isRxFreqUpdate) {
      await this.sendFreq(this.state.getReqRxFreqHz());
      this.state.isRxFreqUpdate = false;
    } else if (this.state.isRecvRxFreqUpdate) {
      // Rx周波数の取得
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、周波数の取得は行わない
      const recvDataMainFreq = await this.sendAndWaitRecv(this.cmdMaker.getFreq(), "GET_FREQ");
      await this.handleRecvData(recvDataMainFreq);
      this.state.isRecvRxFreqUpdate = false;
    }

    // Rx運用モードの設定
    if (this.state.isRxModeUpdate) {
      const cmdData = this.cmdMaker.setMode(this.state.getReqRxMode());
      await this.sendAndWaitRecv(cmdData, "SET_MODE");
      this.state.isRxModeUpdate = false;
    } else {
      // Rx運用モードの取得
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、周波数の取得は行わない
      const recvDataMode = await this.sendAndWaitRecv(this.cmdMaker.getMode(), "GET_MODE");
      await this.handleRecvData(recvDataMode);
    }
  }

  /**
   * サブバンドの周波数、モードを設定、取得する
   */
  private async sendAndRecvForSub() {
    // サブ（Tx）の周波数、モードの更新がない場合は処理終了
    if (!this.state.isTxUpdate()) {
      return;
    }

    // サブバンドへ切り替え
    this.state.isMain = false;
    await this.sendAndWaitRecv(this.cmdMaker.switchToSubBand(), "SWITCH");

    // Tx周波数の設定
    if (this.state.isTxFreqUpdate) {
      await this.sendFreq(this.state.getReqTxFreqHz());
      this.state.isTxFreqUpdate = false;
    } else if (this.state.isRecvTxFreqUpdate) {
      // Rx周波数の取得
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、周波数の取得は行わない
      const recvDataSubFreq = await this.sendAndWaitRecv(this.cmdMaker.getFreq(), "GET_FREQ");
      await this.handleRecvData(recvDataSubFreq);
      this.state.isRecvTxFreqUpdate = false;
    }

    // Tx運用モードの設定
    if (this.state.isTxModeUpdate) {
      const cmdData = this.cmdMaker.setMode(this.state.getReqTxMode());
      await this.sendAndWaitRecv(cmdData, "SET_MODE");
      this.state.isTxModeUpdate = false;
    } else {
      // Tx運用モードの取得
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、周波数の取得は行わない
      const recvDataMode = await this.sendAndWaitRecv(this.cmdMaker.getMode(), "GET_MODE");
      await this.handleRecvData(recvDataMode);
    }
  }

  /**
   * 周波数の設定コマンドを送信する
   * 現在のバンド（メイン、サブ）に対して設定が行われます。
   */
  private async sendFreq(freq: number): Promise<void> {
    // 周波数が未設定の場合は処理終了する
    if (!CommonUtil.isNumber(freq)) {
      return;
    }

    // データ送信
    const cmdData = this.cmdMaker.setFreq(freq);
    await this.sendAndWaitRecv(cmdData, "SET_FREQ");
  }

  /**
   * 無線機に周波数を設定するコマンドを送信する
   * @param {(UplinkType | DownlinkType)} freqModel 周波数設定
   */
  public override async setFreq(freqModel: UplinkType | DownlinkType): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.serial?.isOpen) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    if ("uplinkHz" in freqModel && freqModel.uplinkHz) {
      // アップリンク周波数を取得する
      this.state.setReqTxFreqHz(freqModel.uplinkHz);
    } else if ("downlinkHz" in freqModel && freqModel.downlinkHz) {
      // ダウンリンク周波数を取得する
      this.state.setReqRxFreqHz(freqModel.downlinkHz);
    }
  }

  /**
   * 無線機に運用モードを設定するコマンドを送信する
   * @param {(UplinkType | DownlinkType)} modeModel 運用モード設定
   */
  public override async setMode(modeModel: UplinkType | DownlinkType): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.serial?.isOpen) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    if ("uplinkMode" in modeModel) {
      // アップリンクモードを取得する
      const mode = modeModel.uplinkMode;
      const modeValue = TransceiverIcomRecvParser.getValueFromOpeMode(mode);

      // 運用モードの値が取得できない場合は処理終了
      if (modeValue === null) {
        return;
      }
      this.state.setReqTxMode(modeValue);
    } else if ("downlinkMode" in modeModel) {
      // ダウンリンクモードを取得する
      const mode = modeModel.downlinkMode;
      const modeValue = TransceiverIcomRecvParser.getValueFromOpeMode(mode);

      // 運用モードの値が取得できない場合は処理終了
      if (modeValue === null) {
        return;
      }
      this.state.setReqRxMode(modeValue);
    }
  }

  /**
   * RSTと無線機の「メイン」バンドのRx周波数を元に、必要であればバンドの入れ替えを行う
   * memo: 入れ替えないと、要求と無線機のバンド帯が異なる場合に、周波数設定ができない。
   * memo: サブバンドTx側は参照しないので注意。
   */
  private async switchBandIfNeed(): Promise<boolean> {
    // サテライトモードでない場合は入れ替え不要
    if (!this.state.isSatelliteMode) {
      return false;
    }

    const rstRxFreqHz = this.state.getReqRxFreqHz();
    const icomRxFreqHz = this.state.getRecvRxFreqHz();

    // 周波数が未設定の場合は入れ替え不要
    if (rstRxFreqHz === 0 || icomRxFreqHz === 0) {
      return false;
    }

    // RSTとICOMのバンド帯を取得
    const rstRxBandRange = TransceiverUtil.analizeAmateurBandRange(rstRxFreqHz);
    const icomRxBandRange = TransceiverUtil.analizeAmateurBandRange(icomRxFreqHz);

    // 周波数がアマチュアバンド帯でない場合は入れ替えしない
    if (CommonUtil.isEmpty(rstRxBandRange)) {
      AppMainLogger.warn(`RST側のRx周波数がアマチュアバンド帯外です。 RST=${rstRxFreqHz}Hz`);
      return false;
    }
    if (CommonUtil.isEmpty(icomRxBandRange)) {
      AppMainLogger.warn(`ICOM側のRx周波数がアマチュアバンド帯外です。 RST=${icomRxFreqHz}Hz`);
      return false;
    }

    // RSTと無線機が同じバンド帯の場合は、入れ替え不要
    if (rstRxBandRange === icomRxBandRange) {
      return false;
    }

    AppMainLogger.info(
      `RSTと無線機のバンドが異なるため、無線機のメイン/サブバンドを反転させます。 RST=${rstRxFreqHz}Hz, ICOM=${icomRxFreqHz}Hz`
    );

    // メインとサブのバンドを入れ替える
    const cmdData = this.cmdMaker.setInvertBand();
    await this.sendAndWaitRecv(cmdData, "SWITCH");

    // 入れ替え後の周波数データを取得する
    this.getFreqFromIcom();

    return true;
  }

  /**
   * サテライトモードを設定するコマンドを送信する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public override async setSatelliteMode(isSatelliteMode: boolean): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.serial?.isOpen) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    // データ送信
    const cmdData = this.cmdMaker.setSatelliteMode(isSatelliteMode);
    await this.sendAndWaitRecv(cmdData, "SET_MODE");

    // サテライトモードの設定を保持する
    this.state.isSatelliteMode = isSatelliteMode;

    // メインバンドの周波数を元に、必要であればメインとサブの周波数帯の入れ替えを行う
    await this.switchBandIfNeed();
  }

  /**
   * 無線機へデータの送信、応答受信を行う
   * - 応答を待つかは、targetCmdTypeによって要否が決定される。
   * - RST内で排他的に処理を行うため、synchronizedを付与している。
   * - 排他処理のため、コールバック（this.recvCallbackType と this.recvCallback）はクラス内で１つのみ保持。
   * @param cmdData コマンド
   * @param targetCmdType 送信コマンド種別
   * @returns 受信データ
   */
  @synchronized()
  private async sendAndWaitRecv(cmdData: Uint8Array, targetCmdType: CommandType): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!this.checkRecvTimeout()) {
        return;
      }

      let timeout: NodeJS.Timeout;

      const resetCallback = () => {
        this.recvCallbackType = null;
        clearTimeout(timeout);
      };

      // データ受信
      const onData = (recvData: string, recvCmdType: string) => {
        if (!this.recvCallbackType) {
          resetCallback();
          resolve(recvData);
          return;
        }

        // GET系だが、他のデータが飛んできた場合は無視
        if (targetCmdType.startsWith("GET") && recvCmdType !== targetCmdType) {
          return;
        }

        // 送信に対する受信が来たので、応答を返す
        resetCallback();
        resolve(recvData);
      };

      // コールバック制御データの作成
      this.recvCallbackType = this.makeRecvCallback(targetCmdType);
      this.recvCallback = null;
      // 応答アリのコマンドの場合は、コールバックを設定する
      if (this.recvCallbackType.isResponsive) {
        this.recvCallback = onData;
      }

      // データ送信
      await this.waitSendInterval();
      await super.sendSerial(cmdData);

      // 送信次点の現在の時刻を保持
      this.prevSendTimeMsec = new Date().getTime();

      // タイムアウト判定
      timeout = setTimeout(() => {
        // 応答タイムアウト時は、発生しうるためログ出力を行い、処理は継続する
        AppMainLogger.warn(
          `無線機からの応答タイムアウトが発生しました。 ${targetCmdType} コマンド：${Buffer.from(cmdData).toString("hex")}`
        );

        resetCallback();
        resolve("");
      }, RECV_TIEOUT_MSEC);

      // 応答なしのコマンドは、送信後に処理を終了する
      if (!this.recvCallbackType.isResponsive) {
        resetCallback();
        resolve("");
      }
    });
  }

  /**
   * 受信コールバックの制御データを作成する
   */
  private makeRecvCallback(reqCommandType: CommandType): RecvCallBackType {
    return {
      reqCommandType,
      // 送信に対して応答があるコマンドか？
      isResponsive: responsiveCmds.includes(reqCommandType),
    };
  }

  /**
   * シリアルデータの受信
   * @param {Buffer} data 受信データ
   */
  protected override onRecv = async (data: Buffer) => {
    if (!this.freqCallback || !this.modeCallback) {
      return;
    }

    // 受信済みとする
    this.isReceived = true;

    // 受信データを16進数文字列に変換する
    for (let i = 0; i < data.length; i++) {
      this.recvBuffer += data[i].toString(16).padStart(2, "0").toLowerCase();
      if (!this.recvBuffer.endsWith("fd")) {
        continue;
      }

      // コールバックが設定されている場合は、ディスパッチにてコールバックを呼び出し
      if (this.recvCallbackType) {
        this.dispatchRecvData(this.recvBuffer);
      } else {
        // 無線機起点で受信したデータの場合
        await this.handleRecvData(this.recvBuffer);
      }

      // 受信バッファをクリア
      this.recvBuffer = "";
    }
  };

  /**
   * 無線機から受信したデータを処理する
   * @param {string} recvData 受信データ
   */
  private dispatchRecvData(recvData: string) {
    if (!this.recvCallback) {
      return;
    }

    // プリアンブル以降を読む（先頭に"00"がついている場合があるので、そこは読み捨てる）
    const trimedData = TransceiverIcomRecvParser.trimRecData(recvData);

    // 対象の無線機からの応答でない場合は無視（ターゲットのCI-Vアドレスで判定）
    const target = trimedData.substring(6, 8);
    if (target !== this.civAddress.toString(16)) {
      return;
    }

    // コマンド部により処理を切り替え
    const resultCmd = trimedData.substring(8, 10);
    switch (resultCmd) {
      // セット系はコマンド部にFB（OK）、FA（NG）が返ってくる
      case "fb":
        //
        this.recvCallback(trimedData, "SET_OK");
        return;
      case "fa":
        this.recvCallback(trimedData, "SET_NG");
        return;

      // 周波数データの設定（トランシーブ）
      case "00":
      // 表示周波数の取得
      case "03":
        if (trimedData.length === 22) {
          this.recvCallback(trimedData, "GET_FREQ");
        }
        return;

      // 運用モードの設定（トランシーブ）
      case "01":
      // 表示モードの取得
      case "04":
        if (trimedData.length === 16) {
          this.recvCallback(trimedData, "GET_MODE");
        }
        return;
    }

    // サブコマンド部により処理を切り替え
    const resultSubCmd = trimedData.substring(8, 12);
    switch (resultSubCmd) {
      // サテライトモードの取得
      case "165a":
        this.recvCallback(trimedData, "GET_MODE");
        return;
    }

    // 上記以外
    this.recvCallback(trimedData, "");
  }

  /**
   * 無線機から受信したデータを処理する
   * @param {string} recvData 受信データ
   */
  private async handleRecvData(recvData: string) {
    // プリアンブル以降を読む（先頭に"00"がついている場合があるので、そこは読み捨てる）
    const trimedData = TransceiverIcomRecvParser.trimRecData(recvData);

    // 対象の無線機からの応答でない場合は無視（ターゲットのCI-Vアドレスで判定）
    const target = trimedData.substring(6, 8);
    if (target !== this.civAddress.toString(16)) {
      return;
    }

    // コマンド部により処理を切り替え
    switch (trimedData.substring(8, 10)) {
      // 周波数データの設定（トランシーブ）
      case "00":
      // 表示周波数の取得
      case "03":
        if (trimedData.length === 22) {
          // 無線機から受信した周波数データを処理する
          await this.procRecvFreqData(trimedData);
        }
        return;

      // 運用モードの設定（トランシーブ）
      case "01":
      // 表示モードの取得
      case "04":
        if (trimedData.length === 16) {
          // 無線機から受信した運用モードデータを処理する
          this.procRecvModeData(trimedData);
        }
        return;
    }

    // サブコマンド部を含めた処理切り替え
    const resultSubCmd = trimedData.substring(8, 12);
    switch (resultSubCmd) {
      // サテライトモードの取得
      case "165a":
        // TODO: 画面にサテライトモードを返す
        return;
    }
  }

  /**
   * 無線機から受信した周波数データを処理する
   * @param {string} recvData 受信データ
   */
  private async procRecvFreqData(recvData: string) {
    if (!this.freqCallback) {
      return;
    }

    // 受信データをパースして周波数部を読み取る
    const freqHz = TransceiverIcomRecvParser.parseFreq(recvData);
    const res = new ApiResponse(true);

    // サテライトモードがONの場合
    if (this.state.isSatelliteMode) {
      if (this.state.isMain) {
        // メインバンドの受信データをRx周波数とする
        res.data = { downlinkHz: freqHz, downlinkMode: "" } as DownlinkType;
        this.state.setRecvRxFreqHz(freqHz);
      } else {
        // サブバンドは受信データをTx周波数とする
        res.data = { uplinkHz: freqHz, uplinkMode: "" } as UplinkType;
        this.state.setRecvTxFreqHz(freqHz);
      }
    } else {
      // サテライトモードがOFFの場合は、受信データをアップリンク周波数とする
      res.data = { uplinkHz: freqHz, uplinkMode: "" } as UplinkType;
      this.state.setRecvTxFreqHz(freqHz);
    }

    // 周波数のコールバック呼び出し
    this.freqCallback(res);
  }

  /**
   * 無線機から受信した運用モードデータを処理する
   * @param {string} recvData 受信データ
   */
  private procRecvModeData(recvData: string) {
    if (!this.modeCallback) {
      return;
    }

    const res = new ApiResponse(true);
    // 無線機から受信したデータから運用モードを取得する
    const recvMode = TransceiverIcomRecvParser.parseMode(recvData);
    if (!recvMode) {
      // 運用モードが取得できない場合は処理を中断する
      return;
    }

    // サテライトモードがONの場合
    if (this.state.isSatelliteMode) {
      if (this.state.isMain) {
        // 運用モードのMAINバンド設定フラグがFALSEの場合は受信データをダウンリンクの運用モードとする
        res.data = {
          downlinkHz: null,
          downlinkMode: recvMode,
        } as DownlinkType;
      } else {
        // 運用モードのMAINバンド設定フラグがTRUEの場合は受信データをアップリンクの運用モードとする
        res.data = {
          uplinkHz: null,
          uplinkMode: recvMode,
        } as UplinkType;
      }

      // サテライトモードがOFFの場合は受信データをアップリンクの運用モードとする
    } else {
      res.data = {
        uplinkHz: null,
        uplinkMode: recvMode,
      } as UplinkType;
    }

    // 運用モードのコールバック呼び出し
    this.modeCallback(res);
  }

  /**
   * データ受信タイムアウトチェック
   * memo: 少なくともIC-9700においては、無線機が電源Offでも、電源が接続されている場合は、送信コマンドをそのまま返してくるので、
   *       本処理でのタイムアウトチェックは、無線機が電源に接続されていない場合にのみ有効となる。
   */
  private checkRecvTimeout(): boolean {
    // 既にデータ受信済みであればOK
    if (this.isReceived) {
      return true;
    }

    // タイムアウト前の場合はOK
    const nowSec = new Date().getTime() / 1000;
    if (this.startSec + FIRST_RECV_TIEOUT_SEC > nowSec) {
      return true;
    }

    // タイムアウト
    AppMainLogger.warn(
      `無線機へのモード取得開始から${FIRST_RECV_TIEOUT_SEC}秒経過しましたが、無線機から応答がないため、無線機のモードの取得を停止します。`
    );

    // タイマーを停止
    this.cancelTimer();

    // コールバック呼び出し
    if (this.freqCallback) {
      const res = new ApiResponse(false, I18nMsgs.SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT);
      this.freqCallback(res);
    }
    if (this.modeCallback) {
      const res = new ApiResponse(false, I18nMsgs.SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT);
      this.modeCallback(res);
    }

    return false;
  }

  /**
   * 無線機への送信間隔を調整する
   */
  private async waitSendInterval() {
    // memo: 現状、特に調整しなくても問題なしのため、コメントアウト
    // const now = new Date().getTime();
    // const interval = now - this.prevSendTimeMsec;
    // await CommonUtil.sleep(interval + 10);
  }
}
