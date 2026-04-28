import { createDefaultSatellite, initializeDefaultSatellites, normalizeData } from "@/common/util/DefaultSatelliteUtil";

describe("DefaultSatelliteUtil", () => {
  it("空のデフォルト衛星情報を生成できる", () => {
    // 準備
    const satelliteId = -1;
    const satelliteName = "";
    const noradId = "";

    // 実行
    const result = createDefaultSatellite(satelliteId, satelliteName, noradId);

    // 検証
    expect(result.satelliteId).toBe(satelliteId);
    expect(result.satelliteName).toBe(satelliteName);
    expect(result.noradId).toBe(noradId);
  });

  it("不足項目を含むデフォルト衛星情報を正規化できる", () => {
    // 準備
    const satellites = [
      {
        satelliteId: 10,
        satelliteName: "TEST SAT",
        noradId: "25544",
        uplink1: { uplinkHz: 145800000, uplinkMode: "USB" },
      },
    ];

    // 実行
    const result = initializeDefaultSatellites(satellites);

    // 検証
    expect(result).toHaveLength(1);
    expect(result[0].satelliteId).toBe(10);
    expect(result[0].satelliteName).toBe("TEST SAT");
    expect(result[0].noradId).toBe("25544");
    expect(result[0].uplink1.uplinkHz).toBe(145800000);
    expect(result[0].uplink1.uplinkMode).toBe("USB");
  });

  it("ネストしたデータをテンプレートに基づいて正規化できる", () => {
    // 準備
    const source = {
      foo: {
        bar: 100,
      },
    };
    const template = {
      foo: {
        bar: 0,
        baz: "",
      },
      qux: false,
    };

    // 実行
    const result = normalizeData(source, template);

    // 検証
    expect(result).toEqual({
      foo: {
        bar: 100,
        baz: "",
      },
      qux: false,
    });
  });
});
