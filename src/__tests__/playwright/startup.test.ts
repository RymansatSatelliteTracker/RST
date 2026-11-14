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

  test("地図タイルの表示", async ({ page }) => {
    // パッケージ化せずに起動した場合も、地図タイル（dist/tiles）が読み込まれることを確認する
    // memo: Leafletは、読み込みが完了したタイル画像に leaflet-tile-loaded を付与する
    await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible({ timeout: 15 * 1000 });
  });
});
