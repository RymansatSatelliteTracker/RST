import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";

/**
 * デフォルト衛星設定関係のレンダラ側API
 */
export default class ApiDefaultSatellite {
  /**
   * 保存済みの衛星識別情報を返す
   * @returns {Promise<SatelliteIdentiferType[]>} TLE文字列
   */
  public static async getSavedSatelliteIdentifer() {
    return await window.rstApi.getSavedSatelliteIdentifer();
  }
  /**
   * 衛星IDに一致するデフォルト衛星情報を取得を返す
   * @param {number} satelliteId 衛星ID
   * @param {boolean} useDefaultAppConfigIfExists true:アプリケーション設定にデフォルト設定があれば使用する/false:アプリケーション設定を無視してデフォルト衛星情報を取得する
   * @returns {Promise<DefaultSatelliteType>} TLE文字列
   */
  public static async getDefaultSatelliteBySatelliteId(
    satelliteId: number,
    useDefaultAppConfigIfExists = true
  ): Promise<DefaultSatelliteType> {
    return await window.rstApi.getDefaultSatelliteBySatelliteId(satelliteId, useDefaultAppConfigIfExists);
  }

  /**
   * デフォルト衛星情報を追加する
   * @param satelliteName
   * @returns {Promise<number>} satelliteId(更新時-1)
   */
  public static async addDefaultSatellite(satelliteName: string): Promise<number> {
    return await window.rstApi.addDefaultSatellite(satelliteName);
  }
}
