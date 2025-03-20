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
   * @returns {Promise<DefaultSatelliteType>} TLE文字列
   */
  public static async getDefaultSatelliteBySatelliteId(satelliteId: number): Promise<DefaultSatelliteType> {
    return await window.rstApi.getDefaultSatelliteBySatelliteId(satelliteId);
  }

  /**
   * デフォルト衛星情報を追加する
   * @param satelliteName
   * @returns {Promise<number>} satelliteId(更新時-1)
   */
  public static async addDefaultSatellite(satelliteName: string): Promise<number> {
    return await window.rstApi.addDefaultSatellite(satelliteName);
  }

  /**
   * デフォルト衛星情報をリフレッシュする
   * @returns true:正常/false:失敗
   */
  public static async reCreateDefaultSatellite(): Promise<boolean> {
    return await window.rstApi.reCreateDefaultSatellite();
  }
}
