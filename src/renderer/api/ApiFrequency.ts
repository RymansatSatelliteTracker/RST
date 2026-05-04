import { FrequencyModel } from "@/common/model/FrequencyModel";
import { ApiResponse } from "@/common/types/types";

/**
 * Frequency関係のレンダラ側API
 */
export default class ApiFrequency {
  /**
   * リポジトリ登録用の保存済み周波数設定情報を返す
   */
  public static async getRepoFrequency(): Promise<FrequencyModel> {
    return await window.rstApi.getRepoFrequency();
  }

  /**
   * リポジトリ登録用の周波数設定情報を保存する
   */
  public static async storeRepoFrequency(frequencyModel: FrequencyModel): Promise<ApiResponse<void>> {
    return await window.rstApi.storeRepoFrequency(frequencyModel);
  }
}
