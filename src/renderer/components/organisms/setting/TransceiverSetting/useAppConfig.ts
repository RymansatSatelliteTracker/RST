import { AppConfigModel } from "@/common/model/AppConfigModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";

/**
 * 無線機設定関係のフック
 */
export default function useAppConfig() {
  /**
   * アプリ設定を取得する
   */
  async function getAppConfig(): Promise<AppConfigModel> {
    return await ApiAppConfig.getAppConfig();
  }

  /**
   * アプリ設定を保存する
   */
  async function storeAppConfig(config: AppConfigModel) {
    await ApiAppConfig.storeAppConfig(config);
  }

  return {
    getAppConfig,
    storeAppConfig,
  };
}
