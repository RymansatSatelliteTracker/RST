import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import { FileTransaction } from "@/main/util/FileTransaction";

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
    const satellite: AppConfigSatellite | null = AppConfigUtil.searchAppConfigSatellite(satelliteId, groupId);
    if (!satellite) return appConfigSatellite;

    AppConfigUtil.copyMatchingProperties(appConfigSatellite, satellite);

    return appConfigSatellite;
  }

  /**
   * 衛星設定を保存する
   * @param config
   * @param isTLEUpdate TLE更新の場合はtrue
   */
  public store(config: AppConfigSatSettingModel, isTLEUpdate: boolean = false) {
    if (!isTLEUpdate) {
      // TLE更新がなければ単純に保存
      AppConfigUtil.storeConfigSatSetting(config);
    }
    const transaction = new FileTransaction("appConfigSatSet");
    try {
      // default衛星更新中にエラーになると衛星設定だけが更新された状態になるため一時保存しておく
      transaction.begin();
      transaction.update(config);
      const defSatService: DefaultSatelliteService = new DefaultSatelliteService();
      defSatService.reCreateDefaultSatellite();
      // default衛星が更新できたらコミット
      transaction.commit();
    } catch (error) {
      transaction.rollback();
      throw error;
    }
  }
}
