import { InvalidArgumentError } from "@/common/exceptions";
import OrbitLineService from "@/renderer/service/OrbitLineService";
import {
  AEHF_SATELLITE_SERVICE,
  DAICHI_SATELLITE_SERVICE,
  GOES_SATELLITE_SERVICE,
  HEO_SATELLITE_SERVICE,
  HIMAWARI_SATELLITE_SERVICE,
  ISS_SATELLITE_SERVICE,
  MICHIBIKI_SATELLITE_SERVICE,
  MOLNIYA_SATELLITE_SERVICE,
} from "./SatelliteService.test";

/**
 * [正常系]
 * 人工衛星の軌道配列が取得できる
 */
test("getOrbitLineListAsync", async () => {
  const issOrbitLine = new OrbitLineService(ISS_SATELLITE_SERVICE);
  const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(issResult.resultOrbitLine).not.toStrictEqual([]);

  const daichiOrbitLine = new OrbitLineService(DAICHI_SATELLITE_SERVICE);
  const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);

  const himawariOrbitLine = new OrbitLineService(HIMAWARI_SATELLITE_SERVICE);
  const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(himawariResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // ひまわり8号機は軌道描画なし

  const michibikiOrbitLine = new OrbitLineService(MICHIBIKI_SATELLITE_SERVICE);
  const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);

  const goesOrbitLine = new OrbitLineService(GOES_SATELLITE_SERVICE);
  const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(goesResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // GOES-17は軌道描画なし

  const aehfOrbitLine = new OrbitLineService(AEHF_SATELLITE_SERVICE);
  const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);

  const molniyaOrbitLine = new OrbitLineService(MOLNIYA_SATELLITE_SERVICE);
  const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);

  const heoOrbitLine = new OrbitLineService(HEO_SATELLITE_SERVICE);
  const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
});

/**
 * [正常系]
 * 人工衛星の軌道配列が5分間隔で取得できる
 */
test("getOrbitLineListAsyncStep5Min", async () => {
  const issOrbitLine = new OrbitLineService(ISS_SATELLITE_SERVICE, 5);
  const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(issResult.resultOrbitLine).not.toStrictEqual([]);

  const daichiOrbitLine = new OrbitLineService(DAICHI_SATELLITE_SERVICE, 5);
  const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);

  const himawariOrbitLine = new OrbitLineService(HIMAWARI_SATELLITE_SERVICE, 5);
  const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(himawariResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // ひまわり8号機は軌道描画なし

  const michibikiOrbitLine = new OrbitLineService(MICHIBIKI_SATELLITE_SERVICE, 5);
  const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);

  const goesOrbitLine = new OrbitLineService(GOES_SATELLITE_SERVICE, 5);
  const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(goesResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // GOES-17は軌道描画なし

  const aehfOrbitLine = new OrbitLineService(AEHF_SATELLITE_SERVICE, 5);
  const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);

  const molniyaOrbitLine = new OrbitLineService(MOLNIYA_SATELLITE_SERVICE, 5);
  const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);

  const heoOrbitLine = new OrbitLineService(HEO_SATELLITE_SERVICE, 5);
  const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
});

/**
 * [正常系]
 * 人工衛星の軌道配列がラップアラウンドしないで取得できる
 */
test("getOrbitLineListAsyncWithoutWrapAround", async () => {
  const issOrbitLine = new OrbitLineService(ISS_SATELLITE_SERVICE, 1, false);
  const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  expect(issResult.resultOrbitLine.length).toBe(1);

  const daichiOrbitLine = new OrbitLineService(DAICHI_SATELLITE_SERVICE, 1, false);
  const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);
  expect(daichiResult.resultOrbitLine.length).toBe(1);

  const himawariOrbitLine = new OrbitLineService(HIMAWARI_SATELLITE_SERVICE, 1, false);
  const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(himawariResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // ひまわり8号機は軌道描画なし

  const michibikiOrbitLine = new OrbitLineService(MICHIBIKI_SATELLITE_SERVICE, 1, false);
  const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);
  expect(michibikiResult.resultOrbitLine.length).toBe(1);

  const goesOrbitLine = new OrbitLineService(GOES_SATELLITE_SERVICE, 1, false);
  const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(goesResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // GOES-17は軌道描画なし

  const aehfOrbitLine = new OrbitLineService(AEHF_SATELLITE_SERVICE, 1, false);
  const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);
  expect(aehfResult.resultOrbitLine.length).toBe(1);

  const molniyaOrbitLine = new OrbitLineService(MOLNIYA_SATELLITE_SERVICE, 1, false);
  const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);
  expect(molniyaResult.resultOrbitLine.length).toBe(1);

  const heoOrbitLine = new OrbitLineService(HEO_SATELLITE_SERVICE, 1, false);
  const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
  expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
  expect(heoResult.resultOrbitLine.length).toBe(1);
});

/**
 * [正常系]
 * 人工衛星の軌道配列が指定時間で分割して取得できる
 */
test("getSplitOrbitLineListAsync", async () => {
  const issOrbitLine = new OrbitLineService(ISS_SATELLITE_SERVICE);
  const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  expect(issResult.resultOrbitLine.length).not.toBe(1);

  const daichiOrbitLine = new OrbitLineService(DAICHI_SATELLITE_SERVICE);
  const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);
  expect(daichiResult.resultOrbitLine.length).not.toBe(1);

  const himawariOrbitLine = new OrbitLineService(HIMAWARI_SATELLITE_SERVICE);
  const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(himawariResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // ひまわり8号機は軌道描画なし

  const michibikiOrbitLine = new OrbitLineService(MICHIBIKI_SATELLITE_SERVICE);
  const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);
  expect(michibikiResult.resultOrbitLine.length).not.toBe(1);

  const goesOrbitLine = new OrbitLineService(GOES_SATELLITE_SERVICE);
  const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(goesResult).toStrictEqual({
    resultOrbitDashLine: [],
    resultOrbitLine: [],
  }); // GOES-17は軌道描画なし

  const aehfOrbitLine = new OrbitLineService(AEHF_SATELLITE_SERVICE);
  const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);
  expect(aehfResult.resultOrbitLine.length).not.toBe(1);

  const molniyaOrbitLine = new OrbitLineService(MOLNIYA_SATELLITE_SERVICE);
  const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);
  expect(molniyaResult.resultOrbitLine.length).not.toBe(1);

  const heoOrbitLine = new OrbitLineService(HEO_SATELLITE_SERVICE);
  const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
    new Date("2024-10-01T00:00:00Z"),
  ]);
  expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
  expect(heoResult.resultOrbitLine.length).not.toBe(1);
});

/**
 * [異常系]
 * コンストラクタに渡す軌道ピッチが人工衛星の軌道周期以上の場合は例外をスローする
 */
test("orbitPitchMinOutOfRange", () => {
  expect(() => new OrbitLineService(ISS_SATELLITE_SERVICE, 180)).toThrow(InvalidArgumentError);
});
