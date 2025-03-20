import { AppConfigModel } from "../../../../../common/model/AppConfigModel";
import ApiAppConfig from "../../../../api/ApiAppConfig";

/**
 * 地上局設定関係のフック
 */
export default function useAppConfig() {
  /**
   * アプリ設定を取得する
   */
  async function getAppConfig(): Promise<AppConfigModel> {
    // 地上局定義を取得
    return await ApiAppConfig.getAppConfig();
  }

  /**
   * アプリ設定を保存する
   */
  async function storeAppConfig(config: AppConfigModel) {
    // 地上局定義を取得
    await ApiAppConfig.storeAppConfig(config);
  }

  return {
    getAppConfig,
    storeAppConfig,
  };
}
