import { AppConfigModel } from "@/common/model/AppConfigModel";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import DateUtil from "@/renderer/util/DateUtil";

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
    const offsetDate = this.getOffsetBaseDate(appConfig, baseDate);

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
   * 指定の基準日時を元に、追尾開始・終了時間を加味した基準日時を返す
   */
  public static getOffsetBaseDate(appConfig: AppConfigModel, baseDate: Date): Date {
    // ローテータ自動追尾の開始・終了時刻を取得
    const offsetMinute = appConfig.rotator.startAgoMinute ?? 0;
    const offsetSec = offsetMinute * 60;

    // 基準日時から追尾開始時間を引く
    return DateUtil.addSec(baseDate, offsetSec * -1);
  }
}
