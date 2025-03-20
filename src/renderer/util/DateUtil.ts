import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import dayjs from "dayjs";

/**
 * 日付や時間関係のユーティリティ
 * @class DateUtil
 * @typedef {DateUtil}
 */
class DateUtil {
  /**
   * Date型データをフォーマット形式を指定して文字列に変換する
   * @param {Date} date Date型データ
   * @param {formatOptions} [formatOptions=yyyyMMddhhmmss] フォーマットオプション
   * @returns {string} 日時文字列
   */
  public static formatDateTime = (
    date: Date | undefined,
    formatOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ): string => {
    return date ? date.toLocaleString(Constant.Time.DATE_LOCALE, formatOptions) : I18nUtil.getMsg(I18nMsgs.GCOM_NA);
  };

  /**
   * ミリ秒数値をhh:mm:ss形式の文字列に変換する
   * @param {number} milliSeconds ミリ秒数値
   * @returns {string} hh:mm:ss形式の文字列
   */
  public static formatMsToHHMMSS = (milliSeconds: number | null): string => {
    if (!milliSeconds || milliSeconds < 0) {
      // ミリ秒数値がnullまたはマイナス値の場合は"―"を返却する
      return I18nUtil.getMsg(I18nMsgs.GCOM_NA);
    }

    // ミリ秒数値をhh:mm:ss形式の文字列に変換する
    const seconds = Math.floor((milliSeconds / 1000) % 60),
      minutes = Math.floor((milliSeconds / (1000 * 60)) % 60),
      hours = Math.floor((milliSeconds / (1000 * 60 * 60)) % 24);
    const hoursStr = hours < 10 ? "0" + hours : hours.toString();
    const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
    const secondsStr = seconds < 10 ? "0" + seconds : seconds.toString();

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  };

  /**
   * ミリ秒数値を単位付き日時文字列に変換する
   * @param {number} milliSeconds ミリ秒数値
   * @returns {string} 単位付き日時文字列
   */
  public static formatMsToDHMS = (milliSeconds: number | null): string => {
    if (!milliSeconds || milliSeconds < 0) {
      // ミリ秒数値がnullまたはマイナス値の場合は"―"を返却する
      return I18nUtil.getMsg(I18nMsgs.GCOM_NA);
    }

    // ミリ秒数値をd h m s形式の文字列に変換する
    const seconds = Math.floor((milliSeconds / 1000) % 60),
      minutes = Math.floor((milliSeconds / (1000 * 60)) % 60),
      hours = Math.floor((milliSeconds / (1000 * 60 * 60)) % 24),
      days = Math.floor(milliSeconds / (1000 * 60 * 60 * 24));

    if (days === 0 && hours === 0) {
      // d, hが0の場合はm s形式で表示する
      return `${minutes}m ${seconds}s`;
    } else if (days === 0 && hours !== 0) {
      // dが0の場合はh m s形式で表示する
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      // d h m s形式で表示する
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
  };

  /**
   * 分を加算（減算）する
   */
  public static addMinute(date: Date, val: number): Date {
    const dt = dayjs(date);
    return dt.add(val, "minute").toDate();
  }
}

export default DateUtil;
