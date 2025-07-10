import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";

/**
 * 無線機のコントローラ親クラス
 */
export default abstract class TransceiverControllerBase {
  protected freqCallback: Function | null = null;
  protected modeCallback: Function | null = null;
  protected isDopplerShiftWaitingCallback: Function | null = null;

  /**
   * 無線機の監視、操作を開始する
   */
  public abstract start(): Promise<ApiResponse<void>>;

  /**
   * 無線機の監視、操作を終了する
   */
  public abstract stop(): Promise<void>;

  /**
   * 無線機関係・AutoOn時の初期処理
   */
  public abstract initAutoOn(txFreqHz: number, rxFreqHz: number): Promise<void>;

  /**
   * 無線機に送信する周波数を設定する
   * @param {(UplinkType | DownlinkType)} frequencyModel 周波数設定
   */
  public abstract setFreq(frequencyModel: UplinkType | DownlinkType): Promise<void>;

  /**
   * 無線機に送信する運用モードを設定する
   * @param {(UplinkType | DownlinkType)} modeModel 運用モード設定
   */
  public abstract setMode(modeModel: UplinkType | DownlinkType): Promise<void>;

  /**
   * 無線機に送信するサテライトモードを設定する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public abstract setSatelliteMode(isSatelliteMode: boolean): Promise<void>;

  /**
   * 無線機の周波数を呼び出し側に伝播させるためのコールバックを設定する
   */
  public setFrequencyCallback(callback: Function): void {
    this.freqCallback = callback;
  }

  /**
   * 無線機の運用モードの変更を呼び出し側に伝播させるためのコールバックを設定する
   */
  public setModeCallback(callback: Function): void {
    this.modeCallback = callback;
  }

  /**
   * 無線機からの周波数データ(トランシーブ)受信があった場合はドップラーシフトを待機するコールバックを設定する
   */
  public setIsDopplerShiftWaitingCallback(callback: Function): void {
    this.isDopplerShiftWaitingCallback = callback;
  }

  /**
   * コールバックを解除する
   */
  public unsetCallback(): void {
    this.freqCallback = null;
    this.modeCallback = null;
    this.isDopplerShiftWaitingCallback = null;
  }
}
