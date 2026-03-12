import assert from "assert";
type Sign = -1 | 1;
/**
 * 周波数コントローラーのユーティリティ関数
 */

/**
 * 符号付き周波数文字列を、符号とMHz/kHz/Hzのdigit配列へ分割する
 */
export function parseSignedFrequency(freq: string): [Sign, number[][]] {
  const sign: Sign = freq.startsWith("-") ? -1 : 1;
  const unsignedFreq = freq.replace(/^[+-]/, "");

  return [sign, parseFrequency(unsignedFreq)];
}

/**
 * 周波数文字列を、MHz/kHz/Hzのdigit配列へ分割する
 * @param {string} freq - 周波数文字列 (例: "+243.000.000" または "-243.000.000")
 * @returns {number[][]} 周波数の各桁を表す数値の2次元配列 (例: [[2, 4, 3], [0, 0, 0], [0, 0, 0]])
 */
export function parseFrequency(freq: string): number[][] {
  return freq.split(".").map((part) => {
    return part.split("").map((char) => {
      const digit = Number(char);
      return isNaN(digit) ? 0 : digit;
    });
  });
}

/**
 * 周波数のdigit配列と符号から、符号付き周波数文字列を生成する
 * @param {number[]} digits - 周波数の各桁を表す数値の配列
 * @param {Sign} sign - 符号 (-1 または 1)
 * @returns {string} 符号付き周波数文字列 (例: "+243.000" または "-243.000")
 */
export function formatSignedFrequency(digits: number[], sign: Sign): string {
  const formatted = formatFrequency(digits);
  return sign === -1 ? `-${formatted}` : `+${formatted}`;
}

/**
 * 周波数のdigitを周波数表示に変換する
 * @param {number[]} digits - 周波数の各桁を表す数値の配列
 * @returns {string} 周波数表示の文字列
 * 例: [2, 4, 3, 0, 0, 0] -> "243.000"
 */
export function formatFrequency(digits: number[]): string {
  assert(digits.length % 3 === 0, "digits length must be a multiple of 3");
  const parts: string[] = [];
  let part: string;
  for (let i = 0; i < digits.length; i += 3) {
    part = digits.slice(i, i + 3).join("");
    parts.push(part);
  }
  return parts.join(".");
}
