import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";

describe("TransceiverDopplerCalc", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("calcBaseFreqByShiftedRxFreq", () => {
    const currentDate = new Date("2025-01-01T12:00:00Z");
    const intervalMs = 1000;

    it("FrequencyTrackService縺悟叙蠕励〒縺阪↑縺・ｴ蜷医・0繧定ｿ斐☆縺薙→", async () => {
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

    it("繝峨ャ繝励Λ繝ｼ繝輔ぃ繧ｯ繧ｿ繝ｼ1.0縺ｮ縺ｨ縺埼・・繝・Ο繝繧､繝ｳ險育ｮ励′螳溯｡後＆繧後ｋ縺薙→", async () => {
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

