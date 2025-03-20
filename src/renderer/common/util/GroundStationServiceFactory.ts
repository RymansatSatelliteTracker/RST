import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import GroundStationService from "@/renderer/service/GroundStationService";
import OverlapPassesService from "@/renderer/service/OverlapPassesService";
import SatelliteService from "@/renderer/service/SatelliteService";

/**
 * 地上局サービスファクトリ
 */
export default class GroundStationServiceFactory {
  /**
   * 地上局サービスを生成する
   */
  public static async create(
    satService: SatelliteService,
    validMinElDeg: number | null = null
  ): Promise<GroundStationService> {
    const appConfig = await ApiAppConfig.getAppConfig();

    return new GroundStationService(
      satService,
      appConfig.groundStation.lat,
      appConfig.groundStation.lon,
      appConfig.groundStation.height,
      validMinElDeg ? validMinElDeg : appConfig.satelliteSetting.satelliteChoiceMinEl
    );
  }

  /**
   * 地上局サービスを生成する（2か所の地上局向け）
   */
  public static async createOverlapPassesService(
    satService: SatelliteService,
    validMinElDeg: number | null = null
  ): Promise<OverlapPassesService> {
    const appConfig = await ApiAppConfig.getAppConfig();
    const minElDeg = validMinElDeg ? validMinElDeg : appConfig.satelliteSetting.satelliteChoiceMinEl;

    return new OverlapPassesService(
      satService,
      appConfig.groundStation.lat,
      appConfig.groundStation.lon,
      appConfig.groundStation2.lat,
      appConfig.groundStation2.lon,
      appConfig.groundStation.height,
      appConfig.groundStation2.height,
      minElDeg,
      minElDeg
    );
  }
}
