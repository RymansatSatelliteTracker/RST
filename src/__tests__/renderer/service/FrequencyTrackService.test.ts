import { AppConfigModel } from "@/common/model/AppConfigModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import FrequencyTrackService from "@/renderer/service/FrequencyTrackService";
import SatelliteService from "@/renderer/service/SatelliteService";

/**
 * FrequencyTrackServiceのテスト
 * 衛星通信入門(https://www.asahi-net.or.jp/~ei7m-wkt/numbr239.htm)
 * に記載の値を使用してテストを行う
 * この記事ではダウンリンク周波数が観測されているためロジックはダウリンク周波数を使って検証する
 * アップリンクのドップラーファクターはダウンリンクとほぼ同じなので簡略化して確認する
 */
describe("FrequencyTrackService", () => {
  beforeAll(() => {
    // 設定ファイルが扱えないため
    jest.spyOn(ApiAppConfig, "getAppConfig").mockImplementation(async () => {
      const appConfigModel = new AppConfigModel();
      // 衛星通信入門では神奈川に受信局があるため神奈川の適当な場所を指定する
      appConfigModel.groundStation.lat = 35.38408;
      appConfigModel.groundStation.lon = 139.610193;
      appConfigModel.groundStation.height = 36.5485;
      return appConfigModel;
    });
  });

  /**
   * 衛星通信入門で観測しているAO-40の人工衛星クラスを返却する
   * @returns
   */
  function getSatelliteService() {
    // AO-40のTLE
    const tleLine1 = "1 26609U 00072B   00328.20006944  .00000001  00000-0  12451-4 0    45";
    const tleLine2 = "2 26609   6.4214 245.2971 7351666 180.5141 180.0042  2.03021569   166";
    const tleStrings = { tleLine1: tleLine1, tleLine2: tleLine2, satelliteName: "AO-40" };

    const satelliteService = new SatelliteService(tleStrings);
    return satelliteService;
  }

  /**
   * ダウンリンク周波数の検証
   * 衛星通信入門記載の観測値で検証する
   */
  it.each`
    observedTime              | expectedFreq
    ${"2000-11-28T08:30:00Z"} | ${145899}
    ${"2000-11-28T08:39:00Z"} | ${145898}
    ${"2000-11-28T08:41:00Z"} | ${145897}
  `("観測日時 $observedTime のダウンリンク周波数は $expectedFreq である", async ({ observedTime, expectedFreq }) => {
    //Arrange
    const BASE_FREQ_kHz = 145898;

    const dt = new Date(observedTime);
    const satService = getSatelliteService();
    const freqTrack = new FrequencyTrackService(satService);

    //Act
    const dopplerFactor = await freqTrack.calcDownlinkDopplerFactor(dt);

    //Assert
    const downlinkFreq = Math.trunc(dopplerFactor * BASE_FREQ_kHz);
    expect(Math.abs(downlinkFreq - expectedFreq)).toBeLessThanOrEqual(1); // 観測値のため±1kHzの誤差を許容する
  });

  /**
   * アップリンクのドップラーファクターの検証
   */
  it("衛星が向かってくる時のアップリンクのドップラーファクターは1より小さい", async () => {
    //Arrange
    const dt = new Date("2000-11-28T08:30:00Z");
    const satService = getSatelliteService();
    const freqTrack = new FrequencyTrackService(satService);

    //Act
    const dopplerFactor = await freqTrack.calcUplinkDopplerFactor(dt);

    //Assert
    expect(dopplerFactor).toBeLessThan(1);
  });
});
