import CommonUtil from "@/common/CommonUtil";

/**
 * 無線機関係のユーティリティ
 * @class TransceiverUtil
 * @typedef {TransceiverUtil}
 */
export default class TransceiverUtil {
  /**
   * 周波数をMHzの数値からHzの数値に変換する
   * @param {number} mhz 周波数の数値[単位:MHz]
   * @returns {number} 周波数の数値[単位:Hz]
   */
  public static mhzToHz = (mhz: number): number => {
    return Math.floor(mhz * 1000000);
  };

  /**
   * 周波数をHzの数値からMHzの数値に変換する
   * @param {number} hz 周波数の数値[単位:Hz]
   * @returns {number} 周波数の数値[単位:MHz]
   */
  public static hzToMhz = (hz: number): number => {
    return Math.floor(hz / 1000) / 1000;
  };

  /**
   * 周波数のkHz未満を切り捨てる
   * @param {number} mhz 周波数の数値[単位:MHz]
   * @returns {number} 周波数の数値[単位MHz]
   */
  public static floorMhz = (mhz: number): number => {
    return Math.floor(mhz * 1000) / 1000;
  };

  /**
   * 周波数をHzの数値からMHzの文字列に変換する
   * @param {number} hz 周波数の数値[単位:Hz]
   * @returns {string} 周波数の文字列[単位:MHz]
   */
  public static hzToMhzString(hz: number): string {
    // 小数点以下3桁にフォーマット
    const mhzStr = this.hzToMhz(hz).toFixed(3);
    // 整数部と小数部に分割
    const [integerPart, decimalPart] = mhzStr.split(".");
    // 整数部を4桁にパディング
    const paddedIntegerPart = integerPart.padStart(4, "0");
    // 整数部と小数部を結合して8文字にする
    return `${paddedIntegerPart}.${decimalPart}`;
  }

  /**
   * 周波数をMHzの数値からMHzの文字列に変換する
   * @param {number} mhz 周波数の数値[単位:MHz]
   * @returns {string} 周波数の文字列[単位:MHz]
   */
  public static mhzToMhzString(mhz: number): string {
    // 小数点以下3桁にフォーマット
    const mhzStr = this.floorMhz(mhz).toFixed(3);
    // 整数部と小数部に分割
    const [integerPart, decimalPart] = mhzStr.split(".");
    // 整数部を4桁にパディング
    const paddedIntegerPart = integerPart.padStart(4, "0");
    // 整数部と小数部を結合して8文字にする
    return `${paddedIntegerPart}.${decimalPart}`;
  }

  /**
   * 2つの周波数を足し算する
   * @param {number} freq1 周波数1[単位:MHz]
   * @param {number} freq2 周波数2[単位:MHz]
   * @returns {number} 演算結果[単位:MHz]
   */
  public static addFrequencies = (freq1: number, freq2: number): number => {
    // IEEE754の丸め誤差を回避するため、小数点以下3桁で丸める
    return Math.round((freq1 + freq2) * 1000) / 1000;
  };

  /**
   * 2つの周波数を引き算する
   * @param {number} freq1 周波数1[単位:MHz]
   * @param {number} freq2 周波数2[単位:MHz]
   * @returns {number} 演算結果[単位:MHz]
   */
  public static subtractFrequencies = (freq1: number, freq2: number): number => {
    // IEEE754の丸め誤差を回避するため、小数点以下3桁で丸める
    return Math.round((freq1 - freq2) * 1000) / 1000;
  };

  /**
   * 指定の周波数がアマチュアバンドの範囲内かどうかを判定する
   * @returns {string} アマチュアバンドの範囲外の場合は空文字を返す
   */
  public static analizeAmateurBandRange(freq: number): "144" | "430" | "1200" | "" {
    if (!CommonUtil.isNumber(freq)) {
      return "";
    }

    // 144MHz帯か？
    if (144000000 <= freq && freq <= 146000000) {
      return "144";
    }

    // 430MHz帯か？
    if (432000000 <= freq && freq <= 440000000) {
      return "430";
    }

    // 1200MHz帯か？
    if (1294000000 <= freq && freq <= 1295000000) {
      return "1200";
    }

    return "";
  }
}
