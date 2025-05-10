import CommonUtil from "@/common/CommonUtil";

/**
 * 無線機関係のユーティリティ
 * @class TransceiverUtil
 */
export default class TransceiverUtil {
  /**
   * 数値　→ ドット区切り文字列
   * @param hz
   * @returns
   */
  public static formatWithDot(hz: number): string {
    // 10桁にパディング
    // 整数として扱う
    // 10桁以上の場合は、下10桁を取得
    const padHz = Math.floor(hz).toString().slice(-10).padStart(10, "0");

    // 各桁を取得
    const digitMHz = padHz.slice(0, 4);
    const digitKHz = padHz.slice(4, 7);
    const digitHz = padHz.slice(7, 10);

    // ドット区切りの文字列に変換
    return `${digitMHz}.${digitKHz}.${digitHz}`;
  }

  /**
   * ドット区切り文字列 → 数値
   * @param value
   */
  public static parseNumber(value: string): number {
    const numeric = value.replace(/\./g, "");
    const parsed = parseFloat(numeric);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 2つの周波数を足し算する
   * @param {number} freq1 周波数1[単位:Hz]
   * @param {number} freq2 周波数2[単位:Hz]
   * @returns {number} 演算結果[単位:Hz]
   */
  public static addFrequencies = (freq1: number, freq2: number): number => {
    // IEEE754の丸め誤差を回避するため、小数点以下3桁で丸める
    return Math.round((freq1 + freq2) * 1000) / 1000;
  };

  /**
   * 2つの周波数を引き算する
   * @param {number} freq1 周波数1[単位:Hz]
   * @param {number} freq2 周波数2[単位:Hz]
   * @returns {number} 演算結果[単位:Hz]
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
    if (430000000 <= freq && freq <= 440000000) {
      return "430";
    }

    // 1200MHz帯か？
    if (1260000000 <= freq && freq <= 1300000000) {
      return "1200";
    }

    return "";
  }
}
