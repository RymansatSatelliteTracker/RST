import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/TransceiverBaseFreqMgr";
import TransceiverModeCoordinator, {
  ModeCoordinatorState,
} from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeCoordinator";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeSettingResolver";
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

const createCoordinator = (): TransceiverModeCoordinator => {
  return new TransceiverModeCoordinator(
    createState(),
    { tranceiverAuto: false } as never,
    new TransceiverModeSettingResolver(),
    new TransceiverBaseFreqMgr(),
    () => {},
    () => {}
  );
};

describe("TransceiverModeCoordinator.stopUpdateFreq", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("タイマID未設定の場合はfalseを返すこと", async () => {
    const coordinator = createCoordinator();
    const sleepSpy = jest.spyOn(CommonUtil, "sleep").mockResolvedValue();

    const result = await coordinator.stopUpdateFreq();

    expect(result).toBe(false);
    expect(sleepSpy).not.toHaveBeenCalled();
  });

  it("タイマID設定済みの場合は停止してtrueを返すこと", async () => {
    const coordinator = createCoordinator();
    const sleepSpy = jest.spyOn(CommonUtil, "sleep").mockResolvedValue();
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const timerId = setInterval(() => {}, 1000);
    coordinator.setTimerId(timerId);

    const result = await coordinator.stopUpdateFreq();

    expect(result).toBe(true);
    expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
    expect(sleepSpy).toHaveBeenCalledTimes(1);

    const secondResult = await coordinator.stopUpdateFreq();
    expect(secondResult).toBe(false);
  });
});
