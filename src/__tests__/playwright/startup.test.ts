import { expect, test } from "./fixtures";

test.describe("起動", () => {
  test("起動チェック", async ({ page }) => {
    // アプリが正常に起動し、ウィンドウが描画されていることを確認する
    const { width, height } = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
