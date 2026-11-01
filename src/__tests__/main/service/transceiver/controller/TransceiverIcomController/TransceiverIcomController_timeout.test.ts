import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createIcomContext,
  disposeIcomContext,
  runOneCycle,
  settle,
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

describe("TransceiverIcomController タイムアウト・リトライ", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  it("応答のあるコマンドが無応答の場合、100ms後にタイムアウトとして後続の処理を継続すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    ctx.sim.muted = true;

    // 起動直後の周期：周波数の取得（無応答）
    await vi.advanceTimersByTimeAsync(ctx.intervalMs);
    expect(ctx.sentBodies()).toEqual(["03"]);

    // 100ms後にタイムアウトし、運用モードの取得に進む
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.sentBodies()).toEqual(["03", "04"]);
  });

  it("運用モード・データモードの設定が無応答の場合、それぞれ最大3回送信すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await runOneCycle(ctx);
    ctx.serial().clearSent();
    ctx.sim.muted = true;

    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "USB" });
    await runOneCycle(ctx);
    await vi.advanceTimersByTimeAsync(700);

    expect(ctx.sentBodies()).toEqual(["0601", "0601", "0601", "1a060000", "1a060000", "1a060000"]);
  });

  it("起動から2秒間、一度も受信がない場合は、2秒経過後の最初のコマンド送信時に、シリアルを切断し、周波数・運用モードのコールバックに失敗を通知すること", async () => {
    ctx = createIcomContext();
    ctx.sim.muted = true;
    const startPromise = ctx.controller.start();
    await vi.advanceTimersByTimeAsync(2500);
    const res = await startPromise;
    // 起動処理自体は（各コマンドのタイムアウトを経て）完了する
    expect(res.status).toBe(true);
    expect(ctx.freqCb).not.toHaveBeenCalled();

    // 2秒経過後、要求の送信時にタイムアウトが判定される
    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.serial().isOpen()).toBe(false);
    expect(ctx.freqCb).toHaveBeenCalled();
    expect(ctx.freqCb.mock.calls[0][0].status).toBe(false);
    expect(ctx.modeCb).toHaveBeenCalled();
    expect(ctx.modeCb.mock.calls[0][0].status).toBe(false);
    // タイムアウトの判定は送信前に行われるため、周波数の設定コマンドは送信されない
    expect(ctx.sentBodies().some((body) => body.startsWith("00"))).toBe(false);
  });

  it("起動から2秒間、一度も受信がなくても、RSTからの要求がなければタイムアウトは通知されないこと（現状の挙動）", async () => {
    ctx = createIcomContext();
    ctx.sim.muted = true;
    const startPromise = ctx.controller.start();
    await vi.advanceTimersByTimeAsync(2500);
    await startPromise;

    await vi.advanceTimersByTimeAsync(5000);
    await settle();

    expect(ctx.freqCb).not.toHaveBeenCalled();
    expect(ctx.serial().isOpen()).toBe(true);
  });
});
