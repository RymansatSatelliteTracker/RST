import Constant from "@/common/Constant";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/TransceiverBaseFreqMgr";
import TransceiverModeCoordinator, {
  ModeCoordinatorState,
} from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeCoordinator";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeSettingResolver";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
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

describe("TransceiverModeCoordinator.syncCurrentNoradIdFromActiveSat", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("アクティブ衛星がある場合はNoradIdを同期し、初回はtrueを返すこと", () => {
    const coordinator = createCoordinator();
    jest.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
      getSatService: () => ({ getNoradId: () => "25544" }),
    } as never);

    const changed = coordinator.syncCurrentNoradIdFromActiveSat();

    expect(changed).toBe(true);
    expect(coordinator.currentNoradId).toBe("25544");
  });

  it("アクティブ衛星がない場合は空文字を同期し、同値ならfalseを返すこと", () => {
    const coordinator = createCoordinator();
    jest.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
      getSatService: () => null,
    } as never);

    const changed = coordinator.syncCurrentNoradIdFromActiveSat();

    expect(changed).toBe(false);
    expect(coordinator.currentNoradId).toBe("");
  });
});
