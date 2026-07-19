import { AppConfigSatellite } from "@/common/model/AppConfigModel.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";

describe("AppConfigUtil", () => {
  beforeAll(() => {
    vi.spyOn(AppConfigUtil, "getConfig").mockImplementation(() => {
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

/**
 * migrateSatelliteTleToOmm のテスト
 * ユーザ登録衛星のuserRegisteredTleをuserRegisteredOmmに変換する処理を検証する
 */
describe("AppConfigUtil - migrateSatelliteTleToOmm", () => {
  function callMigrate(sat: AppConfigSatellite): AppConfigSatellite {
    return (AppConfigUtil as any)["migrateSatelliteTleToOmm"](sat);
  }

  it("ユーザ登録衛星でuserRegisteredOmmが未設定の場合は変換して設定する", () => {
    // 準備
    const sat = new AppConfigSatellite();
    sat.userRegistered = true;
    sat.userRegisteredSatelliteName = "ISS (ZARYA)";
    sat.userRegisteredTle =
      "1 25544U 98067A   26171.41461525  .00008813  00000+0  16600-3 0  9990\n" +
      "2 25544  51.6327 284.1189 0004557 208.5194 151.5545 15.49333088572250";

    // 実行
    const result = callMigrate(sat);

    // 検証
    expect(result.userRegisteredOmm).not.toBe("");
    const ommItem = JSON.parse(result.userRegisteredOmm);
    expect(ommItem.noradCatId).toBe("25544");
    expect(ommItem.meanMotion).toBeCloseTo(15.49333088, 8);
  });

  it("userRegisteredOmmが既に設定されている場合は何もしない", () => {
    // 準備
    const sat = new AppConfigSatellite();
    sat.userRegistered = true;
    sat.userRegisteredSatelliteName = "TEST";
    sat.userRegisteredTle = "1 99999U 00000A   24001.00000000  .00000000  00000-0  00000-0 0  9990\n2 99999  00.0000 000.0000 0000000 000.0000 000.0000 15.00000000000010";
    sat.userRegisteredOmm = '{"already":"set"}';

    // 実行
    const result = callMigrate(sat);

    // 検証
    expect(result.userRegisteredOmm).toBe('{"already":"set"}');
  });

  it("ユーザ登録衛星でない場合は何もしない", () => {
    // 準備
    const sat = new AppConfigSatellite();
    sat.userRegistered = false;
    sat.userRegisteredTle = "dummy";

    // 実行
    const result = callMigrate(sat);

    // 検証
    expect(result.userRegisteredOmm).toBe("");
  });
});
