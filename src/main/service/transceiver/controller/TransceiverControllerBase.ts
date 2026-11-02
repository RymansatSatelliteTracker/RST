import I18nMsgs from "@/common/I18nMsgs.js";
import type { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import { ApiResponse } from "@/common/types/types.js";

/**
 * 無線機のコントローラ親クラス
 */
export default abstract class TransceiverControllerBase {
  protected freqCallback: ((res: ApiResponse<UplinkType | DownlinkType>) => void) | null = null;
  protected modeCallback: ((res: ApiResponse<UplinkType | DownlinkType>) => void) | null = null;
  protected isDopplerShiftWaitingCallback: ((res: ApiResponse<boolean>) => void) | null = null;

  /**
   * 無線機の監視、操作を開始する
   */
  public abstract start(): Promise<ApiResponse<void>>;

  /**
   * 無線機の監視、操作を終了する
   */
  public abstract stop(): Promise<void>;

  /**
   * 無線機との接続が準備完了かどうかを返す
   */
  public abstract isReady(): boolean;

  /**
   * 無線機関係・AutoOn時の初期処理
   */
  public abstract initAutoOn(
    txFreqHz: number,
    rxFreqHz: number,
    txMode: string,
    rxMode: string,
    toneHz: number | null
  ): Promise<void>;

  /**
   * 無線機関係・AutoOff
   */
  public abstract autoOff(): Promise<void>;

  /**
   * 無線機に送信する周波数を設定する
   * @param {(UplinkType | DownlinkType)} frequencyModel 周波数設定
   * @param {boolean} isForce 強制設定（同一周波数でも強制的に無線機へ送信する場合はtrueを指定する）
   */
  public abstract setFreq(frequencyModel: UplinkType | DownlinkType, isForce?: boolean): Promise<void>;

  /**
   * 無線機に送信する運用モードを設定する
   * @param {(UplinkType | DownlinkType)} modeModel 運用モード設定
   */
  public abstract setMode(modeModel: UplinkType | DownlinkType): Promise<void>;

  /**
   * 無線機に送信するサテライトモードを設定する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public abstract setSatelliteMode(isSatelliteMode: boolean): Promise<boolean>;

  /**
   * 無線機の周波数を呼び出し側に伝播させるためのコールバックを設定する
   */
  public setFrequencyCallback(callback: (res: ApiResponse<UplinkType | DownlinkType>) => void): void {
    this.freqCallback = callback;
  }

  /**
   * 無線機の運用モードの変更を呼び出し側に伝播させるためのコールバックを設定する
   */
  public setModeCallback(callback: (res: ApiResponse<UplinkType | DownlinkType>) => void): void {
    this.modeCallback = callback;
  }

  /**
   * 無線機からの周波数データ(トランシーブ)受信があった場合はドップラーシフトを待機するコールバックを設定する
   */
  public setIsDopplerShiftWaitingCallback(callback: (res: ApiResponse<boolean>) => void): void {
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

  /**
   * レンダラ側のドップラーシフト補正を待機させる
   */
  protected notifyDopplerShiftWaiting(): void {
    if (!this.isDopplerShiftWaitingCallback) {
      return;
    }

    const res = new ApiResponse<boolean>(true);
    res.data = true;
    this.isDopplerShiftWaitingCallback(res);
  }

  /**
   * 無線機からの受信タイムアウトを、周波数、運用モードのコールバックに失敗として通知する
   */
  protected notifyRecvTimeoutError(): void {
    if (this.freqCallback) {
      const res = new ApiResponse<UplinkType | DownlinkType>(false, I18nMsgs.SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT);
      this.freqCallback(res);
    }
    if (this.modeCallback) {
      const res = new ApiResponse<UplinkType | DownlinkType>(false, I18nMsgs.SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT);
      this.modeCallback(res);
    }
  }
}
