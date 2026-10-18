import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import type { FreqCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator.js";
import TransceiverFreqCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const createState = (): FreqCoordinatorState => ({
  txFrequency: ref(""),
  rxFrequency: ref(""),
  txBaseFreq: ref(0),
  rxBaseFreq: ref(0),
});

describe("TransceiverFreqCoordinator.initFreq", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AppConfigのTx/Rx周波数を状態へ反映すること", async () => {
    const state = createState();
    const coordinator = new TransceiverFreqCoordinator(state, ref(new Date("2026-05-09T00:00:00.000Z")));
    const appConfig = new AppConfigModel();
    appConfig.transceiver.txFrequency = "2430.000.000";
    appConfig.transceiver.rxFrequency = "0480.000.000";
    vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);

    await coordinator.initFreq();

    expect(state.txFrequency.value).toBe("2430.000.000");
    expect(state.rxFrequency.value).toBe("0480.000.000");
  });
});
