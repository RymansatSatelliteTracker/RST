import type { OmmItem } from "@/common/model/OmmModel.js";

/**
 * OMM関係のレンダラ側API
 */
export default class ApiOmm {
  /**
   * 指定のNorad IDの軌道要素データをOMMで取得する
   * @param {string[]} noradIds Norad ID
   * @returns {Promise<OmmItem[]>} OMM
   */
  public static async getOmmsByNoradIds(noradIds: string[]): Promise<OmmItem[]> {
    const ommItems = await window.rstApi.getOmmsByNoradIds(JSON.stringify(noradIds));
    if (!ommItems) {
      // 指定のNorad IDが見つからなかった場合は空配列を返却する
      return [];
    }

    return ommItems;
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
