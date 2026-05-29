import Constant from "@/common/Constant.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import OrbitLineService from "@/renderer/service/OrbitLineService.js";
import type SatelliteService from "@/renderer/service/SatelliteService.js";

/**
 * 人工衛星の軌道サービスファクトリ
 */
export default class OrbitLineServiceFactory {
  /**
   * 人工衛星の軌道サービスを生成する
   */
  public static async create(satService: SatelliteService): Promise<OrbitLineService> {
    const appConfig = await ApiAppConfig.getAppConfig();

    return new OrbitLineService(
      satService,
      Constant.OrbitCalculation.ORBIT_PITCH_MIN,
      true,
      appConfig.groundStation.lon - 180.0
    );
  }
}
