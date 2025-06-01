import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigRotator } from "@/common/model/AppConfigModel";

/**
 * ローテータのヘルパー
 */
export default class RotatorHelper {
  /**
   * 指定のposがローテータ設定の仰角、方位の範囲内か判定する
   */
  public static isWithinRange(rotatorConfig: AppConfigRotator, pos: AntennaPositionModel): boolean {
    // 指定のローテータ設定が範囲外の場合は何もしない
    if (!this.isWithinRangeAz(rotatorConfig, pos.azimuth)) {
      return false;
    }
    if (!this.isWithinRangeEl(rotatorConfig, pos.elevation)) {
      return false;
    }
    return true;
  }

  /**
   * 指定のazがローテータ設定の仰角範囲内か判定する
   */
  public static isWithinRangeAz(rotatorConfig: AppConfigRotator, az: number): boolean {
    if (az < rotatorConfig.rangeAzMin) {
      return false;
    }
    if (az > rotatorConfig.rangeAzMax) {
      return false;
    }
    return true;
  }

  /**
   * 指定のelがローテータ設定の仰角範囲内か判定する
   */
  public static isWithinRangeEl(rotatorConfig: AppConfigRotator, el: number): boolean {
    if (el < rotatorConfig.rangeElMin) {
      return false;
    }
    if (el > rotatorConfig.rangeElMax) {
      return false;
    }
    return true;
  }
}
