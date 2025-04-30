import Constant from "@/common/Constant";
import type { OrbitElement } from "@/common/types/satelliteSettingTypes";
import type { TleStrings } from "@/renderer/types/satellite-type";
import CoordinateCalcUtil from "../../renderer/util/CoordinateCalcUtil";

/**
 * TLE関係のユーティリティ
 * @class TleUtil
 */
class TleUtil {
  /**
   * 人工衛星の軌道要素からTLE文字列に変換する
   * @param {OrbitElement} orbitElement 人工衛星の軌道要素
   * @returns {TleStrings} TLE文字列
   */
  public static orbitElementsToTLE = (orbitElement: OrbitElement): TleStrings => {
    const meanMotion = this.calculateMeanMotion(orbitElement.semiMajorAxisKm);
    const line0 = `${this.getName(orbitElement.satelliteName)}`;
    let line1 = `1 ${orbitElement.noradId}U 00000A   ${this.formatEpoch(orbitElement.epochUtcDate)}  .00000000  00000-0  ${this.formatBStar(orbitElement.bStar)} 0  000`;
    let line2 = `2 ${orbitElement.noradId} ${orbitElement.inclinationDeg.toFixed(4).padStart(8, " ")} ${orbitElement.raanDeg.toFixed(4).padStart(8, " ")} ${orbitElement.eccentricity.toFixed(7).substring(2).padStart(7, "0")} ${orbitElement.argumentOfPerigeeDeg.toFixed(4).padStart(8, " ")} ${orbitElement.meanAnomalyDeg.toFixed(4).padStart(8, " ")} ${meanMotion.padStart(11, " ")}00000`;
    line1 = line1 + this.calculateChecksum(line1);
    line2 = line2 + this.calculateChecksum(line2);

    return { satelliteName: line0, tleLine1: line1, tleLine2: line2 };
  };

  /**
   * TLE文字列（３行）からTleStringsを生成する
   */
  public static toTleStrings = (tle: string): TleStrings => {
    const lines = tle.split("\n");
    if (lines.length !== 3) {
      throw new Error("TLEのフォーマットが不正です。");
    }

    const tleStrings = {
      satelliteName: lines[0],
      tleLine1: lines[1],
      tleLine2: lines[2],
    };

    return tleStrings;
  };

  /**
   * TLEの0行目から人工衛星の名称を取得する
   * @param {string} line0 TLE0行目
   * @returns {string} 人工衛星の名称
   */
  public static getName(line0: string): string {
    return line0.trim();
  }

  /**
   * TLEの1行目からNoradIDを取得する
   * @param {string} line1 TLE1行目
   * @returns {number} NoradID
   */
  public static getNoradId(line1: string): string {
    return line1.slice(2, 7);
  }

  /**
   * TLEの1行目からエポック日時を取得する
   * @param {string} line1 TLE1行目
   * @returns {number} エポック日時(YYDDD.DDDDDDDD)
   */
  public static getEpochDate(line1: string): number {
    return parseFloat(line1.slice(18, 32));
  }

  /**
   * 軌道要素の元期を文字列に変換する
   * @param {Date} epochUtcDate 軌道要素の元期
   * @returns {string} 軌道要素の元期文字列(YYDDD.DDDDDDDD)
   */
  public static formatEpoch = (epochUtcDate: Date): string => {
    // 年、日付、時刻を取得する
    const year = epochUtcDate.getUTCFullYear();
    const dayOfYear = Math.floor(
      (epochUtcDate.getTime() - new Date(year, 0, 0).getTime()) / Constant.Time.MILLISECONDS_IN_DAY
    );
    const hours = epochUtcDate.getUTCHours();
    const minutes = epochUtcDate.getUTCMinutes();
    const seconds = epochUtcDate.getUTCSeconds();
    // 秒を1日の割合に変換する
    const fractionOfDay = (hours * 3600 + minutes * 60 + seconds) / Constant.Time.SECONDS_IN_DAY;
    // TLEの元期フォーマットに変換する
    const epoch = `${year.toString().slice(-2)}${dayOfYear.toString().padStart(3, "0")}.${fractionOfDay.toFixed(8).slice(2)}`;
    return epoch;
  };

  /**
   * 軌道長半径から平均運動を計算する
   * @param {number} semiMajorAxisKm 軌道長半径[単位:km]
   * @returns {string} 平均運動[単位:Rev/Day]
   */
  public static calculateMeanMotion = (semiMajorAxisKm: number): string => {
    const semiMajorAxisM = CoordinateCalcUtil.kmToM(semiMajorAxisKm);
    const meanMotion =
      Math.sqrt((Constant.Astronomy.EARTH_MASS * Constant.Astronomy.GRAVITATIONAL_CONSTANT) / semiMajorAxisM ** 3) *
      (Constant.Time.SECONDS_IN_DAY / (2 * Math.PI));
    return meanMotion.toFixed(8);
  };

  /**
   * B*抗力項をフォーマット変換する
   * @param {number} [bStar=0.0] B*抗力項
   * @returns {string} B*抗力項のTLEフォーマット
   */
  static formatBStar(bStar: number = 0.0): string {
    if (bStar === 0.0) {
      // B*抗力項が0の場合は終了する
      return "00000+0";
    }
    // B*抗力項の指数部を取得する
    const exponent = Math.floor(Math.log10(Math.abs(bStar)) + 1) - 1;
    // B*抗力項の仮数部を取得する
    const mantissa = bStar / 10 ** exponent;

    // B*抗力項の文字列フォーマットに変換する
    const formattedMantissa = mantissa.toFixed(5).replace(".", "").substring(0, 5);
    const formattedExponent = (exponent >= 0 ? "+" : "") + exponent.toString().padStart(1, "0");

    return `${formattedMantissa}${formattedExponent}`;
  }

  /**
   * TLE文字列のチェックサムを計算する
   * @param {string} tleLine チェックサム1桁を除くTLE文字列行
   * @returns {string} チェックサム1桁
   */
  public static calculateChecksum = (tleLine: string): string => {
    let sum = 0;

    for (let i = 0; i < tleLine.length; i++) {
      const char = tleLine.charAt(i);

      if (char >= "0" && char <= "9") {
        // 各桁の数字を加算する
        sum += parseInt(char, 10);
      } else if (char === "-") {
        // -は1と見なして加算する
        sum += 1;
      }
    }

    // 総和の剰余を文字列に変換して返却する
    return (sum % 10).toString();
  };
}

export default TleUtil;
