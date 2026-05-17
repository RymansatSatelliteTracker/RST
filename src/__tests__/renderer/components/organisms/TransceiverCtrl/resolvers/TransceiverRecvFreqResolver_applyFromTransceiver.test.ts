import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { ApiResponse } from "@/common/types/types";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";
import TransceiverRecvFreqResolver, {
  RecvFreqResolverState,
} from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver";
import emitter from "@/renderer/util/EventBus";
import { ref } from "vue";

const createState = (): RecvFreqResolverState => ({
  txFrequency: ref("2430.000.000"),
  rxFrequency: ref("0480.000.000"),
  txFrequencyAdjustment: ref("+000.000"),
  rxFrequencyAdjustment: ref("+000.000"),
  txBaseFreq: ref(2430000000),
  rxBaseFreq: ref(480000000),
});

describe("TransceiverRecvFreqResolver.applyFromTransceiver", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("受信失敗時は通知を表示して処理を終了すること", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    const calcWithAdjust = jest.fn();
    const resolver = new TransceiverRecvFreqResolver(
      state,
      { tranceiverAuto: false } as never,
      baseFreqMgr,
      ref(new Date("2026-05-09T00:00:00.000Z")),
      () => 1000,
      calcWithAdjust,
      () => 0
    );
    jest.spyOn(I18nUtil, "getMsg").mockReturnValue("mocked notice");
    const emitSpy = jest.spyOn(emitter, "emit").mockImplementation(() => {});

    await resolver.applyFromTransceiver({
      status: false,
      message: I18nMsgs.SERIAL_NOT_CONNECTED_TRANSCEIVER,
      data: null,
    } as ApiResponse<any>);

    expect(emitSpy).toHaveBeenCalledWith(Constant.GlobalEvent.NOTICE_ERR, "mocked notice");
    expect(calcWithAdjust).not.toHaveBeenCalled();
  });

  it("Tx周波数受信かつAutoOff時、画面周波数のみ更新すること", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    const calcWithAdjust = jest.fn();
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
    } as ApiResponse<any>);

    expect(state.txFrequency.value).toBe("2430.123.456");
    expect(calcWithAdjust).not.toHaveBeenCalled();
  });

  it("Rx周波数受信かつAutoOn時、基準周波数を算出すること", async () => {
    const state = createState();
    const baseFreqMgr = new TransceiverBaseFreqMgr();
    baseFreqMgr.setPlainBaseFreqs(480000000, 2430000000);
    const calcRxSpy = jest.spyOn(TransceiverDopplerCalc.prototype, "calcBaseFreqByShiftedRxFreq").mockResolvedValue({
      newRxBaseFreq: 481000000,
      newTxBaseFreq: 2429000000,
    });
    const calcWithAdjust = jest.fn();
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
    } as ApiResponse<any>);

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
    expect(baseFreqMgr.getPlainBaseFreqs()).toEqual({
      plainRxBaseFreq: 481000000,
      plainTxBaseFreq: 2429000000,
    });
  });
});
