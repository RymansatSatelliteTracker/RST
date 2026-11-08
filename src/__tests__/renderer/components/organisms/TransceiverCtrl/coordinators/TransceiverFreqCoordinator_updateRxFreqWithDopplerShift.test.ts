import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import type { FreqCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator.js";
import TransceiverFreqCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const createState = (): FreqCoordinatorState => ({
  txFrequency: ref("0145.900.000"),
  rxFrequency: ref("0435.800.000"),
  txBaseFreq: ref(145900000),
  rxBaseFreq: ref(435800000),
});
const date = ref(new Date("2026-05-09T00:00:00.000Z"));

describe("TransceiverFreqCoordinator.updateRxFreqWithDopplerShift", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("基準周波数を省略した場合、Rx基準周波数でドップラーシフト補正すること", async () => {
    const state = createState();
    const spy = vi
      .spyOn(TransceiverDopplerCalc.prototype, "calcNewRxFreqWithDoppler")
      .mockResolvedValue("0435.801.000");

    await new TransceiverFreqCoordinator(state, date).updateRxFreqWithDopplerShift(1000);

    expect(spy).toHaveBeenCalledWith(date.value, 435800000, 1000);
    expect(state.rxFrequency.value).toBe("0435.801.000");
  });

  it("基準周波数を指定した場合（ビーコン中）、指定の基準周波数でドップラーシフト補正すること", async () => {
    const state = createState();
    const spy = vi
      .spyOn(TransceiverDopplerCalc.prototype, "calcNewRxFreqWithDoppler")
      .mockResolvedValue("0435.611.000");

    await new TransceiverFreqCoordinator(state, date).updateRxFreqWithDopplerShift(1000, 435610000);

    expect(spy).toHaveBeenCalledWith(date.value, 435610000, 1000);
    expect(state.rxFrequency.value).toBe("0435.611.000");
  });

  it("算出結果がnullの場合は更新しないこと", async () => {
    const state = createState();
    vi.spyOn(TransceiverDopplerCalc.prototype, "calcNewRxFreqWithDoppler").mockResolvedValue(null);

    await new TransceiverFreqCoordinator(state, date).updateRxFreqWithDopplerShift(1000, 435610000);

    expect(state.rxFrequency.value).toBe("0435.800.000");
  });
});
