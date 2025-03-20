import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";

/**
 * 無線機のコントローラ親クラス
 */
export default abstract class TransceiverControllerBase {
  protected frequencyCallback: Function | null = null;
  protected modeCallback: Function | null = null;

  /**
   * 無線機の監視、操作を開始する
   */
  public abstract start(): Promise<ApiResponse<void>>;

  /**
   * 無線機の監視、操作を終了する
   */
  public abstract stop(): Promise<void>;

  /**
   * 無線機に周波数を設定するコマンドを送信する
   * @param {(UplinkType | DownlinkType)} frequencyModel 周波数設定
   */
  public abstract sendFrequencyCommand(frequencyModel: UplinkType | DownlinkType): Promise<void>;

  /**
   * 無線機に運用モードを設定するコマンドを送信する
   * @param {(UplinkType | DownlinkType)} modeModel 運用モード設定
   */
  public abstract sendModeCommand(modeModel: UplinkType | DownlinkType): Promise<void>;

  /**
   * 無線機にサテライトモードを設定するコマンドを送信する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public abstract sendSatelliteModeCommand(isSatelliteMode: boolean): Promise<void>;

  /**
   * 無線機の周波数を呼び出し側に伝播させるためのコールバックを設定する
   */
  public setFrequencyCallback(callback: Function): void {
    this.frequencyCallback = callback;
  }

  /**
   * 無線機の運用モードの変更を呼び出し側に伝播させるためのコールバックを設定する
   */
  public setModeCallback(callback: Function): void {
    this.modeCallback = callback;
  }

  /**
   * コールバックを解除する
   */
  public unsetCallback(): void {
    this.frequencyCallback = null;
    this.modeCallback = null;
  }
}
