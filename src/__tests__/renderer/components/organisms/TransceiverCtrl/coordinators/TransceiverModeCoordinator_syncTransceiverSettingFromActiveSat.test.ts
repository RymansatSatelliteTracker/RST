import Constant from "@/common/Constant.js";
import type { ModeCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverModeCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
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
  dopplerShiftMode: ref(Constant.Transceiver.DopplerShiftMode.FIXED_SAT),
  savedTxFrequency: ref(""),
  savedRxFrequency: ref(""),
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

/**
 * アクティブ衛星の無線設定を返すモックを設定する
 */
const mockTransceiverSetting = (beaconHz: number | null) => {
  vi.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
    getActiveSatTransceiverSetting: () => ({
      downlink: { downlinkHz: 435633000, downlinkMode: "USB" },
      uplink: { uplinkHz: 145970000, uplinkMode: "LSB" },
      beacon: { beaconHz, beaconMode: "CW" },
      satelliteMode: true,
      satTrackMode: null,
      dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_SAT,
      toneHz: null,
    }),
  } as unknown as ActiveSatServiceHub);
};

describe("TransceiverModeCoordinator.syncTransceiverSettingFromActiveSat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初回はtrue、無線設定が同じ場合はfalseを返すこと", () => {
    const coordinator = createCoordinator();
    mockTransceiverSetting(435610000);

    expect(coordinator.syncTransceiverSettingFromActiveSat()).toBe(true);
    expect(coordinator.syncTransceiverSettingFromActiveSat()).toBe(false);
  });

  it("無線設定が変わった場合はtrueを返すこと", () => {
    const coordinator = createCoordinator();
    mockTransceiverSetting(435610000);
    coordinator.syncTransceiverSettingFromActiveSat();

    // ビーコン周波数を変更する
    vi.restoreAllMocks();
    mockTransceiverSetting(435611000);

    expect(coordinator.syncTransceiverSettingFromActiveSat()).toBe(true);
    expect(coordinator.syncTransceiverSettingFromActiveSat()).toBe(false);
  });
});
