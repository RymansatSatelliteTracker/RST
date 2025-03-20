import { getMainWindow } from "@/main/main";

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
