import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import type { ModeCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverModeCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
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
    vi.restoreAllMocks();
  });

  it("タイマID未設定の場合、falseを返すこと", async () => {
    const coordinator = createCoordinator();
    const sleepSpy = vi.spyOn(CommonUtil, "sleep").mockResolvedValue();

    const result = await coordinator.stopUpdateFreq();

    expect(result).toBe(false);
    expect(sleepSpy).not.toHaveBeenCalled();
  });

  it("タイマID設定済みの場合、停止してtrueを返すこと", async () => {
    const coordinator = createCoordinator();
    const sleepSpy = vi.spyOn(CommonUtil, "sleep").mockResolvedValue();
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
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
