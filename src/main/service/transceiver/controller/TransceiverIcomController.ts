import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import { synchronized } from "@/common/decorator/synchronized";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";
import TransceiverUtil from "@/common/util/TransceiverUtil";
import TransceiverIcomCmdMaker, { CivCommand } from "@/main/service/transceiver/controller/TransceiverIcomCmdMaker";
import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser";
import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState";
import TransceiverSerialControllerBase from "@/main/service/transceiver/controller/TransceiverSerialControllerBase";
import AppMainLogger from "@/main/util/AppMainLogger";

// 受信タイムアウト（秒）（起動時）
const RECV_TIEOUT_SEC_FOR_BOOT = 2;
// 受信タイムアウト（ミリ秒）（通常のデータ受信時）
const RECV_TIMEOUT_MSEC = 250;

// 送受信制御用・コマンド種別
type CommandType =
  | "GET_FREQ"
  | "GET_MODE"
  | "GET_DATA_MODE"
  | "GET_BAND"
  | "SET_FREQ"
  | "SET_MODE"
  | "SET_DATA_MODE"
  | "SWITCH"
  | "SET_TONE";
// 送受信制御用・無線機から応答があるコマンド種別
const responsiveCmds = ["GET_FREQ", "GET_MODE", "GET_DATA_MODE", "GET_BAND", "SET_MODE", "SET_DATA_MODE", "SWITCH"];

// 受信コールバックの制御用
type RecvCallBackType = {
  reqCommandType: CommandType;
  isResponsive: boolean;
};

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

  // 無線機からの周波数データ(トランシーブ)受信があった場合にRSTからの周波数送信を一時停止するためのフラグ
  private isWaitSendFreq = false;
  // 周波数データ(トランシーブ)受信時の待機用タイマー
  private transceiveWaitTimer: NodeJS.Timeout | null = null;

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

    // 無線機との送受信の排他制御用
    let isProcessing = false;

    // 一定間隔で無線機の周波数設定／取得コマンドを送信する
    // メインバンドの処理を設定値（autoTrackingIntervalSec）秒ごとに行う。
    // 無線機側の周波数変更操作への影響を最小限にするため、サブバンドへの切り替えはメインの処理前に一瞬だけ行う
    const interval = parseFloat(this.transceiverConfig.autoTrackingIntervalSec) * 1000;
    this.sendAndRecvTimer = setInterval(async () => {
      // 無線機からの周波数データ(トランシーブ)受信があった場合はドップラーシフトを待機する
      if (this.isWaitSendFreq) {
        return;
      }

      // 前回処理が終わっていない場合はスキップ
      if (isProcessing) {
        return;
      }
      isProcessing = true;

      // サテライトモードの場合のみ、サブの処理を一瞬だけ実行
      if (this.state.isSatelliteMode) {
        await this.sendAndRecv(false);
      }

      // メインの処理を実行
      await this.sendAndRecv(true);

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

    // 周波数データ(トランシーブ)受信時のタイマーを停止
    if (this.transceiveWaitTimer) {
      clearTimeout(this.transceiveWaitTimer);
      this.transceiveWaitTimer = null;
    }
  }

  /**
   * AutoOn時の初期処理
   */
  public override async initAutoOn(
    txFreqHz: number,
    rxFreqHz: number,
    txModeText: string,
    rxModeText: string,
    toneHz: number | null
  ): Promise<void> {
    AppMainLogger.info(`無線機Auto On処理を開始します。`);

    // RST側の周波数を保存する（バンド入れ替え判定で必要）
    this.state.setReqRxFreqHz(rxFreqHz);
    this.state.setReqTxFreqHz(txFreqHz);

    // RST側のモードを保存する（バンド入れ替え判定で必要）
    const [txModeValue, txDataMode] = this.getValFromModeText(txModeText);
    this.state.setReqTxMode(txModeValue, txDataMode, true);

    const [rxModeValue, rxDataMode] = this.getValFromModeText(rxModeText);
    this.state.setReqRxMode(rxModeValue, rxDataMode, true);

    // メインバンドの周波数を元に、必要であればメインとサブの周波数帯の入れ替えを行う
    await this.switchBandIfNeed();

    // RST側の周波数とモードを無線機に送信する
    // memo: バンド入れ替え後のこの段階では、まだRST側の設定を反映していないため、RST側の周波数とモードを初回設定値として反映する
    // メインバンドに切り替える
    this.state.isMain = true;
    await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToMainBand(), "SWITCH");

    // メインバンド（Rx）の周波数を設定する
    await this.sendFreq(rxFreqHz);

    // メインバンド（Rx）のモードを設定する
    if (rxModeValue) {
      AppMainLogger.debug(`Rx運用モード（RST→無線機） ${rxModeText}`);
      const cmdData = this.cmdMaker.makeSetOpeMode(rxModeValue);
      await this.sendAndWaitRecv(cmdData, "SET_MODE");
    }

    // メインバンド（Rx）のデータモードを設定する
    AppMainLogger.debug(`Rxデータモード（RST→無線機） ${this.state.currentRxDataMode}`);
    const cmdData = this.cmdMaker.makeSetDataMode(this.state.currentRxDataMode);
    await this.sendAndWaitRecv(cmdData, "SET_DATA_MODE");

    // メインバンド（Rx）のトーン設定
    await this.setupTone(rxModeText, toneHz);

    // サブバンド
    // サテライトモードの場合は、サブバンド（Tx）の周波数とモードも設定する
    if (this.state.isSatelliteMode) {
      // サブバンドに切り替える
      this.state.isMain = false;
      await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToSubBand(), "SWITCH");

      // サブバンド（Tx）の周波数を設定する
      await this.sendFreq(txFreqHz);

      // サブバンド（Tx）のモードを設定する
      if (txModeValue) {
        const cmdData = this.cmdMaker.makeSetOpeMode(txModeValue);
        await this.sendAndWaitRecv(cmdData, "SET_MODE");
        AppMainLogger.debug(`Tx運用モード（RST→無線機） ${txModeText}`);
      }

      // サブバンド（Tx）のデータモードを設定する
      const cmdData = this.cmdMaker.makeSetDataMode(this.state.currentTxDataMode);
      await this.sendAndWaitRecv(cmdData, "SET_DATA_MODE");
      AppMainLogger.debug(`Txデータモード（RST→無線機） ${this.state.currentTxDataMode}`);

      // サブバンド（Tx）のトーン設定
      await this.setupTone(txModeText, toneHz);
    }

    AppMainLogger.info(`無線機AutoをOnにしました。`);
  }

  /**
   * AutoOff
   */
  public override async autoOff(): Promise<void> {
    AppMainLogger.info(`無線機Auto Off処理を開始します。`);

    // サブ・トーンOff
    if (this.state.isSatelliteMode) {
      this.state.isMain = false;
      await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToSubBand(), "SWITCH");
      await this.sendToneOff();
    }

    // メイン・トーンOff
    this.state.isMain = true;
    await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToMainBand(), "SWITCH");
    await this.sendToneOff();

    AppMainLogger.info(`無線機AutoをOffにしました。`);
  }

  /**
   * 無線機の初期化を行う
   */
  private async initTranceiver() {
    // VFO-Aに切り替え
    const cmdData = this.cmdMaker.makeSwitchVfoA();
    await this.sendAndWaitRecv(cmdData, "SWITCH");

    // トランシーブOn
    await this.sendAndWaitRecv(this.cmdMaker.makeSetTranceive(0x01), "SWITCH");

    // サテライトモードOff
    await this.setSatelliteMode(false);

    // 現状の周波数、モードを取得し、画面に反映させる
    await this.getFreqFromIcom();
    await this.getModeFromIcom();
  }

  /**
   * 無線機側の周波数データを取得する
   */
  private async getFreqFromIcom() {
    // サテライトモードの場合は、サブ側のデータ取得も取得する
    if (this.state.isSatelliteMode) {
      // サブ側のデータ取得
      this.state.isMain = false;
      await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToSubBand(), "SWITCH");
      // サブ・周波数の取得
      const recvDataSubFreq = await this.sendAndWaitRecv(this.cmdMaker.makeGetFreq(), "GET_FREQ");
      this.state.setRecvTxFreqHz(TransceiverIcomRecvParser.parseFreq(recvDataSubFreq));
    }

    // メイン側のデータ取得
    this.state.isMain = true;
    await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToMainBand(), "SWITCH");
    // メイン・周波数の取得
    const recvDataMainFreq = await this.sendAndWaitRecv(this.cmdMaker.makeGetFreq(), "GET_FREQ");
    this.state.setRecvRxFreqHz(TransceiverIcomRecvParser.parseFreq(recvDataMainFreq));
  }

  /**
   * 無線機側の運用モード、データモードを取得する
   */
  private async getModeFromIcom() {
    AppMainLogger.info(`無線機側の運用モード、データモードの取得要求を行います。`);

    // サテライトモードの場合は、サブ側のデータ取得も取得する
    if (this.state.isSatelliteMode) {
      // サブ側のデータ取得
      this.state.isMain = false;
      await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToSubBand(), "SWITCH");
      // サブ・周波数の取得
      const recvDataSubFreq = await this.sendAndWaitRecv(this.cmdMaker.makeGetFreq(), "GET_FREQ");
      this.state.setRecvTxFreqHz(TransceiverIcomRecvParser.parseFreq(recvDataSubFreq));
      // サブ・運用モードの取得
      const recvSubMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetMode(), "GET_MODE");
      AppMainLogger.debug(`Tx運用モード 取得要求（RST→無線機）`);
      await this.handleRecvData(recvSubMode);
      // サブ・データモードの取得
      const recvSubDataMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetDataMode(), "GET_DATA_MODE");
      AppMainLogger.debug(`Txデータモード 取得要求（RST→無線機）`);
      await this.handleRecvData(recvSubDataMode);
    }

    // メイン側のデータ取得
    this.state.isMain = true;
    await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToMainBand(), "SWITCH");
    // メイン・周波数の取得
    const recvDataMainFreq = await this.sendAndWaitRecv(this.cmdMaker.makeGetFreq(), "GET_FREQ");
    this.state.setRecvRxFreqHz(TransceiverIcomRecvParser.parseFreq(recvDataMainFreq));
    // メイン・運用モードの取得
    const recvMainMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetMode(), "GET_MODE");
    AppMainLogger.debug(`Rx運用モード 取得要求（RST→無線機）`);
    await this.handleRecvData(recvMainMode);
    // メイン・データモードの取得
    const recvMainDataMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetDataMode(), "GET_DATA_MODE");
    AppMainLogger.debug(`Rxデータモード 取得要求（RST→無線機）`);
    await this.handleRecvData(recvMainDataMode);
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
    // メインバンドの周波数の設定／取得、およびモードの設定／取得を行う
    if (isProcMain) {
      await this.sendAndRecvForMain();
    }

    // サテライトモードでない場合は、処理終了（サブバンドの処理は不要）
    if (!this.state.isSatelliteMode) {
      return;
    }

    // サブバンドの周波数の設定／取得、およびモードの設定／取得を行う
    if (!isProcMain) {
      await this.sendAndRecvForSub();
    }
  }

  /**
   * メインバンドの周波数の設定／取得、およびモードの設定／取得を行う
   */
  private async sendAndRecvForMain() {
    // メイン（Rx）の周波数、モードの更新がない場合は処理終了
    if (!this.state.isRxUpdate()) {
      return;
    }

    // メインへ切り替え
    this.state.isMain = true;
    await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToMainBand(), "SWITCH");

    // メインバンドの周波数を元に、必要であればメインとサブの周波数帯の入れ替えを行う
    await this.switchBandIfNeed();

    // 無線機へ送信するRx周波数の設定
    if (this.state.isReqRxFreqUpdate) {
      await this.sendFreq(this.state.getReqRxFreqHz());
      this.state.isReqRxFreqUpdate = false;
    } else if (this.state.isRecvRxFreqUpdate) {
      // Rx周波数を無線機から取得
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、周波数の取得は行わない
      const recvDataMainFreq = await this.sendAndWaitRecv(this.cmdMaker.makeGetFreq(), "GET_FREQ");
      await this.handleRecvData(recvDataMainFreq);
      this.state.isRecvRxFreqUpdate = false;
    }

    // 無線機へ送信する運用モードの設定
    if (this.state.isReqRxModeUpdate) {
      // 運用モードを無線機に設定
      const cmdData = this.cmdMaker.makeSetOpeMode(this.state.getReqRxMode());
      await this.sendAndWaitRecv(cmdData, "SET_MODE");

      // データモードを無線機に設定
      const cmdDataMode = this.cmdMaker.makeSetDataMode(this.state.getReqRxDataMode());
      await this.sendAndWaitRecv(cmdDataMode, "SET_DATA_MODE");

      this.state.isReqRxModeUpdate = false;
    } else {
      // 運用モードを無線機から取得
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、運用モードの取得は行わない
      const recvMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetMode(), "GET_MODE");
      await this.handleRecvData(recvMode);

      // データモードを無線機から取得
      const recvDataMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetDataMode(), "GET_DATA_MODE");
      await this.handleRecvData(recvDataMode);
    }
  }

  /**
   * サブバンドの周波数の設定／取得、およびモードの設定／取得を行う
   */
  private async sendAndRecvForSub() {
    // サブ（Tx）の周波数、モードの更新がない場合は処理終了
    if (!this.state.isTxUpdate()) {
      return;
    }

    // サブバンドへ切り替え
    this.state.isMain = false;
    await this.sendAndWaitRecv(this.cmdMaker.makeSwitchToSubBand(), "SWITCH");

    // 無線機へ送信するTx周波数の設定
    if (this.state.isReqTxFreqUpdate) {
      await this.sendFreq(this.state.getReqTxFreqHz());
      this.state.isReqTxFreqUpdate = false;
    } else if (this.state.isRecvTxFreqUpdate) {
      // Tx周波数を無線機から取得
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、周波数の取得は行わない
      const recvDataSubFreq = await this.sendAndWaitRecv(this.cmdMaker.makeGetFreq(), "GET_FREQ");
      await this.handleRecvData(recvDataSubFreq);
      this.state.isRecvTxFreqUpdate = false;
    }

    // 無線機へ送信する運用モードの設定
    if (this.state.isReqTxModeUpdate) {
      // 運用モードを無線機に設定
      const cmdData = this.cmdMaker.makeSetOpeMode(this.state.getReqTxMode());
      await this.sendAndWaitRecv(cmdData, "SET_MODE");

      // データモードを無線機に設定
      const cmdDataMode = this.cmdMaker.makeSetDataMode(this.state.getReqTxDataMode());
      await this.sendAndWaitRecv(cmdDataMode, "SET_DATA_MODE");

      this.state.isReqTxModeUpdate = false;
    } else {
      // 運用モードを無線機から取得
      // memo: 運用モードの送信時以外は、運用モードの取得は必ず行う。
      // memo: RST側から設定した直後は、基本的に同じ値が返ってくるため、運用モードの取得は行わない。
      const recvMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetMode(), "GET_MODE");
      await this.handleRecvData(recvMode);

      // データモードを無線機から取得
      const recvDataMode = await this.sendAndWaitRecv(this.cmdMaker.makeGetDataMode(), "GET_DATA_MODE");
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
    const cmdData = this.cmdMaker.makeSetFreq(freq);
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
   * 無線機の運用モードを設定する
   * memo: 設定したい値の設定のみ行う。無線機への送信は一定時間間隔で別メソッドにて行われる。
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
      const [modeValue, dataMode] = this.getValFromModeText(mode);

      // 運用モードの値が取得できない場合は処理終了
      if (modeValue === null) {
        return;
      }

      // 無線機に設定したいモードをセット
      this.state.setReqTxMode(modeValue, dataMode);
    } else if ("downlinkMode" in modeModel) {
      // ダウンリンクモードを取得する
      const mode = modeModel.downlinkMode;
      const [modeValue, dataMode] = this.getValFromModeText(mode);

      // 運用モードの値が取得できない場合は処理終了
      if (modeValue === null) {
        return;
      }

      // 無線機に設定したいモードをセット
      this.state.setReqRxMode(modeValue, dataMode);
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
    const cmdData = this.cmdMaker.makeSetInvertBand();
    await this.sendAndWaitRecv(cmdData, "SWITCH");

    // 入れ替え後の周波数、モードの取得
    await this.getFreqFromIcom();
    await this.getModeFromIcom();

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
    const cmdData = this.cmdMaker.makeSetSatelliteMode(isSatelliteMode);
    await this.sendAndWaitRecv(cmdData, "SET_MODE");
    AppMainLogger.debug(`サテライトモード（RST→無線機） ${isSatelliteMode}`);

    // サテライトモードの設定を保持する
    this.state.isSatelliteMode = isSatelliteMode;

    // サテライトモードの周波数、モードを取得する
    await this.getFreqFromIcom();
    await this.getModeFromIcom();
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

        // AppMainLogger.debug(`onData: recv=${recvCmdType}, data=${recvData}`);

        // 待ち受けがGET系だが、他のデータが飛んできた場合は無視
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

      // AppMainLogger.debug(`データ送信（RST→無線機） ${targetCmdType} ${Buffer.from(cmdData).toString("hex")}`);

      // データ送信
      await super.sendSerial(cmdData);

      // タイムアウト判定
      timeout = setTimeout(() => {
        // 応答タイムアウトは発生しうるためログ出力を行い、処理は継続する
        // MEMO: 必要に応じてコメント解除してください
        // AppMainLogger.warn(
        //   `無線機からの応答タイムアウトが発生しました。 ${targetCmdType} コマンド：${Buffer.from(cmdData).toString("hex")}`
        // );

        resetCallback();
        resolve("");
      }, RECV_TIMEOUT_MSEC);

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

    // 受信データを１バイトごとに処理する
    for (let i = 0; i < data.length; i++) {
      // 受信データを16進数文字列に変換して、受信バッファに蓄積
      this.recvBuffer += data[i].toString(16).padStart(2, "0").toLowerCase();

      // 受信データの終端が"fd"でない場合は、次のバイトを処理する
      if (!this.recvBuffer.endsWith("fd")) {
        continue;
      }

      // プリアンブル以降を読む（先頭に"00"がついている場合があるので、そこは読み捨てる）
      // memo: この時点で受信バッファからデータを抽出、確保しないと、次の受信データが非同期で受信バッファに追加されるので注意
      const trimedData = TransceiverIcomRecvParser.trimRecvData(this.recvBuffer);
      // 受信バッファをクリア
      this.recvBuffer = "";

      // コールバックが設定されている場合は、ディスパッチにてコールバックを呼び出し
      if (this.recvCallbackType) {
        this.dispatchRecvData(trimedData);
      } else {
        // 無線機起点で受信したデータの場合
        await this.handleRecvData(trimedData);
      }
    }
  };

  /**
   * 無線機から受信したデータを処理する
   * @param {string} trimedData 受信データ
   */
  private dispatchRecvData(trimedData: string) {
    if (!this.recvCallback) {
      return;
    }

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
      // 運用モードの取得
      case "04":
        if (trimedData.length === 16) {
          this.recvCallback(trimedData, "GET_MODE");
        }
        return;
      // バンドの取得
      case "07":
        if (trimedData.length === 16) {
          this.recvCallback(trimedData, "GET_BAND");
        }
        return;
      // データモードの取得
      case "1a":
        if (trimedData.length === 18) {
          this.recvCallback(trimedData, "GET_DATA_MODE");
        }
        return;
      default:
        AppMainLogger.warn(`処理対象外のデータが受信されました。${trimedData}`);
    }

    // サブコマンド部により処理を切り替え
    const resultSubCmd = trimedData.substring(8, 12);
    switch (resultSubCmd) {
      // サテライトモードの取得
      case "165a":
        this.recvCallback(trimedData, "GET_DATA_MODE");
        return;
    }

    // 上記以外
    this.recvCallback(trimedData, "");
  }

  /**
   * 無線機から受信したデータを処理する
   * @param {string} trimedData 受信データ
   */
  private async handleRecvData(trimedData: string) {
    // コールバックが未設定の場合は処理終了
    if (!this.isDopplerShiftWaitingCallback) {
      return;
    }

    // 対象の無線機からの応答でない場合は無視（ターゲットのCI-Vアドレスで判定）
    const target = trimedData.substring(6, 8);
    if (target !== this.civAddress.toString(16)) {
      return;
    }

    // 無線機からの周波数データ(トランシーブ)受信があった場合の戻り値
    const res = new ApiResponse(true);

    // コマンド部により処理を切り替え
    const cmd = trimedData.substring(8, 10);

    // トランシーブ関連のコマンド処理
    // 現在のバンド（メイン、サブ）を無線機から取得する
    // memo: 無線機側の操作でトランシーブが受信されるが、RST側で保持しているMain/Sub状態と異なるバンド側の操作である場合があるため
    switch (cmd) {
      // 周波数データ（00：トランシーブ）
      case "00":
      // 運用モードの設定（01:トランシーブ）
      case "01":
        this.state.isMain = await this.isCurrentMainBand();
        AppMainLogger.info(`Main/Subを無線機と同期しました。 isMain=${this.state.isMain}`);
    }

    // 受信データ処理
    switch (cmd) {
      // 周波数データの設定（トランシーブ）
      case "00":
        // 表示周波数の取得
        if (trimedData.length === 22) {
          // 無線機から受信した周波数データを処理する
          await this.procRecvFreqData(trimedData);
        }

        // 無線機への周波数の送信を一時停止する
        // MEMO: 無線機のダイアルなどでの周波数変更時、
        //       RSTから周波数の変更を行うと無線機での操作と混線状態になることを防止するため、一時停止が必要
        res.data = true;
        this.isDopplerShiftWaitingCallback(res);
        this.isWaitSendFreq = true;

        // 既存のタイマーがあればクリア
        if (this.transceiveWaitTimer) {
          clearTimeout(this.transceiveWaitTimer);
        }

        // 指定秒後、無線機への周波数の送信一時停止を解除する
        this.transceiveWaitTimer = setTimeout(() => {
          this.isWaitSendFreq = false;
          this.transceiveWaitTimer = null;
        }, Constant.Transceiver.TRANSCEIVE_WAIT_MS);
        return;

      // 表示周波数の取得
      case "03":
        if (trimedData.length === 22) {
          // 無線機から受信した周波数データを処理する
          await this.procRecvFreqData(trimedData);
        }
        res.data = false;
        this.isDopplerShiftWaitingCallback(res);
        this.isWaitSendFreq = false;
        return;

      // 運用モードの設定（01:トランシーブ、04:要求に対する応答）
      case "01":
      case "04":
        if (trimedData.length === 16) {
          // 無線機から受信した運用モードデータを処理する
          await this.procRecvOpeMode(trimedData);
        }
        res.data = false;
        this.isDopplerShiftWaitingCallback(res);
        this.isWaitSendFreq = false;
        return;
      // データモードの取得
      case "1a":
        if (trimedData.length === 18) {
          // 無線機から受信したデータモードを処理する
          this.procRecvDataMode(trimedData);
        }
        res.data = false;
        this.isDopplerShiftWaitingCallback(res);
        this.isWaitSendFreq = false;
        return;
    }

    // サブコマンド部を含めた処理切り替え
    const resultSubCmd = trimedData.substring(8, 12);
    switch (resultSubCmd) {
      // サテライトモードの取得
      case "165a": /// IC910以外
      case "1a07": /// IC910
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

    // 現在のバンドを再取得
    // memo: 無線機側でメイン／サブの切り替えが行われている可能性があるため、更新ターゲットを再取得する
    this.state.isMain = await this.isCurrentMainBand();

    // サテライトモードがONの場合
    if (this.state.isSatelliteMode) {
      if (this.state.isMain) {
        // メインバンドの受信データをRx周波数とする
        res.data = { downlinkHz: freqHz, downlinkMode: "" } as DownlinkType;
        this.state.setRecvRxFreqHz(freqHz);
        AppMainLogger.debug(`Rx周波数 （無線機→RST）`);
      } else {
        // サブバンドは受信データをTx周波数とする
        res.data = { uplinkHz: freqHz, uplinkMode: "" } as UplinkType;
        this.state.setRecvTxFreqHz(freqHz);
        AppMainLogger.debug(`Tx周波数 （無線機→RST）`);
      }
    } else {
      // サテライトモードがOFFの場合は、受信データをアップリンク周波数とする
      res.data = { uplinkHz: freqHz, uplinkMode: "" } as UplinkType;
      this.state.setRecvTxFreqHz(freqHz);
      AppMainLogger.debug(`Tx周波数 （無線機→RST） サテライトOff`);
    }

    // 周波数のコールバック呼び出し
    this.freqCallback(res);
  }

  /**
   * 無線機から受信した運用モードデータを処理する
   * @param {string} recvData 受信データ
   */
  private async procRecvOpeMode(recvData: string) {
    if (!this.modeCallback) {
      return;
    }

    const res = new ApiResponse(true);
    // 無線機から受信したデータから運用モードを取得する
    const recvModeText = TransceiverIcomRecvParser.parseMode(recvData);
    if (!recvModeText) {
      // 運用モードが取得できない場合は処理を終了する
      return;
    }
    const [recvMode] = this.getValFromModeText(recvModeText);

    // 現在のデータモードを無線機から取得する
    // memo: 運用モードとデータモードは別コマンドで取得する必要があるため
    await this.fetchCurrentDataMode();

    // サテライトモードがONの場合
    if (this.state.isSatelliteMode) {
      if (this.state.isMain) {
        this.state.currentRxOpeMode = recvMode;
        const modeText = this.makeModeText(this.state.currentRxOpeMode, this.state.currentRxDataMode);
        // 運用モードのMAINバンド設定フラグがFALSEの場合は受信データをダウンリンクの運用モードとする
        res.data = {
          downlinkHz: null,
          downlinkMode: modeText,
        } as DownlinkType;

        AppMainLogger.debug(`Rx運用モード（無線機→RST） ${modeText}`);
      } else {
        this.state.currentTxOpeMode = recvMode;
        const modeText = this.makeModeText(this.state.currentTxOpeMode, this.state.currentTxDataMode);
        // 運用モードのMAINバンド設定フラグがTRUEの場合は受信データをアップリンクの運用モードとする
        res.data = {
          uplinkHz: null,
          uplinkMode: modeText,
        } as UplinkType;

        AppMainLogger.debug(`Tx運用モード（無線機→RST） ${modeText}`);
      }

      // サテライトモードがOFFの場合は受信データをアップリンクの運用モードとする
    } else {
      this.state.currentTxOpeMode = recvMode;
      const modeText = this.makeModeText(this.state.currentTxOpeMode, this.state.currentTxDataMode);
      res.data = {
        uplinkHz: null,
        uplinkMode: modeText,
      } as UplinkType;

      AppMainLogger.debug(`Tx運用モード（無線機→RST） ${modeText}`);
    }

    // 運用モードのコールバック呼び出し
    this.modeCallback(res);
  }

  /**
   * 無線機から受信した運用モードデータを処理する
   * @param {string} recvData 受信データ
   */
  private procRecvDataMode(recvData: string) {
    if (!this.modeCallback) {
      return;
    }

    const res = new ApiResponse(true);
    // 無線機から受信したデータからデータモードを取得する
    const recvDataMode = TransceiverIcomRecvParser.parseDataMode(recvData);
    if (!recvDataMode) {
      // データモードが取得できない場合は処理を終了する
      return;
    }

    // サテライトモードがONの場合
    if (this.state.isSatelliteMode) {
      if (this.state.isMain) {
        this.state.currentRxDataMode = recvDataMode;
        const modeText = this.makeModeText(this.state.currentRxOpeMode, this.state.currentRxDataMode);
        // 運用モードのMAINバンド設定フラグがFALSEの場合は受信データをダウンリンクの運用モードとする
        res.data = {
          downlinkHz: null,
          downlinkMode: modeText,
        } as DownlinkType;

        AppMainLogger.debug(`Rxデータモード（無線機→RST） ${modeText}`);
      } else {
        this.state.currentTxDataMode = recvDataMode;
        const modeText = this.makeModeText(this.state.currentTxOpeMode, this.state.currentTxDataMode);
        // 運用モードのMAINバンド設定フラグがTRUEの場合は受信データをアップリンクの運用モードとする
        res.data = {
          uplinkHz: null,
          uplinkMode: modeText,
        } as UplinkType;

        AppMainLogger.debug(`Txデータモード（無線機→RST） ${modeText}`);
      }

      // サテライトモードがOFFの場合は受信データをアップリンクの運用モードとする
    } else {
      this.state.currentTxDataMode = recvDataMode;
      const modeText = this.makeModeText(this.state.currentTxOpeMode, this.state.currentTxDataMode);
      res.data = {
        uplinkHz: null,
        uplinkMode: modeText,
      } as UplinkType;

      AppMainLogger.debug(`Txデータモード（無線機→RST） ${modeText}`);
    }

    // 運用モードのコールバック呼び出し
    this.modeCallback(res);
  }

  /**
   * 現在のバンドがメインバンドかを判定する
   */
  private async isCurrentMainBand() {
    const cmdData = this.cmdMaker.makeGetBand();
    const res = await this.sendAndWaitRecv(cmdData, "GET_BAND");

    return TransceiverIcomRecvParser.parseCurrentBand(res) === CivCommand.Band.MAIN;
  }

  /**
   * 現在のデータモードを無線機から取得する
   */
  private async fetchCurrentDataMode() {
    // 現在のバンドを再取得
    this.state.isMain = await this.isCurrentMainBand();

    // データモードの取得
    const recvData = await this.sendAndWaitRecv(this.cmdMaker.makeGetDataMode(), "GET_DATA_MODE");
    const recvDataMode = TransceiverIcomRecvParser.parseDataMode(recvData);
    if (!recvDataMode) {
      // データモードが取得できない場合は処理を終了する
      return;
    }

    // 現在のバンドに応じてデータモードを保持する
    if (this.state.isMain) {
      this.state.currentRxDataMode = recvDataMode;
    } else {
      this.state.currentTxDataMode = recvDataMode;
    }
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
    if (this.startSec + RECV_TIEOUT_SEC_FOR_BOOT > nowSec) {
      return true;
    }

    // タイムアウト
    AppMainLogger.warn(
      `無線機へのモード取得開始から${RECV_TIEOUT_SEC_FOR_BOOT}秒経過しましたが、無線機から応答がないため、無線機のモードの取得を停止します。`
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
   * 運用モード値、データモード値元に、RSTの画面表示用のモード値に変換する
   * @returns RSTの運用モード値
   */
  private makeModeText(opeMode: string, dataMode: string): string | null {
    switch (opeMode) {
      case "00":
        if (dataMode === "01") {
          return Constant.Transceiver.OpeMode.LSB_D;
        }
        return Constant.Transceiver.OpeMode.LSB;
      case "01":
        if (dataMode === "01") {
          return Constant.Transceiver.OpeMode.USB_D;
        }
        return Constant.Transceiver.OpeMode.USB;
      case "02":
        return Constant.Transceiver.OpeMode.AM;
      case "03":
        return Constant.Transceiver.OpeMode.CW;
      case "04":
        return Constant.Transceiver.OpeMode.RTTY;
      case "05":
        if (dataMode === "01") {
          return Constant.Transceiver.OpeMode.FM_D;
        }
        return Constant.Transceiver.OpeMode.FM;
      case "17":
        return Constant.Transceiver.OpeMode.DV;
      default:
        return null;
    }
  }

  /**
   * 指定のモード文字列から運用モードとデータモードのCI-Vコマンド値を返す
   * @param {string} opeMode 運用モード
   * @returns {(string | null)} 運用モードのCI-Vコマンド値
   */
  private getValFromModeText(opeMode: string | null): [string, string] {
    // 運用モードがnullの場合はLSBをデフォ値として返す
    if (!opeMode) {
      AppMainLogger.warn(`運用モードがnullのため、デフォルト値としてLSBを返します。`);
      return ["00", CivCommand.DataMode.OFF];
    }

    switch (opeMode) {
      case Constant.Transceiver.OpeMode.LSB:
        return ["00", CivCommand.DataMode.OFF];
      case Constant.Transceiver.OpeMode.LSB_D:
        return ["00", CivCommand.DataMode.ON];
      case Constant.Transceiver.OpeMode.USB:
        return ["01", CivCommand.DataMode.OFF];
      case Constant.Transceiver.OpeMode.USB_D:
        return ["01", CivCommand.DataMode.ON];
      case Constant.Transceiver.OpeMode.AM:
        return ["02", CivCommand.DataMode.OFF];
      case Constant.Transceiver.OpeMode.CW:
        return ["03", CivCommand.DataMode.OFF];
      case Constant.Transceiver.OpeMode.RTTY:
        return ["04", CivCommand.DataMode.OFF];
      case Constant.Transceiver.OpeMode.FM:
        return ["05", CivCommand.DataMode.OFF];
      case Constant.Transceiver.OpeMode.FM_D:
        return ["05", CivCommand.DataMode.ON];
      case Constant.Transceiver.OpeMode.DV:
        return ["17", CivCommand.DataMode.OFF];
      default:
        // 該当なしの場合はLSBをデフォ値として返す
        AppMainLogger.warn(`運用モードが不定のため、デフォルト値としてLSBを返します。`);
        return ["00", CivCommand.DataMode.OFF];
    }
  }

  /**
   * TONE設定を無線機に送信する
   */
  private async setupTone(modeText: string | null, toneHz: number | null): Promise<void> {
    // 運用モードがTONE設定可能なモードでない場合（FM、FM-D以外の場合）はTONE Offを送信して処理終了
    // memo: FM、FM-DでのみTONE設定が可能なため
    if (modeText !== Constant.Transceiver.OpeMode.FM && modeText !== Constant.Transceiver.OpeMode.FM_D) {
      await this.sendToneOff();
      return;
    }

    // TONE周波数の設定/未設定に従い、TONE On/Offを無線機に設定する
    AppMainLogger.debug(`TONE On/Off設定（RST→無線機） ${toneHz ? "On" : "Off"}`);
    const toneOnOffCmd = this.cmdMaker.makeSetToneCmd(toneHz ? true : false);
    await this.sendAndWaitRecv(toneOnOffCmd, "SET_TONE");

    // TONEが未設定の場合は処理終了
    if (!toneHz) {
      return;
    }

    // TONEが設定されている場合は、TONE周波数を無線機に設定する
    AppMainLogger.debug(`TONE周波数設定（RST→無線機） ${toneHz}`);
    const toneFreqCmd = this.cmdMaker.makeSetToneFreqCmd(toneHz);
    await this.sendAndWaitRecv(toneFreqCmd, "SET_TONE");
  }

  /**
   * TONE Offを無線機に送信する
   */
  private async sendToneOff(): Promise<void> {
    AppMainLogger.debug(`TONE On/Off設定（RST→無線機） Off`);
    const toneOnOffCmd = this.cmdMaker.makeSetToneCmd(false);
    await this.sendAndWaitRecv(toneOnOffCmd, "SET_TONE");
  }
}
