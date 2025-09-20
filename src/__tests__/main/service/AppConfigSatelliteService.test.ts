import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { createDefaultSatellite } from "@/common/util/DefaultSatelliteUtil";
import AppConfigSatelliteService from "@/main/service/AppConfigSatelliteService";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

const DEFAULT_SATELLITE_ID = 0;
const DEFAULT_NORAD_ID = "00000";
const APPCONFIG_SATELLITE_ID = 1;
const APPCONFIG_NORAD_ID = "12345";
describe("AppConfigSatelliteService", () => {
  beforeAll(() => {
    jest.spyOn(DefaultSatelliteService.prototype, "init").mockImplementation(() => {
      return;
    });
    jest
      .spyOn(DefaultSatelliteService.prototype, "getDefaultSatelliteBySatelliteIdSync")
      .mockImplementation((satelliteId: number) => {
        // デフォルト衛星は衛星IDを任意指定
        return createDefaultSatellite(satelliteId, "TEST_SAT", DEFAULT_NORAD_ID);
      });
    jest.spyOn(AppConfigUtil, "getConfig").mockImplementation(() => {
      const model: AppConfigSatellite = new AppConfigSatellite();
      // アプリケーション設定の衛星は衛星ID=1で固定
      model.satelliteId = APPCONFIG_SATELLITE_ID;
      model.noradId = APPCONFIG_NORAD_ID;
      return { satellites: [model] } as any;
    });
  });
  it("デフォルト衛星を取得", () => {
    // 準備
    const appConfigSatelliteService = new AppConfigSatelliteService();
    // 実行
    const result = appConfigSatelliteService.getUserRegisteredAppConfigSatellite(DEFAULT_SATELLITE_ID);
    // 検証
    expect(result?.noradId).toBe(DEFAULT_NORAD_ID);
  });
  it("アプリケーション設定を取得", () => {
    // 準備
    const appConfigSatelliteService = new AppConfigSatelliteService();
    // 実行
    const result = appConfigSatelliteService.getUserRegisteredAppConfigSatellite(APPCONFIG_SATELLITE_ID);
    // 検証
    expect(result?.noradId).toBe(APPCONFIG_NORAD_ID);
  });
});
