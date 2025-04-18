import { AppConfigModel, AppConfigSatellite } from "@/common/model/AppConfigModel";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

/**
 * アプリケーション設定衛星サービス
 */
export default class AppConfigSatelliteService {
  /**
   * 衛星IDでデフォルト衛星情報とアプリケーション設定を検索してデータがあるものを返す
   * @param satelliteId
   * @returns null:一致するデフォルト衛星がない
   *          デフォルト衛星情報:アプリケーション設定がない
   *          アプリケーション設定の衛星:アプリケーション設定がある
   */
  public getUserRegisteredAppConfigSatellite(satelliteId: number): AppConfigSatellite | null {
    const defSatService: DefaultSatelliteService = new DefaultSatelliteService();
    const defSat = defSatService.getDefaultSatelliteBySatelliteIdSync(satelliteId);

    const appConfigSatellite = new AppConfigSatellite();

    // デフォルト衛星情報がなければそこで抜ける
    if (!defSat) return null;

    AppConfigUtil.copyMatchingProperties(appConfigSatellite, defSat);
    appConfigSatellite.userRegisteredSatelliteName = defSat.satelliteName;

    // アプリケーション設定の衛星があれば設定する
    const appConfig: AppConfigModel = AppConfigUtil.getConfig();
    if (!appConfig) return appConfigSatellite;

    const satellite = appConfig.satellites.find((sat: AppConfigSatellite) => sat.satelliteId === satelliteId);
    if (satellite) {
      AppConfigUtil.copyMatchingProperties(appConfigSatellite, satellite);
    }
    return appConfigSatellite;
  }
}
