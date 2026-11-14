import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import type { Page } from "playwright/test";
import { expect, test } from "./fixtures";
import { TEST_SATS, makeTestAppConfig, makeTestDefaultSatellites } from "./helpers/activeSatRestoreTestData";

/**
 * 地図上の軌道の南北の広がり（地図の高さに対する比率）の判定値
 * - 極軌道：南北に大きく振れるため、地図の高さの多くを占める
 * - 赤道軌道：南北にほとんど振れないため、矢印の大きさ程度にとどまる
 */
const POLAR_MIN_RATIO = 0.3;
const EQUATORIAL_MAX_RATIO = 0.1;

/**
 * 衛星選択ボックスの表示値を返す
 */
const readSelectedSatellite = async (page: Page): Promise<string | null> => {
  const text = await page.locator(".sat_select .v-select__selection-text").textContent();
  return text?.trim() ?? null;
};

/**
 * 衛星選択ボックスで衛星を選択する
 */
const selectSatellite = async (page: Page, satName: string): Promise<void> => {
  await page.locator(".sat_select").click();
  await page.getByRole("option", { name: satName, exact: true }).click();
  await expect.poll(() => readSelectedSatellite(page)).toBe(satName);
};

/**
 * 保存されたアクティブ衛星IDを返す
 */
const readSavedActiveSatelliteId = async (page: Page): Promise<number> => {
  return await page.evaluate(async () => {
    const api = (window as unknown as { rstApi: { getAppConfig: () => Promise<AppConfigModel> } }).rstApi;
    const config = await api.getAppConfig();
    return config.mainDisplay.activeSatelliteId;
  });
};

/**
 * 地図上の軌道の南北の広がりを、地図の高さに対する比率で返す
 * MEMO: 軌道（OrbitLine）は線の太さ 1.5 の polyline として描画される（他の図形は太さ 1 以下）。
 *       軌道が未描画の場合は -1 を返す
 */
const readOrbitHeightRatio = async (page: Page): Promise<number> => {
  return await page.evaluate(() => {
    const map = document.querySelector(".main_left_map .leaflet-container");
    if (!map) {
      return -1;
    }
    const paths = Array.from(map.querySelectorAll<SVGPathElement>('.leaflet-overlay-pane path[stroke-width="1.5"]'));
    const rects = paths
      .filter((path) => (path.getAttribute("d") ?? "") !== "" && path.getAttribute("d") !== "M0 0")
      .map((path) => path.getBoundingClientRect())
      .filter((rect) => rect.width > 0);
    if (rects.length === 0) {
      return -1;
    }
    const top = Math.min(...rects.map((rect) => rect.top));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    return (bottom - top) / map.getBoundingClientRect().height;
  });
};

test.describe("アクティブ衛星の復元", () => {
  test.describe("前回終了時のアクティブ衛星がグループ内の2つ目の場合", () => {
    test.use({
      testData: {
        appConfig: makeTestAppConfig(TEST_SATS.polar.satelliteId),
        defaultSatellites: makeTestDefaultSatellites(),
      },
    });

    test("起動後、衛星選択ボックスと地図の軌道が2つ目の衛星で一致する", async ({ page }) => {
      // 衛星選択ボックスは2つ目の衛星（極軌道）
      await expect.poll(() => readSelectedSatellite(page), { timeout: 15 * 1000 }).toBe(TEST_SATS.polar.name);

      // 地図の軌道も2つ目の衛星（極軌道：南北に大きく振れる）
      await expect.poll(() => readOrbitHeightRatio(page), { timeout: 15 * 1000 }).toBeGreaterThan(POLAR_MIN_RATIO);

      // 起動時にアクティブ衛星が書き換えられていない
      expect(await readSavedActiveSatelliteId(page)).toBe(TEST_SATS.polar.satelliteId);
      expect(await readSelectedSatellite(page)).toBe(TEST_SATS.polar.name);
    });

    test("衛星を切り替えると、地図の軌道も切り替わる", async ({ page }) => {
      await expect.poll(() => readSelectedSatellite(page), { timeout: 15 * 1000 }).toBe(TEST_SATS.polar.name);
      await expect.poll(() => readOrbitHeightRatio(page), { timeout: 15 * 1000 }).toBeGreaterThan(POLAR_MIN_RATIO);

      // 1つ目の衛星（赤道軌道）に切り替える
      await selectSatellite(page, TEST_SATS.equatorial.name);
      await expect.poll(() => readOrbitHeightRatio(page)).toBeGreaterThan(0);
      await expect.poll(() => readOrbitHeightRatio(page)).toBeLessThan(EQUATORIAL_MAX_RATIO);
      await expect.poll(() => readSavedActiveSatelliteId(page)).toBe(TEST_SATS.equatorial.satelliteId);

      // 2つ目の衛星（極軌道）に戻す
      await selectSatellite(page, TEST_SATS.polar.name);
      await expect.poll(() => readOrbitHeightRatio(page)).toBeGreaterThan(POLAR_MIN_RATIO);
      await expect.poll(() => readSavedActiveSatelliteId(page)).toBe(TEST_SATS.polar.satelliteId);
    });
  });

  test.describe("前回終了時のアクティブ衛星がグループ内の1つ目の場合", () => {
    test.use({
      testData: {
        appConfig: makeTestAppConfig(TEST_SATS.equatorial.satelliteId),
        defaultSatellites: makeTestDefaultSatellites(),
      },
    });

    test("起動後、衛星選択ボックスと地図の軌道が1つ目の衛星で一致する", async ({ page }) => {
      await expect.poll(() => readSelectedSatellite(page), { timeout: 15 * 1000 }).toBe(TEST_SATS.equatorial.name);
      await expect.poll(() => readOrbitHeightRatio(page), { timeout: 15 * 1000 }).toBeGreaterThan(0);
      await expect.poll(() => readOrbitHeightRatio(page)).toBeLessThan(EQUATORIAL_MAX_RATIO);
      expect(await readSavedActiveSatelliteId(page)).toBe(TEST_SATS.equatorial.satelliteId);
    });
  });
});
