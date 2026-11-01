import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bcd,
  createIcomContext,
  disposeIcomContext,
  runOneCycle,
  startAndClear,
  type IcomTestContext,
} from "../helpers/icomControllerTestUtil.js";

vi.mock("@/main/common/SerialComm.js", async () => ({
  default: (await import("../helpers/FakeSerialComm.js")).default,
}));
vi.mock("@/main/main.js", () => ({ fireIpcEvent: vi.fn(), getMainWindow: vi.fn() }));
vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/main/util/I18nUtil4Main.js", () => ({ default: { getMsg: vi.fn(() => "msg") } }));

describe("TransceiverIcomController.setFreq / setMode（要求値の保持と定期処理での送信）", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  /**
   * 起動直後の周期（起動時の取得結果の読み取り）を済ませ、送信履歴をクリアした状態にする
   */
  async function startAndSettle() {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await runOneCycle(ctx);
    ctx.serial().clearSent();
  }

  it("呼び出しただけではコマンドを送信せず、定期処理で周波数・モードを送信すること", async () => {
    await startAndSettle();

    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "USB-D" });
    expect(ctx.sentBodies()).toEqual([]);

    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual([
      // Rx周波数の設定
      `00${bcd(435100000)}`,
      // 運用モード（USB）とデータモード（On、フィルター01）の設定
      "0601",
      "1a060101",
    ]);
  });

  it("同一の周波数は再送しないこと", async () => {
    await startAndSettle();
    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await runOneCycle(ctx);
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies().some((body) => body.startsWith("00"))).toBe(false);
  });

  it("isForce=trueの場合は、同一の周波数でも再送すること", async () => {
    await startAndSettle();
    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await runOneCycle(ctx);
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" }, true);
    await runOneCycle(ctx);

    expect(ctx.sentBodies()[0]).toBe(`00${bcd(435100000)}`);
  });

  it.each([
    ["LSB", "0600", "1a060000"],
    ["LSB-D", "0600", "1a060101"],
    ["USB", "0601", "1a060000"],
    ["USB-D", "0601", "1a060101"],
    ["AM", "0602", "1a060000"],
    ["CW", "0603", "1a060000"],
    ["RTTY", "0604", "1a060000"],
    ["FM", "0605", "1a060000"],
    ["FM-D", "0605", "1a060101"],
    ["DV", "0617", "1a060000"],
  ])("運用モード%sを、運用モード%s・データモード%sとして送信すること", async (mode, opeCmd, dataCmd) => {
    await startAndSettle();
    // 一度別のモードを設定しておき、同一モードのスキップを避ける
    ctx.sim.main.mode = "05";
    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: mode === "LSB" ? "USB" : "LSB" });
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: mode });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual([opeCmd, dataCmd]);
  });

  it("不明な運用モードの場合は、既定値のLSB（データモードOff）として送信すること（現状の挙動）", async () => {
    await startAndSettle();
    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "USB" });
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "XXX" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual(["0600", "1a060000"]);
  });

  it("サテライトモードOffでは、Tx（アップリンク）周波数の要求は無線機へ送信されないこと（現状の挙動）", async () => {
    await startAndSettle();

    await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual([]);
  });

  it("シリアル未接続の場合は、要求を保持しないこと（接続後の定期処理でも送信されない）", async () => {
    ctx = createIcomContext();

    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "USB" });
    await startAndClear(ctx);
    await runOneCycle(ctx);

    expect(ctx.sentBodies().some((body) => body.startsWith("00") || body.startsWith("06"))).toBe(false);
  });
});
