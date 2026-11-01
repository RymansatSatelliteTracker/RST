import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createIcomContext,
  disposeIcomContext,
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

describe("TransceiverIcomController 受信処理（onRecv / dispatchRecvData）", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  it("フレームが分割して受信された場合、終端（FD）まで蓄積してから処理すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    const frame = ctx.sim.transceiveFreqFrame(435300000);

    await ctx.serial().emitRecv(frame.slice(0, 10));
    await settle();
    expect(ctx.freqCb).not.toHaveBeenCalled();

    await ctx.serial().emitRecv(frame.slice(10));
    await settle();
    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([{ uplinkHz: 435300000, uplinkMode: "" }]);
  });

  it("先頭に付いている'00'を読み捨てて処理すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    await ctx.serial().emitRecv("00" + ctx.sim.transceiveFreqFrame(435400000));
    await settle();

    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([{ uplinkHz: 435400000, uplinkMode: "" }]);
  });

  it("他のCI-Vアドレスの無線機からのデータは無視すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    // IC-9100（7C）からの周波数データ
    await ctx.serial().emitRecv("fefe007c000000503504fd");
    await settle();

    expect(ctx.freqCb).not.toHaveBeenCalled();
    expect(ctx.waitCb).not.toHaveBeenCalled();
    expect(ctx.sentBodies()).toEqual([]);
  });

  it("1回の受信に複数のフレームが含まれる場合、それぞれを処理すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(435500000) + ctx.sim.transceiveModeFrame("01"));
    await settle();

    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([{ uplinkHz: 435500000, uplinkMode: "" }]);
    expect(ctx.modeCb.mock.calls.map(([res]) => res.data)).toEqual([{ uplinkHz: null, uplinkMode: "USB" }]);
  });

  it("応答待ちのGET系コマンドに対して、種別の異なる応答（運用モード）は無視し、目的の応答（周波数）を待つこと", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    // 周波数取得に対して、運用モード（USB）の応答を先に返し、その後に周波数を返す
    ctx.sim.override = (body) =>
      body[0] === 0x03 ? [ctx.sim.frame("040101"), ctx.sim.frame(`03${"0000203504"}`)] : undefined;

    // 起動直後の周期で周波数を取得する
    await vi.advanceTimersByTimeAsync(ctx.intervalMs);
    await settle();

    // 運用モードの応答を周波数の応答として扱っていれば、周波数は解析できない値となる
    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toContainEqual({ uplinkHz: 435200000, uplinkMode: "" });
  });

  it("設定コマンドに対するNG応答（FA）も応答として受け付け、処理を継続すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    // サテライトモードの設定にNGを返す
    ctx.sim.override = (body) => (body[0] === 0x16 && body[1] === 0x5a ? [ctx.sim.ng()] : undefined);

    const res = await ctx.controller.setSatelliteMode(true);

    // 応答待ちはタイムアウトせず、後続の取得処理が行われる
    expect(res).toBe(true);
    expect(ctx.sentBodies()[0]).toBe("165a01");
    expect(ctx.sentBodies().length).toBeGreaterThan(1);
  });
});
