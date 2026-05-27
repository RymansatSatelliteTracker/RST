import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";

describe("TransceiverBaseFreqMgr.updatePlainBaseFreq", () => {
  it("文字列周波数を数値へ反映できること", () => {
    const mgr = new TransceiverBaseFreqMgr();

    mgr.updatePlainBaseFreq("2430.000.000", "0480.000.000");

    const freqs = mgr.getPlainBaseFreqs();
    expect(freqs.plainTxBaseFreq).toBe(2430000000);
    expect(freqs.plainRxBaseFreq).toBe(480000000);
    expect(mgr.getPlainBaseFreqSum()).toBe(2910000000);
  });
});
