import { AppConfigMainDisplay, AppConfigModel } from "@/common/model/AppConfigModel";
import { AppConfigRotatorModel } from "@/common/model/AppConfigRotatorModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { AppConfigTransceiverModel } from "@/common/model/AppConfigTransceiverModel";

/**
 * アプリケーション設定関係のレンダラ側API
 */
export default class ApiAppConfig {
  /**
   * アプリケーション設定を取得する
   */
  public static async getAppConfig(): Promise<AppConfigModel> {
    return await window.rstApi.getAppConfig();
  }

  /**
   * アプリケーション設定を保存する
   */
  public static async storeAppConfig(config: AppConfigModel) {
    return await window.rstApi.storeAppConfig(config);
  }

  /**
   * 衛星設定画面用のアプリケーション設定を取得する
   */
  public static async getAppConfigSatSetting(): Promise<AppConfigSatSettingModel> {
    return await window.rstApi.getAppConfigSatSetting();
  }

  /**
   * メイン表示する衛星グループ、衛星ID情報を返す
   */
  public static async getAppConfigMainDisplay(): Promise<AppConfigMainDisplay> {
    return await window.rstApi.getAppConfigMainDisplay();
  }

  /**
   * メイン表示する衛星グループ、衛星ID情報が保存された場合の変更イベント
   */
  public static async onChangeActiveSatelliteGroup(callback: Function) {
    await window.rstApi.onChangeActiveSatelliteGroup(callback);
  }

  /**
   * 衛星設定画面用のアプリケーション設定を保存する
   */
  public static async storeAppSatSettingConfig(config: AppConfigSatSettingModel) {
    return await window.rstApi.storeAppConfigSatSetting(config);
  }

  /**
   * ローテーター定義を返す
   */
  public static async getRotatorConfig(): Promise<AppConfigRotatorModel> {
    return await window.rstApi.getRotatorConfig();
  }

  /**
   * 無線機定義を返す
   */
  public static async getTransceiverConfig(): Promise<AppConfigTransceiverModel> {
    return await window.rstApi.getTransceiverConfig();
  }
}
