import Constant from "@/common/Constant";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import SatelliteService from "@/renderer/service/SatelliteService";
import { EcefLocation } from "@/renderer/types/location-type";
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
   * @param {number} intervalMs 現在と以前の時間差[単位:ミリ秒]
   * @returns ドップラーファクター(ダウンリンク)
   */
  public async calcDownlinkDopplerFactor(nowDate: Date, intervalMs: number = 1000): Promise<number> {
    return this._calcDopplerFactor(new Date(nowDate.getTime() - intervalMs / 2.0), false);
  }

  /**
   * ドップラーファクター(アップリンク)を算出する
   * @param {Date} nowDate 現在日時
   * @param {number} intervalMs 現在と以前の時間差[単位:ミリ秒]
   * @returns ドップラーファクター(アップリンク)
   */
  public async calcUplinkDopplerFactor(nowDate: Date, intervalMs: number = 1000): Promise<number> {
    return this._calcDopplerFactor(new Date(nowDate.getTime() - intervalMs / 2.0), true);
  }

  /**
   * ドップラーファクターを算出する
   * @param {Date} nowDate 現在日時
   * @param {boolean} isUplink アップリンク判定フラグ
   * @returns {Promise<number | null>} 速度[単位:m/s]
   */
  private async _calcDopplerFactor(nowDate: Date, isUplink: boolean): Promise<number> {
    const positionEcf = this._satelliteService.getTargetLocation3(nowDate);
    const velocityEcf = this._satelliteService.getTargetVelocity3(nowDate);
    const observerEcf = await this.getGroundStationEcefLocation();

    if (!positionEcf || !velocityEcf || !observerEcf) {
      return 1.0;
    }

    const gsVel = {
      x: -Constant.Astronomy.EARTH_ROTATION_OMEGA * observerEcf.y,
      y: Constant.Astronomy.EARTH_ROTATION_OMEGA * observerEcf.x,
      z: 0,
    };

    const vRel = {
      x: velocityEcf.x - gsVel.x,
      y: velocityEcf.y - gsVel.y,
      z: velocityEcf.z - gsVel.z,
    };

    const dx = positionEcf.x - observerEcf.x;
    const dy = positionEcf.y - observerEcf.y;
    const dz = positionEcf.z - observerEcf.z;
    const rangeMag = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const rHat = {
      x: dx / rangeMag,
      y: dy / rangeMag,
      z: dz / rangeMag,
    };

    const dot = vRel.x * rHat.x + vRel.y * rHat.y + vRel.z * rHat.z;

    return 1.0 - (isUplink ? -dot : dot) / Constant.Astronomy.LIGHT_SPEED;
  }

  /**
   * 設定ファイルから地上局の位置を取得して地心直交座標に変換する
   * @returns 地上局の位置(WGS84回転楕円体)
   */
  private async getGroundStationEcefLocation() {
    const appConfig = await ApiAppConfig.getAppConfig();

    // 高度は m から km に変換
    const heightKm = CoordinateCalcUtil.mToKm(appConfig.groundStation.height);

    // 観測地点の地心直交座標(WGS84回転楕円体)を設定する
    const ecef = CoordinateCalcUtil.geodeticInDegreeToEcef(
      appConfig.groundStation.lat,
      appConfig.groundStation.lon,
      heightKm
    );

    const ecefLocation: EcefLocation = {
      x: ecef.x,
      y: ecef.y,
      z: ecef.z,
      radius: CoordinateCalcUtil.getEarthRadiusInDegree(appConfig.groundStation.lat),
      height: heightKm,
    };

    return ecefLocation;
  }
}
