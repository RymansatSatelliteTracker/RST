import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import { AppConfigSatelliteGroup } from "@/common/model/AppConfigModel.js";
import type { Page } from "playwright/test";
import { expect, test } from "./fixtures";
import { makeBaseAppConfig, makeOmmItem } from "./helpers/e2eTestData";

/** テスト用の衛星グループ */
const TEST_GROUP_ID = 1;
const TEST_GROUP_NAME = "E2E";

/** テスト用の衛星（軌道要素のみ用意し、起動時に既定衛星定義へ追加される） */
const TEST_SATS = [
  { noradId: 99911, name: "E2E-SAT-A" },
  { noradId: 99912, name: "E2E-SAT-B" },
  { noradId: 99913, name: "E2E-SAT-C" },
];

/** 重複時の通知メッセージ */
const DUPLICATE_MSG = "重複したデータは移動できません";

/**
 * テスト用のアプリケーション設定（空の衛星グループを1つ持つ）
 */
const makeAppConfig = (): AppConfigModel => {
  const config = makeBaseAppConfig();

  const group = new AppConfigSatelliteGroup();
  group.groupId = TEST_GROUP_ID;
  group.groupName = TEST_GROUP_NAME;
  group.satelliteIds = [];
  config.satelliteGroups = [group];
  config.mainDisplay.activeSatelliteGroupId = TEST_GROUP_ID;

  return config;
};

/**
 * サイドメニューの「衛星」アイコンをクリックし、衛星設定ダイアログを開く
 */
const openSatelliteSetting = async (page: Page): Promise<void> => {
  await page
    .locator("div")
    .filter({ hasText: /^衛星$/ })
    .getByRole("img")
    .click();
  await expect(page.getByTestId("filterable-satellite-list")).toBeVisible();
};

/**
 * 左側の一覧で衛星を選択し、グループへ移動する
 */
const moveSatelliteToGroup = async (page: Page, sat: { noradId: number; name: string }): Promise<void> => {
  await page
    .getByTestId("filterable-satellite-list")
    .locator(".listitem", { hasText: `<${sat.noradId}> ${sat.name}` })
    .click();
  await page.getByTestId("move-to-group-btn").click();
};

/**
 * 右側（グループ）の一覧の衛星名を返す
 */
const readGroupSatellites = async (page: Page): Promise<string[]> => {
  const texts = await page.getByTestId("group-satellite-list").locator(".listitem").allTextContents();
  return texts.map((text) => text.trim());
};

/**
 * 保存されたテスト用グループの衛星IDを返す
 */
const readSavedGroupSatelliteIds = async (page: Page): Promise<number[]> => {
  return await page.evaluate(async (groupId) => {
    const api = (window as unknown as { rstApi: { getAppConfig: () => Promise<AppConfigModel> } }).rstApi;
    const config = await api.getAppConfig();
    return config.satelliteGroups.find((group) => group.groupId === groupId)?.satelliteIds ?? [];
  }, TEST_GROUP_ID);
};

test.describe("衛星", () => {
  test.use({
    testData: {
      appConfig: makeAppConfig(),
      ommItems: TEST_SATS.map((sat) => makeOmmItem(sat.noradId, sat.name)),
    },
  });

  test("衛星の追加", async ({ page }) => {
    await openSatelliteSetting(page);

    // 衛星を選択してグループへ移動する
    await moveSatelliteToGroup(page, TEST_SATS[0]);
    await expect.poll(() => readGroupSatellites(page)).toEqual([TEST_SATS[0].name]);
    await expect(page.getByText(DUPLICATE_MSG)).toHaveCount(0);

    // OKで保存すると、グループに衛星が追加される
    await page.getByRole("button", { name: "OK" }).click();
    await expect.poll(() => readSavedGroupSatelliteIds(page)).toHaveLength(1);
  });

  test("同じ衛星を追加した場合は重複の通知が表示され、追加されない", async ({ page }) => {
    await openSatelliteSetting(page);

    await moveSatelliteToGroup(page, TEST_SATS[0]);
    await expect.poll(() => readGroupSatellites(page)).toEqual([TEST_SATS[0].name]);

    // 同じ衛星をもう一度移動する
    await moveSatelliteToGroup(page, TEST_SATS[0]);
    await expect(page.getByText(DUPLICATE_MSG)).toBeVisible();
    expect(await readGroupSatellites(page)).toEqual([TEST_SATS[0].name]);
  });
});
