import { InvalidArgumentError } from "@/common/exceptions";
import TleUtil from "@/main/util/TleUtil";
import SatelliteService from "@/renderer/service/SatelliteService";

// ISS (ZARYA)
export const ISS_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "ISS (ZARYA)",
  tleLine1: "1 25544U 98067A   24274.40627631  .00013723  00000-0  24831-3 0  9995",
  tleLine2: "2 25544  51.6392 154.2186 0007232  45.9401 125.4774 15.49946976474861",
});

// 太陽同期軌道（だいち4号機）
export const DAICHI_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "ALOS-4 (DAICHI-4)",
  tleLine1: "1 60182U 24123A   24274.23099422  .00005580  00000-0  75353-3 0  9993",
  tleLine2: "2 60182  97.9218   9.3771 0001463  98.1663 261.9714 14.79468992 13473",
});

// 静止軌道（ひまわり8号機）
export const HIMAWARI_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "HIMAWARI 8",
  tleLine1: "1 40267U 14060A   24274.19632620 -.00000284  00000-0  00000+0 0  9992",
  tleLine2: "2 40267   0.0295 146.7844 0000710  44.5174  29.4843  1.00271295 36594",
});

// 準天頂軌道（みちびき）
export const MICHIBIKI_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "QZS-2 (MICHIBIKI-2)",
  tleLine1: "1 42738U 17028A   24273.81924390 -.00000212  00000-0  00000+0 0  9991",
  tleLine2: "2 42738  40.4122 252.2534 0747383 270.5488 281.1634  1.00256825 26853",
});

// （常に不可視）静止軌道（GOES 17）
export const GOES_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "GOES 17",
  tleLine1: "1 43226U 18022A   24273.08399552 -.00000103  00000-0  00000-0 0  9994",
  tleLine2: "2 43226   0.0501  14.2771 0002614 208.0976  71.5028  1.00271968 24140",
});

// （常に不可視）（AEHF-1 (USA 214))
export const AEHF_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "AEHF-1",
  tleLine1: "1 36868U 10039A   24273.79563417  .00000132  00000-0  00000-0 0  9990",
  tleLine2: "2 36868   6.6431  75.9702 0003222  93.3013 146.8404  1.00419503 47383",
});

// モルニア軌道
export const MOLNIYA_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "MOLNIYA 1-91",
  tleLine1: "1 25485U 98054A   24273.27870397 -.00000039  00000-0  00000-0 0  9994",
  tleLine2: "2 25485  64.1733  19.1544 6821288 289.7877  12.2720  2.36442145198774",
});

// 高軌道衛星（TESS）
export const HEO_SATELLITE_SERVICE = new SatelliteService({
  satelliteName: "TESS",
  tleLine1: "1 43435U 18038A   24275.46328589 -.00001321  00000-0  00000+0 0  9991",
  tleLine2: "2 43435  52.1227  60.4467 4749271 123.3912   6.8977  0.07759656  1094",
});

// ISS (ZARYA)の軌道要素
const ISS_TLE = TleUtil.orbitElementsToTLE({
  noradId: "25544",
  satelliteName: "ISS (ZARYA)",
  epochUtcDate: new Date(),
  semiMajorAxisKm: 6797.0,
  inclinationDeg: 51.6,
  raanDeg: 243.0542,
  argumentOfPerigeeDeg: 345.284,
  eccentricity: 0.0007697,
  meanAnomalyDeg: 100.4574,
  bStar: 0.0,
});
export const ISS_ORBIT_ELEMENT_SERVICE = new SatelliteService({
  satelliteName: ISS_TLE.satelliteName,
  tleLine1: ISS_TLE.tleLine1,
  tleLine2: ISS_TLE.tleLine2,
});

/**
 * [正常系]
 * 人工衛星のNoradIDが取得できる
 */
test("getNoradId", () => {
  const issResult = ISS_SATELLITE_SERVICE.getNoradId();
  expect(issResult).toBe("25544");
  const daichiResult = DAICHI_SATELLITE_SERVICE.getNoradId();
  expect(daichiResult).toBe("60182");
  const himawariResult = HIMAWARI_SATELLITE_SERVICE.getNoradId();
  expect(himawariResult).toBe("40267");
  const michibikiResult = MICHIBIKI_SATELLITE_SERVICE.getNoradId();
  expect(michibikiResult).toBe("42738");
  const goesResult = GOES_SATELLITE_SERVICE.getNoradId();
  expect(goesResult).toBe("43226");
  const aehfResult = AEHF_SATELLITE_SERVICE.getNoradId();
  expect(aehfResult).toBe("36868");
  const molniyaResult = MOLNIYA_SATELLITE_SERVICE.getNoradId();
  expect(molniyaResult).toBe("25485");
  const heoResult = HEO_SATELLITE_SERVICE.getNoradId();
  expect(heoResult).toBe("43435");
});

/**
 * [正常系]
 * 人工衛星の名称が取得できる
 */
test("getSatelliteName", () => {
  const issResult = ISS_SATELLITE_SERVICE.getSatelliteName();
  expect(issResult).toBe("ISS (ZARYA)");
  const daichiResult = DAICHI_SATELLITE_SERVICE.getSatelliteName();
  expect(daichiResult).toBe("ALOS-4 (DAICHI-4)");
  const himawariResult = HIMAWARI_SATELLITE_SERVICE.getSatelliteName();
  expect(himawariResult).toBe("HIMAWARI 8");
  const michibikiResult = MICHIBIKI_SATELLITE_SERVICE.getSatelliteName();
  expect(michibikiResult).toBe("QZS-2 (MICHIBIKI-2)");
  const goesResult = GOES_SATELLITE_SERVICE.getSatelliteName();
  expect(goesResult).toBe("GOES 17");
  const aehfResult = AEHF_SATELLITE_SERVICE.getSatelliteName();
  expect(aehfResult).toBe("AEHF-1");
  const molniyaResult = MOLNIYA_SATELLITE_SERVICE.getSatelliteName();
  expect(molniyaResult).toBe("MOLNIYA 1-91");
  const heoResult = HEO_SATELLITE_SERVICE.getSatelliteName();
  expect(heoResult).toBe("TESS");
  const issResult2 = ISS_ORBIT_ELEMENT_SERVICE.getSatelliteName();
  expect(issResult2).toBe("ISS (ZARYA)");
});

/**
 * [正常系]
 * 人工衛星の軌道が静止軌道か判定できる
 */
test("geostationaryOrbit", () => {
  const issResult = ISS_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(issResult).toBe(false);
  const daichiResult = DAICHI_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(daichiResult).toBe(false);
  const himawariResult = HIMAWARI_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(himawariResult).toBe(true); // ひまわり8号機は静止軌道
  const michibikiResult = MICHIBIKI_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(michibikiResult).toBe(false);
  const goesResult = GOES_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(goesResult).toBe(true); // GOES-17は静止軌道
  const aehfResult = AEHF_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(aehfResult).toBe(false);
  const molniyaResult = MOLNIYA_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(molniyaResult).toBe(false);
  const heoResult = HEO_SATELLITE_SERVICE.isGeostationaryOrbit();
  expect(heoResult).toBe(false);
  const issResult2 = ISS_ORBIT_ELEMENT_SERVICE.isGeostationaryOrbit();
  expect(issResult2).toBe(false);
});

/**
 * [正常系]
 * 人工衛星の軌道周期が1恒星日以上か判定できる
 */
test("isOverSiderealDay", () => {
  const issResult = ISS_SATELLITE_SERVICE.isOverSiderealDay();
  expect(issResult).toBe(false);
  const daichiResult = DAICHI_SATELLITE_SERVICE.isOverSiderealDay();
  expect(daichiResult).toBe(false);
  const himawariResult = HIMAWARI_SATELLITE_SERVICE.isOverSiderealDay();
  expect(himawariResult).toBe(true); // ひまわり8号機は1恒星日以上
  const michibikiResult = MICHIBIKI_SATELLITE_SERVICE.isOverSiderealDay();
  expect(michibikiResult).toBe(true); // みちびきは1恒星日以上
  const goesResult = GOES_SATELLITE_SERVICE.isOverSiderealDay();
  expect(goesResult).toBe(true); // GOES-17は1恒星日以上
  const aehfResult = AEHF_SATELLITE_SERVICE.isOverSiderealDay();
  expect(aehfResult).toBe(false); // AEHF-1は1恒星日未満
  const molniyaResult = MOLNIYA_SATELLITE_SERVICE.isOverSiderealDay();
  expect(molniyaResult).toBe(false);
  const heoResult = HEO_SATELLITE_SERVICE.isOverSiderealDay();
  expect(heoResult).toBe(true); // TESSは1恒星日以上
  const issResult2 = ISS_ORBIT_ELEMENT_SERVICE.isOverSiderealDay();
  expect(issResult2).toBe(false);
});

/**
 * [準正常系]
 * コンストラクタに渡す人工衛星の名称が空文字だった場合は例外をスローしない
 */
test("satelliteNameNone", () => {
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

/**
 * [異常系]
 * コンストラクタに渡すTLE行が空文字だった場合は例外をスローする
 */
test("nullError", () => {
  // TLEの1行目が空文字
  expect(
    () =>
      new SatelliteService({
        satelliteName: "ISS (ZARYA)",
        tleLine1: "",
        tleLine2: "2 25544  51.6392 154.2186 0007232  45.9401 125.4774 15.49946976474861",
      })
  ).toThrow(InvalidArgumentError);
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
