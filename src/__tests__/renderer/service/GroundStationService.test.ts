import Constant from "@/common/Constant";
import { InvalidArgumentError } from "@/common/exceptions";
import GroundStationService, { VisibilityType } from "@/renderer/service/GroundStationService";
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

// 地上局位置設定1：リーマンサット地上局の座標
export const GROUND_STATION = {
  latitudeDeg: 35.69809913754548,
  longitudeDeg: 139.87427345857722,
  AltitudeM: -1.0, // 地上局の高度[単位:m]
};
// 地上局位置設定2：種子島宇宙センター
export const GROUND2_STATION = {
  latitudeDeg: 30.3960255,
  longitudeDeg: 130.9700461,
  AltitudeM: 28.7832, // 地上局の高度[単位:m]
};

/**
 * [正常系]
 * 人工衛星の可視種別が取得できる
 */
test("getVisibilityType", () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult = issGroundStation.getVisibilityType();
  expect(issResult).toBe(VisibilityType.VISIBLE);

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult = daichiGroundStation.getVisibilityType();
  expect(daichiResult).toBe(VisibilityType.VISIBLE);

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult = himawariGroundStation.getVisibilityType();
  expect(himawariResult).toBe(VisibilityType.ALWAYS_VISIBLE); // ひまわり8号機は常時可視

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult = michibikiGroundStation.getVisibilityType();
  expect(michibikiResult).toBe(VisibilityType.ALWAYS_VISIBLE); // みちびきは常時可視

  const goesGroundStation = new GroundStationService(
    GOES_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const goesResult = goesGroundStation.getVisibilityType();
  expect(goesResult).toBe(VisibilityType.ALWAYS_INVISIBLE); // GOES-17は常時不可視

  const aehfGroundStation = new GroundStationService(
    AEHF_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const aehfResult = aehfGroundStation.getVisibilityType();
  expect(aehfResult).toBe(VisibilityType.VISIBLE);

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult = molniyaGroundStation.getVisibilityType();
  expect(molniyaResult).toBe(VisibilityType.VISIBLE);

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult = heoGroundStation.getVisibilityType();
  expect(heoResult).toBe(VisibilityType.VISIBLE);
});

/**
 * [正常系]
 * 人工衛星の可視/不可視判定が取得できる
 */
test("isSatelliteVisibleAsync", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult = await issGroundStation.getOrbitPassAsync(currentDate);
  expect(issResult && issResult.maxEl && (await issGroundStation.isSatelliteVisibleAsync(issResult.maxEl.date))).toBe(
    true
  );
  expect(
    issResult &&
      issResult.aos &&
      (await issGroundStation.isSatelliteVisibleAsync(new Date(issResult.aos.date.getTime() - 60000)))
  ).toBe(false);

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult = await daichiGroundStation.getOrbitPassAsync(currentDate);
  expect(
    daichiResult && daichiResult.maxEl && (await daichiGroundStation.isSatelliteVisibleAsync(daichiResult.maxEl.date))
  ).toBe(true);
  expect(
    daichiResult &&
      daichiResult.aos &&
      (await daichiGroundStation.isSatelliteVisibleAsync(new Date(daichiResult.aos.date.getTime() - 60000)))
  ).toBe(false);

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult = await himawariGroundStation.getOrbitPassAsync(currentDate);
  expect(
    himawariResult &&
      himawariResult.maxEl &&
      (await himawariGroundStation.isSatelliteVisibleAsync(himawariResult.maxEl.date))
  ).toBe(true);

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult = await michibikiGroundStation.getOrbitPassAsync(currentDate);
  expect(
    michibikiResult &&
      michibikiResult.maxEl &&
      (await michibikiGroundStation.isSatelliteVisibleAsync(michibikiResult.maxEl.date))
  ).toBe(true);

  const goesGroundStation = new GroundStationService(
    GOES_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  await goesGroundStation.getOrbitPassAsync(currentDate);
  expect(await goesGroundStation.isSatelliteVisibleAsync(currentDate)).toBe(false);

  const aehfrandStation = new GroundStationService(
    AEHF_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  await aehfrandStation.getOrbitPassAsync(currentDate);
  expect(await aehfrandStation.isSatelliteVisibleAsync(currentDate)).toBe(false);

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult = await molniyaGroundStation.getOrbitPassAsync(currentDate);
  expect(
    molniyaResult &&
      molniyaResult.maxEl &&
      (await molniyaGroundStation.isSatelliteVisibleAsync(molniyaResult.maxEl.date))
  ).toBe(true);
  expect(
    molniyaResult &&
      molniyaResult.aos &&
      (await molniyaGroundStation.isSatelliteVisibleAsync(new Date(molniyaResult.aos.date.getTime() - 60000)))
  ).toBe(false);

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult = await heoGroundStation.getOrbitPassAsync(currentDate);
  expect(heoResult && heoResult.maxEl && (await heoGroundStation.isSatelliteVisibleAsync(heoResult.maxEl.date))).toBe(
    true
  );
  expect(
    heoResult &&
      heoResult.aos &&
      (await heoGroundStation.isSatelliteVisibleAsync(new Date(heoResult.aos.date.getTime() - 60000)))
  ).toBe(false);
});

/**
 * [正常系]
 * 人工衛星の可視時間が一つ取得できる
 */
test("getOrbitPassAsync", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult = await issGroundStation.getOrbitPassAsync(currentDate);
  expect(issResult && issResult.aos).not.toBe(null);
  expect(issResult && issResult.maxEl).not.toBe(null);
  expect(issResult && issResult.los).not.toBe(null);
  expect(issResult && issResult.durationMs).not.toBe(null);

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult = await daichiGroundStation.getOrbitPassAsync(currentDate);
  expect(daichiResult && daichiResult.aos).not.toBe(null);
  expect(daichiResult && daichiResult.maxEl).not.toBe(null);
  expect(daichiResult && daichiResult.los).not.toBe(null);
  expect(daichiResult && daichiResult.durationMs).not.toBe(null);

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult = await himawariGroundStation.getOrbitPassAsync(currentDate);
  expect(himawariResult && himawariResult.aos).toBe(null);
  expect(himawariResult && himawariResult.maxEl).not.toBe(null); // ひまわり8号機は常時可視のためAOS/LOSなし
  expect(himawariResult && himawariResult.los).toBe(null);
  expect(himawariResult && himawariResult.durationMs).toBe(null);

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult = await michibikiGroundStation.getOrbitPassAsync(currentDate);
  expect(michibikiResult && michibikiResult.aos).toBe(null);
  expect(michibikiResult && michibikiResult.maxEl).not.toBe(null); // みちびきは常時可視のためAOS/LOSなし
  expect(michibikiResult && michibikiResult.los).toBe(null);
  expect(michibikiResult && michibikiResult.durationMs).toBe(null);

  const goesGroundStation = new GroundStationService(
    GOES_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const goesResult = await goesGroundStation.getOrbitPassAsync(currentDate);
  expect(goesResult).toBe(null); // GOES-17は常時不可視のためnull

  const aehfrandStation = new GroundStationService(
    AEHF_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const aehfResult = await aehfrandStation.getOrbitPassAsync(currentDate);
  expect(aehfResult).toBe(null); // AEHF-1は常時不可視のためnull

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult = await molniyaGroundStation.getOrbitPassAsync(currentDate);
  expect(molniyaResult && molniyaResult.aos).not.toBe(null);
  expect(molniyaResult && molniyaResult.maxEl).not.toBe(null);
  expect(molniyaResult && molniyaResult.los).not.toBe(null);
  expect(molniyaResult && molniyaResult.durationMs).not.toBe(null);

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult = await heoGroundStation.getOrbitPassAsync(currentDate);
  expect(heoResult && heoResult.aos).not.toBe(null);
  expect(heoResult && heoResult.maxEl).not.toBe(null);
  expect(heoResult && heoResult.los).not.toBe(null);
  expect(heoResult && heoResult.durationMs).not.toBe(null);
});

/**
 * [正常系]
 * 人工衛星の可視時間がキャッシュから取得できる
 */
test("getOrbitPassAsyncFromCache", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult1 = await issGroundStation.getOrbitPassAsync(currentDate);
  const issResult2 = await issGroundStation.getOrbitPassAsync(currentDate);
  expect(issResult1).not.toBe(null);
  expect(issResult2).not.toBe(null);
  if (issResult1 && issResult2) {
    expect(issResult1.aos).toStrictEqual(issResult2.aos);
    expect(issResult1.maxEl).toStrictEqual(issResult2.maxEl);
    expect(issResult1.los).toStrictEqual(issResult2.los);
    expect(issResult1.durationMs).toStrictEqual(issResult2.durationMs);
  }

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult1 = await daichiGroundStation.getOrbitPassAsync(currentDate);
  const daichiResult2 = await daichiGroundStation.getOrbitPassAsync(currentDate);
  expect(daichiResult1).not.toBe(null);
  expect(daichiResult2).not.toBe(null);
  if (daichiResult1 && daichiResult2) {
    expect(daichiResult1.aos).toStrictEqual(daichiResult2.aos);
    expect(daichiResult1.maxEl).toStrictEqual(daichiResult2.maxEl);
    expect(daichiResult1.los).toStrictEqual(daichiResult2.los);
    expect(daichiResult1.durationMs).toStrictEqual(daichiResult2.durationMs);
  }

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult1 = await himawariGroundStation.getOrbitPassAsync(currentDate);
  const himawariResult2 = await himawariGroundStation.getOrbitPassAsync(currentDate);
  expect(himawariResult1).not.toBe(null);
  expect(himawariResult2).not.toBe(null);
  if (himawariResult1 && himawariResult2) {
    expect(himawariResult1.maxEl).toStrictEqual(himawariResult2.maxEl); // ひまわり8号機は常時可視のためAOS/LOSなし
  }

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult1 = await michibikiGroundStation.getOrbitPassAsync(currentDate);
  const michibikiResult2 = await michibikiGroundStation.getOrbitPassAsync(currentDate);
  expect(michibikiResult1).not.toBe(null);
  expect(michibikiResult2).not.toBe(null);
  if (michibikiResult1 && michibikiResult2) {
    expect(michibikiResult1.maxEl).toStrictEqual(michibikiResult2.maxEl); // みちびきは常時可視のためAOS/LOSなし
  }

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult1 = await molniyaGroundStation.getOrbitPassAsync(currentDate);
  const molniyaResult2 = await molniyaGroundStation.getOrbitPassAsync(currentDate);
  expect(molniyaResult1).not.toBe(null);
  expect(molniyaResult2).not.toBe(null);
  if (molniyaResult1 && molniyaResult2) {
    expect(molniyaResult1.aos).toStrictEqual(molniyaResult2.aos);
    expect(molniyaResult1.maxEl).toStrictEqual(molniyaResult2.maxEl);
    expect(molniyaResult1.los).toStrictEqual(molniyaResult2.los);
    expect(molniyaResult1.durationMs).toStrictEqual(molniyaResult2.durationMs);
  }

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult1 = await heoGroundStation.getOrbitPassAsync(currentDate);
  const heoResult2 = await heoGroundStation.getOrbitPassAsync(currentDate);
  expect(heoResult1).not.toBe(null);
  expect(heoResult2).not.toBe(null);
  if (heoResult1 && heoResult2) {
    expect(heoResult1.aos).toStrictEqual(heoResult2.aos);
    expect(heoResult1.maxEl).toStrictEqual(heoResult2.maxEl);
    expect(heoResult1.los).toStrictEqual(heoResult2.los);
    expect(heoResult1.durationMs).toStrictEqual(heoResult2.durationMs);
  }
});

/**
 * [正常系]
 * 人工衛星の可視時間がキャッシュの後続日時から取得できる
 */
test("getOrbitPassAsyncAfterCache", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult1 = await issGroundStation.getOrbitPassAsync(currentDate);
  expect(issResult1 && issResult1.los).not.toBe(null);
  if (issResult1 && issResult1.los) {
    const issResult2 = await issGroundStation.getOrbitPassAsync(
      new Date(issResult1.los.date.getTime() + Constant.Time.MILLISECONDS_IN_MINUTE)
    );
    expect(issResult1.aos).not.toStrictEqual(issResult2 && issResult2.aos);
    expect(issResult1.maxEl).not.toStrictEqual(issResult2 && issResult2.maxEl);
    expect(issResult1.los).not.toStrictEqual(issResult2 && issResult2.los);
    expect(issResult1.durationMs).not.toStrictEqual(issResult2 && issResult2.durationMs);
  }

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult1 = await daichiGroundStation.getOrbitPassAsync(currentDate);
  expect(daichiResult1 && daichiResult1.los).not.toBe(null);
  if (daichiResult1 && daichiResult1.los) {
    const daichiResult2 = await daichiGroundStation.getOrbitPassAsync(
      new Date(daichiResult1.los.date.getTime() + Constant.Time.MILLISECONDS_IN_MINUTE)
    );
    expect(daichiResult1.aos).not.toStrictEqual(daichiResult2 && daichiResult2.aos);
    expect(daichiResult1.maxEl).not.toStrictEqual(daichiResult2 && daichiResult2.maxEl);
    expect(daichiResult1.los).not.toStrictEqual(daichiResult2 && daichiResult2.los);
    expect(daichiResult1.durationMs).not.toStrictEqual(daichiResult2 && daichiResult2.durationMs);
  }

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult1 = await molniyaGroundStation.getOrbitPassAsync(currentDate);
  expect(molniyaResult1 && molniyaResult1.los).not.toBe(null);
  if (molniyaResult1 && molniyaResult1.los) {
    const molniyaResult2 = await molniyaGroundStation.getOrbitPassAsync(
      new Date(molniyaResult1.los.date.getTime() + Constant.Time.MILLISECONDS_IN_MINUTE)
    );
    expect(molniyaResult1.aos).not.toStrictEqual(molniyaResult2 && molniyaResult2.aos);
    expect(molniyaResult1.maxEl).not.toStrictEqual(molniyaResult2 && molniyaResult2.maxEl);
    expect(molniyaResult1.los).not.toStrictEqual(molniyaResult2 && molniyaResult2.los);
    expect(molniyaResult1.durationMs).not.toStrictEqual(molniyaResult2 && molniyaResult2.durationMs);
  }

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult1 = await heoGroundStation.getOrbitPassAsync(currentDate);
  expect(heoResult1 && heoResult1.los).not.toBe(null);
  if (heoResult1 && heoResult1.los) {
    const heoResult2 = await heoGroundStation.getOrbitPassAsync(
      new Date(heoResult1.los.date.getTime() + Constant.Time.MILLISECONDS_IN_MINUTE)
    );
    expect(heoResult1.aos).not.toStrictEqual(heoResult2 && heoResult2.aos);
    expect(heoResult1.maxEl).not.toStrictEqual(heoResult2 && heoResult2.maxEl);
    expect(heoResult1.los).not.toStrictEqual(heoResult2 && heoResult2.los);
    expect(heoResult1.durationMs).not.toStrictEqual(heoResult2 && heoResult2.durationMs);
  }
});

/**
 * [正常系]
 * AOS/LOSが仰角0度で取得できる
 */
test("getOrbitPassAsync", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult = await issGroundStation.getOrbitPassAsync(currentDate);
  expect(issResult && issResult.aos && Math.abs(Math.trunc(issResult.aos.lookAngles.elevation))).toBe(0);
  expect(issResult && issResult.los && Math.abs(Math.trunc(issResult.los.lookAngles.elevation))).toBe(0);

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult = await daichiGroundStation.getOrbitPassAsync(currentDate);
  expect(daichiResult && daichiResult.aos && Math.abs(Math.trunc(daichiResult.aos.lookAngles.elevation))).toBe(0);
  expect(daichiResult && daichiResult.los && Math.abs(Math.trunc(daichiResult.los.lookAngles.elevation))).toBe(0);

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult = await molniyaGroundStation.getOrbitPassAsync(currentDate);
  expect(molniyaResult && molniyaResult.aos && Math.abs(Math.trunc(molniyaResult.aos.lookAngles.elevation))).toBe(0);
  expect(molniyaResult && molniyaResult.los && Math.abs(Math.trunc(molniyaResult.los.lookAngles.elevation))).toBe(0);

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult = await heoGroundStation.getOrbitPassAsync(currentDate);
  expect(heoResult && heoResult.aos && Math.abs(Math.trunc(heoResult.aos.lookAngles.elevation))).toBe(0);
  expect(heoResult && heoResult.los && Math.abs(Math.trunc(heoResult.los.lookAngles.elevation))).toBe(0);
});

/**
 * [正常系]
 * 人工衛星の可視時間リストが取得できる
 */
test("getOrbitPassListAsync", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const oneDayLaterDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult = await issGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(issResult && issResult[0].aos).not.toBe(null);
  expect(issResult && issResult[0].maxEl).not.toBe(null);
  expect(issResult && issResult[0].los).not.toBe(null);
  expect(issResult && issResult[0].durationMs).not.toBe(null);

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult = await daichiGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(daichiResult && daichiResult[0].aos).not.toBe(null);
  expect(daichiResult && daichiResult[0].maxEl).not.toBe(null);
  expect(daichiResult && daichiResult[0].los).not.toBe(null);
  expect(daichiResult && daichiResult[0].durationMs).not.toBe(null);

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult = await himawariGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(himawariResult && himawariResult[0].aos).toBe(null);
  expect(himawariResult && himawariResult[0].maxEl).not.toBe(null); // ひまわり8号機は常時可視のためAOS/LOSなし
  expect(himawariResult && himawariResult[0].los).toBe(null);
  expect(himawariResult && himawariResult[0].durationMs).toBe(null);

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult = await michibikiGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(michibikiResult && michibikiResult[0].aos).toBe(null);
  expect(michibikiResult && michibikiResult[0].maxEl).not.toBe(null); // みちびきは常時可視のためAOS/LOSなし
  expect(michibikiResult && michibikiResult[0].los).toBe(null);
  expect(michibikiResult && michibikiResult[0].durationMs).toBe(null);

  const goesGroundStation = new GroundStationService(
    GOES_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const goesResult = await goesGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(goesResult).toBe(null); // GOES-17は常時不可視のためnull

  const aehfGroundStation = new GroundStationService(
    AEHF_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const aehfResult = await aehfGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(aehfResult).toStrictEqual([]);

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult = await molniyaGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(molniyaResult && molniyaResult[0].aos).not.toBe(null);
  expect(molniyaResult && molniyaResult[0].maxEl).not.toBe(null);
  expect(molniyaResult && molniyaResult[0].los).not.toBe(null);
  expect(molniyaResult && molniyaResult[0].durationMs).not.toBe(null);

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult = await heoGroundStation.getOrbitPassListAsync(
    currentDate,
    new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000)
  );
  expect(heoResult && heoResult[0].aos).not.toBe(null);
  expect(heoResult && heoResult[0].maxEl).not.toBe(null);
  expect(heoResult && heoResult[0].los).not.toBe(null);
  expect(heoResult && heoResult[0].durationMs).not.toBe(null);
});

/**
 * [正常系]
 * 人工衛星の可視時間リストがキャッシュから取得できる
 */
test("getOrbitPassListAsyncFromCache", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const oneDayLaterDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult1 = await issGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  const issResult2 = await issGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(issResult1).not.toBe(null);
  expect(issResult2).not.toBe(null);
  if (issResult1 && issResult2) {
    expect(issResult1.length).toBe(issResult2.length);
    for (let i = 0; i < issResult1.length; i++) {
      expect(issResult1[i].aos).toStrictEqual(issResult2[i].aos);
      expect(issResult1[i].maxEl).toStrictEqual(issResult2[i].maxEl);
      expect(issResult1[i].los).toStrictEqual(issResult2[i].los);
      expect(issResult1[i].durationMs).toStrictEqual(issResult2[i].durationMs);
    }
  }

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult1 = await daichiGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  const daichiResult2 = await daichiGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(daichiResult1).not.toBe(null);
  expect(daichiResult2).not.toBe(null);
  if (daichiResult1 && daichiResult2) {
    expect(daichiResult1.length).toBe(daichiResult2.length);
    for (let i = 0; i < daichiResult1.length; i++) {
      expect(daichiResult1[i].aos).toStrictEqual(daichiResult2[i].aos);
      expect(daichiResult1[i].maxEl).toStrictEqual(daichiResult2[i].maxEl);
      expect(daichiResult1[i].los).toStrictEqual(daichiResult2[i].los);
      expect(daichiResult1[i].durationMs).toStrictEqual(daichiResult2[i].durationMs);
    }
  }

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult1 = await himawariGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  const himawariResult2 = await himawariGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(himawariResult1 && himawariResult1.length).toBe(1);
  expect(himawariResult1 && himawariResult1[0].maxEl).toStrictEqual(himawariResult2 && himawariResult2[0].maxEl); // ひまわり8号機は常時可視のためAOS/LOSなし

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult1 = await michibikiGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  const michibikiResult2 = await michibikiGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(michibikiResult1 && michibikiResult1.length).toBe(1);
  expect(michibikiResult1 && michibikiResult1[0].maxEl).toStrictEqual(michibikiResult2 && michibikiResult2[0].maxEl); // みちびきは常時可視のためAOS/LOSなし

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult1 = await molniyaGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  const molniyaResult2 = await molniyaGroundStation.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  expect(molniyaResult1).not.toBe(null);
  expect(molniyaResult2).not.toBe(null);
  if (molniyaResult1 && molniyaResult2) {
    expect(molniyaResult1.length).toBe(molniyaResult2.length);
    for (let i = 0; i < molniyaResult1.length; i++) {
      expect(molniyaResult1[i].aos).toStrictEqual(molniyaResult2[i].aos);
      expect(molniyaResult1[i].maxEl).toStrictEqual(molniyaResult2[i].maxEl);
      expect(molniyaResult1[i].los).toStrictEqual(molniyaResult2[i].los);
      expect(molniyaResult1[i].durationMs).toStrictEqual(molniyaResult2[i].durationMs);
    }
  }

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult1 = await heoGroundStation.getOrbitPassListAsync(
    currentDate,
    new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000)
  );
  const heoResult2 = await heoGroundStation.getOrbitPassListAsync(
    currentDate,
    new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000)
  );
  expect(heoResult1).not.toBe(null);
  expect(heoResult2).not.toBe(null);
  if (heoResult1 && heoResult2) {
    expect(heoResult1.length).toBe(heoResult2.length);
    for (let i = 0; i < heoResult1.length; i++) {
      expect(heoResult1[i].aos).toStrictEqual(heoResult2[i].aos);
      expect(heoResult1[i].maxEl).toStrictEqual(heoResult2[i].maxEl);
      expect(heoResult1[i].los).toStrictEqual(heoResult2[i].los);
      expect(heoResult1[i].durationMs).toStrictEqual(heoResult2[i].durationMs);
    }
  }
});

/**
 * [正常系]
 * 人工衛星の可視時間リストがキャッシュの後続日時から取得できる
 */
test("getOrbitPassListAsyncAfterCache", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const oneDayLaterDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const twoDayLaterDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  const threeDayLaterDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fourDayLaterDate = new Date(currentDate.getTime() + 4 * 24 * 60 * 60 * 1000);

  const issGroundStation1 = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult1 = await issGroundStation1.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const issGroundStation2 = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let issResult2 = await issGroundStation2.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(oneDayLaterDate, twoDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(threeDayLaterDate, fourDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  expect(issResult1).not.toBe(null);
  expect(issResult2).not.toBe(null);
  if (issResult1 && issResult2) {
    expect(issResult1.length).toBe(issResult2.length);
    for (let i = 0; i < issResult1.length; i++) {
      const aosDate1 = issResult1[i].aos?.date.getTime();
      const melDate1 = issResult1[i].maxEl?.date.getTime();
      const losDate1 = issResult1[i].los?.date.getTime();
      const aosDate2 = issResult2[i].aos?.date.getTime();
      const melDate2 = issResult2[i].maxEl?.date.getTime();
      const losDate2 = issResult2[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);

      // 分割でパスを取得しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
      }
    }
  }

  const daichiGroundStation1 = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult1 = await daichiGroundStation1.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const daichiGroundStation2 = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(oneDayLaterDate, twoDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(threeDayLaterDate, fourDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  expect(daichiResult1).not.toBe(null);
  expect(daichiResult2).not.toBe(null);
  if (daichiResult1 && daichiResult2) {
    expect(daichiResult1.length).toBe(daichiResult2.length);
    for (let i = 0; i < daichiResult1.length; i++) {
      const aosDate1 = daichiResult1[i].aos?.date.getTime();
      const melDate1 = daichiResult1[i].maxEl?.date.getTime();
      const losDate1 = daichiResult1[i].los?.date.getTime();
      const aosDate2 = daichiResult2[i].aos?.date.getTime();
      const melDate2 = daichiResult2[i].maxEl?.date.getTime();
      const losDate2 = daichiResult2[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);

      // 分割でパスを取得しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
      }
    }
  }

  const molniyaGroundStation1 = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult1 = await molniyaGroundStation1.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const molniyaGroundStation2 = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(oneDayLaterDate, twoDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(threeDayLaterDate, fourDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  expect(molniyaResult1).not.toBe(null);
  expect(molniyaResult2).not.toBe(null);
  if (molniyaResult1 && molniyaResult2) {
    expect(molniyaResult1.length).toBe(molniyaResult2.length);
    for (let i = 0; i < molniyaResult1.length; i++) {
      const aosDate1 = molniyaResult1[i].aos?.date.getTime();
      const melDate1 = molniyaResult1[i].maxEl?.date.getTime();
      const losDate1 = molniyaResult1[i].los?.date.getTime();
      const aosDate2 = molniyaResult2[i].aos?.date.getTime();
      const melDate2 = molniyaResult2[i].maxEl?.date.getTime();
      const losDate2 = molniyaResult2[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);

      // 分割でパスを取得しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
      }
    }
  }

  const onePeriodLaterDate = new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const twoPeriodLaterDate = new Date(onePeriodLaterDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const threePeriodLaterDate = new Date(twoPeriodLaterDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const fourPeriodLaterDate = new Date(threePeriodLaterDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const heoGroundStation1 = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult1 = await heoGroundStation1.getOrbitPassListAsync(currentDate, fourPeriodLaterDate);

  const heoGroundStation2 = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let heoResult2 = await heoGroundStation2.getOrbitPassListAsync(currentDate, onePeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(onePeriodLaterDate, twoPeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(twoPeriodLaterDate, threePeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(threePeriodLaterDate, fourPeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(currentDate, fourPeriodLaterDate);

  expect(heoResult1).not.toBe(null);
  expect(heoResult2).not.toBe(null);
  if (heoResult1 && heoResult2) {
    expect(heoResult1.length).toBe(heoResult2.length);
    for (let i = 0; i < heoResult1.length; i++) {
      const aosDate1 = heoResult1[i].aos?.date.getTime();
      const melDate1 = heoResult1[i].maxEl?.date.getTime();
      const losDate1 = heoResult1[i].los?.date.getTime();
      const aosDate2 = heoResult2[i].aos?.date.getTime();
      const melDate2 = heoResult2[i].maxEl?.date.getTime();
      const losDate2 = heoResult2[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);

      // 分割でパスを取得しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
      }
    }
  }
});

/**
 * [正常系]
 * 人工衛星の可視時間リストが分割&取得順序逆転しても取得できる
 */
test("getOrbitPassListAsyncFromCacheAndNewSeek", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const oneDayLaterDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const twoDayLaterDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  const threeDayLaterDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fourDayLaterDate = new Date(currentDate.getTime() + 4 * 24 * 60 * 60 * 1000);

  const issGroundStation1 = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult1 = await issGroundStation1.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const issGroundStation2 = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let issResult2 = await issGroundStation2.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(oneDayLaterDate, threeDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(twoDayLaterDate, fourDayLaterDate);
  issResult2 = await issGroundStation2.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const issGroundStation3 = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let issResult3 = await issGroundStation3.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  issResult3 = await issGroundStation3.getOrbitPassListAsync(threeDayLaterDate, fourDayLaterDate);
  issResult3 = await issGroundStation3.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  issResult3 = await issGroundStation3.getOrbitPassListAsync(oneDayLaterDate, twoDayLaterDate);
  issResult3 = await issGroundStation3.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  expect(issResult1).not.toBe(null);
  expect(issResult2).not.toBe(null);
  expect(issResult3).not.toBe(null);
  if (issResult1 && issResult2 && issResult3) {
    expect(issResult1.length).toBe(issResult2.length);
    expect(issResult1.length).toBe(issResult3.length);
    expect(issResult2.length).toBe(issResult3.length);
    for (let i = 0; i < issResult1.length; i++) {
      const aosDate1 = issResult1[i].aos?.date.getTime();
      const melDate1 = issResult1[i].maxEl?.date.getTime();
      const losDate1 = issResult1[i].los?.date.getTime();
      const aosDate2 = issResult2[i].aos?.date.getTime();
      const melDate2 = issResult2[i].maxEl?.date.getTime();
      const losDate2 = issResult2[i].los?.date.getTime();
      const aosDate3 = issResult3[i].aos?.date.getTime();
      const melDate3 = issResult3[i].maxEl?.date.getTime();
      const losDate3 = issResult3[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);
      expect(aosDate3).not.toBe(null);
      expect(melDate3).not.toBe(null);
      expect(losDate3).not.toBe(null);

      // 分割&順序逆転した上でパスを取得しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2 && aosDate3 && melDate3 && losDate3) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
        expect(Math.abs(aosDate1 - aosDate3) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate3) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate3) < 1000).toBe(true);
      }
    }
  }

  const daichiGroundStation1 = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult1 = await daichiGroundStation1.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const daichiGroundStation2 = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(oneDayLaterDate, threeDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(twoDayLaterDate, fourDayLaterDate);
  daichiResult2 = await daichiGroundStation2.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const daichiGroundStation3 = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let daichiResult3 = await daichiGroundStation3.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  daichiResult3 = await daichiGroundStation3.getOrbitPassListAsync(threeDayLaterDate, fourDayLaterDate);
  daichiResult3 = await daichiGroundStation3.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  daichiResult3 = await daichiGroundStation3.getOrbitPassListAsync(oneDayLaterDate, twoDayLaterDate);
  daichiResult3 = await daichiGroundStation3.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  expect(daichiResult1).not.toBe(null);
  expect(daichiResult2).not.toBe(null);
  expect(daichiResult3).not.toBe(null);
  if (daichiResult1 && daichiResult2 && daichiResult3) {
    expect(daichiResult1.length).toBe(daichiResult2.length);
    expect(daichiResult1.length).toBe(daichiResult3.length);
    expect(daichiResult2.length).toBe(daichiResult3.length);
    for (let i = 0; i < daichiResult1.length; i++) {
      const aosDate1 = daichiResult1[i].aos?.date.getTime();
      const melDate1 = daichiResult1[i].maxEl?.date.getTime();
      const losDate1 = daichiResult1[i].los?.date.getTime();
      const aosDate2 = daichiResult2[i].aos?.date.getTime();
      const melDate2 = daichiResult2[i].maxEl?.date.getTime();
      const losDate2 = daichiResult2[i].los?.date.getTime();
      const aosDate3 = daichiResult3[i].aos?.date.getTime();
      const melDate3 = daichiResult3[i].maxEl?.date.getTime();
      const losDate3 = daichiResult3[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);
      expect(aosDate3).not.toBe(null);
      expect(melDate3).not.toBe(null);
      expect(losDate3).not.toBe(null);

      // 分割&順序逆転した上でパスを取得しても結果しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2 && aosDate3 && melDate3 && losDate3) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
        expect(Math.abs(aosDate1 - aosDate3) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate3) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate3) < 1000).toBe(true);
      }
    }
  }

  const molniyaGroundStation1 = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult1 = await molniyaGroundStation1.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const molniyaGroundStation2 = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(oneDayLaterDate, threeDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(twoDayLaterDate, fourDayLaterDate);
  molniyaResult2 = await molniyaGroundStation2.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  const molniyaGroundStation3 = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let molniyaResult3 = await molniyaGroundStation3.getOrbitPassListAsync(currentDate, oneDayLaterDate);
  molniyaResult3 = await molniyaGroundStation3.getOrbitPassListAsync(threeDayLaterDate, fourDayLaterDate);
  molniyaResult3 = await molniyaGroundStation3.getOrbitPassListAsync(twoDayLaterDate, threeDayLaterDate);
  molniyaResult3 = await molniyaGroundStation3.getOrbitPassListAsync(oneDayLaterDate, twoDayLaterDate);
  molniyaResult3 = await molniyaGroundStation3.getOrbitPassListAsync(currentDate, fourDayLaterDate);

  expect(molniyaResult1).not.toBe(null);
  expect(molniyaResult2).not.toBe(null);
  expect(molniyaResult3).not.toBe(null);
  if (molniyaResult1 && molniyaResult2 && molniyaResult3) {
    expect(molniyaResult1.length).toBe(molniyaResult2.length);
    expect(molniyaResult1.length).toBe(molniyaResult3.length);
    expect(molniyaResult2.length).toBe(molniyaResult3.length);
    for (let i = 0; i < molniyaResult1.length; i++) {
      const aosDate1 = molniyaResult1[i].aos?.date.getTime();
      const melDate1 = molniyaResult1[i].maxEl?.date.getTime();
      const losDate1 = molniyaResult1[i].los?.date.getTime();
      const aosDate2 = molniyaResult2[i].aos?.date.getTime();
      const melDate2 = molniyaResult2[i].maxEl?.date.getTime();
      const losDate2 = molniyaResult2[i].los?.date.getTime();
      const aosDate3 = molniyaResult3[i].aos?.date.getTime();
      const melDate3 = molniyaResult3[i].maxEl?.date.getTime();
      const losDate3 = molniyaResult3[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);
      expect(aosDate3).not.toBe(null);
      expect(melDate3).not.toBe(null);
      expect(losDate3).not.toBe(null);

      // 分割&順序逆転した上でパスを取得しても結果しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2 && aosDate3 && melDate3 && losDate3) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
        expect(Math.abs(aosDate1 - aosDate3) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate3) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate3) < 1000).toBe(true);
      }
    }
  }

  const onePeriodLaterDate = new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const twoPeriodLaterDate = new Date(onePeriodLaterDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const threePeriodLaterDate = new Date(twoPeriodLaterDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const fourPeriodLaterDate = new Date(threePeriodLaterDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const heoGroundStation1 = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult1 = await heoGroundStation1.getOrbitPassListAsync(currentDate, fourPeriodLaterDate);

  const heoGroundStation2 = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let heoResult2 = await heoGroundStation2.getOrbitPassListAsync(currentDate, onePeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(onePeriodLaterDate, threePeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(twoPeriodLaterDate, threePeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(twoPeriodLaterDate, fourPeriodLaterDate);
  heoResult2 = await heoGroundStation2.getOrbitPassListAsync(currentDate, fourPeriodLaterDate);

  const heoGroundStation3 = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  let heoResult3 = await heoGroundStation3.getOrbitPassListAsync(currentDate, onePeriodLaterDate);
  heoResult3 = await heoGroundStation3.getOrbitPassListAsync(threePeriodLaterDate, fourPeriodLaterDate);
  heoResult3 = await heoGroundStation3.getOrbitPassListAsync(twoPeriodLaterDate, threePeriodLaterDate);
  heoResult3 = await heoGroundStation3.getOrbitPassListAsync(onePeriodLaterDate, twoPeriodLaterDate);
  heoResult3 = await heoGroundStation3.getOrbitPassListAsync(currentDate, fourPeriodLaterDate);

  expect(heoResult1).not.toBe(null);
  expect(heoResult2).not.toBe(null);
  expect(heoResult3).not.toBe(null);
  if (heoResult1 && heoResult2 && heoResult3) {
    expect(heoResult1.length).toBe(heoResult2.length);
    expect(heoResult1.length).toBe(heoResult3.length);
    expect(heoResult2.length).toBe(heoResult3.length);
    for (let i = 0; i < heoResult1.length; i++) {
      const aosDate1 = heoResult1[i].aos?.date.getTime();
      const melDate1 = heoResult1[i].maxEl?.date.getTime();
      const losDate1 = heoResult1[i].los?.date.getTime();
      const aosDate2 = heoResult2[i].aos?.date.getTime();
      const melDate2 = heoResult2[i].maxEl?.date.getTime();
      const losDate2 = heoResult2[i].los?.date.getTime();
      const aosDate3 = heoResult3[i].aos?.date.getTime();
      const melDate3 = heoResult3[i].maxEl?.date.getTime();
      const losDate3 = heoResult3[i].los?.date.getTime();
      expect(aosDate1).not.toBe(null);
      expect(melDate1).not.toBe(null);
      expect(losDate1).not.toBe(null);
      expect(aosDate2).not.toBe(null);
      expect(melDate2).not.toBe(null);
      expect(losDate2).not.toBe(null);
      expect(aosDate3).not.toBe(null);
      expect(melDate3).not.toBe(null);
      expect(losDate3).not.toBe(null);

      // 分割&順序逆転した上でパスを取得しても結果しても結果は1秒以内に収まることを評価する
      if (aosDate1 && melDate1 && losDate1 && aosDate2 && melDate2 && losDate2 && aosDate3 && melDate3 && losDate3) {
        expect(Math.abs(aosDate1 - aosDate2) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate2) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate2) < 1000).toBe(true);
        expect(Math.abs(aosDate1 - aosDate3) < 1000).toBe(true);
        expect(Math.abs(melDate1 - melDate3) < 1000).toBe(true);
        expect(Math.abs(losDate1 - losDate3) < 1000).toBe(true);
      }
    }
  }
});

/**
 * [正常系]
 * コンストラクタに渡す引数の値が範囲内の場合は例外をスローしない
 */
test("normalRange", () => {
  // 地上局の緯度が範囲内(境界値テスト[正数])
  expect(() => new GroundStationService(ISS_SATELLITE_SERVICE, 90.0, GROUND_STATION.longitudeDeg)).not.toThrow(
    InvalidArgumentError
  );
  // 地上局の緯度が範囲内(境界値テスト[負数])
  expect(() => new GroundStationService(ISS_SATELLITE_SERVICE, -90.0, GROUND_STATION.longitudeDeg)).not.toThrow(
    InvalidArgumentError
  );
  // 地上局の経度が範囲内(境界値テスト[正数])
  expect(() => new GroundStationService(ISS_SATELLITE_SERVICE, GROUND_STATION.latitudeDeg, 180.0)).not.toThrow(
    InvalidArgumentError
  );
  // 地上局の経度が範囲内(境界値テスト[負数])
  expect(() => new GroundStationService(ISS_SATELLITE_SERVICE, GROUND_STATION.latitudeDeg, -180.0)).not.toThrow(
    InvalidArgumentError
  );
  // 地上局の高度が範囲内(境界値テスト)
  expect(
    () =>
      new GroundStationService(ISS_SATELLITE_SERVICE, GROUND_STATION.latitudeDeg, GROUND_STATION.longitudeDeg, 10000.0)
  ).not.toThrow(InvalidArgumentError);
});

/**
 * [準正常系]
 * 時系列が逆転した日時を指定した場合に人工衛星の可視時間リストが取得できない
 */
test("getOrbitPassListAsyncError1", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const oneDayLaterDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult = await issGroundStation.getOrbitPassListAsync(oneDayLaterDate, currentDate);
  expect(issResult).toBe(null);

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult = await daichiGroundStation.getOrbitPassListAsync(oneDayLaterDate, currentDate);
  expect(daichiResult).toBe(null);

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult = await himawariGroundStation.getOrbitPassListAsync(oneDayLaterDate, currentDate);
  expect(himawariResult).toBe(null);

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult = await michibikiGroundStation.getOrbitPassListAsync(oneDayLaterDate, currentDate);
  expect(michibikiResult).toBe(null);

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult = await molniyaGroundStation.getOrbitPassListAsync(oneDayLaterDate, currentDate);
  expect(molniyaResult).toBe(null);

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult = await heoGroundStation.getOrbitPassListAsync(
    new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000),
    currentDate
  );
  expect(heoResult).toBe(null);
});

/**
 * [準正常系]
 * 過去日時を指定した場合に人工衛星の可視時間リストが取得できない
 */
test("getOrbitPassListAsyncError2", async () => {
  const currentDate = new Date("2024-10-01T00:00:00Z");
  const pastDate = new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneDayLaterDate = new Date(pastDate.getTime() + 24 * 60 * 60 * 1000);
  const issGroundStation = new GroundStationService(
    ISS_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const issResult = await issGroundStation.getOrbitPassListAsync(pastDate, oneDayLaterDate);
  expect(issResult).toBe(null);

  const daichiGroundStation = new GroundStationService(
    DAICHI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const daichiResult = await daichiGroundStation.getOrbitPassListAsync(pastDate, oneDayLaterDate);
  expect(daichiResult).toBe(null);

  const himawariGroundStation = new GroundStationService(
    HIMAWARI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const himawariResult = await himawariGroundStation.getOrbitPassListAsync(pastDate, oneDayLaterDate);
  expect(himawariResult).toBe(null);

  const michibikiGroundStation = new GroundStationService(
    MICHIBIKI_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const michibikiResult = await michibikiGroundStation.getOrbitPassListAsync(pastDate, oneDayLaterDate);
  expect(michibikiResult).toBe(null);

  const molniyaGroundStation = new GroundStationService(
    MOLNIYA_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const molniyaResult = await molniyaGroundStation.getOrbitPassListAsync(pastDate, oneDayLaterDate);
  expect(molniyaResult).toBe(null);

  const heoGroundStation = new GroundStationService(
    HEO_SATELLITE_SERVICE,
    GROUND_STATION.latitudeDeg,
    GROUND_STATION.longitudeDeg,
    0.0,
    0.0,
    currentDate
  );
  const heoResult = await heoGroundStation.getOrbitPassListAsync(
    new Date(currentDate.getTime() - 2 * 13 * 24 * 60 * 60 * 1000),
    new Date(currentDate.getTime() - 13 * 24 * 60 * 60 * 1000)
  );
  expect(heoResult).toBe(null);
});
