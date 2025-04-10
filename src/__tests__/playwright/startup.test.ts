// test/sample.test.ts
import { _electron, ElectronApplication, Page, test } from "@playwright/test";

let electronApp: ElectronApplication;
let page: Page;

//electoronのアプリを開く
test.beforeEach(async () => {
  electronApp = await _electron.launch({
    args: ["src/main/main.ts"],
  });
  page = await electronApp.firstWindow();
});

//electoronのアプリを閉じる
test.afterEach(async () => {
  await electronApp.close();
});

//テスト内容ｖ
test("起動チェック", async () => {
  const { width, height } = await page.evaluate(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });
});
