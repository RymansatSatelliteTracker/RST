import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";

/**
 * 無線機関係のレンダラ側API
 */
export default class ApiTransceiver {
  /**
   * 無線機の監視を開始する
   * @param reqTransceiverConfig 無線機設定（テストモード向け。省略時はAppConfigの設定値で起動される）
   */
  public static async startCtrl(reqTransceiverConfig: AppConfigTransceiver | null = null): Promise<ApiResponse<void>> {
    return await window.rstApi.startTransceiverCtrl(reqTransceiverConfig);
  }

  /**
   * 無線機の監視を終了する
   */
  public static async stopCtrl(): Promise<void> {
    await window.rstApi.stopTransceiverCtrl();
  }

  /**
   * 無線機との接続が準備完了かどうかを返す
   */
  public static async isReady(): Promise<ApiResponse<boolean>> {
    return await window.rstApi.isTransceiverReady();
  }

  /**
   * AutoOn時の初期処理
   */
  public static async transceiverInitAutoOn(
    txFreqHz: number,
    rxFreqHz: number,
    txMode: string,
    rxMode: string,
    toneHz: number | null
  ): Promise<void> {
    await window.rstApi.transceiverInitAutoOn(txFreqHz, rxFreqHz, txMode, rxMode, toneHz);
  }

  /**
   * AutoOff時の初期処理
   */
  public static async transceiverAutoOff(): Promise<void> {
    await window.rstApi.transceiverAutoOff();
  }

  /**
   * 指定の周波数に変更する
   */
  public static async setTransceiverFrequency(frequencyModel: UplinkType | DownlinkType) {
    await window.rstApi.setTransceiverFrequency(frequencyModel);
  }

  /**
   * 周波数の変更イベント
   */
  public static async onChangeTransceiverFrequency(callback: Function) {
    await window.rstApi.onChangeTransceiverFrequency(callback);
  }

  /**
   * 指定の運用モードに変更する
   */
  public static async setTransceiverMode(modeModel: UplinkType | DownlinkType) {
    await window.rstApi.setTransceiverMode(modeModel);
  }

  /**
   * 運用モードの変更イベント
   */
  public static async onChangeTransceiverMode(callback: Function) {
    await window.rstApi.onChangeTransceiverMode(callback);
  }

  /**
   * サテライトモードを変更する
   */
  public static async setSatelliteMode(isSatelliteMode: boolean): Promise<boolean> {
    return await window.rstApi.setSatelliteMode(isSatelliteMode);
  }

  /**
   * ドップラーシフト待機イベント
   */
  public static async dopplerShiftWaitingCallback(callback: Function) {
    await window.rstApi.dopplerShiftWaitingCallback(callback);
  }

  /**
   * 無線機周波数保存イベント
   */
  public static async onSaveTransceiverFrequency(callback: Function) {
    await window.rstApi.onSaveTransceiverFrequency(callback);
  }
}
