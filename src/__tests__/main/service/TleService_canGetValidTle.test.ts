import TleService from "@/main/service/TleService";

/**
 * canGetValidTle のテスト
 */
describe("TleService - canGetValidTle", () => {
  /**
   * TLEがブランク
   * 保持TLEもブランク
   */
  test("TLEが取得できないURLの場合false", async () => {
    const tleService = new TleService();
    const url = "https://example.com/tle.txt";
    const result = await tleService.canGetValidTle(url);
    expect(result).toBe(false);
  });
});
