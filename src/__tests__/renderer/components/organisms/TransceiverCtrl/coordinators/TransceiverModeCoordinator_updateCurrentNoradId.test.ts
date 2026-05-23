import Constant from "@/common/Constant";
import type { ModeCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator";
import TransceiverModeCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver";
import { describe, expect, it } from "vitest";
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

describe("TransceiverModeCoordinator.updateCurrentNoradId", () => {
  it("初回更新時、変更ありとしてtrueを返すこと", () => {
    const coordinator = createCoordinator();

    const changed = coordinator.updateCurrentNoradId("25544");

    expect(changed).toBe(true);
  });

  it("同じNoradIdを設定した場合、falseを返すこと", () => {
    const coordinator = createCoordinator();
    coordinator.updateCurrentNoradId("25544");

    const changed = coordinator.updateCurrentNoradId("25544");

    expect(changed).toBe(false);
  });

  it("異なるNoradIdへ更新した場合、再度trueを返すこと", () => {
    const coordinator = createCoordinator();
    coordinator.updateCurrentNoradId("25544");

    const changed = coordinator.updateCurrentNoradId("40967");

    expect(changed).toBe(true);
  });
});
