import FrequencyTrackService from "@/renderer/service/FrequencyTrackService";
import SatelliteService from "@/renderer/service/SatelliteService";

/**
 * FrequencyTrackService.calcInvertingHeterodyneBaseFreqのテスト
 */
describe("FrequencyTrackService.calcInvertingHeterodyneBaseFreqのテスト", () => {
  beforeAll(() => {});

  it("逆ヘテロダウンでRx、Txの基準周波数を計算する", () => {
    const servie = new FrequencyTrackService(
      new SatelliteService({ tleLine1: "dummy", tleLine2: "dummy", satelliteName: "dummy" })
    );
    const { rxBaseFreq, txBaseFreq } = servie.calcInvertingHeterodyneBaseFreq(1000, 500, 0.8);

    expect(rxBaseFreq).toBe(625); // 500 / 0.8 = 625
    expect(txBaseFreq).toBe(375); // 1000 - 625 = 375
  });

  it("ドップラーファクターが1.0の場合", () => {
    const service = new FrequencyTrackService(
      new SatelliteService({ tleLine1: "dummy", tleLine2: "dummy", satelliteName: "dummy" })
    );
    const { rxBaseFreq, txBaseFreq } = service.calcInvertingHeterodyneBaseFreq(1000, 500, 1.0);

    expect(rxBaseFreq).toBe(500); // 500 / 1.0 = 500
    expect(txBaseFreq).toBe(500); // 1000 - 500 = 500
  });

  it("高いドップラーファクター値での計算", () => {
    const service = new FrequencyTrackService(
      new SatelliteService({ tleLine1: "dummy", tleLine2: "dummy", satelliteName: "dummy" })
    );
    const { rxBaseFreq, txBaseFreq } = service.calcInvertingHeterodyneBaseFreq(2000, 800, 1.2);

    expect(rxBaseFreq).toBeCloseTo(667, 2); // 800 / 1.2 ≈ 666.667
    expect(txBaseFreq).toBeCloseTo(1333, 2); // 2000 - 666.667 ≈ 1333.333
  });

  it("低いドップラーファクター値での計算", () => {
    const service = new FrequencyTrackService(
      new SatelliteService({ tleLine1: "dummy", tleLine2: "dummy", satelliteName: "dummy" })
    );
    const { rxBaseFreq, txBaseFreq } = service.calcInvertingHeterodyneBaseFreq(1500, 600, 0.6);

    expect(rxBaseFreq).toBe(1000); // 600 / 0.6 = 1000
    expect(txBaseFreq).toBe(500); // 1500 - 1000 = 500
  });

  it("小数値での計算（四捨五入されること）", () => {
    const service = new FrequencyTrackService(
      new SatelliteService({ tleLine1: "dummy", tleLine2: "dummy", satelliteName: "dummy" })
    );
    const { rxBaseFreq, txBaseFreq } = service.calcInvertingHeterodyneBaseFreq(145.5, 70.25, 0.95);

    expect(rxBaseFreq).toBeCloseTo(74, 3); // 70.25 / 0.95 ≈ 73.947
    expect(txBaseFreq).toBeCloseTo(72, 3); // 145.5 - 73.947 ≈ 71.553
  });

  it("ゼロ値のテスト", () => {
    const service = new FrequencyTrackService(
      new SatelliteService({ tleLine1: "dummy", tleLine2: "dummy", satelliteName: "dummy" })
    );
    const { rxBaseFreq, txBaseFreq } = service.calcInvertingHeterodyneBaseFreq(0, 0, 1.0);

    expect(rxBaseFreq).toBe(0); // 0 / 1.0 = 0
    expect(txBaseFreq).toBe(0); // 0 - 0 = 0
  });
});
