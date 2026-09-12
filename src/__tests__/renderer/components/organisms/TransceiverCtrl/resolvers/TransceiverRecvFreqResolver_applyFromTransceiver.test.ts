import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import type { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import type { ApiResponse } from "@/common/types/types.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import type { DopplerShiftCorrectionFlags } from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverDopplerModeResolver.js";
import type { RecvFreqResolverState } from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.js";
import TransceiverRecvFreqResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.js";
import emitter from "@/renderer/util/EventBus.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const createState = (): RecvFreqResolverState => ({
  txFrequency: ref("2430.000.000"),
  rxFrequency: ref("0480.000.000"),
  txFrequencyAdjustment: ref("+000.000"),
  rxFrequencyAdjustment: ref("+000.000"),
  txBaseFreq: ref(2430000000),
  rxBaseFreq: ref(480000000),
});

// 衛星固定相当（Tx/Rxとも補正対象）
const FLAGS_FIXED_SAT: DopplerShiftCorrectionFlags = {
  execTxDopplerShiftCorrection: true,
  execRxDopplerShiftCorrection: true,
};
// 送信固定相当（Txが固定側）
const FLAGS_FIXED_TX: DopplerShiftCorrectionFlags = {
  execTxDopplerShiftCorrection: false,
  execRxDopplerShiftCorrection: true,
};
// 受信固定相当（Rxが固定側）
const FLAGS_FIXED_RX: DopplerShiftCorrectionFlags = {
  execTxDopplerShiftCorrection: true,
  execRxDopplerShiftCorrection: false,
};

describe("TransceiverRecvFreqResolver.applyFromTransceiver", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("受信失敗時は通知を表示して処理を終了すること", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: false } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => 0,
      () => FLAGS_FIXED_SAT
    );
    vi.spyOn(I18nUtil, "getMsg").mockReturnValue("mocked notice");
    const emitSpy = vi.spyOn(emitter, "emit").mockImplementation(() => {});

    await resolver.applyFromTransceiver({
      status: false,
      message: I18nMsgs.SERIAL_NOT_CONNECTED_TRANSCEIVER,
      data: null,
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    expect(emitSpy).toHaveBeenCalledWith(Constant.GlobalEvent.NOTICE_ERR, "mocked notice");
    expect(calcWithAdjust).not.toHaveBeenCalled();
  });

  it("Tx周波数受信かつAutoOff時、モードに関わらず画面周波数のみ更新し基準周波数は再算出しないこと", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: false } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => 0,
      () => FLAGS_FIXED_TX
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        uplinkHz: 2430123456,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    // AutoOff時はTx破棄判定を行わず、画面表示のみ反映され基準周波数の再算出は行われない
    expect(state.txFrequency.value).toBe("2430.123.456");
    expect(calcWithAdjust).not.toHaveBeenCalled();
  });

  it("Rx周波数受信かつAutoOn時、モードに関わらずRxが更新されSumを保ったままTx基準周波数も更新されること（送信固定モード）", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    const calcRxSpy = vi.spyOn(TransceiverDopplerCalc.prototype, "calcBaseFreqByShiftedRxFreq").mockResolvedValue({
      newRxBaseFreq: 481000000,
      newTxBaseFreq: 2429000000,
    });
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: true } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => state.rxBaseFreq.value + state.txBaseFreq.value,
      () => FLAGS_FIXED_TX
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        downlinkHz: 480100000,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    expect(state.rxFrequency.value).toBe("0480.100.000");
    expect(calcRxSpy).toHaveBeenCalledWith(
      480000000,
      2430000000,
      0,
      480100000,
      new Date("2026-05-09T00:00:00.000Z"),
      1000
    );
    expect(calcWithAdjust).toHaveBeenCalled();
    // Rxは常に受け付ける。ダイヤル操作された側（Rx）に伴い、Sum維持のために再計算されたTx側の値もRST自身の計算として採用される
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 481000000,
      plainTxBaseFreq: 2429000000,
    });
  });

  it("Rx周波数受信かつAutoOn時、受信固定モードでもRxが更新されSumを保ったままTx基準周波数も更新されること", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    vi.spyOn(TransceiverDopplerCalc.prototype, "calcBaseFreqByShiftedRxFreq").mockResolvedValue({
      newRxBaseFreq: 481000000,
      newTxBaseFreq: 2429000000,
    });
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: true } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => state.rxBaseFreq.value + state.txBaseFreq.value,
      () => FLAGS_FIXED_RX
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        downlinkHz: 480100000,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    // 受信固定モード（Rxが固定側）であっても、Rx側の無線機通知は破棄されずそのまま反映される
    expect(state.rxFrequency.value).toBe("0480.100.000");
    expect(calcWithAdjust).toHaveBeenCalled();
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 481000000,
      plainTxBaseFreq: 2429000000,
    });
  });

  it("Tx周波数受信かつAutoOn時（衛星固定モード）、Txが更新されSumを保ったままRx基準周波数も更新されること", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    const calcTxSpy = vi.spyOn(TransceiverDopplerCalc.prototype, "calcBaseFreqByShiftedTxFreq").mockResolvedValue({
      newRxBaseFreq: 481000000,
      newTxBaseFreq: 2429000000,
    });
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: true } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => state.rxBaseFreq.value + state.txBaseFreq.value,
      () => FLAGS_FIXED_SAT
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        uplinkHz: 2429900000,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    expect(state.txFrequency.value).toBe("2429.900.000");
    expect(calcTxSpy).toHaveBeenCalledWith(
      480000000,
      2430000000,
      0,
      2429900000,
      new Date("2026-05-09T00:00:00.000Z"),
      1000
    );
    expect(calcWithAdjust).toHaveBeenCalled();
    // 衛星固定モードのため、Sum維持のために再計算されたRx側の値もそのまま採用される
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 481000000,
      plainTxBaseFreq: 2429000000,
    });
  });

  it("送信固定モードでTx周波数を受信した場合、無線機側の自動変化を取り込まず画面表示・基準周波数のいずれも変化しないこと", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    const calcTxSpy = vi.spyOn(TransceiverDopplerCalc.prototype, "calcBaseFreqByShiftedTxFreq");
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: true } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => 0,
      () => FLAGS_FIXED_TX
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        uplinkHz: 2430999999,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    // Rxダイヤル操作に伴う無線機側の自動変化を想定し、Tx側の無線機通知は取り込まずRST側の値を維持する
    expect(state.txFrequency.value).toBe("2430.000.000");
    expect(calcTxSpy).not.toHaveBeenCalled();
    expect(calcWithAdjust).not.toHaveBeenCalled();
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 480000000,
      plainTxBaseFreq: 2430000000,
    });
  });

  it("受信固定モードでTx周波数を受信した場合も、無線機側の自動変化を取り込まず画面表示・基準周波数のいずれも変化しないこと", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    const calcTxSpy = vi.spyOn(TransceiverDopplerCalc.prototype, "calcBaseFreqByShiftedTxFreq");
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: true } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => 0,
      () => FLAGS_FIXED_RX
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        uplinkHz: 2429900000,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    expect(state.txFrequency.value).toBe("2430.000.000");
    expect(calcTxSpy).not.toHaveBeenCalled();
    expect(calcWithAdjust).not.toHaveBeenCalled();
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 480000000,
      plainTxBaseFreq: 2430000000,
    });
  });
});
