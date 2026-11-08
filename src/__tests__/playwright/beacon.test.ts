import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import type { Page } from "playwright/test";
import { expect as baseExpect, test } from "./fixtures";
import {
  BEACON_FREQ_TEXT,
  makeTestAppConfig,
  makeTestDefaultSatellites,
  TEST_GROUP_ID,
  TEST_SATS,
} from "./helpers/beaconTestData";

/**
 * Beacon対応のE2Eテスト（Auto OFF で確認できるもの）
 * テストIDは .claude/.steering/20261107-beacon/4_e2e_test.md に対応する
 * MEMO: Auto ON は無線機の接続が必要なため、ここでは扱わない（実機での手動テストとする）
 */

// アプリ起動直後は衛星データの読み込みに時間がかかるため、待ち時間を延ばす
const expect = baseExpect.configure({ timeout: 10 * 1000 });

/** 固定モードの表示名 */
const FIXED_SAT = "衛星固定";
const FIXED_RX = "受信固定";
const FIXED_TX = "送信固定";

/** 実装中通知のメッセージ（Beacon対応前に表示していたもの） */
const UNDER_DEVELOPMENT_MSG = "この機能は実装中のため使用できません。";

/** レンダラから呼び出す preload のAPI（テストで使用するもののみ） */
type RstApiForTest = {
  getAppConfig: () => Promise<AppConfigModel>;
  storeAppConfig: (config: AppConfigModel) => Promise<void>;
  refreshAppConfig: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// 画面操作のヘルパー
// ---------------------------------------------------------------------------

/** Beaconボタン */
const beaconBtn = (page: Page) => page.getByTestId("beacon-btn");

/** 固定モードのセレクトボックス */
const dopplerShiftModeSelect = (page: Page) => page.getByTestId("doppler-shift-mode");

/**
 * 周波数表示の値を返す（例："0435.610.000"）
 */
const readFreq = async (page: Page, testId: string): Promise<string> => {
  const text = (await page.getByTestId(testId).textContent()) ?? "";
  return text.replace(/\s/g, "").replace("Hz", "");
};

/**
 * セレクトボックスの選択中の表示名を返す
 */
const readSelected = async (page: Page, testId: string): Promise<string> => {
  const text = await page.getByTestId(testId).locator(".v-select__selection-text").textContent();
  return (text ?? "").trim();
};

/**
 * セレクトボックスで選択肢を選ぶ
 */
const selectOption = async (page: Page, testId: string, optionName: string): Promise<void> => {
  await page.getByTestId(testId).click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
  await expect.poll(() => readSelected(page, testId)).toBe(optionName);
};

/**
 * メイン画面で衛星を切り替える
 */
const selectSatellite = async (page: Page, satName: string): Promise<void> => {
  await page.locator(".sat_select").click();
  await page.getByRole("option", { name: satName, exact: true }).click();
};

/**
 * サテライトモードのボタンを1回押す（未設定 → SATELLITE → SPLIT → 未設定 の順に切り替わる）
 */
const clickSatelliteModeBtn = async (page: Page): Promise<void> => {
  await page.getByTestId("satellite-mode-btn").click();
};

/**
 * Beaconボタンを押し、ON/OFFの切替が終わるまで待つ
 */
const clickBeacon = async (page: Page, expectOn: boolean): Promise<void> => {
  await beaconBtn(page).click();
  await expect(beaconBtn(page)).toHaveClass(expectOn ? /mode_btn_on/ : /mode_btn_off/);
};

/**
 * 衛星Bを表示し、サテライトモードをONにした状態にする（Auto OFF）
 * Rx運用モードは USB にしておく
 */
const prepareBeaconSatellite = async (page: Page): Promise<void> => {
  // 衛星Bの無線設定が読み込まれ、サテライトモードONでBeaconボタンが活性になるまで待つ
  await expect(beaconBtn(page)).toBeVisible();
  await clickSatelliteModeBtn(page);
  await expect(beaconBtn(page)).toBeEnabled();

  await selectOption(page, "rx-ope-mode", "USB");
};

/**
 * 衛星設定を変更して保存したことを再現する（設定を保存し、アクティブ衛星の更新を通知する）
 * MEMO: 衛星設定画面の操作は既存のE2Eの対象のため、ここでは保存後の通知以降の動作を確認する
 */
const updateBeaconSatelliteSetting = async (
  page: Page,
  change: { beaconHz?: number; outline?: string }
): Promise<void> => {
  await page.evaluate(
    async ({ satelliteId, groupId, change }) => {
      const api = (window as unknown as { rstApi: RstApiForTest }).rstApi;
      const config = await api.getAppConfig();
      const sat = config.satellites.find((s) => s.satelliteId === satelliteId && s.groupId === groupId);
      if (!sat) {
        throw new Error("テスト用の衛星が見つかりません");
      }
      if (change.beaconHz !== undefined) {
        sat.beacon.beaconHz = change.beaconHz;
      }
      if (change.outline !== undefined) {
        sat.outline = change.outline;
      }
      await api.storeAppConfig(config);
      await api.refreshAppConfig();
    },
    { satelliteId: TEST_SATS.beacon.satelliteId, groupId: TEST_GROUP_ID, change }
  );
};

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

test.describe("Beacon（Auto OFF）", () => {
  // アプリ起動と衛星データの読み込みに時間がかかるため、タイムアウトを延ばす
  test.describe.configure({ timeout: 60 * 1000 });
  test.use({
    testData: { appConfig: makeTestAppConfig(), defaultSatellites: makeTestDefaultSatellites() },
  });

  test("A-01/A-03/A-04：サテライトモードONの場合のみBeaconボタンが活性になる", async ({ page }) => {
    // 起動直後はサテライトモードが未設定のため非活性（A-03）
    await expect(beaconBtn(page)).toBeVisible();
    await expect(beaconBtn(page)).toBeDisabled();

    // サテライトモードをONにすると活性（A-04、A-01）
    await clickSatelliteModeBtn(page);
    await expect(beaconBtn(page)).toBeEnabled();

    // SPLITにすると非活性（A-03）
    await clickSatelliteModeBtn(page);
    await expect(beaconBtn(page)).toBeDisabled();

    // テストデータで起動した際に、ファイル不足による起動時のエラー通知が出ていないこと
    await expect(page.getByText(/ENOENT/)).toHaveCount(0);
  });

  test("A-02/A-05：ビーコン周波数がない衛星ではBeaconボタンが非活性になる", async ({ page }) => {
    await prepareBeaconSatellite(page);

    await selectSatellite(page, TEST_SATS.noBeacon.name);
    await expect(beaconBtn(page)).toBeDisabled();

    // ビーコンありの衛星に戻すと活性
    await selectSatellite(page, TEST_SATS.beacon.name);
    await expect(beaconBtn(page)).toBeEnabled();
  });

  test("A-06/B-01/B-04：Beacon ONでRxがビーコンに切り替わり、OFFで元に戻る", async ({ page }) => {
    await prepareBeaconSatellite(page);
    const rxBefore = await readFreq(page, "rx-frequency");
    const txBefore = await readFreq(page, "tx-frequency");
    const txModeBefore = await readSelected(page, "tx-ope-mode");

    // Beacon ON（B-01）
    await clickBeacon(page, true);
    expect(await readFreq(page, "rx-frequency")).toBe(BEACON_FREQ_TEXT);
    expect(await readSelected(page, "rx-ope-mode")).toBe("CW");
    // Txは変わらない
    expect(await readFreq(page, "tx-frequency")).toBe(txBefore);
    expect(await readSelected(page, "tx-ope-mode")).toBe(txModeBefore);
    // 実装中通知は表示されない（A-06）
    await expect(page.getByText(UNDER_DEVELOPMENT_MSG)).toHaveCount(0);

    // Beacon OFF（B-04）
    await clickBeacon(page, false);
    expect(await readFreq(page, "rx-frequency")).toBe(rxBefore);
    expect(await readSelected(page, "rx-ope-mode")).toBe("USB");
  });

  for (const fixedMode of [FIXED_SAT, FIXED_RX, FIXED_TX]) {
    test(`B-02/B-03/B-05/B-06：${fixedMode}の場合、Beacon中は衛星固定で選択不可になり、OFFで${fixedMode}に戻る`, async ({
      page,
    }) => {
      await prepareBeaconSatellite(page);
      await selectOption(page, "doppler-shift-mode", fixedMode);

      // Beacon ON：衛星固定になり、選択不可
      await clickBeacon(page, true);
      expect(await readSelected(page, "doppler-shift-mode")).toBe(FIXED_SAT);
      await expect(dopplerShiftModeSelect(page)).toHaveClass(/v-input--disabled/);

      // Beacon OFF：元の固定モードに戻り、選択可能
      await clickBeacon(page, false);
      expect(await readSelected(page, "doppler-shift-mode")).toBe(fixedMode);
      await expect(dopplerShiftModeSelect(page)).not.toHaveClass(/v-input--disabled/);
    });
  }

  test("B-07/B-08：Beacon中のRxの変更はOFFで破棄され、Rx補正値はビーコンに加わらない", async ({ page }) => {
    await prepareBeaconSatellite(page);
    const rxBefore = await readFreq(page, "rx-frequency");

    // Rx補正値を 0 以外にしてから Beacon ON（B-08）
    await page.getByTestId("rx-frequency-adjustment").locator("span").nth(3).click();
    const adjustment = (await page.getByTestId("rx-frequency-adjustment").textContent())?.replace(/\s/g, "");
    expect(adjustment).not.toBe("+000.000Hz");
    await clickBeacon(page, true);
    expect(await readFreq(page, "rx-frequency")).toBe(BEACON_FREQ_TEXT);

    // Beacon中に画面でRxを変更する（kHzの1の位を+1）（B-07）
    await page.getByTestId("rx-frequency").locator("span").nth(7).click();
    expect(await readFreq(page, "rx-frequency")).not.toBe(BEACON_FREQ_TEXT);

    // Beacon OFF：Beacon ON 前のRxに戻る
    await clickBeacon(page, false);
    expect(await readFreq(page, "rx-frequency")).toBe(rxBefore);
  });

  test("B-09：Beaconボタンを素早く2回押しても、画面の状態が食い違わない", async ({ page }) => {
    await prepareBeaconSatellite(page);
    const rxBefore = await readFreq(page, "rx-frequency");

    // MEMO: Auto OFF では切替が一瞬で終わるため、2回目のクリックも受け付けられ、ON→OFF と切り替わる
    //       （処理中のクリックが無視されるのは、切替に時間がかかる Auto ON の場合。実機で確認する）
    await beaconBtn(page).dblclick();
    await expect(beaconBtn(page)).not.toHaveClass(/v-btn--loading/);

    // ON/OFFのどちらで止まっても、ボタンの表示と周波数・固定モードの状態が一致していること
    const isOn = /mode_btn_on/.test((await beaconBtn(page).getAttribute("class")) ?? "");
    if (isOn) {
      expect(await readFreq(page, "rx-frequency")).toBe(BEACON_FREQ_TEXT);
      await expect(dopplerShiftModeSelect(page)).toHaveClass(/v-input--disabled/);
    } else {
      expect(await readFreq(page, "rx-frequency")).toBe(rxBefore);
      await expect(dopplerShiftModeSelect(page)).not.toHaveClass(/v-input--disabled/);
    }
  });

  test("E-01：Beacon中に衛星を切り替えるとBeaconがOFFになり、固定モードが戻る", async ({ page }) => {
    await prepareBeaconSatellite(page);
    await selectOption(page, "doppler-shift-mode", FIXED_RX);
    await clickBeacon(page, true);

    await selectSatellite(page, TEST_SATS.noBeacon.name);

    await expect(beaconBtn(page)).toHaveClass(/mode_btn_off/);
    await expect(beaconBtn(page)).toBeDisabled();
    await expect.poll(() => readSelected(page, "doppler-shift-mode")).toBe(FIXED_RX);
    await expect(dopplerShiftModeSelect(page)).not.toHaveClass(/v-input--disabled/);
  });

  test("E-02：Beacon中にビーコン周波数を変更して保存するとBeaconがOFFになる", async ({ page }) => {
    await prepareBeaconSatellite(page);
    const rxBefore = await readFreq(page, "rx-frequency");
    await selectOption(page, "doppler-shift-mode", FIXED_TX);
    await clickBeacon(page, true);

    await updateBeaconSatelliteSetting(page, { beaconHz: 435611000 });

    await expect(beaconBtn(page)).toHaveClass(/mode_btn_off/);
    await expect.poll(() => readFreq(page, "rx-frequency")).toBe(rxBefore);
    expect(await readSelected(page, "rx-ope-mode")).toBe("USB");
    expect(await readSelected(page, "doppler-shift-mode")).toBe(FIXED_TX);

    // 再度ONにすると、変更後のビーコン周波数になる
    await clickBeacon(page, true);
    expect(await readFreq(page, "rx-frequency")).toBe("0435.611.000");
  });

  test("E-03：Beacon中に概要だけを変更して保存しても、Beaconは継続する", async ({ page }) => {
    await prepareBeaconSatellite(page);
    await clickBeacon(page, true);

    await updateBeaconSatelliteSetting(page, { outline: "E2E outline" });

    // 変更通知の処理を待ってから確認する
    await page.waitForTimeout(1000);
    await expect(beaconBtn(page)).toHaveClass(/mode_btn_on/);
    expect(await readFreq(page, "rx-frequency")).toBe(BEACON_FREQ_TEXT);
    expect(await readSelected(page, "rx-ope-mode")).toBe("CW");
  });

  test("E-05/E-06：Beacon中にサテライトモードを切り替えると、BeaconをOFFにしてから切り替わる", async ({ page }) => {
    await prepareBeaconSatellite(page);
    await selectOption(page, "doppler-shift-mode", FIXED_RX);
    await clickBeacon(page, true);

    // SATELLITE → SPLIT（E-05）
    await clickSatelliteModeBtn(page);
    await expect(beaconBtn(page)).toHaveClass(/mode_btn_off/);
    await expect(beaconBtn(page)).toBeDisabled();
    expect(await readSelected(page, "doppler-shift-mode")).toBe(FIXED_RX);

    // SPLIT → 未設定 → SATELLITE（E-06）：ビーコンの値は残らない
    await clickSatelliteModeBtn(page);
    await clickSatelliteModeBtn(page);
    await expect(beaconBtn(page)).toBeEnabled();
    expect(await readFreq(page, "rx-frequency")).not.toBe(BEACON_FREQ_TEXT);
    expect(await readSelected(page, "rx-ope-mode")).not.toBe("CW");
  });
});
