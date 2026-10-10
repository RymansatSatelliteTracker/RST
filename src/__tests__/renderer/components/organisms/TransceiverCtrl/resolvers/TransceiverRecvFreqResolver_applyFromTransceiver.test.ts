import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import type { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import type { ApiResponse } from "@/common/types/types.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import type { RecvFreqResolverState } from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.js";
import TransceiverRecvFreqResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver.js";
import emitter from "@/renderer/util/EventBus.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const createState = (): RecvFreqResolverState => ({
  rxFrequency: ref("0480.000.000"),
  rxFrequencyAdjustment: ref("+000.000"),
  txBaseFreq: ref(2430000000),
  rxBaseFreq: ref(480000000),
});

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
      () => 0
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

  it("Tx周波数受信かつAutoOn時、モードに関わらず無線機側の変化を取り込まず基準周波数は変化しないこと", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: true } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => 0
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        uplinkHz: 2429900000,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    // Tx周波数の同期はRST→無線機の一方向のため、無線機からの通知は破棄され基準周波数は変化しない
    expect(calcWithAdjust).not.toHaveBeenCalled();
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 480000000,
      plainTxBaseFreq: 2430000000,
    });
  });

  it("Tx周波数受信かつAutoOff時も、無線機側の変化を取り込まないこと", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    const calcWithAdjust = vi.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: false } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => 0
    );

    await resolver.applyFromTransceiver({
      status: true,
      data: {
        uplinkHz: 2430123456,
      },
    } as unknown as ApiResponse<UplinkType | DownlinkType>);

    expect(calcWithAdjust).not.toHaveBeenCalled();
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 480000000,
      plainTxBaseFreq: 2430000000,
    });
  });

  it("Rx周波数受信かつAutoOn時、Rxが更新されSumを保ったままTx基準周波数も更新されること", async () => {
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
      () => state.rxBaseFreq.value + state.txBaseFreq.value
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
});
