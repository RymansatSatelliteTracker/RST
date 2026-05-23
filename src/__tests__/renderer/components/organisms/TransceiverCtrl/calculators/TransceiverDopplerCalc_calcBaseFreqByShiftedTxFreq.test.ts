import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("TransceiverDopplerCalc", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calcBaseFreqByShiftedTxFreq", () => {
    const currentDate = new Date("2025-01-01T12:00:00Z");
    const intervalMs = 1000;

    it("FrequencyTrackServiceが取得できない場合、0を返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue(null);

      const result = await calc.calcBaseFreqByShiftedTxFreq(
        480000000,
        2430000000,
        0,
        2430000000,
        currentDate,
        intervalMs
      );
      expect(result).toEqual({ newRxBaseFreq: 0, newTxBaseFreq: 0 });
    });

    it("ドップラーファクター1.0のとき送受信周波数の計算が実行されること", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      vi.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue({
        calcUplinkDopplerFactor: vi.fn().mockResolvedValue(1.0),
        calcInvHeteroBaseFreqByTxFreq: vi.fn().mockReturnValue({
          rxBaseFreq: 480000000,
          txBaseFreq: 2430000000,
        }),
      } as any);

      const result = await calc.calcBaseFreqByShiftedTxFreq(
        480000000,
        2430000000,
        0,
        2430000000,
        currentDate,
        intervalMs
      );
      expect(result.newRxBaseFreq).toBe(480000000);
      expect(result.newTxBaseFreq).toBe(2430000000);
    });
  });
});
