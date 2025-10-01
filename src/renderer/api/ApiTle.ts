import type { TleStrings } from "@/renderer/types/satellite-type";

/**
 * TLE関係のレンダラ側API
 */
export default class ApiTle {
  /**
   * 指定のNorad IDのTLEを取得する
   * @param {string[]} noradIds Norad ID
   * @returns {Promise<TleStrings[]>} TLE文字列
   */
  public static async getTlesByNoradIds(noradIds: string[]): Promise<TleStrings[]> {
    const tleStrings = await window.rstApi.getTlesByNoradIds(JSON.stringify(noradIds));
    if (!tleStrings) {
      // 指定のNorad IDが見つからなかった場合は空配列を返却する
      return [];
    }

    return tleStrings;
  }
  /**
   * URLから読み込み可能なTLEが取得できるか確認する
   * @param {string} url URL
   * @returns {Promise<boolean>} true: 取得可能, false: 取得不可
   */
  public static async canGetValidTle(url: string): Promise<boolean> {
    return await window.rstApi.canGetValidTle(url);
  }
}
