import { AppConfigModel } from "@/common/model/AppConfigModel";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import type { PassesCache } from "@/renderer/types/pass-type";

// テスト用パス生成ヘルパー。AOS/LOSを指定してPassesCacheを生成する
function makePass(aosDate: Date, losDate: Date): PassesCache {
  const dummyLookAngles = { elevation: 30, azimuth: 180 };
  const dummySatLocation = { latitude: 0, longitude: 0, height: 0 };
  return {
    aos: { date: aosDate, lookAngles: dummyLookAngles, satLocation: dummySatLocation },
    maxEl: {
      date: new Date((aosDate.getTime() + losDate.getTime()) / 2),
      lookAngles: dummyLookAngles,
      satLocation: dummySatLocation,
    },
    los: { date: losDate, lookAngles: dummyLookAngles, satLocation: dummySatLocation },
    durationMs: losDate.getTime() - aosDate.getTime(),
  };
}

describe("AutoTrackingHelper", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("isTransceiverTrackingTimeRange", () => {
    const BASE = new Date("2025-01-01T12:00:00Z");
    // AOS: 12:10, LOS: 12:20
    const AOS = new Date("2025-01-01T12:10:00Z");
    const LOS = new Date("2025-01-01T12:20:00Z");

    function createAppConfig(
      rotatorStartAgoMinute: number = 0,
      transceiverAutoTrackingStartEndTime: string = "10"
    ): AppConfigModel {
      const appConfig = new AppConfigModel();
      appConfig.rotator.startAgoMinute = rotatorStartAgoMinute;
      appConfig.transceiver.autoTrackingStartEndTime = transceiverAutoTrackingStartEndTime;
      return appConfig;
    }

    it("パスが取得できない場合、falseを返すこと", async () => {
      const appConfig = createAppConfig();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(null);

      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, BASE);

      expect(result).toBe(false);
    });

    it("AOSがnullの場合、falseを返すこと", async () => {
      const appConfig = createAppConfig();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue({
        aos: null,
        maxEl: null,
        los: {
          date: LOS,
          lookAngles: { elevation: 30, azimuth: 180 },
          satLocation: { latitude: 0, longitude: 0, height: 0 },
        },
        durationMs: null,
      });

      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, BASE);
      expect(result).toBe(false);
    });

    it("LOSがnullの場合、falseを返すこと", async () => {
      const appConfig = createAppConfig();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue({
        aos: {
          date: AOS,
          lookAngles: { elevation: 30, azimuth: 180 },
          satLocation: { latitude: 0, longitude: 0, height: 0 },
        },
        maxEl: null,
        los: null,
        durationMs: null,
      });

      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, BASE);
      expect(result).toBe(false);
    });

    it("現在時刻がAOS直前（autoTrackingStartEndTime内）の場合、trueを返すこと", async () => {
      const appConfig = createAppConfig(0, "10");
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS - (10分 - 1秒) = 有効範囲内
      const currentDate = new Date(AOS.getTime() - (10 * 60 - 1) * 1000);
      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がAOS直前（autoTrackingStartEndTime外）の場合、falseを返すこと", async () => {
      const appConfig = createAppConfig(0, "10");
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS - (10分 + 1秒) = 有効範囲外
      const currentDate = new Date(AOS.getTime() - (10 * 60 + 1) * 1000);
      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, currentDate);
      expect(result).toBe(false);
    });

    it("現在時刻がAOS〜LOS間の場合、trueを返すこと", async () => {
      const appConfig = createAppConfig(0, "10");
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS + 5分 = パス中
      const currentDate = new Date(AOS.getTime() + 5 * 60 * 1000);
      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がLOS直後（autoTrackingStartEndTime内）の場合、trueを返すこと", async () => {
      const appConfig = createAppConfig(0, "10");
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // LOS + (10分 - 1秒) = 有効範囲内
      const currentDate = new Date(LOS.getTime() + (10 * 60 - 1) * 1000);
      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がLOS直後（autoTrackingStartEndTime外）の場合、falseを返すこと", async () => {
      const appConfig = createAppConfig(0, "10");
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // LOS + (10分 + 1秒) = 有効範囲外
      const currentDate = new Date(LOS.getTime() + (10 * 60 + 1) * 1000);
      const result = await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, currentDate);
      expect(result).toBe(false);
    });

    it("パス取得時の基準日時は無線機の開始・終了時刻で前倒しすること", async () => {
      const appConfig = createAppConfig(12, "10");
      const hubInstance = ActiveSatServiceHub.getInstance();
      const getOrbitPassAsyncSpy = jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      const currentDate = new Date(AOS.getTime() - 5 * 60 * 1000);
      await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, currentDate);

      expect(getOrbitPassAsyncSpy).toHaveBeenCalledWith(new Date(currentDate.getTime() - 10 * 60 * 1000));
    });
  });
});
