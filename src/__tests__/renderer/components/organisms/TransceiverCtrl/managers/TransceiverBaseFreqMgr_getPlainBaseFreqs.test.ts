import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";
import { describe, expect, it } from "vitest";

describe("TransceiverBaseFreqMgr.getPlainBaseFreqs", () => {
  it("初期状態ではTx/Rx基準周波数が0であること", () => {
    const mgr = new TransceiverBaseFreqMgr();

    const freqs = mgr.getPlainBaseFreqs();

    expect(freqs.plainTxBaseFreq).toBe(0);
    expect(freqs.plainRxBaseFreq).toBe(0);
  });
});
