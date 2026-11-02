/**
 * 共通系API
 */
export default class ApiSirial {
  /**
   * アクティブなシリアルポートのリストを返す
   */
  public static async getActiveSerialPorts(): Promise<string[]> {
    return await window.rstApi.getActiveSerialPorts();
  }

  /**
   * シリアルポートをオープンする
   */
  public static async tryOpen(comName: string, baudRate: number, stopBits: 1 | 2 = 1): Promise<boolean> {
    return await window.rstApi.openSerialPortTry(comName, baudRate, stopBits);
  }

  /**
   * シリアルポートをクローズする
   */
  public static async close(): Promise<boolean> {
    return await window.rstApi.closeSerialPort();
  }
}
