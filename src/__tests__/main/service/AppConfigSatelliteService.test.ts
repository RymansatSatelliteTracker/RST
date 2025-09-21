import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { DefaultSatelliteModel } from "@/common/model/DefaultSatelliteModel";
import { createDefaultSatellite } from "@/common/util/DefaultSatelliteUtil";
import AppConfigSatelliteService from "@/main/service/AppConfigSatelliteService";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

const DEFAULT_SATELLITE_ID = 0;
const DEFAULT_NORAD_ID = "00000";
const APPCONFIG_SATELLITE_ID = 1;
const APPCONFIG_NORAD_ID1 = "12345";
const APPCONFIG_NORAD_ID2 = "54321";
const APPCONFIG_NORAD_ID3 = "99999";
describe("AppConfigSatelliteService", () => {
  beforeAll(() => {
    jest.spyOn(DefaultSatelliteService.prototype, "init").mockImplementation(() => {
      return;
    });
    jest
      .spyOn(DefaultSatelliteModel.prototype, "getDefaultSatelliteBySatelliteId")
      .mockImplementation((satelliteId: number) => {
        return createDefaultSatellite(satelliteId, "TEST_SAT", DEFAULT_NORAD_ID);
      });
    jest.spyOn(AppConfigUtil, "getConfig").mockImplementation(() => {
      const sat1: AppConfigSatellite = new AppConfigSatellite();
      sat1.satelliteId = APPCONFIG_SATELLITE_ID;
      sat1.noradId = APPCONFIG_NORAD_ID1;
      sat1.groupId = 1;
      const sat2: AppConfigSatellite = new AppConfigSatellite();
      sat2.satelliteId = APPCONFIG_SATELLITE_ID;
      sat2.noradId = APPCONFIG_NORAD_ID2;
      sat2.groupId = 2;
      const sat3: AppConfigSatellite = new AppConfigSatellite();
      sat3.satelliteId = APPCONFIG_SATELLITE_ID;
      sat3.noradId = APPCONFIG_NORAD_ID3;
      sat3.groupId = -1;
      return { satellites: [sat1, sat2, sat3] } as any;
    });
  });
  it("デフォルト衛星を取得", () => {
    // 準備
    const appConfigSatelliteService = new AppConfigSatelliteService();
    const groupdId = -1;
    // 実行
    const result = appConfigSatelliteService.getUserRegisteredAppConfigSatellite(DEFAULT_SATELLITE_ID, groupdId);
    // 検証
    expect(result?.noradId).toBe(DEFAULT_NORAD_ID);
  });
  it("アプリケーション設定を取得(グループ一致)", () => {
    // 準備
    const appConfigSatelliteService = new AppConfigSatelliteService();
    const groupId = 2;
    // 実行
    const result = appConfigSatelliteService.getUserRegisteredAppConfigSatellite(APPCONFIG_SATELLITE_ID, groupId);
    // 検証
    expect(result?.noradId).toBe(APPCONFIG_NORAD_ID2);
  });
  it("アプリケーション設定を取得(グループ不一致なのでデフォルト衛星取得)", () => {
    // 準備
    const appConfigSatelliteService = new AppConfigSatelliteService();
    const groupId = 3;
    // 実行
    const result = appConfigSatelliteService.getUserRegisteredAppConfigSatellite(APPCONFIG_SATELLITE_ID, groupId);
    // 検証
    expect(result?.noradId).toBe(APPCONFIG_NORAD_ID3);
  });
});
