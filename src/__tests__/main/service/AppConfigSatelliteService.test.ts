import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { createDefaultSatellite } from "@/common/util/DefaultSatelliteUtil";
import AppConfigSatelliteService from "@/main/service/AppConfigSatelliteService";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

describe("AppConfigSatelliteService", () => {
  beforeAll(() => {
    jest.spyOn(DefaultSatelliteService.prototype, "init").mockImplementation(() => {
      return;
    });
    jest
      .spyOn(DefaultSatelliteService.prototype, "getDefaultSatelliteBySatelliteIdSync")
      .mockImplementation((satelliteId: number) => {
        // デフォルト衛星は衛星IDを任意指定
        return createDefaultSatellite(satelliteId, "TEST_SAT", "00000");
      });
    jest.spyOn(AppConfigUtil, "getConfig").mockImplementation(() => {
      const model: AppConfigSatellite = new AppConfigSatellite();
      // アプリケーション設定の衛星は衛星ID=1で固定
      model.satelliteId = 1;
      model.noradId = "12345";
      return { satellites: [model] } as any;
    });
  });
  it("デフォルト衛星を取得", () => {
    // 準備
    const appConfigSatelliteService = new AppConfigSatelliteService();
    // 実行
    const result = appConfigSatelliteService.getUserRegisteredAppConfigSatellite(0);
    // 検証
    expect(result?.noradId).toBe("00000");
  });
  it("アプリケーション設定を取得", () => {
    // 準備
    const appConfigSatelliteService = new AppConfigSatelliteService();
    // 実行
    const result = appConfigSatelliteService.getUserRegisteredAppConfigSatellite(1);
    // 検証
    expect(result?.noradId).toBe("12345");
  });
});
