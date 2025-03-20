/**
 * 実行環境関係のユーティリティ
 */
export default class EnvUtil {
  /**
   * 開発環境での実行かを返す
   */
  public static isDev(): boolean {
    return process.env.npm_lifecycle_event === "app:dev" ? true : false;
  }

  /**
   * Macで実行されているかを返す
   */
  public static isMac(): boolean {
    return process.platform === "darwin";
  }
}
