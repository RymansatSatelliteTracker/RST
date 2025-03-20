/**
 * GeoLocation関係のレンダラ側API
 */
export default class ApiGeoLocation {
  /**
   * GeoLocationの取得を行う
   * @returns 取得できた緯度/経度
   *          取得できなかった場合はnullを返却する
   */
  public static async getGeoLocation(): Promise<{ latitude: string; longitude: string } | null> {
    return await window.rstApi.getGeoLocation();
  }
}
