import TleDataHelper from "@/__tests__/renderer/service/TleDataHelper";
import { InvalidArgumentError } from "@/common/exceptions";
import OrbitLineService from "@/renderer/service/OrbitLineService";

/**
 * [正常系]
 * 人工衛星の軌道配列が取得できる
 */
describe("[正常系]人工衛星の軌道配列が取得できる", () => {
  it("ISSの軌道配列が取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("だいち4号機の軌道配列が取得できる", async () => {
    // given 前提条件
    const daichiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.DAICHI);
    // when 実行
    const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("ひまわり8号機は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const himawariOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HIMAWARI8_20241001);
    // when 実行
    const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(himawariResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // ひまわり8号機は軌道描画なし
  });

  it("みちびきの軌道配列が取得できる", async () => {
    // given 前提条件
    const michibikiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MICHIBIKI);
    // when 実行
    const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("GOES 17は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const goesOrbitLine = new OrbitLineService(TleDataHelper.Satellite.GOES);
    // when 実行
    const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(goesResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // GOES-17は軌道描画なし
  });

  it("AEHF-1の軌道配列が取得できる", async () => {
    // given 前提条件
    const aehfOrbitLine = new OrbitLineService(TleDataHelper.Satellite.AEHF);
    // when 実行
    const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("モルニア軌道の軌道配列が取得できる", async () => {
    // given 前提条件
    const molniyaOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MOLNIYA);
    // when 実行
    const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("TESSの軌道配列が取得できる", async () => {
    // given 前提条件
    const heoOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HEO);
    // when 実行
    const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("ISS (ZARYA)の軌道要素の軌道配列が取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS_ORBIT);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  });
});

/**
 * [正常系]
 * 人工衛星の軌道配列が5分間隔で取得できる
 */
describe("[正常系]人工衛星の軌道配列が5分間隔で取得できる", () => {
  it("ISSの軌道配列が5分間隔で取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS, 5);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("だいち4号機の軌道配列が5分間隔で取得できる", async () => {
    // given 前提条件
    const daichiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.DAICHI, 5);
    // when 実行
    const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("ひまわり8号機は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const himawariOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HIMAWARI8_20241001, 5);
    // when 実行
    const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(himawariResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // ひまわり8号機は軌道描画なし
  });

  it("みちびきの軌道配列が5分間隔で取得できる", async () => {
    // given 前提条件
    const michibikiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MICHIBIKI, 5);
    // when 実行
    const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("GOES 17は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const goesOrbitLine = new OrbitLineService(TleDataHelper.Satellite.GOES, 5);
    // when 実行
    const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(goesResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // GOES-17は軌道描画なし
  });

  it("AEHF-1の軌道配列が5分間隔で取得できる", async () => {
    // given 前提条件
    const aehfOrbitLine = new OrbitLineService(TleDataHelper.Satellite.AEHF, 5);
    // when 実行
    const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("モルニア軌道の軌道配列が5分間隔で取得できる", async () => {
    // given 前提条件
    const molniyaOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MOLNIYA, 5);
    // when 実行
    const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("TESSの軌道配列が5分間隔で取得できる", async () => {
    // given 前提条件
    const heoOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HEO, 5);
    // when 実行
    const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("ISS (ZARYA)の軌道要素の軌道配列が5分間隔で取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS_ORBIT, 5);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  });
});

/**
 * [正常系]
 * 人工衛星の軌道配列がラップアラウンドしないで取得できる
 */
describe("[正常系]人工衛星の軌道配列がラップアラウンドしないで取得できる", () => {
  it("ISSの軌道配列がラップアラウンドしないで取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS, 1, false);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
    expect(issResult.resultOrbitLine.length).toBe(1);
  });

  it("だいち4号機の軌道配列がラップアラウンドしないで取得できる", async () => {
    // given 前提条件
    const daichiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.DAICHI, 1, false);
    // when 実行
    const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);
    expect(daichiResult.resultOrbitLine.length).toBe(1);
  });

  it("ひまわり8号機は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const himawariOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HIMAWARI8_20241001, 1, false);
    // when 実行
    const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(himawariResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // ひまわり8号機は軌道描画なし
  });

  it("みちびきの軌道配列がラップアラウンドしないで取得できる", async () => {
    // given 前提条件
    const michibikiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MICHIBIKI, 1, false);
    // when 実行
    const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);
    expect(michibikiResult.resultOrbitLine.length).toBe(1);
  });

  it("GOES 17は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const goesOrbitLine = new OrbitLineService(TleDataHelper.Satellite.GOES, 1, false);
    // when 実行
    const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(goesResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // GOES-17は軌道描画なし
  });

  it("AEHF-1の軌道配列がラップアラウンドしないで取得できる", async () => {
    // given 前提条件
    const aehfOrbitLine = new OrbitLineService(TleDataHelper.Satellite.AEHF, 1, false);
    // when 実行
    const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);
    expect(aehfResult.resultOrbitLine.length).toBe(1);
  });

  it("モルニア軌道の軌道配列がラップアラウンドしないで取得できる", async () => {
    // given 前提条件
    const molniyaOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MOLNIYA, 1, false);
    // when 実行
    const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);
    expect(molniyaResult.resultOrbitLine.length).toBe(1);
  });

  it("TESSの軌道配列がラップアラウンドしないで取得できる", async () => {
    // given 前提条件
    const heoOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HEO, 1, false);
    // when 実行
    const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
    expect(heoResult.resultOrbitLine.length).toBe(1);
  });

  it("ISS (ZARYA)の軌道要素の軌道配列がラップアラウンドしないで取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS_ORBIT, 1, false);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"));
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
    expect(issResult.resultOrbitLine.length).toBe(1);
  });
});

/**
 * [正常系]
 * 人工衛星の軌道配列が指定時間で分割して取得できる
 */
describe("[正常系]人工衛星の軌道配列が指定時間で分割して取得できる", () => {
  // 現在日時を作成する
  const currentDate = new Date("2024-10-01T00:00:00Z");

  it("ISSの軌道配列が指定時間で分割して取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("だいち4号機の軌道配列が指定時間で分割して取得できる", async () => {
    // given 前提条件
    const daichiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.DAICHI);
    // when 実行
    const daichiResult = await daichiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(daichiResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("ひまわり8号機は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const himawariOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HIMAWARI8_20241001);
    // when 実行
    const himawariResult = await himawariOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(himawariResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // ひまわり8号機は軌道描画なし
  });

  it("みちびきの軌道配列が指定時間で分割して取得できる", async () => {
    // given 前提条件
    const michibikiOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MICHIBIKI);
    // when 実行
    const michibikiResult = await michibikiOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(michibikiResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("GOES 17は静止軌道のため軌道配列が取得できない", async () => {
    // given 前提条件
    const goesOrbitLine = new OrbitLineService(TleDataHelper.Satellite.GOES);
    // when 実行
    const goesResult = await goesOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(goesResult).toStrictEqual({
      resultOrbitDashLine: [],
      resultOrbitLine: [],
    }); // GOES-17は軌道描画なし
  });

  it("AEHF-1の軌道配列が指定時間で分割して取得できる", async () => {
    // given 前提条件
    const aehfOrbitLine = new OrbitLineService(TleDataHelper.Satellite.AEHF);
    // when 実行
    const aehfResult = await aehfOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(aehfResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("モルニア軌道の軌道配列が指定時間で分割して取得できる", async () => {
    // given 前提条件
    const molniyaOrbitLine = new OrbitLineService(TleDataHelper.Satellite.MOLNIYA);
    // when 実行
    const molniyaResult = await molniyaOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(molniyaResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("TESSの軌道配列が指定時間で分割して取得できる", async () => {
    // given 前提条件
    const heoOrbitLine = new OrbitLineService(TleDataHelper.Satellite.HEO);
    // when 実行
    const heoResult = await heoOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(heoResult.resultOrbitLine).not.toStrictEqual([]);
  });

  it("ISS (ZARYA)の軌道要素の軌道配列が指定時間で分割して取得できる", async () => {
    // given 前提条件
    const issOrbitLine = new OrbitLineService(TleDataHelper.Satellite.ISS_ORBIT);
    // when 実行
    const issResult = await issOrbitLine.getOrbitLineListAsync(new Date("2024-10-01T00:00:00Z"), [
      new Date("2024-10-01T00:00:00Z"),
    ]);
    // then 結果
    expect(issResult.resultOrbitLine).not.toStrictEqual([]);
  });
});

/**
 * 異常系テスト
 */
describe("異常系テスト", () => {
  it("[異常系]コンストラクタに渡す軌道ピッチが人工衛星の軌道周期以上の場合は例外をスローする", () => {
    expect(() => new OrbitLineService(TleDataHelper.Satellite.ISS, 180)).toThrow(InvalidArgumentError);
  });
});
