import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/TransceiverDopplerCalc";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";

describe("TransceiverDopplerCalc", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("calcBaseFreqByShiftedRxFreq", () => {
    const currentDate = new Date("2025-01-01T12:00:00Z");
    const intervalMs = 1000;

    it("FrequencyTrackServiceが取得できない場合は0を返すこと", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue(null);

      const result = await calc.calcBaseFreqByShiftedRxFreq(
        480000000,
        2430000000,
        0,
        480000000,
        currentDate,
        intervalMs
      );
      expect(result).toEqual({ newRxBaseFreq: 0, newTxBaseFreq: 0 });
    });

    it("ドップラーファクター1.0のとき逆ヘテロダイン計算が実行されること", async () => {
      const calc = new TransceiverDopplerCalc();
      const hubInstance = ActiveSatServiceHub.getInstance();
      jest.spyOn(hubInstance, "getFrequencyTrackService").mockReturnValue({
        calcDownlinkDopplerFactor: jest.fn().mockResolvedValue(1.0),
        calcInvHeteroBaseFreqByRxFreq: jest.fn().mockReturnValue({
          rxBaseFreq: 480000000,
          txBaseFreq: 2430000000,
        }),
      } as any);

      const result = await calc.calcBaseFreqByShiftedRxFreq(
        480000000,
        2430000000,
        0,
        480000000,
        currentDate,
        intervalMs
      );
      expect(result.newRxBaseFreq).toBe(480000000);
      expect(result.newTxBaseFreq).toBe(2430000000);
    });
  });
});
