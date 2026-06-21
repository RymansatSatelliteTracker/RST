import type { TleStrings } from "@/renderer/types/satellite-type.js";

/**
 * OMM関係のレンダラ側API
 */
export default class ApiOmm {
  /**
   * 指定のNorad IDの軌道要素データをTLE文字列で取得する
   * @param {string[]} noradIds Norad ID
   * @returns {Promise<TleStrings[]>} TLE文字列
   */
  public static async getOmmsByNoradIds(noradIds: string[]): Promise<TleStrings[]> {
    const tleStrings = await window.rstApi.getOmmsByNoradIds(JSON.stringify(noradIds));
    if (!tleStrings) {
      // 指定のNorad IDが見つからなかった場合は空配列を返却する
      return [];
    }

    return tleStrings;
  }
  /**
   * URLから読み込み可能な軌道要素データが取得できるか確認する
   * @param {string} url URL
   * @returns {Promise<boolean>} true: 取得可能, false: 取得不可
   */
  public static async canGetValidOmm(url: string): Promise<boolean> {
    return await window.rstApi.canGetValidOmm(url);
  }
}
