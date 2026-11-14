import Constant from "@/common/Constant.js";
import TransceiverDopplerModeResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverDopplerModeResolver.js";
import { describe, expect, it } from "vitest";

describe("TransceiverDopplerModeResolver.resolveCorrectionFlags", () => {
  const resolver = new TransceiverDopplerModeResolver();

  it("衛星固定の場合はTx/Rx双方を補正対象とすること", () => {
    const flags = resolver.resolveCorrectionFlags(Constant.Transceiver.DopplerShiftMode.FIXED_SAT);
    expect(flags).toEqual({
      execTxDopplerShiftCorrection: true,
      execRxDopplerShiftCorrection: true,
    });
  });

  it("受信固定の場合はTxのみ補正対象とし、Rxは補正対象外とすること", () => {
    const flags = resolver.resolveCorrectionFlags(Constant.Transceiver.DopplerShiftMode.FIXED_RX);
    expect(flags).toEqual({
      execTxDopplerShiftCorrection: true,
      execRxDopplerShiftCorrection: false,
    });
  });

  it("送信固定の場合はRxのみ補正対象とし、Txは補正対象外とすること", () => {
    const flags = resolver.resolveCorrectionFlags(Constant.Transceiver.DopplerShiftMode.FIXED_TX);
    expect(flags).toEqual({
      execTxDopplerShiftCorrection: false,
      execRxDopplerShiftCorrection: true,
    });
  });

  it("未知のモードの場合はTx/Rx双方とも補正対象外とすること", () => {
    const flags = resolver.resolveCorrectionFlags("UNKNOWN_MODE");
    expect(flags).toEqual({
      execTxDopplerShiftCorrection: false,
      execRxDopplerShiftCorrection: false,
    });
  });
});
