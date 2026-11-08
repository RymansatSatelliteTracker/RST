import Constant from "@/common/Constant.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixture, mockEnvironment } from "./helpers/beaconCoordinatorTestUtil.js";

const DopplerShiftMode = Constant.Transceiver.DopplerShiftMode;

/**
 * 指定の固定モードでBeaconを開始した状態を作る
 * @param autoOn AutoモードがONか
 * @param dopplerShiftMode Beacon ON 前の固定モード
 * @param withinRange ドップラーシフトの有効範囲内か
 */
const startBeacon = async (autoOn: boolean, dopplerShiftMode: string, withinRange: boolean = true) => {
  const fixture = createFixture(autoOn);
  fixture.state.dopplerShiftMode.value = dopplerShiftMode;
  mockEnvironment({ withinRange });

  await fixture.coordinator.start();

  // Beacon中の操作を想定する（ダイヤル・ホイールによるRx/Txの微調整、通常の基準周波数の変化）
  fixture.beaconMgr.shiftBeaconRxBaseFreq(-300);
  fixture.state.txBaseFreq.value = 145969000;
  fixture.state.rxBaseFreq.value = 435630000;
  fixture.state.txFrequency.value = "0145.968.000";
  fixture.baseFreqMgr.setPlainBaseFreqs(1, 1);

  vi.clearAllMocks();
  return fixture;
};

describe("TransceiverBeaconCoordinator.stop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Beacon中でない場合は何もしないこと", async () => {
    const { state, callbacks, coordinator } = createFixture(true);
    mockEnvironment();

    await coordinator.stop();

    expect(callbacks.stopTracking).not.toHaveBeenCalled();
    expect(state.rxFrequency.value).toBe("0435.634.000");
  });

  it("Auto ON・衛星固定：Beacon ON 前の基準周波数に戻し、ドップラーシフト補正を1回実行して周期処理を再開すること", async () => {
    const { state, beaconMgr, baseFreqMgr, callbacks, coordinator } = await startBeacon(
      true,
      DopplerShiftMode.FIXED_SAT
    );

    await coordinator.stop();

    expect(state.isBeaconMode.value).toBe(false);
    expect(state.dopplerShiftMode.value).toBe(DopplerShiftMode.FIXED_SAT);
    expect(state.rxOpeMode.value).toBe("USB");
    // 記録した基準周波数（補正値なし）に戻し、現在の補正値で計算し直す（Beacon中の調整は破棄される）
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({ plainRxBaseFreq: 435633000, plainTxBaseFreq: 145970000 });
    expect(state.rxBaseFreq.value).toBe(435634000);
    expect(state.txBaseFreq.value).toBe(145969500);
    expect(callbacks.applyDopplerShiftNow).toHaveBeenCalledTimes(1);
    expect(beaconMgr.getSaved()).toBeNull();
    expect(beaconMgr.getBeaconRxBaseFreq()).toBe(0);
    expect(callbacks.stopTracking).toHaveBeenCalledTimes(1);
    expect(callbacks.restartTracking).toHaveBeenCalledTimes(1);
  });

  it("Auto ON・受信固定：Rxを記録した固定値に戻し、固定モードを受信固定に戻すこと", async () => {
    const { state, callbacks, coordinator } = await startBeacon(true, DopplerShiftMode.FIXED_RX);

    await coordinator.stop();

    expect(state.dopplerShiftMode.value).toBe(DopplerShiftMode.FIXED_RX);
    expect(state.rxFrequency.value).toBe("0435.634.000");
    // Txは受信固定の通常の算出（ドップラーシフト補正）で決まる
    expect(callbacks.applyDopplerShiftNow).toHaveBeenCalledTimes(1);
  });

  it("Auto ON・送信固定：Txを記録した固定値に戻し、固定モードを送信固定に戻すこと", async () => {
    const { state, callbacks, coordinator } = await startBeacon(true, DopplerShiftMode.FIXED_TX);

    await coordinator.stop();

    expect(state.dopplerShiftMode.value).toBe(DopplerShiftMode.FIXED_TX);
    expect(state.txFrequency.value).toBe("0145.969.000");
    // Rxは送信固定の通常の算出（ドップラーシフト補正）で決まる
    expect(callbacks.applyDopplerShiftNow).toHaveBeenCalledTimes(1);
  });

  it("Auto ON・ドップラーシフトの有効範囲外：固定側以外を基準周波数（ドップラーシフトなし）にすること", async () => {
    const { state, callbacks, coordinator } = await startBeacon(true, DopplerShiftMode.FIXED_SAT, false);

    await coordinator.stop();

    expect(callbacks.applyDopplerShiftNow).not.toHaveBeenCalled();
    expect(state.rxFrequency.value).toBe("0435.634.000");
    expect(state.txFrequency.value).toBe("0145.969.500");
  });

  it("Auto ON・ドップラーシフトの有効範囲外・受信固定：Rxは固定値、Txは基準周波数にすること", async () => {
    const { state, coordinator } = await startBeacon(true, DopplerShiftMode.FIXED_RX, false);

    await coordinator.stop();

    expect(state.rxFrequency.value).toBe("0435.634.000");
    expect(state.txFrequency.value).toBe("0145.969.500");
  });

  it("周期処理を再開しない指定の場合は、周期処理を再開しないこと", async () => {
    const { callbacks, coordinator } = await startBeacon(true, DopplerShiftMode.FIXED_SAT);

    await coordinator.stop({ restartTracking: false });

    expect(callbacks.stopTracking).toHaveBeenCalledTimes(1);
    expect(callbacks.restartTracking).not.toHaveBeenCalled();
  });

  it("Auto OFF：Rx周波数・Rx運用モード・固定モードを記録した値に戻し、周期処理には触れないこと", async () => {
    const { state, baseFreqMgr, callbacks, coordinator } = await startBeacon(false, DopplerShiftMode.FIXED_TX);

    await coordinator.stop();

    expect(state.isBeaconMode.value).toBe(false);
    expect(state.dopplerShiftMode.value).toBe(DopplerShiftMode.FIXED_TX);
    expect(state.rxOpeMode.value).toBe("USB");
    expect(state.rxFrequency.value).toBe("0435.634.000");
    // Auto OFF では基準周波数を戻さない
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({ plainRxBaseFreq: 1, plainTxBaseFreq: 1 });
    expect(callbacks.applyDopplerShiftNow).not.toHaveBeenCalled();
    expect(callbacks.stopTracking).not.toHaveBeenCalled();
    expect(callbacks.restartTracking).not.toHaveBeenCalled();
  });
});
