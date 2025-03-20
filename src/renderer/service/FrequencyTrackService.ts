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
    const velocity = await this.calcVelocity(nowDate, intervalMs);
    if (!velocity) {
      return 1.0;
    }
    return 1.0 + velocity / Constant.Astronomy.LIGHT_SPEED;
  }
  /**
   * ドップラーファクター(アップリンク)を算出する
   * @param {Date} nowDate 現在日時
   * @param {number} intervalMs 現在と以前の時間差[単位:ミリ秒]
   * @returns ドップラーファクター(アップリンク)
   */
  public async calcUplinkDopplerFactor(nowDate: Date, intervalMs: number = 1000): Promise<number> {
    const velocity = await this.calcVelocity(nowDate, intervalMs);
    if (!velocity) {
      return 1.0;
    }
    return 1.0 - velocity / Constant.Astronomy.LIGHT_SPEED;
  }

  /**
   * 距離の変化量から速度を算出する
   * 観測者に向かう方が正の値
   * @param {Date} nowDate 現在日時
   * @param {number} intervalMs 現在と以前の時間差[単位:ミリ秒]
   * @returns {Promise<number | null>} 速度[単位:m/s]
   */
  private async calcVelocity(nowDate: Date, intervalMs: number): Promise<number | null> {
    const nowDistance = await this.calcDistance(nowDate);
    const prevDistance = await this.calcDistance(new Date(nowDate.getTime() - intervalMs));
    if (nowDistance === null || prevDistance === null) {
      // 距離が取得できない場合はnullを返却する
      return null;
    }
    // 距離の変化量から速度を算出する
    // m/sに変換するため1000で割る
    return (prevDistance - nowDistance) / (intervalMs / 1000);
  }

  /**
   * 地上局と衛星の間の距離を算出する
   * @param {Date} nowDate 現在日時
   * @returns {Promise<number | null>} 地上局と衛星の間の距離[単位:m]
   */
  private async calcDistance(nowDate: Date): Promise<number | null> {
    // 地上局の地心直交座標を取得する
    const grdStaEcefCoord = await this.getGroundStationEcefLocation();
    // 人工衛星の緯度/経度を取得する
    const satCoord = this._satelliteService.getTargetPolarLocationInDegree(nowDate);
    if (!satCoord) {
      // 人工衛星の緯度/経度が取得できない場合はnullを返却する
      return null;
    }
    // 人工衛星の緯度/経度を地心直交座標に変換する
    const satEcefCoord = CoordinateCalcUtil.geodeticInDegreeToEcef(
      satCoord.latitude,
      satCoord.longitude,
      satCoord.height
    );

    // 地上局と衛星の間の距離を算出する
    const distance = CoordinateCalcUtil.getVectorNorm({
      x: satEcefCoord.x - grdStaEcefCoord.x,
      y: satEcefCoord.y - grdStaEcefCoord.y,
      z: satEcefCoord.z - grdStaEcefCoord.z,
    });

    return CoordinateCalcUtil.kmToM(distance);
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
