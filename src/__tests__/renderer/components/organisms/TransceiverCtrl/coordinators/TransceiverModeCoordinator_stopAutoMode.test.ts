import Constant from "@/common/Constant";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";
import TransceiverModeCoordinator, {
  ModeCoordinatorState,
} from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver";
import { ref } from "vue";

const createState = (): ModeCoordinatorState => ({
  txFrequency: ref("2430.000.000"),
  rxFrequency: ref("0480.000.000"),
  txOpeMode: ref("FM"),
  rxOpeMode: ref("FM"),
  satelliteMode: ref(Constant.Transceiver.SatelliteMode.UNSET),
  isSatelliteMode: ref(false),
  isSatTrackingModeNormal: ref(true),
  savedTxFrequency: ref(""),
  savedRxFrequency: ref(""),
  savedTxOpeMode: ref(""),
  savedRxOpeMode: ref(""),
  isBeaconMode: ref(false),
  execTxDopplerShiftCorrection: ref(false),
  execRxDopplerShiftCorrection: ref(false),
  txFrequencyAdjustment: ref("+000.000"),
  rxFrequencyAdjustment: ref("+000.000"),
});

const createCoordinator = (autoOn: boolean, state: ModeCoordinatorState): TransceiverModeCoordinator => {
  return new TransceiverModeCoordinator(
    state,
    { tranceiverAuto: autoOn } as never,
    new TransceiverModeSettingResolver(),
    new TransceiverBaseFreqMgr(),
    () => {},
    () => {}
  );
};

describe("TransceiverModeCoordinator.stopAutoMode", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Auto繝｢繝ｼ繝碓FF譎ゅ・菴輔ｂ縺励↑縺・％縺ｨ", async () => {
    const state = createState();
    const coordinator = createCoordinator(false, state);
    const autoOffSpy = jest.spyOn(ApiTransceiver, "transceiverAutoOff").mockResolvedValue();
    const stopUpdateSpy = jest.spyOn(coordinator, "stopUpdateFreq").mockResolvedValue(true);

    await coordinator.stopAutoMode();

    expect(autoOffSpy).not.toHaveBeenCalled();
    expect(stopUpdateSpy).not.toHaveBeenCalled();
  });

  it("Auto繝｢繝ｼ繝碓N譎ゅ・Auto邨ゆｺ・・逅・ｾ後↓騾驕ｿ蜻ｨ豕｢謨ｰ縺ｸ蠕ｩ蜈・☆繧九％縺ｨ", async () => {
    const state = createState();
    state.txFrequency.value = "1200.000.000";
    state.rxFrequency.value = "0145.800.000";
    state.savedTxFrequency.value = "2430.000.000";
    state.savedRxFrequency.value = "0480.000.000";

    const coordinator = createCoordinator(true, state);
    const autoOffSpy = jest.spyOn(ApiTransceiver, "transceiverAutoOff").mockResolvedValue();
    const stopUpdateSpy = jest.spyOn(coordinator, "stopUpdateFreq").mockResolvedValue(true);

    await coordinator.stopAutoMode();

    expect(autoOffSpy).toHaveBeenCalledTimes(1);
    expect(stopUpdateSpy).toHaveBeenCalledTimes(1);
    expect(state.txFrequency.value).toBe("2430.000.000");
    expect(state.rxFrequency.value).toBe("0480.000.000");
  });
});

