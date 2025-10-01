import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

describe("AppConfigUtil", () => {
  beforeAll(() => {
    jest.spyOn(AppConfigUtil, "getConfig").mockImplementation(() => {
      const sat: AppConfigSatellite = new AppConfigSatellite();
      sat.satelliteId = 12345;
      sat.groupId = 1;
      return { satellites: [sat] } as any;
    });
  });

  it("検索がヒットする", () => {
    // 準備
    const satelliteId = 12345;
    const groupId = 1;
    // 実行
    const result = AppConfigUtil.searchAppConfigSatellite(satelliteId, groupId);
    // 検証
    expect(result?.satelliteId).toBe(satelliteId);
    expect(result?.groupId).toBe(groupId);
  });
  it("検索がヒットしない", () => {
    // 準備
    const satelliteId = 12345;
    const groupId = 2;
    // 実行
    const result = AppConfigUtil.searchAppConfigSatellite(satelliteId, groupId);
    // 検証
    expect(result).toBeNull();
  });
});
