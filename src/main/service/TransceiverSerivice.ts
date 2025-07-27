import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";
import { getMainWindow } from "@/main/main";
import TransceiverControllerBase from "@/main/service/transceiver/controller/TransceiverControllerBase";
import TransceiverControllerFactory from "@/main/service/transceiver/controller/TransceiverControllerFactory";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

/**
 * 無線機サービス
 * 例外的にシングルトンです。
 */
export default class TransceiverService {
  // シングルトンインスタンス
  private static instance: TransceiverService;

  // 現在の無線機コントローラ
  private controller: TransceiverControllerBase | null = null;

  /**
   * シングルトンのため、コンストラクタは隠蔽
   */
  private constructor() {}

  /**
   * シングルトンインタンスを返す
   * @returns
   */
  public static getInstance() {
    // 複数スレッドでの同時呼び出しは考慮しない
    // memo: 初回呼び出しはアプリ起動時の想定。単一スレッドからの呼び出しとなるため考慮不要
    if (!TransceiverService.instance) {
      TransceiverService.instance = new TransceiverService();
    }
    return TransceiverService.instance;
  }

  /**
   * 最新の設定ファイルをもとに起動処理などを行う
   * @param reqTransceiverConfig 無線機設定（テストモード向け。省略時はAppConfigの設定値を参照数する）
   */
  public async restart(reqTransceiverConfig: AppConfigTransceiver | null = null): Promise<ApiResponse<void>> {
    let transceiverConfig;

    // 引数で無線機設定が指定されている場合は、その設定を使用
    // memo: 無線機設定画面のテストモード向け
    if (reqTransceiverConfig) {
      transceiverConfig = reqTransceiverConfig;
    } else {
      // 引数で無線機設定が指定されいない場合は、AppConfigで設定されている無線機設定を使用する
      transceiverConfig = AppConfigUtil.getConfig().transceiver;

      // 無線機が未設定の場合は何もしない
      if (CommonUtil.isEmpty(transceiverConfig.makerId)) {
        return new ApiResponse();
      }
    }

    // 無線機を変更する
    await this.changeDevice(transceiverConfig);

    if (!this.controller) {
      return new ApiResponse(false, I18nMsgs.SYSTEM_UNEXPECTED_ERROR);
    }

    this.controller.setFrequencyCallback(this.onChangeTransceiverFrequency);
    this.controller.setModeCallback(this.onChangeTransceiverMode);
    this.controller.setIsDopplerShiftWaitingCallback(this.dopplerShiftWaitingCallback);
    return await this.controller.start();
  }

  /**
   * 無線機の接続を終了する
   */
  public async stop() {
    if (!this.controller) {
      return;
    }
    await this.controller.stop();
  }

  /**
   * 無線機関係・AutoOn時の初期処理
   */
  public async initAutoOn(txFreqHz: number, rxFreqHz: number) {
    if (!this.controller) {
      return;
    }

    // AutoOnの初期処理を実行する
    await this.controller.initAutoOn(txFreqHz, rxFreqHz);
  }

  /**
   * 無線機を変更する
   * @param transceiverConfig 無線機設定
   */
  public async changeDevice(transceiverConfig: AppConfigTransceiver) {
    // デバイスの切断、コールバックの解除
    this.resetDevice();

    // コントローラを設定し直す
    this.controller = await TransceiverControllerFactory.getController(transceiverConfig);
  }

  /**
   * 無線機周波数の変更イベントを設定する
   */
  private onChangeTransceiverFrequency(res: ApiResponse<UplinkType | DownlinkType>) {
    getMainWindow().webContents.send("onChangeTransceiverFrequency", res);
  }

  /**
   * 無線機モードの変更イベントを設定する
   */
  private onChangeTransceiverMode(res: ApiResponse<UplinkType | DownlinkType>) {
    getMainWindow().webContents.send("onChangeTransceiverMode", res);
  }

  /**
   * 無線機の周波数の変動コールバックを設定する
   */
  public setFrequencyCallback(callback: Function) {
    if (!this.isReady()) {
      return;
    }

    this.controller?.setFrequencyCallback(callback);
  }

  /**
   * 無線機の運用モードの変動コールバックを設定する
   */
  public setModeCallback(callback: Function) {
    if (!this.isReady()) {
      return;
    }

    this.controller?.setModeCallback(callback);
  }

  /**
   * ドップラーシフト待機イベントを設定する
   */
  private dopplerShiftWaitingCallback(res: ApiResponse<UplinkType | DownlinkType>) {
    getMainWindow().webContents.send("dopplerShiftWaitingCallback", res);
  }

  /**
   * 無線機からの周波数データ(トランシーブ)受信があった場合はドップラーシフトを待機するコールバックを設定する
   */
  public setIsDopplerShiftWaitingCallback(callback: Function) {
    if (!this.isReady()) {
      return;
    }

    this.controller?.setIsDopplerShiftWaitingCallback(callback);
  }

  /**
   * 無線機機器の制御を解除する
   */
  public async resetDevice() {
    if (!this.isReady()) {
      return;
    }

    this.controller?.unsetCallback();
    await this.controller?.stop();
  }

  /**
   * 無線機周波数を変更する
   * @param {(UplinkType | DownlinkType)} frequencyModel 周波数設定
   */
  public async setTransceiverFrequency(frequencyModel: UplinkType | DownlinkType) {
    if (!this.isReady()) {
      return;
    }

    await this.controller?.setFreq(frequencyModel);
  }

  /**
   * 無線機モードを変更する
   * @param {(UplinkType | DownlinkType)} modeModel 運用モード設定
   */
  public setTransceiverMode(modeModel: UplinkType | DownlinkType) {
    if (!this.isReady()) {
      return;
    }

    this.controller?.setMode(modeModel);
  }

  /**
   * サテライトモードを変更する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public setSatelliteMode(isSatelliteMode: boolean) {
    if (!this.isReady()) {
      return;
    }

    this.controller?.setSatelliteMode(isSatelliteMode);
  }

  /**
   * 無線機制御が可能な状態か判定する
   */
  private isReady() {
    // TransceiverControllerが設定されているか？のみで判定
    return this.controller;
  }
}
