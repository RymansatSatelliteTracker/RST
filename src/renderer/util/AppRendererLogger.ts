import log from "electron-log";

const PREFIX = "[renderer]";

/**
 * レンダラプロセス向けロガー
 */
export default class AppRendererLogger {
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
    log.error(`${PREFIX} ${text}`, err);
  }
}
