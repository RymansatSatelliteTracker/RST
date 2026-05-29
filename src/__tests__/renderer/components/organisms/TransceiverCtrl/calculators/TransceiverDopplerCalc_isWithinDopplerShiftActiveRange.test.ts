import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import type { PassesCache } from "@/renderer/types/pass-type.js";

const RANGE_MINUTE = 10;

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

describe("TransceiverDopplerCalc", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockAppConfig(autoTrackingStartEndTime: string = String(RANGE_MINUTE)): AppConfigModel {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.autoTrackingStartEndTime = autoTrackingStartEndTime;
    return appConfig;
  }

  describe("isWithinDopplerShiftActiveRange", () => {
    const BASE = new Date("2025-01-01T12:00:00Z");
    // AOS: 12:10, LOS: 12:20
    const AOS = new Date("2025-01-01T12:10:00Z");
    const LOS = new Date("2025-01-01T12:20:00Z");

    it("パスが取得できない場合、falseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(null);

      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), BASE);

      expect(result).toBe(false);
    });

    it("AOSがnullの場合、falseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue({
        aos: null,
        maxEl: null,
        los: {
          date: LOS,
          lookAngles: { elevation: 30, azimuth: 180 },
          satLocation: { latitude: 0, longitude: 0, height: 0 },
        },
        durationMs: null,
      });

      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), BASE);
      expect(result).toBe(false);
    });

    it("LOSがnullの場合、falseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue({
        aos: {
          date: AOS,
          lookAngles: { elevation: 30, azimuth: 180 },
          satLocation: { latitude: 0, longitude: 0, height: 0 },
        },
        maxEl: null,
        los: null,
        durationMs: null,
      });

      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), BASE);
      expect(result).toBe(false);
    });

    it("現在時刻がAOS直前（autoTrackingStartEndTime内）の場合、trueを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS - (RANGE_MINUTE * 60 - 1)秒 = 有効範囲内
      const currentDate = new Date(AOS.getTime() - (RANGE_MINUTE * 60 - 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がAOS直前（autoTrackingStartEndTime外）の場合、falseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS - (RANGE_MINUTE * 60 + 1)秒 = 有効範囲外
      const currentDate = new Date(AOS.getTime() - (RANGE_MINUTE * 60 + 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), currentDate);
      expect(result).toBe(false);
    });

    it("現在時刻がAOS〜LOS間の場合、trueを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS + 5分 = パス中
      const currentDate = new Date(AOS.getTime() + 5 * 60 * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がLOS直後（autoTrackingStartEndTime内）の場合、trueを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // LOS + (RANGE_MINUTE * 60 - 1)秒 = 有効範囲内
      const currentDate = new Date(LOS.getTime() + (RANGE_MINUTE * 60 - 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がLOS直後（autoTrackingStartEndTime外）の場合、falseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // LOS + (RANGE_MINUTE * 60 + 1)秒 = 有効範囲外
      const currentDate = new Date(LOS.getTime() + (RANGE_MINUTE * 60 + 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), currentDate);
      expect(result).toBe(false);
    });

    it("パス取得時の基準日時にautoTrackingStartEndTime分の前倒しを適用すること", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
      const getOrbitPassAsyncSpy = vi.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      const currentDate = new Date(AOS.getTime() - 5 * 60 * 1000);
      await calc.isWithinDopplerShiftActiveRange(mockAppConfig(), currentDate);

      expect(getOrbitPassAsyncSpy).toHaveBeenCalledWith(new Date(currentDate.getTime() - RANGE_MINUTE * 60 * 1000));
    });
  });
});
