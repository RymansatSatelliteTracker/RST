import { getMainWindow } from "@/main/main.js";

/**
 * ローテータのシリアルヘルパー
 */
export default class RotatorSerialHelper {
  /**
   * シリアル通信が切断されたことをレンダラに通知する
   */
  public static fireSerialDisConnect() {
    getMainWindow().webContents.send("onRoratorDisconnect");
  }
}
