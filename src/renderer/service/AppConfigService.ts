import { AppConfigModel } from "@/common/model/AppConfigModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";

/**
 * アプリケーション設定サービス
 */
export default class AppConfigService {
  /**
   * アプリケーション設定を取得する
   */
  public async getConfig(): Promise<AppConfigModel> {
    return await ApiAppConfig.getAppConfig();
  }

  /**
   * アプリケーション設定を保存する
   */
  public async storeConfig(config: AppConfigModel) {
    await ApiAppConfig.storeAppConfig(config);
  }
}
