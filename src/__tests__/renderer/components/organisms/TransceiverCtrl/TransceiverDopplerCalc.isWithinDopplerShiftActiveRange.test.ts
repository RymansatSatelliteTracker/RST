import Constant from "@/common/Constant";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/TransceiverDopplerCalc";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import type { PassesCache } from "@/renderer/types/pass-type";

// DOPPLER_SHIFT_RANGE_SEC = 60 秒
const RANGE_SEC = Constant.Transceiver.DOPPLER_SHIFT_RANGE_SEC;

// テスト用パス生成ヘルパー（AOS/LOSを指定した Date で作成）
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
    jest.restoreAllMocks();
  });

  describe("isWithinDopplerShiftActiveRange", () => {
    const BASE = new Date("2025-01-01T12:00:00Z");
    // AOS: 12:10, LOS: 12:20
    const AOS = new Date("2025-01-01T12:10:00Z");
    const LOS = new Date("2025-01-01T12:20:00Z");

    it("パスが取得できない場合はfalseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(null);

      const result = await calc.isWithinDopplerShiftActiveRange(BASE);

      expect(result).toBe(false);
    });

    it("AOSがnullの場合はfalseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
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

      const result = await calc.isWithinDopplerShiftActiveRange(BASE);
      expect(result).toBe(false);
    });

    it("LOSがnullの場合はfalseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
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

      const result = await calc.isWithinDopplerShiftActiveRange(BASE);
      expect(result).toBe(false);
    });

    it("現在時刻がAOS直前（RANGE_SEC内）の場合はtrueを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS - (RANGE_SEC - 1)秒 → 有効範囲内
      const currentDate = new Date(AOS.getTime() - (RANGE_SEC - 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がAOS直前（RANGE_SEC外）の場合はfalseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS - (RANGE_SEC + 1)秒 → 有効範囲外
      const currentDate = new Date(AOS.getTime() - (RANGE_SEC + 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(currentDate);
      expect(result).toBe(false);
    });

    it("現在時刻がAOS〜LOS間の場合はtrueを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // AOS + 5分 → パス中
      const currentDate = new Date(AOS.getTime() + 5 * 60 * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がLOS直後（RANGE_SEC内）の場合はtrueを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // LOS + (RANGE_SEC - 1)秒 → 有効範囲内
      const currentDate = new Date(LOS.getTime() + (RANGE_SEC - 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(currentDate);
      expect(result).toBe(true);
    });

    it("現在時刻がLOS直後（RANGE_SEC外）の場合はfalseを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getOrbitPassAsync").mockResolvedValue(makePass(AOS, LOS));

      // LOS + (RANGE_SEC + 1)秒 → 有効範囲外
      const currentDate = new Date(LOS.getTime() + (RANGE_SEC + 1) * 1000);
      const result = await calc.isWithinDopplerShiftActiveRange(currentDate);
      expect(result).toBe(false);
    });
  });
});
