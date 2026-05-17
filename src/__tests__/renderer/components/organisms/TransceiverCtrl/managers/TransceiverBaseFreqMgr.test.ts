import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";

describe("TransceiverBaseFreqMgr", () => {
  let mgr: TransceiverBaseFreqMgr;

  beforeEach(() => {
    mgr = new TransceiverBaseFreqMgr();
  });

  it("初期状態ではTx/Rx基準周波数と和が0であること", () => {
    const freqs = mgr.getPlainBaseFreqs();
    expect(freqs.plainTxBaseFreq).toBe(0);
    expect(freqs.plainRxBaseFreq).toBe(0);
    expect(mgr.getPlainBaseFreqSum()).toBe(0);
  });

  it("updatePlainBaseFreqで文字列周波数を数値へ反映できること", () => {
    mgr.updatePlainBaseFreq("2430.000.000", "0480.000.000");

    const freqs = mgr.getPlainBaseFreqs();
    expect(freqs.plainTxBaseFreq).toBe(2430000000);
    expect(freqs.plainRxBaseFreq).toBe(480000000);
    expect(mgr.getPlainBaseFreqSum()).toBe(2910000000);
  });

  it("setPlainBaseFreqsで基準周波数を直接設定できること", () => {
    mgr.setPlainBaseFreqs(480000000, 2430000000);

    const freqs = mgr.getPlainBaseFreqs();
    expect(freqs.plainRxBaseFreq).toBe(480000000);
    expect(freqs.plainTxBaseFreq).toBe(2430000000);
  });

  it("calcBaseFreqWithAdjustは補正値を反映した値を返しplain値は変更しないこと", () => {
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
