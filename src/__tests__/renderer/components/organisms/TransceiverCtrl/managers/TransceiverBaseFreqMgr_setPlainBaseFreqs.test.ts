import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import { describe, expect, it } from "vitest";

describe("TransceiverBaseFreqMgr.setPlainBaseFreqs", () => {
  it("基準周波数を直接設定できること", () => {
    const mgr = new TransceiverBaseFreqMgr();

    mgr.setPlainBaseFreqs(480000000, 2430000000);

    const freqs = mgr.getPlainBaseFreqs();
    expect(freqs.plainRxBaseFreq).toBe(480000000);
    expect(freqs.plainTxBaseFreq).toBe(2430000000);
  });
});
