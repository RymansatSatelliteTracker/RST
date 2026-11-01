import { fireIpcEvent } from "@/main/main.js";
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

describe("TransceiverIcomController 定期処理（メイン／サブ制御）", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
    vi.mocked(fireIpcEvent).mockClear();
  });

  it("サテライトモードOff：起動直後の周期で、メインの周波数・モードを取得し、アップリンクとして通知すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual(["03", "07d2", "04", "07d2", "1a06", "1a06"]);
    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([{ uplinkHz: 435000000, uplinkMode: "" }]);
  });

  it("サテライトモードOff：更新がない周期では、コマンドを送信しないこと", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await runOneCycle(ctx);
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual([]);
  });

  it("サテライトモードOn：サブ（Tx）→メイン（Rx）の順に処理し、サブはアップリンク、メインはダウンリンクとして通知すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    ctx.serial().clearSent();
    ctx.freqCb.mockClear();

    await runOneCycle(ctx);

    const bodies = ctx.sentBodies();
    // サブへ切り替えてから処理し、最後にメインへ戻して処理する
    expect(bodies[0]).toBe("07d1");
    expect(bodies.indexOf("07d0")).toBeGreaterThan(0);
    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([
      { uplinkHz: 145900000, uplinkMode: "" },
      { downlinkHz: 435000000, downlinkMode: "" },
    ]);
  });

  it("サテライトモードOn：Rx・Txの周波数要求を、サブ（Tx）→メイン（Rx）の順で送信すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await ctx.controller.setFreq({ uplinkHz: 145910000, uplinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual([
      "07d1",
      `00${bcd(145910000)}`,
      // 運用モードの更新要求がないため、運用モード・データモードを取得する
      "04",
      "07d2",
      "1a06",
      "1a06",
      "07d0",
      `00${bcd(435100000)}`,
      "04",
      "07d2",
      "1a06",
      "1a06",
    ]);
    expect(ctx.sim.sub.freqHz).toBe(145910000);
    expect(ctx.sim.main.freqHz).toBe(435100000);
  });

  it("サテライトモードOn：Rx・Txの運用モード要求を、サブ（Tx）→メイン（Rx）の順で送信すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    await runOneCycle(ctx);
    await ctx.controller.setMode({ uplinkHz: null, uplinkMode: "USB" });
    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "LSB-D" });
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setMode({ uplinkHz: null, uplinkMode: "FM" });
    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "FM-D" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toEqual(["07d1", "0605", "1a060000", "07d0", "0605", "1a060101"]);
  });

  it("前回の処理が終わっていない場合は、その周期の処理をスキップすること", async () => {
    // 処理に時間がかかるよう、無応答（1コマンドあたり100msのタイムアウト）にし、制御間隔を200msにする
    ctx = createIcomContext({ intervalSec: "0.2" });
    await startAndClear(ctx);
    ctx.sim.muted = true;
    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "USB" });

    // 1周期目（200ms時点）で開始した処理は、周波数取得（100ms）＋運用モード設定（100ms×3回）＋データモード設定（100ms×3回）で
    // 700ms（900ms時点まで）かかる。次の周期（1000ms）の直前まで進める
    await vi.advanceTimersByTimeAsync(950);

    // 処理中の周期（400ms, 600ms, 800ms）はスキップされるため、1周期分のコマンドのみが送信されている
    expect(ctx.sentBodies()).toEqual(["03", "0601", "0601", "0601", "1a060000", "1a060000", "1a060000"]);
  });

  it("シリアルが切断された場合、未接続メッセージを通知し、定期処理を停止すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    vi.mocked(fireIpcEvent).mockClear();

    ctx.serial().simulateDisconnect();
    await runOneCycle(ctx);
    await runOneCycle(ctx);
    await runOneCycle(ctx);

    // 通知は1回のみ（定期処理が停止しているため）
    expect(vi.mocked(fireIpcEvent)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fireIpcEvent).mock.calls[0][0]).toBe("onNoticeMessage");
    expect(ctx.sentBodies()).toEqual([]);
  });
});
