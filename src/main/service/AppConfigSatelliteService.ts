import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { ApiResponse } from "@/common/types/types";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import { FileTransaction } from "@/main/util/FileTransaction";
import FileUtil from "@/main/util/FileUtil";

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
  public async store(config: AppConfigSatSettingModel, isTleUpdate: boolean = false): Promise<ApiResponse<void>> {
    // アプリケーション設定ファイルはユーザが直接編集する可能性があるため、ロックされている場合は更新しない
    if (FileUtil.isFileLocked(AppConfigUtil.getConfigPath())) {
      return new ApiResponse(false, I18nMsgs.ERR_APPCONFIG_UPDATE_FOR_LOCKED);
    }
    if (!isTleUpdate) {
      // TLE更新がなければ単純に保存
      AppConfigUtil.storeConfigSatSetting(config);
      return new ApiResponse(true);
    }

    const transaction = new FileTransaction("appConfigSatSet");
    // default衛星更新中にエラーになると衛星設定だけが更新された状態になるため一時保存しておく
    transaction.update(config);

    const res = await new DefaultSatelliteService().reCreateDefaultSatellite();
    if (!res.status) {
      transaction.rollback();
      return res;
    }
    // default衛星が更新できたらコミット
    transaction.commit();
    return new ApiResponse(true);
  }
}
