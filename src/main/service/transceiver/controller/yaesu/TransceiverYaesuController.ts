import Constant from "@/common/Constant.js";
import type { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import type { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import { ApiResponse } from "@/common/types/types.js";
import TransceiverUtil from "@/common/util/TransceiverUtil.js";
import TransceiverLock from "@/main/service/transceiver/controller/TransceiverLock.js";
import TransceiverSerialControllerBase from "@/main/service/transceiver/controller/TransceiverSerialControllerBase.js";
import TransceiverWaitTimer from "@/main/service/transceiver/controller/TransceiverWaitTimer.js";
import type {
  TransceiverYaesuProtocol,
  YaesuNotify,
} from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuProtocol.js";
import TransceiverYaesuSerialIo from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuSerialIo.js";
import TransceiverYaesuState from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuState.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

// 起動時に、無線機から一度も受信がない場合にタイムアウトとする時間（秒）
const RECV_TIMEOUT_SEC_FOR_BOOT = 2;

/**
 * YAESU無線機のコントローラ
 * - 制御の流れ（定期処理、状態管理、無線機側操作の検知、送信の一時停止）を担当する。
 * - 機種ごとのコマンド生成・応答解析は、TransceiverYaesuProtocol（FT-991、FT-897など）が担当する。
 */
export default class TransceiverYaesuController extends TransceiverSerialControllerBase {
  // 機種ごとのCAT制御
  private readonly protocol: TransceiverYaesuProtocol;
  // シリアルのストップビット
  private readonly stopBits: 1 | 2;

  // 無線機との送受信
  private readonly io: TransceiverYaesuSerialIo;
  // 無線機との送受信の排他制御用
  private readonly lock = new TransceiverLock();
  // 無線機側の操作があった場合に、RSTからの送信を一時停止するためのタイマー
  private readonly waitTimer = new TransceiverWaitTimer();
  // RST側と無線機側の周波数、モードの状態の保持
  private readonly state = new TransceiverYaesuState();

  // 通信管理ID（ログ出力用）
  private comId = 0;
  // 定期処理の実行回数
  private cycleCount = 0;
  // 定期処理のタイマー
  private sendAndRecvTimer: NodeJS.Timeout | null = null;
  // 起動時刻（秒）（起動時の応答タイムアウトの判定用）
  private startSec = 0;

  /**
   * @param transceiverConfig 無線機設定
   * @param protocol 機種ごとのCAT制御
   * @param stopBits シリアルのストップビット
   */
  public constructor(transceiverConfig: AppConfigTransceiver, protocol: TransceiverYaesuProtocol, stopBits: 1 | 2 = 1) {
    super(transceiverConfig);
    this.protocol = protocol;
    this.stopBits = stopBits;
    this.io = new TransceiverYaesuSerialIo({
      send: (bytes) => this.sendSerial(bytes),
      extractFrames: (buffer) => this.protocol.extractFrames(buffer),
      onNotify: (frame) => this.onNotifyFrame(frame),
      interCommandDelayMs: protocol.interCommandDelayMs,
    });
  }

  /**
   * デバイスの接続を開始する
   */
  public override async start(): Promise<ApiResponse<void>> {
    this.state.resetAll();
    this.io.reset();
    this.waitTimer.release();
    this.cycleCount = 0;

    // シリアルオープン
    await this.openSerial(this.stopBits);

    // 起動時の応答タイムアウト制御用
    this.startSec = new Date().getTime() / 1000;

    // 無線機の初期化
    await this.protocol.init(this.io);

    // 現状の周波数、モードを取得し、画面に反映させる
    const rx = await this.protocol.readRx(this.io);
    if (rx) {
      this.applyRx(rx.freqHz, rx.modeText, true);
    }

    // 一定間隔で無線機の周波数、モードの設定／取得を行う
    const interval = parseFloat(this.transceiverConfig.autoTrackingIntervalSec) * 1000;
    this.sendAndRecvTimer = setInterval(() => {
      void this.onTimer();
    }, interval);

    AppMainLogger.info(`無線機の監視と送信準備完了。制御間隔：${this.transceiverConfig.autoTrackingIntervalSec}Sec`);

    return new ApiResponse(true);
  }

  /**
   * デバイスの切断などを行う
   */
  public override async stop(): Promise<void> {
    AppMainLogger.info(`無線機の接続を停止します。`);
    this.unsetCallback();

    // 定期処理を停止
    this.cancelTimer();

    // 無線機の終了処理（自動通知の無効化など）
    if (this.isReady()) {
      await this.protocol.term(this.io);
    }

    this.waitTimer.release();
    await super.stop();
  }

  /**
   * 無線機との接続が準備完了かどうかを返す
   */
  public override isReady(): boolean {
    if (!this.serial) {
      return false;
    }

    return this.serial.isOpen();
  }

  /**
   * シリアルデータの受信
   */
  protected override onRecv(data: Buffer): Promise<void> {
    this.io.onRecv(data);
    return Promise.resolve();
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
    if (!this.isReady()) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    this.comId += 1;
    try {
      // ロック取得
      await this.lock.acquire(-1);

      AppMainLogger.debug(
        `無線機Auto On処理を開始します。 Rx：${rxFreqHz}/${rxModeText} Tx：${txFreqHz}/${txModeText}`
      );

      // Rxの周波数、運用モードを設定する
      if (rxFreqHz) {
        this.state.setReqRxFreqHz(rxFreqHz, true);
      }
      this.state.setReqRxMode(rxModeText, true);
      await this.sendRx();

      // サテライトモードの場合は、Txの周波数、運用モード、トーンも設定する
      if (this.state.isSatelliteMode) {
        if (txFreqHz) {
          this.state.setReqTxFreqHz(txFreqHz, true);
        }
        this.state.setReqTxMode(txModeText, true);
        await this.sendTx();
        await this.setupTone(txModeText, toneHz);
      }

      AppMainLogger.debug(`無線機AutoをOnにしました。`);
    } finally {
      this.lock.release();
    }
  }

  /**
   * AutoOff
   */
  public override async autoOff(): Promise<void> {
    if (!this.isReady()) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return;
    }

    try {
      // ロック取得
      await this.lock.acquire(-1);

      AppMainLogger.debug(`無線機Auto Off処理を開始します。`);
      // トーンOff
      await this.protocol.setTone(this.io, null);
      AppMainLogger.debug(`無線機AutoをOffにしました。`);
    } finally {
      this.lock.release();
    }
  }

  /**
   * 無線機に周波数を設定する
   * memo: 設定したい値の保持のみが行われる。無線機への送信は一定時間間隔で別メソッドにて行われる。
   * @param {(UplinkType | DownlinkType)} freqModel 周波数設定
   * @param {boolean} isForce 強制設定（同一周波数でも強制的に無線機へ送信する場合はtrueを指定する）
   */
  public override setFreq(freqModel: UplinkType | DownlinkType, isForce: boolean = false): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.isReady()) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return Promise.resolve();
    }

    if ("uplinkHz" in freqModel && freqModel.uplinkHz) {
      this.state.setReqTxFreqHz(freqModel.uplinkHz, isForce);
    } else if ("downlinkHz" in freqModel && freqModel.downlinkHz) {
      this.state.setReqRxFreqHz(freqModel.downlinkHz, isForce);
    }
    return Promise.resolve();
  }

  /**
   * 無線機に運用モードを設定する
   * memo: 設定したい値の保持のみが行われる。無線機への送信は一定時間間隔で別メソッドにて行われる。
   * @param {(UplinkType | DownlinkType)} modeModel 運用モード設定
   */
  public override setMode(modeModel: UplinkType | DownlinkType): Promise<void> {
    // シリアル未接続の場合は処理終了
    if (!this.isReady()) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");
      return Promise.resolve();
    }

    if ("uplinkMode" in modeModel) {
      AppMainLogger.debug(`Tx運用モード設定要求：${modeModel.uplinkMode}`);
      this.state.setReqTxMode(modeModel.uplinkMode);
    } else if ("downlinkMode" in modeModel) {
      AppMainLogger.debug(`Rx運用モード設定要求：${modeModel.downlinkMode}`);
      this.state.setReqRxMode(modeModel.downlinkMode);
    }
    return Promise.resolve();
  }

  /**
   * サテライトモード（SPLIT）を設定する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public override async setSatelliteMode(isSatelliteMode: boolean): Promise<boolean> {
    // シリアル未接続の場合は処理終了
    if (!this.isReady()) {
      AppMainLogger.warn("シリアル未接続のため、処理を終了します。");

      // レンダラ側へシリアルが未接続であることを通知（トースト表示される）
      this.fireSerialNotConnectedMsg();
      return false;
    }

    // 同じ値が既に設定されている場合はスキップ
    if (this.state.isSatelliteMode === isSatelliteMode) {
      return true;
    }

    try {
      // ロック取得
      await this.lock.acquire(-1);

      // サテライトモードの設定を保持する
      this.state.isSatelliteMode = isSatelliteMode;

      // 無線機に設定する
      await this.protocol.setSplit(this.io, isSatelliteMode);
      AppMainLogger.debug(`サテライトモード（RST→無線機） ${isSatelliteMode}`);

      // サテライトモードになった場合は、Txの周波数、運用モードを次の定期処理で必ず送信する
      if (isSatelliteMode) {
        this.state.resetLastSentTxFreqHz();
        if (this.state.getReqTxFreqHz()) {
          this.state.setReqTxFreqHz(this.state.getReqTxFreqHz(), true);
        }
        if (this.state.getReqTxMode()) {
          this.state.setReqTxMode(this.state.getReqTxMode(), true);
        }
      }

      // 現状の周波数、モードを取得し、画面に反映させる（サテライトモードのOn/Offによって、通知先（アップリンク／ダウンリンク）が変わるため）
      const rx = await this.protocol.readRx(this.io);
      if (rx) {
        this.applyRx(rx.freqHz, rx.modeText, true);
      }
    } finally {
      this.lock.release();
    }

    return true;
  }

  /**
   * 定期処理のタイマー
   */
  private async onTimer(): Promise<void> {
    // 無線機との接続が準備完了でない場合は処理終了
    if (!this.isReady()) {
      // シリアル未接続メッセージをレンダラ側へ通知
      this.fireSerialNotConnectedMsg();
      // 定期処理を停止
      this.cancelTimer();
      return;
    }

    // 前回処理が終わっていない場合はスキップ
    if (this.lock.isLocked()) {
      return;
    }

    this.comId += 1;
    try {
      // ロック取得
      await this.lock.acquire(this.comId);

      await this.sendAndRecvForLoop();
    } finally {
      this.lock.release();
    }
  }

  /**
   * 定期処理を停止する
   */
  private cancelTimer(): void {
    if (this.sendAndRecvTimer) {
      clearInterval(this.sendAndRecvTimer);
      this.sendAndRecvTimer = null;

      AppMainLogger.info(`無線機の監視とデータの送信を停止しました。`);
    }
  }

  /**
   * （定期処理）無線機への周波数、モードの設定と、無線機側の操作の検知を行う
   */
  private async sendAndRecvForLoop(): Promise<void> {
    // 起動時の応答タイムアウトの判定
    if (!(await this.checkRecvTimeout())) {
      return;
    }

    this.cycleCount += 1;

    // 無線機側の操作の後は、RSTから無線機への送信を一時停止する
    const isWaiting = this.waitTimer.isWaiting();
    // 自動通知（AI）で無線機側の操作を検知する機種は、一時停止中は何もしない（通知の受信で、一時停止の時間が更新される）
    if (isWaiting && this.protocol.supportsAutoInfo) {
      return;
    }

    // RSTから無線機への送信（Rx、Tx）
    let isRxSent = false;
    if (!isWaiting) {
      isRxSent = await this.sendRx();
      await this.sendTx();
    }

    // 無線機側の操作の検知（定期読み取り）
    // memo: Rxを設定した直後の周期は、反映前の値を無線機側の操作と誤認しないよう、読み取りを行わない
    if (!isRxSent && this.cycleCount % this.protocol.pollEveryCycles === 0) {
      await this.protocol.refreshAutoInfo(this.io);
      const rx = await this.protocol.readRx(this.io);
      if (rx) {
        this.applyRx(rx.freqHz, rx.modeText, false);
      }
    }
  }

  /**
   * Rxの周波数、運用モードの要求を、無線機へ送信する
   * @returns 周波数、または運用モードを送信した場合はtrue
   */
  private async sendRx(): Promise<boolean> {
    if (!this.state.isRxUpdate()) {
      return false;
    }

    let isSent = false;

    if (this.state.isReqRxFreqUpdate) {
      const freqHz = this.state.getReqRxFreqHz();
      AppMainLogger.debug(`${this.comId}：Rx周波数（RST→無線機） ${freqHz}`);
      if (await this.protocol.setFreq(this.io, "RX", freqHz)) {
        this.state.isReqRxFreqUpdate = false;
        // 無線機の分解能に丸めた値を、無線機側の値として保持する（次の読み取りで、変化と誤認しないため）
        const rounded = this.roundFreq(freqHz);
        this.state.setRecvRxFreqHz(rounded);
        this.state.markRxSent(rounded, null);
        isSent = true;
      }
    }

    if (this.state.isReqRxModeUpdate) {
      const modeText = this.state.getReqRxMode();
      AppMainLogger.debug(`${this.comId}：Rx運用モード（RST→無線機） ${modeText}`);
      if (await this.protocol.setMode(this.io, "RX", modeText)) {
        this.state.isReqRxModeUpdate = false;
        this.state.markRxSent(null, modeText);
        isSent = true;
      }
    }

    return isSent;
  }

  /**
   * Txの周波数、運用モードの要求を、無線機へ送信する（サテライトモードの場合のみ）
   */
  private async sendTx(): Promise<void> {
    if (!this.state.isSatelliteMode || !this.state.isTxUpdate()) {
      return;
    }

    if (this.state.isReqTxFreqUpdate) {
      const freqHz = this.state.getReqTxFreqHz();
      // 前回送信した値からの変化が小さい場合は、送信しない（Tx周波数の設定が受信に影響する機種で、設定の頻度を抑えるため）
      const thresholdHz = this.protocol.getTxFreqSendThresholdHz(this.state.currentTxMode);
      if (!this.state.shouldSendTxFreq(thresholdHz)) {
        this.state.skipTxFreq();
      } else {
        AppMainLogger.debug(`${this.comId}：Tx周波数（RST→無線機） ${freqHz}`);
        if (await this.protocol.setFreq(this.io, "TX", freqHz)) {
          this.state.markTxFreqSent(freqHz);
        }
      }
    }

    if (this.state.isReqTxModeUpdate) {
      const modeText = this.state.getReqTxMode();
      AppMainLogger.debug(`${this.comId}：Tx運用モード（RST→無線機） ${modeText}`);
      if (await this.protocol.setMode(this.io, "TX", modeText)) {
        this.state.isReqTxModeUpdate = false;
      }
    }
  }

  /**
   * TONE設定を無線機に送信する
   */
  private async setupTone(modeText: string | null, toneHz: number | null): Promise<void> {
    // 運用モードがTONE設定可能なモードでない場合（FM、FM-D以外の場合）はTONE Offを送信して処理終了
    // memo: FM、FM-DでのみTONE設定が可能なため
    if (modeText !== Constant.Transceiver.OpeMode.FM && modeText !== Constant.Transceiver.OpeMode.FM_D) {
      await this.protocol.setTone(this.io, null);
      return;
    }

    AppMainLogger.debug(`TONE設定（RST→無線機） ${toneHz ? toneHz : "Off"}`);
    await this.protocol.setTone(this.io, toneHz ? toneHz : null);
  }

  /**
   * 無線機から受信したRxの周波数、運用モードを処理する
   * 無線機側の操作で変更されたと判断した場合は、RST側へ通知し、RSTから無線機への送信を一時停止する。
   * @param freqHz 周波数（Hz）。通知されていない場合はnull
   * @param modeText 運用モード。通知されていない場合、およびRSTで扱えないモードの場合はnull
   * @param isInitial 起動時、およびサテライトモード切替時の取得か（変化の有無によらず通知し、一時停止はしない）
   */
  private applyRx(freqHz: number | null, modeText: string | null, isInitial: boolean): void {
    let isFreqChanged = false;
    let isModeChanged = false;
    let rxFreqHz = this.state.getRecvRxFreqHz();

    // 周波数
    // memo: RST側から周波数の設定要求がある場合は、RST側を優先し、無線機からの受信データは無視する。
    if (freqHz !== null && freqHz > 0 && !this.state.isReqRxFreqUpdate) {
      const recvFreqHz = this.roundFreq(freqHz);

      // 前回の値から、アマチュアバンドをまたぐ変化があった場合は、無線機側でVFOが切り替えられたとみなし、反映しない
      if (!isInitial && this.isVfoJump(this.state.getRecvRxFreqHz(), recvFreqHz)) {
        AppMainLogger.warn(
          `無線機のVFOが切り替えられた可能性があるため、無線機から取得した周波数を反映しません。前回=${this.state.getRecvRxFreqHz()}Hz, 今回=${recvFreqHz}Hz`
        );
        return;
      }

      if (isInitial) {
        isFreqChanged = true;
      } else if (recvFreqHz !== this.state.getRecvRxFreqHz() && !this.state.isEchoOfSentRxFreq(recvFreqHz)) {
        isFreqChanged = true;
      }
      this.state.setRecvRxFreqHz(recvFreqHz);
      rxFreqHz = recvFreqHz;
    }

    // 運用モード
    // memo: RST側から運用モードの設定要求がある場合は、RST側を優先し、無線機からの受信データは無視する。
    if (modeText && !this.state.isReqRxModeUpdate) {
      const resolved = this.protocol.resolveRecvMode(modeText, this.state.currentRxMode);
      if (isInitial) {
        isModeChanged = true;
      } else if (resolved !== this.state.currentRxMode && !this.state.isEchoOfSentRxMode(resolved)) {
        isModeChanged = true;
      }
      this.state.currentRxMode = resolved;
    }

    if (isFreqChanged) {
      AppMainLogger.debug(`${this.comId}：Rx周波数（無線機→RST） ${rxFreqHz}`);
      this.notifyFreq(rxFreqHz);
      if (!isInitial) {
        // 無線機側の操作の場合は、レンダラ側のドップラーシフト補正を待機させ、RSTからの送信を一時停止する
        this.notifyDopplerShiftWaiting();
        this.waitTimer.start(Constant.Transceiver.TRANSCEIVE_WAIT_MS);
      }
    }
    if (isModeChanged) {
      AppMainLogger.debug(`${this.comId}：Rx運用モード（無線機→RST） ${this.state.currentRxMode}`);
      this.notifyMode(this.state.currentRxMode);
      if (!isInitial) {
        this.waitTimer.start(Constant.Transceiver.TRANSCEIVE_MODE_WAIT_MS);
      }
    }
  }

  /**
   * 無線機から取得した周波数が、無線機側でVFOが切り替えられたことによる変化かを判定する
   * 前回の値、およびRSTが直近に要求したRx周波数のいずれとも、アマチュアバンドが異なる場合は、VFOが切り替えられたとみなす。
   * memo: RSTが別のバンドの周波数を設定した直後の読み取りを、VFOの切り替えと誤認しないため、RSTの要求値も比較する。
   */
  private isVfoJump(prevFreqHz: number, recvFreqHz: number): boolean {
    // 前回の値が未取得の場合は判定しない
    if (!prevFreqHz) {
      return false;
    }

    const recvBand = TransceiverUtil.analizeAmateurBandRange(recvFreqHz);
    if (recvBand === TransceiverUtil.analizeAmateurBandRange(prevFreqHz)) {
      return false;
    }

    const reqFreqHz = this.state.getReqRxFreqHz();
    if (reqFreqHz && recvBand === TransceiverUtil.analizeAmateurBandRange(reqFreqHz)) {
      return false;
    }

    return true;
  }

  /**
   * 周波数を、無線機のCAT周波数の分解能に丸める
   */
  private roundFreq(freqHz: number): number {
    const resolution = this.protocol.freqResolutionHz;
    return Math.round(freqHz / resolution) * resolution;
  }

  /**
   * 無線機から受信した周波数をレンダラ側へ通知する
   * サテライトモードOffの場合はアップリンク、Onの場合はダウンリンクとして通知する。
   */
  private notifyFreq(freqHz: number): void {
    if (!this.freqCallback) {
      return;
    }

    const res = new ApiResponse<UplinkType | DownlinkType>(true);
    if (this.state.isSatelliteMode) {
      res.data = { downlinkHz: freqHz, downlinkMode: "" } as DownlinkType;
    } else {
      res.data = { uplinkHz: freqHz, uplinkMode: "" } as UplinkType;
    }
    this.freqCallback(res);
  }

  /**
   * 無線機から受信した運用モードをレンダラ側へ通知する
   * サテライトモードOffの場合はアップリンク、Onの場合はダウンリンクとして通知する。
   */
  private notifyMode(modeText: string): void {
    if (!this.modeCallback) {
      return;
    }

    const res = new ApiResponse<UplinkType | DownlinkType>(true);
    if (this.state.isSatelliteMode) {
      res.data = { downlinkHz: null, downlinkMode: modeText } as DownlinkType;
    } else {
      res.data = { uplinkHz: null, uplinkMode: modeText } as UplinkType;
    }
    this.modeCallback(res);
  }

  /**
   * 応答待ちではないフレーム（自動通知）の受信
   */
  private onNotifyFrame(frame: Buffer): void {
    const notifies: YaesuNotify[] = this.protocol.parseNotify(frame);
    for (const notify of notifies) {
      switch (notify.type) {
        case "FREQ":
          this.applyRx(notify.freqHz, null, false);
          break;
        case "MODE":
          this.applyRx(null, notify.modeText, false);
          break;
        case "ERROR":
          AppMainLogger.warn(`無線機からエラー応答を受信しました。 ${frame.toString("ascii")}`);
          break;
      }
    }
  }

  /**
   * 起動時の応答タイムアウトチェック
   * 起動から一定時間が経過しても、無線機から一度も受信がない場合は、定期処理とシリアル接続を停止し、
   * レンダラ側へ受信タイムアウトを通知する（ボーレートの設定違い、無線機の電源Offなどが想定される）。
   * @returns タイムアウトしていない場合はtrue
   */
  private async checkRecvTimeout(): Promise<boolean> {
    // 既にデータ受信済みであればOK
    if (this.io.hasReceived()) {
      return true;
    }

    // タイムアウト前の場合はOK
    const nowSec = new Date().getTime() / 1000;
    if (this.startSec + RECV_TIMEOUT_SEC_FOR_BOOT > nowSec) {
      return true;
    }

    // タイムアウト
    AppMainLogger.warn(
      `無線機への接続開始から${RECV_TIMEOUT_SEC_FOR_BOOT}秒経過しましたが、無線機から応答がないため、無線機の監視を停止します。`
    );

    // 定期処理を停止し、シリアルを切断する
    this.cancelTimer();
    await super.stop();

    // コールバック呼び出し
    this.notifyRecvTimeoutError();

    return false;
  }
}
