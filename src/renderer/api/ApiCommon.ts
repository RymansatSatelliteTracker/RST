/**
 * 共通系API
 */
export default class ApiCommon {
  /**
   * 地図タイルのルートパスを取得する
   */
  public static async getTilesPath(): Promise<string> {
    return await window.rstApi.getTilesPath();
  }
}
