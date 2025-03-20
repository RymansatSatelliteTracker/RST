import Constant from "@/common/Constant";

// パースしたTle保持用
export class Tle {
  line1: TleLine1 = new TleLine1();
  line2: TleLine2 = new TleLine2();
}
// Tleの一行目
export class TleLine1 {
  lineNumber: number = NaN;
  satNum: string = "";
  classification: string = "";
  internationalDesinator: string = "";
  epochYear: number = NaN;
  epochDays: number = NaN;
  ndot: number = NaN;
  nddot: number = NaN;
  bstar: number = NaN;
  ephemType: string = "";
  elementNumber: number = NaN;
  checkSum: number = NaN;
}
// Tleの二行目
export class TleLine2 {
  lineNumber: number = NaN;
  satNum: string = "";
  inclination: number = NaN;
  raan: number = NaN;
  eccentricity: number = NaN;
  aruOfPerigee: number = NaN;
  meanAnomaly: number = NaN;
  meanMotion: number = NaN;
  revolutions: number = NaN;
  checkSum: number = NaN;
}
// 軌道6要素
export class OrbitalElements {
  epoch: string = "";
  semiMejarAxis: number = NaN;
  raan: number = NaN;
  eccentricity: number = NaN;
  argumentOfPerigee: number = NaN;
  inclination: number = NaN;
  meanAnomaly: number = NaN;
}

/**
 * TLEの文字列をパースしてオブジェクトで返す
 * @param tleLine1
 * @param tleLine2
 * @returns Tle
 */
export const parseTle = (tleLine1: string, tleLine2: string): Tle => {
  const tle: Tle = new Tle();

  //line1
  tle.line1.lineNumber = parseInt(tleLine1.substring(0, 1));
  tle.line1.satNum = tleLine1.substring(2, 7);
  tle.line1.classification = tleLine1.substring(7, 8);
  tle.line1.internationalDesinator = tleLine1.substring(9, 17);
  tle.line1.epochYear = parseInt(tleLine1.substring(18, 20), 10);
  tle.line1.epochDays = parseFloat(tleLine1.substring(20, 32));
  tle.line1.ndot = parseFloat(tleLine1.substring(33, 43));
  tle.line1.nddot = parseFloat(`.${parseInt(tleLine1.substring(44, 50), 10)}E${tleLine1.substring(50, 52)}`);
  tle.line1.bstar = parseFloat(
    `${tleLine1.substring(53, 54)}.${parseInt(tleLine1.substring(54, 59), 10)}E${tleLine1.substring(59, 61)}`
  );
  tle.line1.ephemType = tleLine1.substring(62, 63);
  tle.line1.elementNumber = parseInt(tleLine1.substring(64, 68));
  tle.line1.checkSum = parseInt(tleLine1.substring(68, 69));

  // line2
  tle.line2.lineNumber = parseInt(tleLine2.substring(0, 1));
  tle.line2.satNum = tleLine2.substring(2, 7);
  tle.line2.inclination = parseFloat(tleLine2.substring(8, 16));
  tle.line2.raan = parseFloat(tleLine2.substring(17, 25));
  tle.line2.eccentricity = parseFloat(`.${tleLine2.substring(26, 33)}`);
  tle.line2.aruOfPerigee = parseFloat(tleLine2.substring(34, 42));
  tle.line2.meanAnomaly = parseFloat(tleLine2.substring(43, 51));
  tle.line2.meanMotion = parseFloat(tleLine2.substring(52, 63));
  tle.line2.revolutions = parseInt(tleLine2.substring(63, 68));
  tle.line2.checkSum = parseInt(tleLine2.substring(68, 69));

  return tle;
};

/**
 * パースしたTleのバリデーションチェックを行う
 * 空文字かNaNのままだったらエラーと判定する
 * @param tle
 * @returns errorを返す、正常の場合はnull
 */
export function validateParsedTle(
  tle: Tle
): { lineNumber: string; error: { name: string; value: string | number } } | null {
  const error1: [string, string | number] | undefined = Object.entries(tle.line1).find(
    ([key, val]) => val === "" || Number.isNaN(val)
  );
  if (error1) return { lineNumber: "1", error: { name: error1[0], value: error1[1] } };

  const error2: [string, string | number] | undefined = Object.entries(tle.line2).find(
    ([key, val]) => val === "" || Number.isNaN(val)
  );
  if (error2) return { lineNumber: "2", error: { name: error2[0], value: error2[1] } };

  return null;
}

/**
 * TLEから軌道6要素のオブジェクトに変換
 * @param tleLine1
 * @param tleLine2
 * @returns
 */
export function tleToOrbitalElements(tleLine1: string, tleLine2: string): OrbitalElements {
  const tle: Tle = parseTle(tleLine1, tleLine2);

  const orb = new OrbitalElements();

  orb.epoch = calcDateFomatEpoch(tle.line1.epochYear, tle.line1.epochDays);
  orb.semiMejarAxis = calcSemiMajorAxis(tle.line2.meanMotion);
  orb.eccentricity = tle.line2.eccentricity;
  orb.inclination = tle.line2.inclination;
  orb.argumentOfPerigee = tle.line2.aruOfPerigee;
  orb.raan = tle.line2.raan;
  orb.meanAnomaly = tle.line2.meanAnomaly;

  return orb;
}

/**
 * TLEのepochから画面表示用のepochに変換
 * @param epochYear
 * @param epochDays
 * @returns
 */
export function calcDateFomatEpoch(epochYear: number, epochDays: number): string {
  // 年の下二桁から4桁の年を計算
  const fullYear = 2000 + epochYear;

  // 指定された年の1月1日 00:00:00 UTC を基準にミリ秒単位の日時を計算
  const epochStart = Date.UTC(fullYear, 0, 1, 0, 0, 0, 0);

  // 経過日数をミリ秒に変換（1日 = 86400秒 = 86400000ミリ秒）
  // 1月1日はepochDays=1なので、1日分を引く
  const elapsedMilliseconds = (epochDays - 1) * 86400000;

  // 計算したUTC時刻を取得
  const epochDate = new Date(epochStart + elapsedMilliseconds);

  // 所定の形式に変換
  const year = epochDate.getUTCFullYear();
  const month = (epochDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = epochDate.getUTCDate().toString().padStart(2, "0");
  const hour = epochDate.getUTCHours().toString().padStart(2, "0");
  const minute = epochDate.getUTCMinutes().toString().padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

/**
 * TLEの平均運動から軌道長半径に変換
 * @param meanMotion
 * @returns
 */
export function calcSemiMajorAxis(meanMotion: number): number {
  // 地球の重力定数 (km^3/s^2)
  const mu = (Constant.Astronomy.EARTH_MASS * Constant.Astronomy.GRAVITATIONAL_CONSTANT) / 10 ** 9;

  // 平均運動数 (rev/day) を秒あたりのラジアンに変換
  const meanMotionRadPerSec = (meanMotion * 2 * Math.PI) / Constant.Time.SECONDS_IN_DAY;

  // ケプラーの第三法則に基づいて軌道長半径を計算
  const semiMajorAxis = Math.pow(mu / Math.pow(meanMotionRadPerSec, 2), 1 / 3);

  return semiMajorAxis; // 単位はキロメートル
}
