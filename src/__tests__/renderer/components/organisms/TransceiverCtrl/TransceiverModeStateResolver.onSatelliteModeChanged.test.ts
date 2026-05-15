import Constant from "@/common/Constant";
import TransceiverModeStateResolver, {
  ModeStateResolverState,
} from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeStateResolver";
import { ModeState } from "@/renderer/components/organisms/TransceiverCtrl/useSatelliteModeStateManager";
import { ref } from "vue";

const createState = (): ModeStateResolverState => ({
  rxFrequency: ref("0480.000.000"),
  rxOpeMode: ref(Constant.Transceiver.OpeMode.FM),
  txOpeMode: ref(Constant.Transceiver.OpeMode.FM),
  isSatTrackingModeNormal: ref(true),
  isSatelliteMode: ref(false),
});

describe("TransceiverModeStateResolver.onSatelliteModeChanged", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("oldModeがundefinedのときは状態を変更しないこと", () => {
    const state = createState();
    const save = jest.fn();
    const load = jest.fn<ModeState, [string]>();
    const resolver = new TransceiverModeStateResolver(state, { tranceiverAuto: false } as never, save, load);

    resolver.onSatelliteModeChanged(Constant.Transceiver.SatelliteMode.SATELLITE, undefined);

    expect(save).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(state.isSatelliteMode.value).toBe(false);
  });

  it("サテライトモードへ変更時は旧モード状態を保存してisSatelliteModeをtrueにすること", () => {
    const state = createState();
    const save = jest.fn();
    const load = jest.fn<ModeState, [string]>();
    const resolver = new TransceiverModeStateResolver(state, { tranceiverAuto: false } as never, save, load);

    resolver.onSatelliteModeChanged(
      Constant.Transceiver.SatelliteMode.SATELLITE,
      Constant.Transceiver.SatelliteMode.UNSET
    );

    expect(save).toHaveBeenCalledWith(Constant.Transceiver.SatelliteMode.UNSET, {
      rxFrequency: "0480.000.000",
      rxOpeMode: Constant.Transceiver.OpeMode.FM,
      isSatTrackingModeNormal: true,
    });
    expect(load).not.toHaveBeenCalled();
    expect(state.isSatelliteMode.value).toBe(true);
  });

  it("UNSETへ変更時は状態を読み込み、トラッキングモードを無効化すること", () => {
    const state = createState();
    const save = jest.fn();
    const load = jest.fn<ModeState, [string]>().mockReturnValue({
      rxFrequency: "145.900.000",
      rxOpeMode: Constant.Transceiver.OpeMode.UNSET,
      isSatTrackingModeNormal: true,
    });
    const resolver = new TransceiverModeStateResolver(state, { tranceiverAuto: false } as never, save, load);

    resolver.onSatelliteModeChanged(
      Constant.Transceiver.SatelliteMode.UNSET,
      Constant.Transceiver.SatelliteMode.SATELLITE
    );

    expect(load).toHaveBeenCalledWith(Constant.Transceiver.SatelliteMode.UNSET);
    expect(state.rxFrequency.value).toBe("145.900.000");
    expect(state.rxOpeMode.value).toBe(Constant.Transceiver.OpeMode.UNSET);
    expect(state.isSatTrackingModeNormal.value).toBe(false);
    expect(state.isSatelliteMode.value).toBe(false);
  });
});
