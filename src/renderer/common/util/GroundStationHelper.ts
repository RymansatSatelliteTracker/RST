import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import { EcefLocation } from "@/renderer/types/location-type";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";

/**
 * 地上局関係のヘルパ
 */
export default class GroundStationHelper {
  /**
   * AppConfigの地上局情報から EcefLocation データを作成する
   */
  public static async getEcefLocation(): Promise<EcefLocation> {
    const appConfig = await ApiAppConfig.getAppConfig();

    // 高度は m から km に変換
    const altitudeKm = CoordinateCalcUtil.mToKm(appConfig.groundStation.height);

    // 観測地点の地心直交座標(WGS84回転楕円体)を設定する
    const ecef = CoordinateCalcUtil.geodeticInDegreeToEcef(
      appConfig.groundStation.lat,
      appConfig.groundStation.lon,
      altitudeKm
    );

    const ecefLocation: EcefLocation = {
      x: ecef.x,
      y: ecef.y,
      z: ecef.z,
      radius: CoordinateCalcUtil.getEarthRadiusInDegree(appConfig.groundStation.lat),
      height: altitudeKm,
    };

    return ecefLocation;
  }
}
