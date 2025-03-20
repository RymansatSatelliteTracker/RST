import OverlapPassesService from "@/renderer/service/OverlapPassesService";
import { GROUND2_STATION, GROUND_STATION } from "./GroundStationService.test";
import { GOES_SATELLITE_SERVICE, HIMAWARI_SATELLITE_SERVICE, ISS_SATELLITE_SERVICE } from "./SatelliteService.test";

/**
 * [正常系]
 * 2か所の地上局から同時に観測できる人工衛星の可視時間リストが取得できる
 */
test("getOverlapPassesListAsync", async () => {
  const nowDate = new Date();
  const oneDayLaterDate = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);

  // 宮本工場(東京都江戸川区)と種子島宇宙センターで同時に観測できる可視時間リストを取得する
  const issOverlapPasses = new OverlapPassesService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    GROUND2_STATION.latitudeDeg,
    GROUND2_STATION.longitudeDeg,
    GROUND_STATION.AltitudeM,
    GROUND2_STATION.AltitudeM
  );
  const issResult = await issOverlapPasses.getOverlapPassesListAsync(nowDate, oneDayLaterDate);
  expect(issResult && issResult[0].aos).not.toBe(null);
  expect(issResult && issResult[0].maxEl).not.toBe(null);
  expect(issResult && issResult[0].los).not.toBe(null);
  expect(issResult && issResult[0].durationMs).not.toBe(null);
});

/**
 * [正常系]
 * 2か所の地上局から常に可視の人工衛星の可視時間リストが取得できる
 */
test("getAlwaysVisiblePassesListAsync", async () => {
  const nowDate = new Date();
  const oneDayLaterDate = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);

  // 宮本工場(東京都江戸川区)と種子島宇宙センターで常に可視の人工衛星の可視時間リストが取得できる
  const himawariOverlapPasses = new OverlapPassesService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    GROUND2_STATION.latitudeDeg,
    GROUND2_STATION.longitudeDeg,
    GROUND_STATION.AltitudeM,
    GROUND2_STATION.AltitudeM
  );
  const himawariResult = await himawariOverlapPasses.getOverlapPassesListAsync(nowDate, oneDayLaterDate);
  expect(himawariResult && himawariResult[0].aos).toBe(null);
  expect(himawariResult && himawariResult[0].maxEl).not.toBe(null);
  expect(himawariResult && himawariResult[0].los).toBe(null);
  expect(himawariResult && himawariResult[0].durationMs).toBe(null);
});

/**
 * [正常系]
 * 2か所の地上局から常に不可視の人工衛星の可視時間リストが取得できない
 */
test("getAlwaysInvisiblePassesListAsync", async () => {
  const nowDate = new Date();
  const oneDayLaterDate = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);

  // 宮本工場(東京都江戸川区)と種子島宇宙センターで常に不可視の人工衛星の可視時間リストが取得できない
  const goesOverlapPasses = new OverlapPassesService(
    GOES_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    GROUND2_STATION.latitudeDeg,
    GROUND2_STATION.longitudeDeg,
    GROUND_STATION.AltitudeM,
    GROUND2_STATION.AltitudeM
  );
  const goesResult = await goesOverlapPasses.getOverlapPassesListAsync(nowDate, oneDayLaterDate);
  expect(goesResult).toBe(null); // GOES-17は常時不可視
});
