import { FrequencyModel } from "@/common/model/FrequencyModel";

/**
 * Frequency関係のレンダラ側API
 */
export default class ApiFrequency {
  /**
   * 保存済みの周波数設定情報を返す
   */
  public static async getFrequency(): Promise<FrequencyModel> {
    return await window.rstApi.getFrequency();
  }
}
