import SerialComm from "@/main/common/SerialComm";
import AppMainLogger from "@/main/util/AppMainLogger";

/**
 * シリアルの試行サービスクラス
 */
export default class SerialTrialService {
  private static serial: SerialComm | null = null;

  /**
   * シリアル接続をオープンする
   */
  public async open(comName: string, baudRate: number) {
    if (SerialTrialService.serial) {
      AppMainLogger.warn("接続中のシリアルポートに対してオープンが要求されました。切断後に再オープンを行います");
      await SerialTrialService.serial.close();
    }

    SerialTrialService.serial = new SerialComm(comName, baudRate);
    const result = await SerialTrialService.serial.open();
    if (!result) {
      SerialTrialService.serial = null;
    }

    return result;
  }

  /**
   * シリアル接続をクローズする
   */
  public async close() {
    if (!SerialTrialService.serial) {
      return false;
    }

    const result = await SerialTrialService.serial.close();
    SerialTrialService.serial = null;

    return result;
  }
}
