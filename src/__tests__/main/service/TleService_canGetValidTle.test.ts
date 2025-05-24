import WebClient, { AppHttpResponse } from "@/common/WebClient";
import TleService from "@/main/service/TleService";

/**
 * canGetValidTle のテスト
 */
describe("TleService - canGetValidTle", () => {
  /**
   * 取得したTLEが読み込み可能な場合true
   */
  test("取得したTLEが読み込み可能な場合true", async () => {
    // Arrange
    jest.spyOn(WebClient.prototype, "get").mockResolvedValue(new AppHttpResponse(200, "", "test\n1 abcde\n2 12345\n"));
    const url = "https://example.com/tle.txt";
    const sut = new TleService();
    // Act
    const result = await sut.canGetValidTle(url, new WebClient());
    // Assert
    expect(result).toBe(true);
  });
  /**
   * 取得したTLEが読み込み不可の場合false
   */
  test("取得したTLEが読み込み不可の場合false", async () => {
    // Arrange
    jest.spyOn(WebClient.prototype, "get").mockResolvedValue(new AppHttpResponse(200, "", "hoge"));
    const url = "https://example.com/tle.txt";
    const sut = new TleService();
    // Act
    const result = await sut.canGetValidTle(url, new WebClient());
    // Assert
    expect(result).toBe(false);
  });
});
