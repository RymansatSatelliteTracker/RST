import { LangType } from "@/common/types/types";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

/**
 * 対言語化サービス
 */
export default class I18nService {
  /**
   * 指定の表示言語をアプリ設定に保存する
   */
  public async changeLang(lang: LangType) {
    // 指定の表示言語をアプリ設定に設定
    const appConfig = AppConfigUtil.getConfig();
    appConfig.lang = lang;

    // 保存
    AppConfigUtil.storeConfig(appConfig);
  }
}
