import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import DateUtil from "@/renderer/util/DateUtil.js";

/**
 * 自動追尾関係のヘルパ
 */
export default class AutoTrackingHelper {
  /**
   * ローテータの自動追尾の時間帯か判定する
   * @param baseDate 基準時間
   */
  public static async isRotatorTrackingTimeRange(appConfig: AppConfigModel, baseDate: Date): Promise<boolean> {
    // 現在の基準日時を元に、追尾開始・終了時間を加味した基準日時を取得する
    const offsetDate = this.getRotatorOffsetBaseDate(appConfig, baseDate);

    // パスを取得
    const currentPass = await ActiveSatServiceHub.getInstance().getOrbitPassAsync(offsetDate);
    if (!currentPass || !currentPass.aos || !currentPass.los) {
      return false;
    }

    // ローテータ自動追尾の開始・終了時刻を取得
    const addMinute = appConfig.rotator.startAgoMinute ?? 0;

    // 自動追尾の開始時刻は「AOS - startAgoMinute」
    const trackingStartDate = DateUtil.addMinute(currentPass.aos.date, addMinute * -1);
    // 自動追尾の終了時刻は「LOS + startAgoMinute」
    const trackingEndDate = DateUtil.addMinute(currentPass.los.date, addMinute);

    // 自動追尾の時間範囲内
    if (trackingStartDate.getTime() <= baseDate.getTime() && baseDate.getTime() <= trackingEndDate.getTime()) {
      return true;
    }

    // 自動追尾の時間範囲外
    return false;
  }

  /**
   * 無線機の自動追尾の時間帯か判定する
   * @param baseDate 基準時間
   */
  public static async isTransceiverTrackingTimeRange(appConfig: AppConfigModel, baseDate: Date): Promise<boolean> {
    // 現在の基準日時を元に、追尾開始・終了時間を加味した基準日時を取得する
    const offsetDate = this.getTransceiverOffsetBaseDate(appConfig, baseDate);

    // 指定の日時から最も近いパスを取得
    const currentPass = await ActiveSatServiceHub.getInstance().getOrbitPassAsync(offsetDate);
    // パスが取得できない場合は自動追尾の時間帯とみなさない
    if (!currentPass || !currentPass.aos || !currentPass.los) {
      return false;
    }

    // 無線機自動追尾の開始・終了時刻を取得
    const addMinute = this.getTransceiverTrackingOffsetMinute(appConfig);

    // 自動追尾の開始時刻は「AOS - autoTrackingStartEndTime」
    const trackingStartDate = DateUtil.addMinute(currentPass.aos.date, addMinute * -1);
    // 自動追尾の終了時刻は「LOS + autoTrackingStartEndTime」
    const trackingEndDate = DateUtil.addMinute(currentPass.los.date, addMinute);

    // 自動追尾の時間範囲内
    if (trackingStartDate.getTime() <= baseDate.getTime() && baseDate.getTime() <= trackingEndDate.getTime()) {
      return true;
    }

    // 自動追尾の時間範囲外
    return false;
  }

  /**
   * 指定の基準日時を元に、追尾開始・終了時間を加味した基準日時を返す
   * ※追尾開始・終了時間はローテータと無線機の大きい方を採用する
   */
  public static getOffsetBaseDate(appConfig: AppConfigModel, baseDate: Date): Date {
    // ローテータと無線機の自動追尾開始・終了時刻を比較して大きい方を採用する
    const rotatorOffsetMinute = this.getRotatorTrackingOffsetMinute(appConfig);
    const transceiverOffsetMinute = this.getTransceiverTrackingOffsetMinute(appConfig);
    const offsetMinute = Math.max(rotatorOffsetMinute, transceiverOffsetMinute);
    const offsetSec = offsetMinute * 60;

    // 基準日時から追尾開始時間を引く
    return DateUtil.addSec(baseDate, offsetSec * -1);
  }

  /**
   * 指定の基準日時を元に、ローテータの追尾開始・終了時間を加味した基準日時を返す
   */
  public static getRotatorOffsetBaseDate(appConfig: AppConfigModel, baseDate: Date): Date {
    const offsetMinute = this.getRotatorTrackingOffsetMinute(appConfig);
    const offsetSec = offsetMinute * 60;

    // 基準日時から追尾開始時間を引く
    return DateUtil.addSec(baseDate, offsetSec * -1);
  }

  /**
   * 指定の基準日時を元に、無線機の追尾開始・終了時間を加味した基準日時を返す
   */
  public static getTransceiverOffsetBaseDate(appConfig: AppConfigModel, baseDate: Date): Date {
    const offsetMinute = this.getTransceiverTrackingOffsetMinute(appConfig);
    const offsetSec = offsetMinute * 60;

    // 基準日時から追尾開始時間を引く
    return DateUtil.addSec(baseDate, offsetSec * -1);
  }

  /**
   * ローテータの自動追尾の開始・終了オフセット分を取得する
   */
  private static getRotatorTrackingOffsetMinute(appConfig: AppConfigModel): number {
    return appConfig.rotator.startAgoMinute ?? 0;
  }

  /**
   * 無線機の自動追尾の開始・終了オフセット分を取得する
   */
  private static getTransceiverTrackingOffsetMinute(appConfig: AppConfigModel): number {
    const offsetMinute = Number.parseInt(appConfig.transceiver.autoTrackingStartEndTime, 10);

    // 未設定や数値以外の場合は1分とする
    return Number.isNaN(offsetMinute) ? 1 : offsetMinute;
  }
}
