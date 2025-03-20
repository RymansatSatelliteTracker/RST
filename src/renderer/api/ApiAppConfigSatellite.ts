import { AppConfigModel, AppConfigSatellite } from "@/common/model/AppConfigModel";

/**
 * アプリケーション設定の衛星関係のレンダラ側API
 */
export default class ApiAppConfigSatellite {
  /**
   * アプリケーション設定の衛星かデフォルト衛星情報を返す
   * @returns
   */
  public static async getUserRegisteredAppConfigSatellite(satelliteId: number): Promise<AppConfigSatellite> {
    return await window.rstApi.getUserRegisteredAppConfigSatellite(satelliteId);
  }
  /**
   * アプリケーション設定の衛星を取得する
   */
  public static async getAppConfigSatellite(satelliteId: number): Promise<AppConfigSatellite | null> {
    const appConfig: AppConfigModel = await window.rstApi.getAppConfig();
    return appConfig.satellites.find((sat) => sat.satelliteId === satelliteId) ?? null;
  }
}
