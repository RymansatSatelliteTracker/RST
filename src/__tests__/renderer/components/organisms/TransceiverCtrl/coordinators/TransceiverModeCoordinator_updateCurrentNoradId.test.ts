import Constant from "@/common/Constant";
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
  it("蛻晏屓譖ｴ譁ｰ譎ゅ・螟画峩縺ゅｊ縺ｨ縺励※true繧定ｿ斐☆縺薙→", () => {
    const coordinator = createCoordinator();

    const changed = coordinator.updateCurrentNoradId("25544");

    expect(changed).toBe(true);
  });

  it("蜷後§NoradId繧貞・險ｭ螳壹＠縺溷ｴ蜷医・false繧定ｿ斐☆縺薙→", () => {
    const coordinator = createCoordinator();
    coordinator.updateCurrentNoradId("25544");

    const changed = coordinator.updateCurrentNoradId("25544");

    expect(changed).toBe(false);
  });

  it("逡ｰ縺ｪ繧起oradId縺ｸ譖ｴ譁ｰ縺励◆蝣ｴ蜷医・蜀阪・true繧定ｿ斐☆縺薙→", () => {
    const coordinator = createCoordinator();
    coordinator.updateCurrentNoradId("25544");

    const changed = coordinator.updateCurrentNoradId("40967");

    expect(changed).toBe(true);
  });
});

