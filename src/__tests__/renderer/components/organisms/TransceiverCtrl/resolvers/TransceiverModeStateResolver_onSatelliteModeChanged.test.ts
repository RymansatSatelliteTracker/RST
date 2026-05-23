import Constant from "@/common/Constant";
import type { ModeStateResolverState } from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeStateResolver";
import TransceiverModeStateResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeStateResolver";
import type { ModeState } from "@/renderer/components/organisms/TransceiverCtrl/useSatelliteModeStateManager";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    vi.restoreAllMocks();
  });

  it("oldModeがundefinedのとき、状態を変更しないこと", () => {
    const state = createState();
    const save = vi.fn();
    const load = vi.fn<(key: string) => ModeState>();
    const resolver = new TransceiverModeStateResolver(state, { tranceiverAuto: false } as never, save, load);

    resolver.onSatelliteModeChanged(Constant.Transceiver.SatelliteMode.SATELLITE, undefined);

    expect(save).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(state.isSatelliteMode.value).toBe(false);
  });

  it("サテライトモードへ変更時、旧モード状態を保存してisSatelliteModeをtrueにすること", () => {
    const state = createState();
    const save = vi.fn();
    const load = vi.fn<(key: string) => ModeState>();
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

  it("UNSETへ変更時、状態を読み込み、トラッキングモードを無効化すること", () => {
    const state = createState();
    const save = vi.fn();
    const load = vi.fn<(key: string) => ModeState>().mockReturnValue({
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
