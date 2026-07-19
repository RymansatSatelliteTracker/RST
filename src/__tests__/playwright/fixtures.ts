import Constant from "@/common/Constant.js";
import Store from "electron-store";
import type { ElectronApplication, Page } from "playwright/test";
import { _electron, test as base } from "playwright/test";

const appConfigStore = new Store({ name: Constant.Config.CONFIG_FILENAME });
const windowStore = new Store({ name: Constant.Config.CONFIG_WINDOW });

// Electronアプリの起動/終了と、electron-storeのクリアを共通化したfixture
export const test = base.extend<{
  electronApp: ElectronApplication;
  page: Page;
}>({
  electronApp: async ({}, use) => {
    // テスト間で設定が残らないよう、起動前に永続化ストアをクリアする
    appConfigStore.clear();
    windowStore.clear();

    const electronApp = await _electron.launch({
      args: ["."],
    });

    await use(electronApp);

    await electronApp.close();
    // 後続テストへの影響を防ぐため、終了後にも再度クリアする
    appConfigStore.clear();
    windowStore.clear();
  },
  page: async ({ electronApp }, use) => {
    // Electronアプリのメインウィンドウをテスト対象のpageとして取得
    const page = await electronApp.firstWindow();
    await use(page);
  },
});

export { expect } from "playwright/test";
