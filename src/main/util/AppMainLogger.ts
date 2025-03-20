import Constant from "@/common/Constant";
import log from "electron-log";

const PREFIX = "[main]";

/**
 * メインプロセス向けロガー
 */
export default class AppMainLogger {
  /**
   * Logger初期化
   */
  public static init() {
    log.initialize();

    // ログファイルサイズ
    log.transports.file.maxSize = Constant.Logger.LOG_SIZE;
    // ログファイル名
    log.transports.file.fileName = Constant.Logger.LOG_FILENAME;
  }

  public static debug(text: any) {
    log.debug(`${PREFIX} ${text}`);
  }
  public static info(text: any) {
    log.info(`${PREFIX} ${text}`);
  }
  public static warn(text: any) {
    log.warn(`${PREFIX} ${text}`);
  }
  public static error(text: any, err: any = null) {
    if (err) {
      log.error(`${PREFIX} ${text}`, err);
      return;
    }

    log.error(`${PREFIX} ${text}`);
  }
}
