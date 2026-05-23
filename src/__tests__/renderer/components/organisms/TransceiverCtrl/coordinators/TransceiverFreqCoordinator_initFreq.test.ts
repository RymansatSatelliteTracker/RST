import { AppConfigModel } from "@/common/model/AppConfigModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import type {
  FreqCoordinatorState,
} from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator";
import TransceiverFreqCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverFreqCoordinator";
import { ref } from "vue";

const createState = (): FreqCoordinatorState => ({
  txFrequency: ref(""),
  rxFrequency: ref(""),
  txBaseFreq: ref(0),
  rxBaseFreq: ref(0),
});

describe("TransceiverFreqCoordinator.initFreq", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("AppConfigのTx/Rx周波数を状態へ反映すること", async () => {
    const state = createState();
    const coordinator = new TransceiverFreqCoordinator(state, ref(new Date("2026-05-09T00:00:00.000Z")));
    const appConfig = new AppConfigModel();
    appConfig.transceiver.txFrequency = "2430.000.000";
    appConfig.transceiver.rxFrequency = "0480.000.000";
    jest.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);

    await coordinator.initFreq();

    expect(state.txFrequency.value).toBe("2430.000.000");
    expect(state.rxFrequency.value).toBe("0480.000.000");
  });
});
