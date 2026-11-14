import Constant from "@/common/Constant.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import emitter from "@/renderer/util/EventBus.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BEACON_HZ, CURRENT_DATE, createFixture, mockEnvironment } from "./helpers/beaconCoordinatorTestUtil.js";

describe("TransceiverBeaconCoordinator.start", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Auto ON：固定モードを衛星固定にし、Rxをビーコン周波数＋ドップラーシフトにすること", async () => {
    const { state, beaconMgr, callbacks, coordinator } = createFixture(true);
    state.dopplerShiftMode.value = Constant.Transceiver.DopplerShiftMode.FIXED_RX;
    const { calcRxSpy } = mockEnvironment({ shiftedRxFreq: "0435.614.000" });

    const result = await coordinator.start();

    expect(result).toBe(true);
    expect(state.isBeaconMode.value).toBe(true);
    expect(state.dopplerShiftMode.value).toBe(Constant.Transceiver.DopplerShiftMode.FIXED_SAT);
    expect(state.rxOpeMode.value).toBe("CW");
    // ビーコン周波数にはRx補正値を加えない
    expect(calcRxSpy).toHaveBeenCalledWith(CURRENT_DATE, BEACON_HZ, 1000);
    expect(state.rxFrequency.value).toBe("0435.614.000");
    expect(beaconMgr.getBeaconRxBaseFreq()).toBe(BEACON_HZ);
    // Txは変更しない
    expect(state.txFrequency.value).toBe("0145.969.000");
    // 切替中は周期処理を停止し、切替後に再開する
    expect(callbacks.stopTracking).toHaveBeenCalledTimes(1);
    expect(callbacks.restartTracking).toHaveBeenCalledTimes(1);
  });

  it("Auto ON：Beacon ON 前の状態（補正値を除いた基準周波数を含む）を記録すること", async () => {
    const { beaconMgr, coordinator, state } = createFixture(true);
    state.dopplerShiftMode.value = Constant.Transceiver.DopplerShiftMode.FIXED_TX;
    mockEnvironment();

    await coordinator.start();

    expect(beaconMgr.getSaved()).toEqual({
      dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_TX,
      txFrequency: "0145.969.000",
      rxFrequency: "0435.634.000",
      rxOpeMode: "USB",
      // 145969500 - (-500)、435634000 - 1000
      plainTxBaseFreq: 145970000,
      plainRxBaseFreq: 435633000,
    });
  });

  it("Auto ON：ドップラーシフトの有効範囲外の場合は、Rxをビーコン周波数そのものにすること", async () => {
    const { state, coordinator } = createFixture(true);
    const { calcRxSpy } = mockEnvironment({ withinRange: false });

    await coordinator.start();

    expect(calcRxSpy).not.toHaveBeenCalled();
    expect(state.rxFrequency.value).toBe("0435.610.000");
  });

  it("Auto OFF：Rxをビーコン周波数にし（ドップラーシフトなし）、周期処理には触れないこと", async () => {
    const { state, callbacks, coordinator } = createFixture(false);
    const { calcRxSpy } = mockEnvironment();

    const result = await coordinator.start();

    expect(result).toBe(true);
    expect(state.isBeaconMode.value).toBe(true);
    expect(state.dopplerShiftMode.value).toBe(Constant.Transceiver.DopplerShiftMode.FIXED_SAT);
    expect(state.rxOpeMode.value).toBe("CW");
    expect(state.rxFrequency.value).toBe("0435.610.000");
    expect(calcRxSpy).not.toHaveBeenCalled();
    expect(callbacks.stopTracking).not.toHaveBeenCalled();
    expect(callbacks.restartTracking).not.toHaveBeenCalled();
  });

  it("ビーコン周波数が未設定の場合は、通知してBeaconを開始しないこと", async () => {
    const { state, beaconMgr, coordinator } = createFixture(true);
    mockEnvironment({ beaconHz: null });
    vi.spyOn(I18nUtil, "getMsg").mockReturnValue("ビーコン未設定");
    const emitSpy = vi.spyOn(emitter, "emit").mockImplementation(() => {});

    const result = await coordinator.start();

    expect(result).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(Constant.GlobalEvent.NOTICE_INFO, "ビーコン未設定");
    expect(state.isBeaconMode.value).toBe(false);
    expect(state.rxFrequency.value).toBe("0435.634.000");
    expect(beaconMgr.getSaved()).toBeNull();
  });

  it("サテライトモードOFFの場合は、Beaconを開始しないこと", async () => {
    const { state, coordinator } = createFixture(true);
    state.isSatelliteMode.value = false;
    mockEnvironment();

    const result = await coordinator.start();

    expect(result).toBe(false);
    expect(state.isBeaconMode.value).toBe(false);
    expect(state.rxFrequency.value).toBe("0435.634.000");
  });
});
