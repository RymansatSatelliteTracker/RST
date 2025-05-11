import Constant from "@/common/Constant";
import { _electron, ElectronApplication, expect, Page, test } from "@playwright/test";
import Store from 'electron-store';

let electronApp: ElectronApplication;
let page: Page;

const AppConfigStore = new Store({ name: Constant.Config.CONFIG_FILENAME });
const WinodwStore = new Store({ name: Constant.Config.CONFIG_WINDOW });

//electoronのアプリを開く
test.beforeEach(async () => {
  // electron-storeのデータをクリア
  AppConfigStore.clear();
  WinodwStore.clear();

  // 起動
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

test("衛星のクリック", async () => {
  // const satellite = await page.$('div.menu__item:has(span:has-text("衛星"))')
  const satellite = await page.locator('div').filter({ hasText: /^衛星$/ }).getByRole('img').click();


  /*const SatelliteSettingWindow = await satellite?.click();
  expect(SatelliteSettingWindow).not.toBeNull();*/

  // 表示されるまで待ち時間を設ける
  await page.waitForTimeout(1000);
  // 衛星の追加
  const firstSatelliteData = await page.locator('.v-virtual-scroll').first().click();
  console.log(firstSatelliteData)

  // 表示されるまで待ち時間を設ける
  await page.waitForTimeout(1000);

  await page.locator('.v-row > div:nth-child(2)').first().click()
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'OK' }).click();;
  await page.waitForTimeout(1000);
  })