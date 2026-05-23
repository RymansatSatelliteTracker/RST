import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import type { FreqCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator";
import TransceiverFreqCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator";
import { describe, expect, vi } from "vitest";
import { ref } from "vue";

const createState = (): FreqCoordinatorState => ({
  txFrequency: ref("2430.000.000"),
  rxFrequency: ref("0480.000.000"),
  txBaseFreq: ref(0),
  rxBaseFreq: ref(0),
});

describe("TransceiverFreqCoordinator.sendTxFreq", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("アップリンク周波数を無線機へ送信すること", async () => {
    const coordinator = new TransceiverFreqCoordinator(createState(), ref(new Date("2026-05-09T00:00:00.000Z")));
    const setFreqSpy = vi.spyOn(ApiTransceiver, "setTransceiverFrequency").mockResolvedValue();

    await coordinator.sendTxFreq(2430000000);

    expect(setFreqSpy).toHaveBeenCalledWith({
      uplinkHz: 2430000000,
      uplinkMode: "",
    });
  });
});
