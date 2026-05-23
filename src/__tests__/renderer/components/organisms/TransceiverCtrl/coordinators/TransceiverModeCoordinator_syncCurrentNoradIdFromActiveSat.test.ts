import Constant from "@/common/Constant";
import type { ModeCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator";
import TransceiverModeCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    vi.restoreAllMocks();
  });

  it("アクティブ衛星がある場合、初回true、同一NoradIdでfalseを返すこと", () => {
    const coordinator = createCoordinator();
    vi.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
      getSatService: () => ({ getNoradId: () => "25544" }),
    } as never);

    const firstChanged = coordinator.syncCurrentNoradIdFromActiveSat();
    const secondChanged = coordinator.syncCurrentNoradIdFromActiveSat();

    expect(firstChanged).toBe(true);
    expect(secondChanged).toBe(false);
  });

  it("アクティブ衛星ありから未設定へ遷移した場合、trueを返すこと", () => {
    const coordinator = createCoordinator();
    let satService: { getNoradId: () => string } | null = { getNoradId: () => "25544" };
    vi.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
      getSatService: () => satService,
    } as never);

    coordinator.syncCurrentNoradIdFromActiveSat();
    satService = null;

    const changed = coordinator.syncCurrentNoradIdFromActiveSat();

    expect(changed).toBe(true);
  });
});
