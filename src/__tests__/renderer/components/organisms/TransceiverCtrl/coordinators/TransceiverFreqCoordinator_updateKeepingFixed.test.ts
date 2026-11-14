import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import type { FreqCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator.js";
import TransceiverFreqCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const createState = (): FreqCoordinatorState => ({
  txFrequency: ref("0145.900.000"),
  rxFrequency: ref("0435.800.000"),
  txBaseFreq: ref(0),
  rxBaseFreq: ref(0),
});
const plain = { plainRxBaseFreq: 435800000, plainTxBaseFreq: 145900000 };
const date = ref(new Date("2026-05-09T00:00:00.000Z"));

describe("TransceiverFreqCoordinator 固定側維持", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updateTxFreqKeepingRxFixed: Txのみ更新し、固定Rx（表示値）を算出に渡すこと", async () => {
    const state = createState();
    const spy = vi
      .spyOn(TransceiverDopplerCalc.prototype, "calcTxFreqKeepingRxFixed")
      .mockResolvedValue("0145.901.234");

    await new TransceiverFreqCoordinator(state, date).updateTxFreqKeepingRxFixed(plain, 10, 20, 1000);

    expect(spy).toHaveBeenCalledWith(435800000, 145900000, 10, 20, 435800000, date.value, 1000);
    expect(state.txFrequency.value).toBe("0145.901.234");
    expect(state.rxFrequency.value).toBe("0435.800.000");
  });

  it("updateTxFreqKeepingRxFixed: 算出結果がnullの場合は更新しないこと", async () => {
    const state = createState();
    vi.spyOn(TransceiverDopplerCalc.prototype, "calcTxFreqKeepingRxFixed").mockResolvedValue(null);

    await new TransceiverFreqCoordinator(state, date).updateTxFreqKeepingRxFixed(plain, 0, 0, 1000);

    expect(state.txFrequency.value).toBe("0145.900.000");
  });

  it("updateRxFreqKeepingTxFixed: Rxのみ更新し、固定Tx（表示値）を算出に渡すこと", async () => {
    const state = createState();
    const spy = vi
      .spyOn(TransceiverDopplerCalc.prototype, "calcRxFreqKeepingTxFixed")
      .mockResolvedValue("0435.798.765");

    await new TransceiverFreqCoordinator(state, date).updateRxFreqKeepingTxFixed(plain, 10, 20, 1000);

    expect(spy).toHaveBeenCalledWith(435800000, 145900000, 10, 20, 145900000, date.value, 1000);
    expect(state.rxFrequency.value).toBe("0435.798.765");
    expect(state.txFrequency.value).toBe("0145.900.000");
  });

  it("updateRxFreqKeepingTxFixed: 算出結果がnullの場合は更新しないこと", async () => {
    const state = createState();
    vi.spyOn(TransceiverDopplerCalc.prototype, "calcRxFreqKeepingTxFixed").mockResolvedValue(null);

    await new TransceiverFreqCoordinator(state, date).updateRxFreqKeepingTxFixed(plain, 0, 0, 1000);

    expect(state.rxFrequency.value).toBe("0435.800.000");
  });
});
