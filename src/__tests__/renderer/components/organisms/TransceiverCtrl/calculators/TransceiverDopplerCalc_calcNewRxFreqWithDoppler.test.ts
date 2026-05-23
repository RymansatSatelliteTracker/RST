import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("TransceiverDopplerCalc", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calcNewRxFreqWithDoppler", () => {
    const currentDate = new Date("2025-01-01T12:00:00Z");
    const rxBaseFreq = 480000000;
    const intervalMs = 1000;

    it("FrequencyTrackServiceが取得できない場合、nullを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue(null);

      const result = await calc.calcNewRxFreqWithDoppler(currentDate, rxBaseFreq, intervalMs);
      expect(result).toBeNull();
    });

    it("ドップラーファクター1.0のときRx基準周波数がそのまま返ること", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue({
        calcDownlinkDopplerFactor: vi.fn().mockResolvedValue(1.0),
      } as any);

      const result = await calc.calcNewRxFreqWithDoppler(currentDate, rxBaseFreq, intervalMs);
      // 480000000 * 1.0 = 480000000 ↁE"0480.000.000"
      expect(result).toBe("0480.000.000");
    });
  });
});
