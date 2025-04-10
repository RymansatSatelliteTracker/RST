// test/sample.test.ts
import { _electron, ElectronApplication, expect, Page, test } from "@playwright/test";

let electronApp: ElectronApplication;
let page: Page;

//electoronのアプリを開く
test.beforeEach(async () => {
  electronApp = await _electron.launch({
    args: ["."],
  });
  page = await electronApp.firstWindow();
});

//electoronのアプリを閉じる
test.afterEach(async () => {
  await electronApp.close();
});

//テスト内容
test("起動チェック", async () => {
  // ウィンドウサイズの確認
  const { width, height } = await page.evaluate(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });
  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);

});
