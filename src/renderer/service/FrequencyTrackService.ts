import Constant from "@/common/Constant";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import SatelliteService from "@/renderer/service/SatelliteService";
import type { Location3 } from "@/renderer/types/location-type";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";

/**
 * 周波数計算サービス
 * 算出するのは周波数の変化率ドップラーファクター
 * (基準周波数)*(ドップラーファクター)として使用する
 */
export default class FrequencyTrackService {
  // SatelliteServiceクラスの実体
  protected _satelliteService: SatelliteService;

  /**
   * コンストラクタ
   * @param satelliteService SatelliteServiceクラスの実体
   */
  constructor(satelliteService: SatelliteService) {
    this._satelliteService = satelliteService;
  }

  /**
   * ドップラーファクター(ダウンリンク)を算出する
   * @param {Date} nowDate 現在日時
   * @returns ドップラーファクター(ダウンリンク)
   */
  public async calcDownlinkDopplerFactor(nowDate: Date): Promise<number> {
    return this._calcDopplerFactor(new Date(nowDate.getTime()), false);
  }

  /**
   * ドップラーファクター(アップリンク)を算出する
   * @param {Date} nowDate 現在日時
   * @returns ドップラーファクター(アップリンク)
   */
  public async calcUplinkDopplerFactor(nowDate: Date): Promise<number> {
    return this._calcDopplerFactor(new Date(nowDate.getTime()), true);
  }

  /**
   * ドップラーファクターを算出する
   * @param {Date} nowDate 現在日時
   * @param {boolean} isUplink アップリンク判定フラグ
   * @returns {Promise<number>} ドップラーファクター
   */
  private async _calcDopplerFactor(nowDate: Date, isUplink: boolean): Promise<number> {
    const targetPosition = this._satelliteService.getTargetPolarLocationInDegree(nowDate);
    const observerEcf = await this.getGroundStationEcefLocation();
    let velocityEcf = this._satelliteService.getTargetVelocity3(nowDate);

    if (!targetPosition || !observerEcf || !velocityEcf) {
      return 1.0;
    }

    // 人工衛星の緯度/経度を地心直交座標に変換する
    let positionEcf = CoordinateCalcUtil.geodeticInDegreeToEcef(
      targetPosition.latitude,
      targetPosition.longitude,
      targetPosition.height
    );

    // 単位をkmからmに変換する
    positionEcf = CoordinateCalcUtil.km3ToM3({ x: positionEcf.x, y: -positionEcf.z, z: positionEcf.y });
    velocityEcf = CoordinateCalcUtil.km3ToM3(velocityEcf);

    const rangeVel = {
      x: velocityEcf.x + Constant.Astronomy.EARTH_ROTATION_OMEGA * observerEcf.y,
      y: velocityEcf.y - Constant.Astronomy.EARTH_ROTATION_OMEGA * observerEcf.x,
      z: velocityEcf.z,
    };

    const rangeX = positionEcf.x - observerEcf.x;
    const rangeY = positionEcf.y - observerEcf.y;
    const rangeZ = positionEcf.z - observerEcf.z;
    const rangeNorm = CoordinateCalcUtil.getVectorNorm({ x: rangeX, y: rangeY, z: rangeZ });

    const rangeHat = {
      x: rangeX / rangeNorm,
      y: rangeY / rangeNorm,
      z: rangeZ / rangeNorm,
    };

    // 人工衛星の速度ベクトルと地上局の位置ベクトルの内積を計算する
    const dot = CoordinateCalcUtil.getVectorDotProduct(rangeVel, rangeHat);

    return 1.0 + (isUplink ? -dot : dot) / Constant.Astronomy.LIGHT_SPEED;
  }

  /**
   * 設定ファイルから地上局の位置を取得して地心直交座標に変換する
   * @returns 地上局の位置(WGS84回転楕円体)[単位:m]
   */
  private async getGroundStationEcefLocation(): Promise<Location3> {
    const appConfig = await ApiAppConfig.getAppConfig();

    // 観測地点の地心直交座標(WGS84回転楕円体)をkm単位で取得
    const location3Km = CoordinateCalcUtil.geodeticInDegreeToEcef(
      appConfig.groundStation.lat,
      appConfig.groundStation.lon,
      CoordinateCalcUtil.mToKm(appConfig.groundStation.height)
    );

    // 単位をkmからmに変換する
    return CoordinateCalcUtil.km3ToM3({ x: location3Km.x, y: -location3Km.z, z: location3Km.y });
  }
}
