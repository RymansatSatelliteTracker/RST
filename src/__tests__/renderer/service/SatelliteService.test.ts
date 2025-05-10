import TleDataHelper from "@/__tests__/renderer/service/TleDataHelper";
import { InvalidArgumentError } from "@/common/exceptions";
import SatelliteService from "@/renderer/service/SatelliteService";

/**
 * [正常系]
 * 人工衛星のNoradIDが取得できる
 */
describe("[正常系]人工衛星のNoradIDが取得できる", () => {
  it("ISS (ZARYA)のNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const issNoradId = TleDataHelper.Satellite.ISS.getNoradId();
    // then 結果
    expect(issNoradId).toBe("25544");
  });

  it("だいち4号機のNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const daichiNoradId = TleDataHelper.Satellite.DAICHI.getNoradId();
    // then 結果
    expect(daichiNoradId).toBe("60182");
  });

  it("ひまわり8号機のNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const himawariNoradId = TleDataHelper.Satellite.HIMAWARI.getNoradId();
    // then 結果
    expect(himawariNoradId).toBe("40267");
  });

  it("みちびきのNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const michibikiNoradId = TleDataHelper.Satellite.MICHIBIKI.getNoradId();
    // then 結果
    expect(michibikiNoradId).toBe("42738");
  });

  it("GOES 17のNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const goesNoradId = TleDataHelper.Satellite.GOES.getNoradId();
    // then 結果
    expect(goesNoradId).toBe("43226");
  });

  it("AEHF-1 (USA 214)のNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const aehfNoradId = TleDataHelper.Satellite.AEHF.getNoradId();
    // then 結果
    expect(aehfNoradId).toBe("36868");
  });

  it("モルニア軌道のNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const molniyaNoradId = TleDataHelper.Satellite.MOLNIYA.getNoradId();
    // then 結果
    expect(molniyaNoradId).toBe("25485");
  });

  it("TESSのNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const heoNoradId = TleDataHelper.Satellite.HEO.getNoradId();
    // then 結果
    expect(heoNoradId).toBe("43435");
  });

  it("ISS (ZARYA)の軌道要素のNoradIDが取得できる", () => {
    // given 前提条件
    // when 実行
    const issOrbitNoradId = TleDataHelper.Satellite.ISS_ORBIT.getNoradId();
    // then 結果
    expect(issOrbitNoradId).toBe("25544");
  });
});

/**
 * [正常系]
 * 人工衛星の名称が取得できる
 */
describe("[正常系]人工衛星の名称が取得できる", () => {
  it("ISSの名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const issResult = TleDataHelper.Satellite.ISS.getSatelliteName();
    // then 結果
    expect(issResult).toBe("ISS (ZARYA)");
  });

  it("だいち4号機の名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const daichiResult = TleDataHelper.Satellite.DAICHI.getSatelliteName();
    // then 結果
    expect(daichiResult).toBe("ALOS-4 (DAICHI-4)");
  });

  it("ひまわり8号機の名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const himawariResult = TleDataHelper.Satellite.HIMAWARI.getSatelliteName();
    // then 結果
    expect(himawariResult).toBe("HIMAWARI 8");
  });

  it("みちびきの名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const michibikiResult = TleDataHelper.Satellite.MICHIBIKI.getSatelliteName();
    // then 結果
    expect(michibikiResult).toBe("QZS-2 (MICHIBIKI-2)");
  });

  it("GOES 17の名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const goesResult = TleDataHelper.Satellite.GOES.getSatelliteName();
    // then 結果
    expect(goesResult).toBe("GOES 17");
  });

  it("AEHF-1の名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const aehfResult = TleDataHelper.Satellite.AEHF.getSatelliteName();
    // then 結果
    expect(aehfResult).toBe("AEHF-1");
  });

  it("モルニア軌道の名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const molniyaResult = TleDataHelper.Satellite.MOLNIYA.getSatelliteName();
    // then 結果
    expect(molniyaResult).toBe("MOLNIYA 1-91");
  });

  it("TESSの名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const heoResult = TleDataHelper.Satellite.HEO.getSatelliteName();
    // then 結果
    expect(heoResult).toBe("TESS");
  });

  it("ISS (ZARYA)の軌道要素の名称が取得できる", () => {
    // given 前提条件
    // when 実行
    const issResult = TleDataHelper.Satellite.ISS_ORBIT.getSatelliteName();
    // then 結果
    expect(issResult).toBe("ISS (ZARYA)");
  });
});

/**
 * [正常系]
 * 人工衛星の軌道が静止軌道か判定できる
 */
describe("[正常系]人工衛星の軌道が静止軌道か判定できる", () => {
  it("ISSの軌道が静止軌道ではないことが判定できる", () => {
    // given 前提条件
    // when 実行
    const issResult = TleDataHelper.Satellite.ISS.isGeostationaryOrbit();
    // then 結果
    expect(issResult).toBe(false);
  });

  it("だいち4号機の軌道が静止軌道ではないことが判定できる", () => {
    // given 前提条件
    // when 実行
    const daichiResult = TleDataHelper.Satellite.DAICHI.isGeostationaryOrbit();
    // then 結果
    expect(daichiResult).toBe(false);
  });

  it("ひまわり8号機の軌道が静止軌道であることが判定できる", () => {
    // given 前提条件
    // when 実行
    const himawariResult = TleDataHelper.Satellite.HIMAWARI.isGeostationaryOrbit();
    // then 結果
    expect(himawariResult).toBe(true); // ひまわり8号機は静止軌道
  });

  it("みちびきの軌道が静止軌道ではないことが判定できる", () => {
    // given 前提条件
    // when 実行
    const michibikiResult = TleDataHelper.Satellite.MICHIBIKI.isGeostationaryOrbit();
    // then 結果
    expect(michibikiResult).toBe(false);
  });

  it("GOES 17の軌道が静止軌道であることが判定できる", () => {
    // given 前提条件
    // when 実行
    const goesResult = TleDataHelper.Satellite.GOES.isGeostationaryOrbit();
    // then 結果
    expect(goesResult).toBe(true); // GOES-17は静止軌道
  });

  it("AEHF-1の軌道が静止軌道ではないことが判定できる", () => {
    // given 前提条件
    // when 実行
    const aehfResult = TleDataHelper.Satellite.AEHF.isGeostationaryOrbit();
    // then 結果
    expect(aehfResult).toBe(false);
  });

  it("モルニア軌道の軌道が静止軌道ではないことが判定できる", () => {
    // given 前提条件
    // when 実行
    const molniyaResult = TleDataHelper.Satellite.MOLNIYA.isGeostationaryOrbit();
    // then 結果
    expect(molniyaResult).toBe(false);
  });

  it("TESSの軌道が静止軌道ではないことが判定できる", () => {
    // given 前提条件
    // when 実行
    const heoResult = TleDataHelper.Satellite.HEO.isGeostationaryOrbit();
    // then 結果
    expect(heoResult).toBe(false);
  });

  it("ISS (ZARYA)の軌道要素の軌道が静止軌道ではないことが判定できる", () => {
    // given 前提条件
    // when 実行
    const issResult = TleDataHelper.Satellite.ISS_ORBIT.isGeostationaryOrbit();
    // then 結果
    expect(issResult).toBe(false);
  });
});

/**
 * [正常系]
 * 人工衛星の軌道周期が1恒星日以上か判定できる
 */
describe("[正常系]人工衛星の軌道周期が1恒星日以上か判定できる", () => {
  it("ISSの軌道周期が1恒星日未満か判定できる", () => {
    // given 前提条件
    // when 実行
    const issResult = TleDataHelper.Satellite.ISS.isOverSiderealDay();
    // then 結果
    expect(issResult).toBe(false);
  });

  it("だいち4号機の軌道周期が1恒星日未満か判定できる", () => {
    // given 前提条件
    // when 実行
    const daichiResult = TleDataHelper.Satellite.DAICHI.isOverSiderealDay();
    // then 結果
    expect(daichiResult).toBe(false);
  });

  it("ひまわり8号機の軌道周期が1恒星日以上か判定できる", () => {
    // given 前提条件
    // when 実行
    const himawariResult = TleDataHelper.Satellite.HIMAWARI.isOverSiderealDay();
    // then 結果
    expect(himawariResult).toBe(true); // ひまわり8号機は1恒星日以上
  });

  it("みちびきの軌道周期が1恒星日以上か判定できる", () => {
    // given 前提条件
    // when 実行
    const michibikiResult = TleDataHelper.Satellite.MICHIBIKI.isOverSiderealDay();
    // then 結果
    expect(michibikiResult).toBe(true); // みちびきは1恒星日以上
  });

  it("GOES 17の軌道周期が1恒星日以上か判定できる", () => {
    // given 前提条件
    // when 実行
    const goesResult = TleDataHelper.Satellite.GOES.isOverSiderealDay();
    // then 結果
    expect(goesResult).toBe(true); // GOES-17は1恒星日以上
  });

  it("AEHF-1の軌道周期が1恒星日未満か判定できる", () => {
    // given 前提条件
    // when 実行
    const aehfResult = TleDataHelper.Satellite.AEHF.isOverSiderealDay();
    // then 結果
    expect(aehfResult).toBe(false); // AEHF-1は1恒星日未満
  });

  it("モルニア軌道の軌道周期が1恒星日未満か判定できる", () => {
    // given 前提条件
    // when 実行
    const molniyaResult = TleDataHelper.Satellite.MOLNIYA.isOverSiderealDay();
    // then 結果
    expect(molniyaResult).toBe(false);
  });

  it("TESSの軌道周期が1恒星日以上か判定できる", () => {
    // given 前提条件
    // when 実行
    const heoResult = TleDataHelper.Satellite.HEO.isOverSiderealDay();
    // then 結果
    expect(heoResult).toBe(true); // TESSは1恒星日以上
  });

  it("ISS (ZARYA)の軌道要素の軌道周期が1恒星日未満か判定できる", () => {
    // given 前提条件
    // when 実行
    const issResult = TleDataHelper.Satellite.ISS_ORBIT.isOverSiderealDay();
    // then 結果
    expect(issResult).toBe(false);
  });
});

/**
 * 準正常系テスト
 */
describe("準正常系テスト", () => {
  it("[準正常系]コンストラクタに渡す人工衛星の名称が空文字だった場合は例外をスローしない", () => {
    // 人工衛星の名称が空文字
    expect(
      () =>
        new SatelliteService({
          satelliteName: "",
          tleLine1: "1 25544U 98067A   24274.40627631  .00013723  00000-0  24831-3 0  9995",
          tleLine2: "2 25544  51.6392 154.2186 0007232  45.9401 125.4774 15.49946976474861",
        })
    ).not.toThrow(InvalidArgumentError);
  });
});

/**
 * 異常系テスト
 */
describe("異常系テスト", () => {
  it("[異常系]コンストラクタに渡すTLEの1行目が空文字だった場合は例外をスローする", () => {
    // TLEの1行目が空文字
    expect(
      () =>
        new SatelliteService({
          satelliteName: "ISS (ZARYA)",
          tleLine1: "",
          tleLine2: "2 25544  51.6392 154.2186 0007232  45.9401 125.4774 15.49946976474861",
        })
    ).toThrow(InvalidArgumentError);
  });
  it("[異常系]コンストラクタに渡すTLEの2行目が空文字だった場合は例外をスローする", () => {
    // TLEの2行目が空文字
    expect(
      () =>
        new SatelliteService({
          satelliteName: "ISS (ZARYA)",
          tleLine1: "1 25544U 98067A   24274.40627631  .00013723  00000-0  24831-3 0  9995",
          tleLine2: "",
        })
    ).toThrow(InvalidArgumentError);
  });
});
