import Constant from "@/common/Constant.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BEACON_HZ, CURRENT_DATE, createFixture, mockEnvironment } from "./helpers/beaconCoordinatorTestUtil.js";

const DopplerShiftMode = Constant.Transceiver.DopplerShiftMode;

describe("TransceiverBeaconCoordinator.resumeOnAutoStart", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Beacon中でない場合は何もしないこと", async () => {
    const { state, beaconMgr, coordinator } = createFixture(false);
    const { calcRxSpy } = mockEnvironment();

    await coordinator.resumeOnAutoStart();

    expect(calcRxSpy).not.toHaveBeenCalled();
    expect(state.rxFrequency.value).toBe("0435.634.000");
    expect(beaconMgr.getSaved()).toBeNull();
  });

  it("Auto OFF → Beacon ON → Auto ON：戻り先をAuto側の値で更新し、Rxをビーコン側にすること", async () => {
    // Auto OFF 中に、受信固定の状態で Beacon ON にする
    const { state, autoStore, beaconMgr, baseFreqMgr, coordinator } = createFixture(false);
    state.dopplerShiftMode.value = DopplerShiftMode.FIXED_RX;
    const { calcRxSpy } = mockEnvironment({ shiftedRxFreq: "0435.614.000" });
    await coordinator.start();
    calcRxSpy.mockClear();

    // Auto 開始処理で、衛星設定の周波数・運用モードと基準周波数が設定された状態を作る
    autoStore.tranceiverAuto = false;
    state.txFrequency.value = "0145.970.000";
    state.rxFrequency.value = "0435.633.000";
    state.rxOpeMode.value = "USB";
    baseFreqMgr.updatePlainBaseFreq("0145.970.000", "0435.633.000");

    await coordinator.resumeOnAutoStart();

    // 戻り先はAuto側の値（衛星設定の周波数）。固定モードはBeacon ON時の値のまま
    expect(beaconMgr.getSaved()).toEqual({
      dopplerShiftMode: DopplerShiftMode.FIXED_RX,
      txFrequency: "0145.970.000",
      rxFrequency: "0435.633.000",
      rxOpeMode: "USB",
      plainTxBaseFreq: 145970000,
      plainRxBaseFreq: 435633000,
    });

    // Rxはビーコン周波数＋ドップラーシフト、固定モードは衛星固定
    expect(calcRxSpy).toHaveBeenCalledWith(CURRENT_DATE, BEACON_HZ, 1000);
    expect(state.rxFrequency.value).toBe("0435.614.000");
    expect(state.rxOpeMode.value).toBe("CW");
    expect(state.dopplerShiftMode.value).toBe(DopplerShiftMode.FIXED_SAT);
    expect(state.isBeaconMode.value).toBe(true);
    expect(beaconMgr.getBeaconRxBaseFreq()).toBe(BEACON_HZ);
  });
});
