import WebClient, { AppHttpResponse } from "@/common/WebClient.js";
import OmmService from "@/main/service/OmmService.js";

/**
 * canGetValidOmm のテスト
 */
describe("OmmService - canGetValidOmm", () => {
  /**
   * 取得した軌道要素データがTLE形式で読み込み可能な場合true
   */
  it("取得した軌道要素データがTLE形式で読み込み可能な場合true", async () => {
    // Arrange
    vi.spyOn(WebClient.prototype, "get").mockResolvedValue(
      new AppHttpResponse(
        200,
        "",
        "ISS (ZARYA)\n1 25544U 98067A   26171.41461525  .00008813  00000+0  16600-3 0  9990\n2 25544  51.6327 284.1189 0004557 208.5194 151.5545 15.49333088572250\n"
      )
    );
    const url = "https://example.com/tle.txt";
    const sut = new OmmService();
    // Act
    const result = await sut.canGetValidOmm(url, new WebClient());
    // Assert
    expect(result).toBe(true);
  });

  /**
   * 取得した軌道要素データがJSON形式で読み込み可能な場合true
   */
  it("取得した軌道要素データがJSON形式で読み込み可能な場合true", async () => {
    // Arrange
    vi.spyOn(WebClient.prototype, "get").mockResolvedValue(
      new AppHttpResponse(
        200,
        "",
        '[{"OBJECT_NAME":"ISS (ZARYA)","NORAD_CAT_ID":25544,"EPOCH":"2026-06-20T09:57:02.757600"}]'
      )
    );
    const url = "https://example.com/gp.php?FORMAT=JSON";
    const sut = new OmmService();
    // Act
    const result = await sut.canGetValidOmm(url, new WebClient());
    // Assert
    expect(result).toBe(true);
  });

  /**
   * サーバがContent-Type: application/jsonで応答し、axiosがレスポンスを自動的にJSONへパースした場合でもtrue
   * memo: res.dataが文字列でなくオブジェクト(配列)になっているケースの回帰テスト
   */
  it("axiosがJSONを自動パースしオブジェクトとなった場合でもtrue", async () => {
    // Arrange
    const parsedJson = [{ OBJECT_NAME: "ISS (ZARYA)", NORAD_CAT_ID: 25544, EPOCH: "2026-06-20T09:57:02.757600" }];
    vi.spyOn(WebClient.prototype, "get").mockResolvedValue(new AppHttpResponse(200, "", parsedJson as unknown as string));
    const url = "https://example.com/gp.php?FORMAT=JSON";
    const sut = new OmmService();
    // Act
    const result = await sut.canGetValidOmm(url, new WebClient());
    // Assert
    expect(result).toBe(true);
  });

  /**
   * 取得した軌道要素データが読み込み不可の場合false
   */
  it("取得した軌道要素データが読み込み不可の場合false", async () => {
    // Arrange
    vi.spyOn(WebClient.prototype, "get").mockResolvedValue(new AppHttpResponse(200, "", "hoge"));
    const url = "https://example.com/tle.txt";
    const sut = new OmmService();
    // Act
    const result = await sut.canGetValidOmm(url, new WebClient());
    // Assert
    expect(result).toBe(false);
  });
});
