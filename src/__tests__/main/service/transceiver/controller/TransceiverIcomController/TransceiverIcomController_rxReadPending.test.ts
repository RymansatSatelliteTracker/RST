import Constant from "@/common/Constant.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bcd,
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

describe("TransceiverIcomController Rx読み取り待ち（サブバンド（Tx）操作後のRx再取得）", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  /**
   * サテライトモードOnで開始し、無線機側でサブバンド（Tx）のダイヤル操作が行われた状態にする
   */
  async function startAndOperateSub() {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    await runOneCycle(ctx);

    ctx.sim.isMain = false;
    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(145950000));
    await settle();
    ctx.serial().clearSent();
    ctx.freqCb.mockClear();
    ctx.waitCb.mockClear();
  }

  it("読み取り待ちの間は、RSTからのRx周波数要求を破棄すること", async () => {
    await startAndOperateSub();

    await ctx.controller.setFreq({ downlinkHz: 435120000, downlinkMode: "" });
    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS);
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).not.toContain(`00${bcd(435120000)}`);
  });

  it("待機の解除後の周期で、ドップラーシフトの待機を通知してからRxを読み取り、ダウンリンクとして通知すること", async () => {
    await startAndOperateSub();

    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS);
    await settle();
    ctx.freqCb.mockClear();
    ctx.waitCb.mockClear();
    await runOneCycle(ctx);

    expect(ctx.waitCb.mock.calls.map(([res]) => res.data)).toContain(true);
    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toContainEqual({
      downlinkHz: 435000000,
      downlinkMode: "",
    });
  });

  it("Rxを読み取った後は読み取り待ちが解除され、RSTからのRx周波数要求が送信されること", async () => {
    await startAndOperateSub();
    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS);
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setFreq({ downlinkHz: 435120000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toContain(`00${bcd(435120000)}`);
  });

  it("Rxの読み取りに失敗し続けた場合、3回で読み取り待ちを解除し、RSTからの要求を受け付けること", async () => {
    await startAndOperateSub();
    // メインバンドへの切り替えに応答しない（Rxを読み取れない）
    ctx.sim.override = (body) => (body[0] === 0x07 && body[1] === 0xd0 ? [] : undefined);
    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS);
    await settle();

    // 読み取り失敗の各周期（失敗のたびに待機を通知して再試行する）
    for (let i = 0; i < 3; i++) {
      await runOneCycle(ctx);
      await vi.advanceTimersByTimeAsync(500);
    }

    // 読み取り待ちの解除後は、RSTからの要求を受け付ける
    ctx.sim.override = null;
    ctx.serial().clearSent();
    await ctx.controller.setFreq({ downlinkHz: 435120000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toContain(`00${bcd(435120000)}`);
  });
});
