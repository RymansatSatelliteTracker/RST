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
}
