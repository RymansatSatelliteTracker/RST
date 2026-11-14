import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import type FrequencyTrackService from "@/renderer/service/FrequencyTrackService.js";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("TransceiverDopplerCalc.calcRxBaseFreqByShiftedRxFreq", () => {
  const currentDate = new Date("2025-01-01T12:00:00Z");
  const intervalMs = 1000;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("FrequencyTrackServiceが取得できない場合、nullを返すこと", async () => {
    const calc = new TransceiverDopplerCalc();
    vi.spyOn(ActiveSatServiceHub.getInstance(), "getFrequencyTrackService").mockReturnValue(null);

    const result = await calc.calcRxBaseFreqByShiftedRxFreq(435610000, currentDate, intervalMs);

    expect(result).toBeNull();
  });

  it("受信したRx周波数を下りドップラーファクターで割り戻した値を返すこと", async () => {
    const calc = new TransceiverDopplerCalc();
    const factorSpy = vi.fn().mockResolvedValue(1.00001);
    vi.spyOn(ActiveSatServiceHub.getInstance(), "getFrequencyTrackService").mockReturnValue({
      calcDownlinkDopplerFactor: factorSpy,
    } as unknown as FrequencyTrackService);

    const result = await calc.calcRxBaseFreqByShiftedRxFreq(435614356.1, currentDate, intervalMs);

    expect(factorSpy).toHaveBeenCalledWith(currentDate, intervalMs);
    expect(result).toBeCloseTo(435610000, 3);
  });
});
