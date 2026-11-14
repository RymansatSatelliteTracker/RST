/**
 * 共通系API
 */
export default class ApiCommon {
  /**
   * 地図タイルのルートパスを取得する
   */
  public static getTilesPath(): Promise<string> {
    return Promise.resolve(window.rstApi.getTilesPath());
  }
}
