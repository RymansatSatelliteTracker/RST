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
   * 無線機から受信したデータから運用モード文字列を取得する
   * @param {string} recvData 受信データ
   * @returns {string | null} 運用モード文字列
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
      case "04":
        return Constant.Transceiver.OpeMode.RTTY;
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
      case Constant.Transceiver.OpeMode.LSB_D:
        return "01";
      case Constant.Transceiver.OpeMode.USB_D:
        return "01";
      case Constant.Transceiver.OpeMode.FM_D:
        return "01";
      default:
        return "00";
    }
  }

  /**
   * 無線機から受信したデータからデータモードを取得する
   * @param {string} recvData 受信データ
   * @returns {string | null} データモード
   */
  public static parseDataMode(recvData: string): string | null {
    // 受信データからデータモードを取得する
    const recvDataMode = recvData.substring(12, 14);
    switch (recvDataMode) {
      case "00":
        return "00";
      case "01":
        return "01";
      default:
        return null;
    }
  }

  /**
   * 無線機から受信した現在のバンド取得（07D2）の応答をパースする
   * @param {string} recvData 受信データ
   * @returns {string} 現在のバンド（"00": メインバンド、"01": サブバンド）
   */
  public static parseCurrentBand(recvData: string): string {
    return recvData.substring(12, 14);
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
  public static trimRecvData(recvData: string) {
    const startIdx = recvData.indexOf("fefe");
    if (startIdx === -1) {
      return "";
    }

    return recvData.substring(startIdx);
  }
}
