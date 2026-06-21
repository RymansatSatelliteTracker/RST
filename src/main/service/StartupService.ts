import DefaultSatelliteService from "@/main/service/DefaultSatelliteService.js";
import FrequencyService from "@/main/service/FrequencyService.js";
import OmmService from "@/main/service/OmmService.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";
/**
 * アプリの初期処理クラス
 */
export default class StartupService {
  /**
   * 初期処理を行う
   */
  public async initApp() {
    // 設定ファイルの初期化
    AppConfigUtil.init();

    // tle.json -> omm.json への移行(一度限り)
    new OmmService().migrateFromTleJsonIfNeeded();

    // OMMの取得
    await new OmmService().getOmmAndSave();
    AppMainLogger.info("OMM取得処理完了");

    const isFrequencyUpdated = await new FrequencyService().saveFrequency();
    AppMainLogger.info(`衛星周波数設定取得処理完了(更新=${isFrequencyUpdated})`);

    await new DefaultSatelliteService().updateDefaultSatelliteService(isFrequencyUpdated);
    AppMainLogger.info("デフォルト衛星定義更新処理完了");
  }
}
