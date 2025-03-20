import Constant from "@/common/Constant";
import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";
import { StringMap } from "@/common/types/types";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import ElectronUtil from "@/main/util/ElectronUtil";
import FileUtil from "@/main/util/FileUtil";
import fs from "fs";
import path from "path";

/**
 * デフォルト衛星定義サービス（DefaultSatelliteService）のキャッシュサービス
 */
export default class DefaultSatelliteCacheService {
  private static cachedService: DefaultSatelliteService;
  // defaultSatellite.jsonの更新日時
  private static jsonFileUpdateDate: number = 0;
  // NORAD IDとデフォルト衛星定義の紐づけマップのキャッシュ
  private static noradIdDefSatCacheMap: StringMap<DefaultSatelliteType> = {};

  /**
   * NORAD IDからデフォルト衛星定義を取得する
   * キャッシュがあればキャッシュ値を返す
   */
  public getDefaultSatelliteBySatelliteIdSync(satId: number): DefaultSatelliteType | null {
    const satIdStr = satId.toString();

    // キャッシュがあればキャッシュ値を返す
    if (satIdStr in DefaultSatelliteCacheService.noradIdDefSatCacheMap) {
      return DefaultSatelliteCacheService.noradIdDefSatCacheMap[satIdStr];
    }

    // サービスを取得
    const service = this.getService();
    if (!service) {
      return null;
    }

    // NORAD IDからデフォルト衛星定義を取得
    const defSat = service.getDefaultSatelliteBySatelliteIdSync(satId);
    if (!defSat) {
      return null;
    }

    // キャッシュに保存
    DefaultSatelliteCacheService.noradIdDefSatCacheMap[satIdStr] = defSat;

    return defSat;
  }

  /**
   * デフォルト衛星定義サービスを取得する
   * キャッシュがあればキャッシュのサービスを返す
   */
  private getService(): DefaultSatelliteService | null {
    // デフォルト衛星定義が保存されたパスを取得する
    const savePathSat = path.join(ElectronUtil.getUserDir(), Constant.Config.DEFAULT_SATELLITE_FILENAME);
    if (!fs.existsSync(savePathSat)) {
      return null;
    }

    const service = DefaultSatelliteCacheService.cachedService;
    const updateAt = FileUtil.updateAt(savePathSat).getTime();

    // キャッシュあり、ファイル更新日時が同じ場合はキャッシュ値を返す
    if (service && DefaultSatelliteCacheService.jsonFileUpdateDate === updateAt) {
      return service;
    }

    // キャッシュを再設定
    DefaultSatelliteCacheService.cachedService = new DefaultSatelliteService();
    DefaultSatelliteCacheService.jsonFileUpdateDate = updateAt;
    DefaultSatelliteCacheService.noradIdDefSatCacheMap = {};

    return DefaultSatelliteCacheService.cachedService;
  }
}
