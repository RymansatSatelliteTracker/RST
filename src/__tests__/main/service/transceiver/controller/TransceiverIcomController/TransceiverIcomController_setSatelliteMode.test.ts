import { fireIpcEvent } from "@/main/main.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createIcomContext,
  disposeIcomContext,
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

describe("TransceiverIcomController.setSatelliteMode", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
    vi.mocked(fireIpcEvent).mockClear();
  });

  it("Onにすると、サテライトモードOnのコマンドを送信し、サブ・メインの周波数・モードを取得してメインに戻ること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    const res = await ctx.controller.setSatelliteMode(true);

    expect(res).toBe(true);
    expect(ctx.sim.isSatelliteMode).toBe(true);
    expect(ctx.sentBodies()).toEqual([
      "165a01",
      // 周波数の取得（getFreqFromIcom）：サブ→メイン
      "07d1",
      "03",
      "07d0",
      "03",
      // 周波数・モードの取得（getModeFromIcom）：サブ→メイン
      "07d1",
      "03",
      "04",
      "07d2",
      "1a06",
      "1a06",
      "07d0",
      "03",
      "04",
      "07d2",
      "1a06",
      "1a06",
    ]);
    // 最後はメインバンドが選択されている
    expect(ctx.sim.isMain).toBe(true);
  });

  it("Offにすると、サテライトモードOffのコマンドを送信し、メインの周波数・モードを取得すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    ctx.serial().clearSent();

    const res = await ctx.controller.setSatelliteMode(false);

    expect(res).toBe(true);
    expect(ctx.sim.isSatelliteMode).toBe(false);
    expect(ctx.sentBodies()).toEqual(["165a00", "03", "03", "04", "07d2", "1a06", "1a06"]);
  });

  it("同じ値が既に設定されている場合は、何も送信せずtrueを返すこと", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    ctx.serial().clearSent();

    const res = await ctx.controller.setSatelliteMode(true);

    expect(res).toBe(true);
    expect(ctx.sentBodies()).toEqual([]);
  });

  it("シリアル未接続の場合は、falseを返し、未接続メッセージを通知すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    ctx.serial().simulateDisconnect();
    vi.mocked(fireIpcEvent).mockClear();

    const res = await ctx.controller.setSatelliteMode(true);

    expect(res).toBe(false);
    expect(vi.mocked(fireIpcEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fireIpcEvent).mock.calls[0][0]).toBe("onNoticeMessage");
  });
});
