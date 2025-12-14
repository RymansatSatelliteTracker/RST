import Constant from "@/common/Constant";

/**
 * ICOM無線機からの応答データパーサ
 */
export default class TransceiverIcomRecvParser {
  /**
   * 無線機から受信したデータから周波数を取得する
   * @param {string} recvData 受信データ
   */
  public static parseFreq(recvData: string): number {
    // 受信データから周波数部分を取得する
    const dataArea = recvData.substring(10, 20);
    const dataAreaArray = dataArea.split("");
    const recvFrequencyStr =
      dataAreaArray[8] +
      dataAreaArray[9] +
      dataAreaArray[6] +
      dataAreaArray[7] +
      dataAreaArray[4] +
      dataAreaArray[5] +
      dataAreaArray[2] +
      dataAreaArray[3] +
      dataAreaArray[0] +
      dataAreaArray[1];

    return parseInt(recvFrequencyStr);
  }

  /**
   * 指定の運用モード文字列からCI-Vコマンド値を返す
   * @param {string} opeMode 運用モード
   * @returns {(string | null)} 運用モードのCI-Vコマンド値
   */
  public static getValueFromOpeMode(opeMode: string): string | null {
    switch (opeMode) {
      case "LSB":
        return "00";
      case "LSB-D":
        return "00";
      case "USB":
        return "01";
      case "USB-D":
        return "01";
      case "AM":
        return "02";
      case "CW":
        return "03";
      case "FM":
        return "05";
      case "FM-D":
        return "05";
      case "DV":
        return "17";
      default:
        return null;
    }
  }

  /**
   * 無線機から受信したデータから運用モードを取得する
   * @param {string} recvData 受信データ
   * @returns {string | null} 運用モード
   */
  public static parseMode(recvData: string): string | null {
    // 受信データから運用モードを取得する
    const recvMode = recvData.substring(10, 12);
    switch (recvMode) {
      case "00":
        return Constant.Transceiver.OpeMode.LSB;
      case "01":
        return Constant.Transceiver.OpeMode.USB;
      case "02":
        return Constant.Transceiver.OpeMode.AM;
      case "03":
        return Constant.Transceiver.OpeMode.CW;
      case "05":
        return Constant.Transceiver.OpeMode.FM;
      case "17":
        return Constant.Transceiver.OpeMode.DV;
      default:
        return null;
    }
  }

  /**
   * 指定の運用モード文字列からデータモードのOn/Offを示す値を返す
   * @param {string} mode 運用モード
   * @returns {string} CI-VコマンドのOn/Offを示す値
   */
  public static getValueFromDataMode(mode: string): string {
    switch (mode) {
      case "LSB-D":
        return "01";
      case "USB-D":
        return "01";
      case "FM-D":
        return "01";
      default:
        return "00";
    }
  }

  /**
   * 無線機から受信したサテライトモードの応答をパースする
   * @param {string} recvData 受信データ
   * @returns true: サテライトモードOn
   */
  public static parseSatelliteMode(recvData: string): boolean {
    const recvMode = recvData.substring(12, 14);
    if (recvMode === "01") {
      return true;
    }
    return false;
  }

  /**
   * 受信データについて、プリアンブル以降を読む（先頭に"00"がついている場合があるので、そこは読み捨てる）
   */
  public static trimRecData(recvData: string) {
    const startIdx = recvData.indexOf("fefe");
    if (startIdx === -1) {
      return "";
    }

    return recvData.substring(startIdx);
  }
}
