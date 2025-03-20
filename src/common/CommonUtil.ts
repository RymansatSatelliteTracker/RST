/**
 * 共通ユーティリティ
 */
export default class CommonUtil {
  /**
   * テキストがブランクか判定する
   * @param text
   * @returns true: ブランク
   *          false: 非ブランク
   */
  public static isEmpty(text: string | null | undefined): boolean {
    if (!text) {
      return true;
    }
    if (text.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * 数値か判定する
   */
  public static isNumber(val: any): boolean {
    if (val == null) {
      return false;
    }
    if (val === "") {
      return false;
    }

    return !isNaN(val);
  }

  /**
   * 数値のフォーマット
   * @param fractionDegits 小数部桁数
   */
  public static numFormat(inValue: number | string | null | undefined, fractionDegits: number): string {
    if (inValue != 0 && !inValue) {
      return "";
    }

    // 指定の小数部桁数でフォーマット
    const formatter = new Intl.NumberFormat("ja", {
      style: "decimal",
      minimumFractionDigits: fractionDegits,
      maximumFractionDigits: fractionDegits,
    });

    const value = Number(inValue);
    return formatter.format(value);
  }

  /**
   * Sleep
   * @param sleepMs Sleep時間（ミリ秒）
   */
  public static async sleep(sleepMs: number) {
    await new Promise((res) => setTimeout(res, sleepMs));
  }

  /**
   * stringに変換する
   * null, undefinedの場合は空文字を返す
   * @param val
   * @returns
   */
  public static toString(val: any): string {
    // numberの0の場合は、null判定でtrueになってしまうので個別判定する
    if (val === 0) {
      return "0";
    }

    if (!val) {
      return "";
    }

    return val.toString();
  }
}
