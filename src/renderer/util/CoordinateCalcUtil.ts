import Constant from "@/common/Constant";
import { Location3, PolarLocation } from "@/renderer/types/location-type";

/**
 * 座標計算関係のユーティリティ
 * @class CoordinateCalcUtil
 */
class CoordinateCalcUtil {
  /**
   * ラジアンを角度に変換する
   * @param {number} radian ラジアン
   * @returns {number} 角度
   */
  public static radianToDegree = (radian: number): number => {
    return radian * (180.0 / Math.PI);
  };

  /**
   * 角度をラジアンに変換する
   * @param {number} degree 角度
   * @returns {number} ラジアン
   */
  public static degreeToRadian = (degree: number): number => {
    return degree * (Math.PI / 180.0);
  };

  /**
   * 角度を正規化する
   * @param {number} radian 角度[単位:ラジアン]
   * @returns {number} 正規化された角度[単位:ラジアン]
   */
  public static normalizeRadian = (radian: number): number => {
    radian = radian % (2 * Math.PI);
    if (radian < 0.0) {
      radian += 2 * Math.PI;
    }
    return radian;
  };

  /**
   * 角度を正規化する
   * @param {number} degree 角度[単位:度]
   * @returns {number} 正規化された角度[単位:度]
   */
  public static normalizeAngle = (degree: number): number => {
    degree = degree % 360;
    if (degree < 0.0) {
      degree += 360.0;
    }
    return degree;
  };

  /**
   * 指定した角度を閾値にして角度を正規化する
   * @param {number} degree 角度[単位:度]
   * @param {number} offsetDeg 閾値[単位:度]
   * @returns {number} 正規化された角度[単位:度]
   */
  public static normalizeAngleWithOffset = (degree: number, offsetDeg: number): number => {
    degree = (degree - offsetDeg) % 360;
    if (degree < 0.0) {
      degree += 360.0;
    }
    return degree + offsetDeg;
  };

  /**
   * 指定した角度を閾値にして角度を正規化する
   * @param {number} radian 角度[単位:ラジアン]
   * @param {number} offsetRad 閾値[単位:ラジアン]
   * @returns {number} 正規化された角度[単位:ラジアン]
   */
  public static normalizeRadianWithOffset = (radian: number, offsetRad: number): number => {
    radian = (radian - offsetRad) % (2 * Math.PI);
    if (radian < 0.0) {
      radian += 2 * Math.PI;
    }
    return radian + offsetRad;
  };

  /**
   * 3次元ベクトルのノルムを取得する
   * @param {Location3} location 3次元ベクトル
   * @returns {number} ベクトルのノルム
   */
  public static getVectorNorm = (location: Location3): number => {
    return Math.hypot(location.x, location.y, location.z);
  };

  /**
   * 3次元ベクトルの内積を取得する
   * @param {Location3} vector1 3次元ベクトル
   * @param {Location3} vector2 3次元ベクトル
   * @returns {number} ベクトルの内積
   */
  public static getVectorDotProduct = (vector1: Location3, vector2: Location3): number => {
    return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  };

  /**
   * kmをmに変換する
   * @param {number} km 距離[単位:km]
   * @returns {number} 距離[単位:m]
   */
  public static kmToM = (km: number): number => {
    return km * 1000;
  };

  /**
   * mをkmに変換する
   * @param {number} m 距離[単位:m]
   * @returns {number} 距離[単位:km]
   */
  public static mToKm = (m: number): number => {
    return m / 1000;
  };

  /**
   * kmをmに変換する（位置ベクトル用）
   * @param {Location3} location3 位置ベクトル[単位:km]
   * @returns {Location3} 位置ベクトル[単位:m]
   */
  public static km3ToM3 = (location3: Location3): Location3 => {
    return {
      x: this.kmToM(location3.x),
      y: this.kmToM(location3.y),
      z: this.kmToM(location3.z),
    };
  };

  /**
   * mをkmに変換する（位置ベクトル用）
   * @param {Location3} location3 位置ベクトル[単位:m]
   * @returns {Location3} 位置ベクトル[単位:km]
   */
  public static m3ToKm3 = (location3: Location3): Location3 => {
    return {
      x: this.mToKm(location3.x),
      y: this.mToKm(location3.y),
      z: this.mToKm(location3.z),
    };
  };

  /**
   * 緯度/経度から地心直交座標(WGS84回転楕円体)を求める
   * @param {number} latitudeDeg 緯度[単位:度]
   * @param {number} longitudeDeg 経度[単位:度]
   * @param {number} AltitudeKm 高度[単位:km]
   * @returns {Location3} 地心直交座標(WGS84回転楕円体)
   */
  public static geodeticInDegreeToEcef = (latitudeDeg: number, longitudeDeg: number, AltitudeKm: number): Location3 => {
    // 緯度をラジアンに変換する
    const latitudeRad = this.degreeToRadian(latitudeDeg);
    // 経度をラジアンに変換する
    const longitudeRad = this.degreeToRadian(longitudeDeg - 180.0);

    // 地球の卯酉線曲率半径を計算する
    const primeVerticalRadius =
      Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM /
      Math.sqrt(1 - Constant.Astronomy.EARTH_ECCENTRICITY * Math.sin(latitudeRad) ** 2);

    // 地心直交座標(WGS84回転楕円体)を計算する
    const ecefX = -(primeVerticalRadius + AltitudeKm) * Math.cos(latitudeRad) * Math.cos(longitudeRad);
    const ecefY =
      (primeVerticalRadius * (1 - Constant.Astronomy.EARTH_ECCENTRICITY) + AltitudeKm) * Math.sin(latitudeRad);
    const ecefZ = (primeVerticalRadius + AltitudeKm) * Math.cos(latitudeRad) * Math.sin(longitudeRad);

    return { x: ecefX, y: ecefY, z: ecefZ };
  };

  /**
   * 緯度/経度から地心直交座標(WGS84回転楕円体)を求める
   * @param {number} latitudeRad 緯度[単位:ラジアン]
   * @param {number} longitudeRad 経度[単位:ラジアン]
   * @param {number} AltitudeKm 高度[単位:km]
   * @returns {Location3} 地心直交座標(WGS84回転楕円体)
   */
  public static geodeticInRadianToEcef = (latitudeRad: number, longitudeRad: number, AltitudeKm: number): Location3 => {
    // 経度を-180～180の範囲に変換する
    longitudeRad = longitudeRad - 180.0;

    // 地球の卯酉線曲率半径を計算する
    const primeVerticalRadius =
      Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM /
      Math.sqrt(1 - Constant.Astronomy.EARTH_ECCENTRICITY * Math.sin(latitudeRad) ** 2);

    // 地心直交座標(WGS84回転楕円体)を計算する
    const ecefX = -(primeVerticalRadius + AltitudeKm) * Math.cos(latitudeRad) * Math.cos(longitudeRad);
    const ecefY =
      (primeVerticalRadius * (1 - Constant.Astronomy.EARTH_ECCENTRICITY) + AltitudeKm) * Math.sin(latitudeRad);
    const ecefZ = (primeVerticalRadius + AltitudeKm) * Math.cos(latitudeRad) * Math.sin(longitudeRad);

    return { x: ecefX, y: ecefY, z: ecefZ };
  };

  /**
   * 任意の緯度での地球半径を取得する
   * @param {number} latitudeDeg 緯度[単位:度]
   * @returns {number} 地球半径[単位:km]
   */
  public static getEarthRadiusInDegree = (latitudeDeg: number): number => {
    return this.getEarthRadiusInRadian(this.degreeToRadian(latitudeDeg));
  };

  /**
   * 任意の緯度での地球半径を取得する
   * @param {number} latitudeRad 緯度[単位:ラジアン]
   * @returns {number} 地球半径[単位:km]
   */
  public static getEarthRadiusInRadian = (latitudeRad: number): number => {
    const cosLatitude = Math.cos(latitudeRad);
    const sinLatitude = Math.sin(latitudeRad);

    return Math.sqrt(
      (Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM *
        Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM *
        cosLatitude *
        cosLatitude +
        Constant.Astronomy.EARTH_POLAR_RADIUS_KM *
          Constant.Astronomy.EARTH_POLAR_RADIUS_KM *
          sinLatitude *
          sinLatitude) /
        (cosLatitude * cosLatitude + sinLatitude * sinLatitude)
    );
  };

  /**
   * 3次元極座標から3次元直行座標へ変換する
   * @param {PolarLocation} polarLocation 3次元極座標(緯度/経度)[単位:度]/半径
   * @returns {Location3} 3次元直行座標
   */
  public static translatePolarInDegreeToCartesian = (polarLocation: PolarLocation): Location3 => {
    // 仰角
    const latitudeRad = this.degreeToRadian(polarLocation.latitude);
    // 方位角
    const longitudeRad = this.degreeToRadian(polarLocation.longitude);

    return this.translatePolarInRadianToCartesian({
      latitude: latitudeRad,
      longitude: longitudeRad,
      radius: polarLocation.radius,
    });
  };

  /**
   * 3次元極座標から3次元直行座標へ変換する
   * @param {PolarLocation} polarLocation 3次元極座標(緯度/経度)[単位:ラジアン]/半径
   * @returns {Location3} 3次元直行座標
   */
  public static translatePolarInRadianToCartesian = (polarLocation: PolarLocation): Location3 => {
    // 仰角
    const latitudeRad = polarLocation.latitude;
    // 方位角
    const longitudeRad = polarLocation.longitude - Math.PI;

    const x = -polarLocation.radius * Math.cos(latitudeRad) * Math.cos(longitudeRad);
    const y = polarLocation.radius * Math.sin(latitudeRad);
    const z = polarLocation.radius * Math.cos(latitudeRad) * Math.sin(longitudeRad);

    return { x, y, z };
  };

  /**
   * 3次元直行座標から3次元極座標へ変換する
   * @param {Location3} location 3次元直行座標
   * @returns {PolarLocation} 3次元極座標(緯度/経度)[単位:度]/半径
   */
  public static translateCartesianToPolarInDegree = (location: Location3): PolarLocation => {
    const polarLocation = this.translateCartesianToPolarInRadian(location);
    return {
      latitude: this.radianToDegree(polarLocation.latitude),
      longitude: this.radianToDegree(polarLocation.longitude),
      radius: polarLocation.radius,
    };
  };

  /**
   * 3次元直行座標から3次元極座標へ変換する
   * @param {Location3} location 3次元直行座標
   * @returns {PolarLocation} 3次元極座標(緯度/経度)[単位:ラジアン]/半径
   */
  public static translateCartesianToPolarInRadian = (location: Location3): PolarLocation => {
    // 半径
    const radius = Math.hypot(location.x, location.y, location.z);
    // 仰角（緯度）
    const latitudeRad = Math.asin(location.y / radius);
    // 方位角（経度）
    let longitudeRad = Math.atan2(location.z, -location.x) + Math.PI;
    // 経度が-180～180の範囲になるよう調整
    if (longitudeRad > Math.PI) {
      longitudeRad -= 2 * Math.PI;
    }

    return {
      latitude: latitudeRad,
      longitude: longitudeRad,
      radius: radius,
    };
  };
}

export default CoordinateCalcUtil;
