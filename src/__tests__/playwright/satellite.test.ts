import { expect, test } from "./fixtures";

test.describe("衛星", () => {
  test("衛星の追加", async ({ page }) => {
    // サイドメニューの「衛星」アイコンをクリックし、衛星選択ダイアログを開く
    const satellite = page
      .locator("div")
      .filter({ hasText: /^衛星$/ })
      .getByRole("img");
    expect(satellite).not.toBeNull();
    await satellite.click();

    // ダイアログのアニメーション/一覧描画が完了するまで待ち時間を設ける
    await page.waitForTimeout(500);

    // 仮想スクロールリストの先頭行（＝一覧の先頭にある衛星）を選択
    const firstSatelliteData = page.locator(".v-virtual-scroll").first();
    expect(firstSatelliteData).not.toBeNull();
    await page.waitForTimeout(500);
    await firstSatelliteData.click();
    await page.waitForTimeout(500);

    // 選択行内の追加ボタン（2列目）をクリックし、確認ダイアログのOKで追加を確定する
    await page.locator(".v-row > div:nth-child(2)").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "OK" }).click();
    await page.waitForTimeout(500);
  });
});
