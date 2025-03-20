import { app } from "electron";

/**
 * electron関係のユーティリティ
 */
export default class ElectronUtil {
  /**
   * OSユーザのアプリディレクトリを返す
   * Windowsであれば、「C:\Users\username\AppData\Roaming\rst」を返す
   * @returns OSユーザのアプリディレクトリのパス
   */
  public static getUserDir(): string {
    return app.getPath("userData");
  }
}
