import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import FrequencyService from "@/main/service/FrequencyService";
import TleService from "@/main/service/TleService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import AppMainLogger from "@/main/util/AppMainLogger";
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

    // TLEの取得
    await new TleService().getTleAndSave();
    AppMainLogger.info("TLE取得処理完了");

    const isFrequencyUpdated = await new FrequencyService().saveFrequency();
    AppMainLogger.info(`衛星周波数設定取得処理完了(更新=${isFrequencyUpdated})`);

    await new DefaultSatelliteService().updateDefaultSatelliteService(isFrequencyUpdated);
    AppMainLogger.info("デフォルト衛星定義更新処理完了");
  }
}
