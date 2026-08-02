import log from "electron-log";

const PREFIX = "[renderer]";

/**
 * レンダラプロセス向けロガー
 */
export default class AppRendererLogger {
  public static debug(text: unknown) {
    log.debug(PREFIX, text);
  }
  public static info(text: unknown) {
    log.info(PREFIX, text);
  }
  public static warn(text: unknown) {
    log.warn(PREFIX, text);
  }
  public static error(text: unknown, err: unknown = null) {
    log.error(PREFIX, text, err);
  }
}
