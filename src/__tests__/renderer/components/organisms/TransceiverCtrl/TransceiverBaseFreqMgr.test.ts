import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/TransceiverBaseFreqMgr";

describe("TransceiverBaseFreqMgr", () => {
  let mgr: TransceiverBaseFreqMgr;

  beforeEach(() => {
    // 各テスト前に新しいインスタンスを生成する
    mgr = new TransceiverBaseFreqMgr();
  });

  describe("初期状態", () => {
    it("初期値はTx/Rxともに0であること", () => {
      const freqs = mgr.getPlainBaseFreqs();
      expect(freqs.plainTxBaseFreq).toBe(0);
      expect(freqs.plainRxBaseFreq).toBe(0);
    });

    it("初期状態の周波数の和は0であること", () => {
      expect(mgr.getPlainBaseFreqSum()).toBe(0);
    });
  });

  describe("updatePlainBaseFreq", () => {
    it("ドット区切り文字列からTx/Rx基準周波数を更新できること", () => {
      // "2430.000.000" → 2430000000, "0480.000.000" → 480000000
      mgr.updatePlainBaseFreq("2430.000.000", "0480.000.000");

      const freqs = mgr.getPlainBaseFreqs();
      expect(freqs.plainTxBaseFreq).toBe(2430000000);
      expect(freqs.plainRxBaseFreq).toBe(480000000);
    });

    it("繰り返し呼び出すと最新の値に上書きされること", () => {
      mgr.updatePlainBaseFreq("2430.000.000", "0480.000.000");
      mgr.updatePlainBaseFreq("1200.000.000", "0145.000.000");

      const freqs = mgr.getPlainBaseFreqs();
      expect(freqs.plainTxBaseFreq).toBe(1200000000);
      expect(freqs.plainRxBaseFreq).toBe(145000000);
    });
  });

  describe("setPlainBaseFreqs", () => {
    it("数値でTx/Rx基準周波数を直接設定できること", () => {
      mgr.setPlainBaseFreqs(480000000, 2430000000);

      const freqs = mgr.getPlainBaseFreqs();
      expect(freqs.plainRxBaseFreq).toBe(480000000);
      expect(freqs.plainTxBaseFreq).toBe(2430000000);
    });

    it("0を設定した場合は0が保持されること", () => {
      // 一度値を設定してから0で上書きする
      mgr.setPlainBaseFreqs(480000000, 2430000000);
      mgr.setPlainBaseFreqs(0, 0);

      const freqs = mgr.getPlainBaseFreqs();
      expect(freqs.plainRxBaseFreq).toBe(0);
      expect(freqs.plainTxBaseFreq).toBe(0);
    });
  });

  describe("getPlainBaseFreqSum", () => {
    it("Tx + Rx の和が返ること", () => {
      mgr.setPlainBaseFreqs(480000000, 2430000000);

      // 480000000 + 2430000000 = 2910000000
      expect(mgr.getPlainBaseFreqSum()).toBe(2910000000);
    });

    it("updatePlainBaseFreq後に和が正しく計算されること", () => {
      mgr.updatePlainBaseFreq("2430.000.000", "0480.000.000");

      expect(mgr.getPlainBaseFreqSum()).toBe(2910000000);
    });
  });

  describe("calcBaseFreqWithAdjust", () => {
    beforeEach(() => {
      // 計算の基準となる周波数を設定する
      mgr.updatePlainBaseFreq("2430.000.000", "0480.000.000");
      // plainTxBaseFreq = 2430000000, plainRxBaseFreq = 480000000
    });

    it("補正値0の場合は基準周波数がそのまま返ること", () => {
      const result = mgr.calcBaseFreqWithAdjust("+000.000", "+000.000");

      expect(result.txBaseFreq).toBe(2430000000);
      expect(result.rxBaseFreq).toBe(480000000);
      expect(result.baseFreqSum).toBe(2910000000);
    });

    it("正の補正値が加算されること", () => {
      // "+001.000" → 1000 Hz加算
      const result = mgr.calcBaseFreqWithAdjust("+001.000", "+002.000");

      expect(result.txBaseFreq).toBe(2430001000);
      expect(result.rxBaseFreq).toBe(480002000);
      expect(result.baseFreqSum).toBe(2910003000);
    });

    it("負の補正値が減算されること", () => {
      // "-001.000" → 1000 Hz減算
      const result = mgr.calcBaseFreqWithAdjust("-001.000", "-002.000");

      expect(result.txBaseFreq).toBe(2429999000);
      expect(result.rxBaseFreq).toBe(479998000);
      expect(result.baseFreqSum).toBe(2909997000);
    });

    it("baseFreqSumはtxBaseFreq + rxBaseFreqの和と一致すること", () => {
      const result = mgr.calcBaseFreqWithAdjust("+003.500", "-001.200");

      expect(result.baseFreqSum).toBe(result.txBaseFreq + result.rxBaseFreq);
    });

    it("calcBaseFreqWithAdjustを呼び出してもplainBaseFreqは変化しないこと", () => {
      mgr.calcBaseFreqWithAdjust("+001.000", "+001.000");

      // 内部の補正値なし基準周波数は変わらない
      const freqs = mgr.getPlainBaseFreqs();
      expect(freqs.plainTxBaseFreq).toBe(2430000000);
      expect(freqs.plainRxBaseFreq).toBe(480000000);
    });
  });
});
