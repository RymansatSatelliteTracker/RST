import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";
import { describe, expect, it } from "vitest";

describe("TransceiverBaseFreqMgr.calcBaseFreqWithAdjust", () => {
  it("補正値を反映した値を返しplain値は変更しないこと", () => {
    const mgr = new TransceiverBaseFreqMgr();
    mgr.updatePlainBaseFreq("2430.000.000", "0480.000.000");

    const result = mgr.calcBaseFreqWithAdjust("+001.000", "-002.000");

    expect(result.txBaseFreq).toBe(2430001000);
    expect(result.rxBaseFreq).toBe(479998000);
    expect(result.baseFreqSum).toBe(result.txBaseFreq + result.rxBaseFreq);

    const plain = mgr.getPlainBaseFreqs();
    expect(plain.plainTxBaseFreq).toBe(2430000000);
    expect(plain.plainRxBaseFreq).toBe(480000000);
  });
});
