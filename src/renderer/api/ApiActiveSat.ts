import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel";

/**
 * メイン表示する衛星関係のレンダラ側API
 */
export default class ApiActiveSat {
  /**
   * メイン表示する衛星グループ、衛星ID情報を返す
   */
  public static async getActiveSatelliteGroup(): Promise<ActiveSatelliteGroupModel> {
    return await window.rstApi.getActiveSatelliteGroup();
  }

  /**
   * 衛星グループ、衛星ID情報を更新した場合にコールする
   */
  public static async refreshAppConfig(): Promise<void> {
    await window.rstApi.refreshAppConfig();
  }

  /**
   * メイン表示する衛星グループ、衛星ID情報が保存された場合の変更イベント
   */
  public static async onChangeActiveSatelliteGroup(callback: Function) {
    await window.rstApi.onChangeActiveSatelliteGroup(callback);
  }
}
