import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import { InvalidArgumentError } from "@/common/exceptions";
import type { EcefLocation, Location3 } from "@/renderer/types/location-type";
import type { MeanElements, TargetPolarLocation, TleStrings } from "@/renderer/types/satellite-type";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";
import DateUtil from "@/renderer/util/DateUtil";
import type { SatRec } from "satellite.js";
import * as satellite from "satellite.js";

/**
 * 人工衛星の軌道要素を管理/各種値を計算する
 * @class SatelliteService
 */
class SatelliteService {
  // NoradID
  private _noradId;
  // 人工衛星の名称
  private _satelliteName;
  // TLEオブジェクト
  private _satRec: SatRec;
  // 静止軌道判定(静止軌道: true、静止衛星でない: false)
  private _isGeostationaryOrbit = false;
  // 軌道周期が1恒星日以上か判定(1恒星日以上: true、1恒星日未満: false)
  private _isOverSiderealDay = false;
  // 遠地点距離
  private _apogee: number;

  /**
   * コンストラクタ
   * @constructor
   * @param {TleStrings} tleStrings TLE文字列
   */
  constructor(tleStrings: TleStrings) {
    // コンストラクタに渡すTLE行がnullまたは空白の場合は例外をスローする
    if (CommonUtil.isEmpty(tleStrings.tleLine1) || CommonUtil.isEmpty(tleStrings.tleLine2)) {
      AppRendererLogger.error("InvalidArgumentError: tleline is null or empty.");
      throw new InvalidArgumentError("tleline is null or empty.");
    }
    this._satelliteName = tleStrings.satelliteName;
    this._satRec = satellite.twoline2satrec(tleStrings.tleLine1, tleStrings.tleLine2);
    this._noradId = Number(this._satRec.satnum);

    // 人工衛星のTLE文字列が有効期限切れの場合は警告メッセージを表示する
    const expirationDate = new Date();
    expirationDate.setDate(new Date().getDate() - Constant.Tle.TLE_EXPIRATION_DAYS);
    if (this.getSgp4Epoc() < expirationDate) {
      AppRendererLogger.warn(
        "TLE data has expired. EpocDate: " +
          DateUtil.formatDateTime(this.getSgp4Epoc(), { year: "numeric", month: "2-digit", day: "2-digit" })
      );
    }

    // 人工衛星の軌道傾斜角が0.0Rad、かつ、離心率が0.0、かつ、軌道周期が1恒星日の場合、静止衛星と判定する（定数の偏差を許容）
    this._isGeostationaryOrbit =
      Math.abs(this._satRec.inclo) <= 2 * Math.PI * Constant.OrbitCalculation.DEVIATION_PERCENTAGE &&
      this.getEccentricity() <= Constant.OrbitCalculation.DEVIATION_PERCENTAGE &&
      Math.abs(this.getOrbitalPeriodInMin() - Constant.Astronomy.MINUTES_IN_SIDEREAL_DAY) <=
        Constant.Astronomy.MINUTES_IN_SIDEREAL_DAY * Constant.OrbitCalculation.DEVIATION_PERCENTAGE;
    // 人工衛星の軌道周期が1恒星日以上か判定する（定数の偏差を許容）
    this._isOverSiderealDay =
      this.getOrbitalPeriodInMin() >=
      Constant.Astronomy.MINUTES_IN_SIDEREAL_DAY -
        Constant.Astronomy.MINUTES_IN_SIDEREAL_DAY * Constant.OrbitCalculation.DEVIATION_PERCENTAGE;
    // 遠地点距離を計算する
    this._apogee = this.getApogee();
  }

  /**
   * 人工衛星のTLEオブジェクトを取得する
   * @returns {SatRec} 人工衛星のTLEオブジェクト
   */
  public getSatRec = (): SatRec => {
    return this._satRec;
  };

  /**
   * 人工衛星のNoradIDを取得する
   * @returns {string} 人工衛星のNoradID
   */
  public getNoradId = (): string => {
    return this._noradId.toString().padStart(5, "0");
  };

  /**
   * 人工衛星の名称を取得する
   * @returns {string} 人工衛星の名称
   */
  public getSatelliteName = (): string => {
    return this._satelliteName;
  };

  /**
   * 人工衛星のSGP4エポック日付を取得する
   * @returns {Date} SGP4エポック日付
   */
  public getSgp4Epoc = (): Date => {
    // 年の下二桁から4桁の年を計算
    const fullYear = 2000 + this._satRec.epochyr;
    // 1月1日からの経過日数を元に日付を計算
    return new Date(fullYear, 0, this._satRec.epochdays);
  };

  /**
   * 人工衛星が静止衛星か判定する
   * @returns {boolean} 静止軌道: true、静止衛星でない: false
   */
  public isGeostationaryOrbit = (): boolean => {
    return this._isGeostationaryOrbit;
  };

  /**
   * 人工衛星の軌道周期が1恒星日以上か判定する
   * @returns {boolean} 1恒星日以上: true、1恒星日未満: false
   */
  public isOverSiderealDay = (): boolean => {
    return this._isOverSiderealDay;
  };

  /**
   * 人工衛星の軌道周期を取得する
   * @returns {number} 軌道周期[単位:分]
   */
  public getOrbitalPeriodInMin = (): number => {
    return (2.0 * Math.PI) / this._satRec.no;
  };

  /**
   * 人工衛星の軌道離心率を取得する
   * @returns {number} 離心率
   */
  public getEccentricity = (): number => {
    return this._satRec.ecco;
  };

  /**
   * 平均運動から軌道長半径を計算する
   * @returns {number} 軌道長半径[単位:km]
   */
  public getSemiMajorAxis = (): number => {
    const meanMotionRadPerSec = (this._satRec.no * Constant.Time.MINUTES_IN_DAY) / Constant.Time.SECONDS_IN_DAY;
    const semiMajorAxisM = Math.cbrt(
      (Constant.Astronomy.EARTH_MASS * Constant.Astronomy.GRAVITATIONAL_CONSTANT) / meanMotionRadPerSec ** 2
    );
    return CoordinateCalcUtil.mToKm(semiMajorAxisM);
  };

  /**
   * 軌道長半径と離心率から遠地点距離を計算する
   * @returns {number} 遠地点距離[単位:km]
   */
  public getApogee = (): number => {
    return this.getSemiMajorAxis() * (1 + this.getEccentricity());
  };

  /**
   * 軌道長半径と離心率から近地点距離を計算する
   * @returns {number} 近地点距離[単位:km]
   */
  public getPerigee = (): number => {
    return this.getSemiMajorAxis() * (1 - this.getEccentricity());
  };

  /**
   * 指定した日時の人工衛星の軌道要素を取得する
   * @param {Date} date 計算日時
   * @returns {(MeanElements | null)} 平均軌道要素
   */
  public getMeanElements = (date: Date): MeanElements | null => {
    const propagate = satellite.propagate(this._satRec, date);
    if (!propagate) {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }

    // 人工衛星の高度を算出する
    const gstime = satellite.gstime(date);
    const altitude = satellite.eciToGeodetic(propagate.position, gstime).height;

    // 人工衛星の軌道要素を返却する
    return {
      semiMajorAxisKm: propagate.meanElements.am,
      eccentricity: propagate.meanElements.em,
      inclinationDeg: CoordinateCalcUtil.normalizeAngle(CoordinateCalcUtil.radianToDegree(propagate.meanElements.im)),
      raanDeg: CoordinateCalcUtil.normalizeAngle(CoordinateCalcUtil.radianToDegree(propagate.meanElements.Om)),
      argumentOfPerigeeDeg: CoordinateCalcUtil.normalizeAngle(
        CoordinateCalcUtil.radianToDegree(propagate.meanElements.om)
      ),
      altitudeKm: altitude,
      meanAnomalyDeg: CoordinateCalcUtil.normalizeAngle(CoordinateCalcUtil.radianToDegree(propagate.meanElements.mm)),
      meanMotion: propagate.meanElements.nm,
      orbitalPeriodMin: (2.0 * Math.PI) / propagate.meanElements.nm,
      speedKmSec: CoordinateCalcUtil.getVectorNorm(propagate.velocity as Location3),
    };
  };

  /**
   * 指定した日時の人工衛星の速度ベクトルを取得する
   * @param {Date} date 計算日時
   * @returns {(Location3 | null)} 人工衛星の速度ベクトル[単位:km/s]
   */
  public getTargetVelocity3 = (date: Date): Location3 | null => {
    const propagate = satellite.propagate(this._satRec, date);
    if (!propagate) {
      // 人工衛星が取得できない場合はnullで返却する
      return null;
    }

    // 人工衛星の速度ベクトルを返却する
    return propagate.velocity;
  };

  /**
   * 指定した日時の人工衛星の緯度/経度を計算する
   * @param {Date} date 計算日時
   * @param {number} offsetLongitude 地図の中心経度のオフセット[単位:度]
   * @returns {(TargetPolarLocation | null)} 人工衛星の緯度/経度[単位:度]
   */
  public getTargetPolarLocationInDegree = (date: Date, offsetLongitude: number = 0.0): TargetPolarLocation | null => {
    const targetPolarLocation = this.getTargetPolarLocationInRadian(
      date,
      CoordinateCalcUtil.degreeToRadian(offsetLongitude)
    );
    if (targetPolarLocation) {
      // 有効な軌道の場合は人工衛星の緯度/経度を返却する
      return {
        latitude: CoordinateCalcUtil.radianToDegree(targetPolarLocation.latitude),
        longitude: CoordinateCalcUtil.radianToDegree(targetPolarLocation.longitude),

        height: targetPolarLocation.height,
        radius: targetPolarLocation.radius,
      };
    } else {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }
  };

  /**
   * 指定した日時の人工衛星の緯度/経度を計算する
   * @param {Date} date 計算日時
   * @param {number} offsetLongitude 地図の中心経度のオフセット[単位:ラジアン]
   * @returns {(TargetPolarLocation | null)} 人工衛星の緯度/経度[単位:ラジアン]
   */
  public getTargetPolarLocationInRadian = (date: Date, offsetLongitude: number = 0.0): TargetPolarLocation | null => {
    const propagate = satellite.propagate(this._satRec, date);
    if (!propagate) {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }

    // 測地座標系に変換する
    const gstime = satellite.gstime(date);
    const location = satellite.eciToGeodetic(propagate.position, gstime);
    if (Constant.Astronomy.EARTH_POLAR_RADIUS_KM + location.height > this._apogee * 1.1) {
      // SGP4の高度計算が発散した場合はnullを返却する（遠地点距離の偏差を許容する）
      return null;
    }

    // 有効な軌道の場合は人工衛星の緯度/経度を返却する
    return {
      latitude: location.latitude,
      longitude: CoordinateCalcUtil.normalizeRadianWithOffset(
        CoordinateCalcUtil.normalizeRadian(location.longitude),
        offsetLongitude
      ),
      height: location.height,
      radius: CoordinateCalcUtil.getEarthRadiusInRadian(location.latitude) + location.height,
    };
  };

  /**
   * 指定した日時の人工衛星の仰角を取得する
   * @param {Date} date 計算日時
   * @param {EcefLocation} ecefLocation 観測地点の地心直交座標(WGS84回転楕円体)
   * @returns {(number | null)} 人工衛星の仰角[単位:度]
   */
  public getSatelliteElevationAngle = (date: Date, ecefLocation: EcefLocation): number | null => {
    // 指定した日時の人工衛星の緯度/経度を計算する
    const location = this.getTargetPolarLocationInRadian(date);
    if (!location) {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }
    // 人工衛星の位置での地球半径を取得する
    const earthRadius = CoordinateCalcUtil.getEarthRadiusInRadian(location.latitude);

    // 人工衛星の位置を3次元直交座標で取得する
    const targetPosition: Location3 = CoordinateCalcUtil.translatePolarInRadianToCartesian({
      latitude: location.latitude,
      longitude: location.longitude,
      radius: earthRadius + location.height,
    });

    // 余弦定理を使用して観測者の位置での人工衛星との仰角を取得する
    const theta =
      this._getAngleInRadianWithCosineFormula(
        CoordinateCalcUtil.getVectorNorm({
          x: ecefLocation.x - targetPosition.x,
          y: ecefLocation.y - targetPosition.y,
          z: ecefLocation.z - targetPosition.z,
        }),
        ecefLocation.radius,
        earthRadius + location.height
      ) -
      Math.PI / 2.0;

    // ラジアンを角度に変換する
    return CoordinateCalcUtil.radianToDegree(theta);
  };

  /**
   * 余弦定理を使用して角度を取得する
   * @param {number} side1 辺1の長さ
   * @param {number} side2 辺2の長さ
   * @param {number} targetSide 取得する角度に対応する辺の長さ
   * @returns {number} 角度[単位:ラジアン]
   */
  private _getAngleInRadianWithCosineFormula = (side1: number, side2: number, targetSide: number): number => {
    let result = (side1 ** 2 + side2 ** 2 - targetSide ** 2) / (2 * side1 * side2);
    // 余弦定理で求めたcos値を-1.0から1.0の範囲に補正する
    result = Math.max(-1.0, Math.min(1.0, result));
    // arccos関数の計算結果を返却する
    return Math.acos(result);
  };

  /**
   * 指定した日時の人工衛星の方位角を取得する
   * @param {Date} date 計算日時
   * @param {EcefLocation} ecefLocation 観測地点の地心直交座標(WGS84回転楕円体)
   * @returns {(number | null)} 人工衛星の方位角
   */
  public getSatelliteAzimuthAngle = (date: Date, ecefLocation: EcefLocation): number | null => {
    // 指定した日時の人工衛星の緯度/経度を計算する
    const location = this.getTargetPolarLocationInRadian(date);
    if (!location) {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }
    // 人工衛星の方位角を取得する
    return this.getAzimuthAngle(ecefLocation, location.latitude, location.longitude);
  };

  /**
   * 観測地点からの人工衛星の方位角を取得する
   * @param {EcefLocation} ecefLocation 観測地点の地心直交座標(WGS84回転楕円体)
   * @param {number} targetLatitudeRad 人工衛星の緯度
   * @param {number} targetLongitudeRad 人工衛星の経度
   * @returns {number} 人工衛星の方位角
   */
  public getAzimuthAngle = (
    ecefLocation: EcefLocation,
    targetLatitudeRad: number,
    targetLongitudeRad: number
  ): number => {
    // 地心直交座標を3次元極座標へ変換する
    const polarLocation = CoordinateCalcUtil.translateCartesianToPolarInRadian({
      x: ecefLocation.x,
      y: ecefLocation.y,
      z: ecefLocation.z,
    });

    // 経度の差を求める
    const deltaLon = targetLongitudeRad - polarLocation.longitude;

    // 方位角を計算する
    const azimuthAngle = CoordinateCalcUtil.radianToDegree(
      Math.atan2(
        Math.sin(deltaLon) * Math.cos(targetLatitudeRad),
        Math.cos(polarLocation.latitude) * Math.sin(targetLatitudeRad) -
          Math.sin(polarLocation.latitude) * Math.cos(targetLatitudeRad) * Math.cos(deltaLon)
      )
    );

    // 方位角を正規化する
    return CoordinateCalcUtil.normalizeAngle(azimuthAngle);
  };

  /**
   * 人工衛星の可視範囲の角度を取得する
   * @param {TargetPolarLocation | null} location 人工衛星の緯度/経度
   * @returns {(number | null)} 可視範囲の角度[単位:ラジアン]
   */
  public getSatelliteVisibleAngle = (location: TargetPolarLocation | null): number | null => {
    if (!location) {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }
    // 人工衛星の可視範囲の角度を計算して返却する
    return Math.acos(
      Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM / (Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM + location.height)
    );
  };
}

export default SatelliteService;
