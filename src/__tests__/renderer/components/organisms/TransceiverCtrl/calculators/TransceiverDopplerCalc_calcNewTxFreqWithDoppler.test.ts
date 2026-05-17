import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";

describe("TransceiverDopplerCalc", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("calcNewTxFreqWithDoppler", () => {
    const currentDate = new Date("2025-01-01T12:00:00Z");
    const txBaseFreq = 2430000000;
    const intervalMs = 1000;

    it("FrequencyTrackServiceが取得できない場合、nullを返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue(null);

      const result = await calc.calcNewTxFreqWithDoppler(currentDate, txBaseFreq, intervalMs);
      expect(result).toBeNull();
    });

    it("ドップラーファクター1.0のときTx基準周波数がそのまま返ること", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue({
        calcUplinkDopplerFactor: jest.fn().mockResolvedValue(1.0),
      } as any);

      const result = await calc.calcNewTxFreqWithDoppler(currentDate, txBaseFreq, intervalMs);
      // 2430000000 * 1.0 = 2430000000 ↁE"2430.000.000"
      expect(result).toBe("2430.000.000");
    });

    it("ドップラーファクターが1.0より小さい場合（衛星が遠ざかる）に周波数が低下すること", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      const factor = 0.99999;
      jest.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue({
        calcUplinkDopplerFactor: jest.fn().mockResolvedValue(factor),
      } as any);

      const result = await calc.calcNewTxFreqWithDoppler(currentDate, txBaseFreq, intervalMs);
      const resultNum = Number(result!.replace(/\./g, ""));
      expect(resultNum).toBeLessThan(txBaseFreq);
    });
  });
});
