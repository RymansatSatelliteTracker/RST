import Constant from "@/common/Constant";
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
   * @param groupId
   * @returns null:一致するデフォルト衛星がない
   *          デフォルト衛星情報:アプリケーション設定がない
   *          アプリケーション設定の衛星:アプリケーション設定がある
   */
  public getUserRegisteredAppConfigSatellite(satelliteId: number, groupId: number): AppConfigSatellite | null {
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

    // デフォルトグループの衛星を探す
    let satellite = appConfig.satellites.find(
      (sat: AppConfigSatellite) =>
        sat.satelliteId === satelliteId && sat.groupId === Constant.SatSetting.DEFAULT_SATELLITE_GROUP_ID
    );

    // グループIDが一致する衛星があったら上書き
    satellite = appConfig.satellites.find(
      (sat: AppConfigSatellite) => sat.satelliteId === satelliteId && sat.groupId === groupId
    );

    if (satellite) {
      AppConfigUtil.copyMatchingProperties(appConfigSatellite, satellite);
    }
    return appConfigSatellite;
  }
}
