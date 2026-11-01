import Constant from "@/common/Constant.js";
import { fireIpcEvent } from "@/main/main.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import FakeSerialComm from "../helpers/FakeSerialComm.js";
import { createIcomContext, disposeIcomContext, type IcomTestContext } from "../helpers/icomControllerTestUtil.js";

vi.mock("@/main/common/SerialComm.js", async () => ({
  default: (await import("../helpers/FakeSerialComm.js")).default,
}));
vi.mock("@/main/main.js", () => ({ fireIpcEvent: vi.fn(), getMainWindow: vi.fn() }));
vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/main/util/I18nUtil4Main.js", () => ({ default: { getMsg: vi.fn(() => "msg") } }));

describe("TransceiverIcomController.start / stop / isReady", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
    vi.mocked(fireIpcEvent).mockClear();
  });

  it("SerialCommがフェイクに差し替わっていること（vi.mockがエイリアスのモジュールに効くこと）", async () => {
    ctx = createIcomContext();
    await ctx.controller.start();

    expect(FakeSerialComm.instances).toHaveLength(1);
    expect(ctx.serial().comName).toBe("COM1");
    expect(ctx.serial().baudRate).toBe(19200);
  });

  it("起動時に初期化コマンドを、VFO-A切替→トランシーブOn→周波数・モードの取得の順で送信すること", async () => {
    ctx = createIcomContext();
    await ctx.controller.start();

    expect(ctx.sentBodies()).toEqual([
      // VFO-Aに切り替え
      "0700",
      // トランシーブOn
      "1a05012701",
      // 周波数の取得（getFreqFromIcom）
      "03",
      // 周波数・運用モードの取得（getModeFromIcom）
      "03",
      "04",
      // 運用モードの受信処理内で、現在のバンドとデータモードを取得（fetchCurrentDataMode）
      "07d2",
      "1a06",
      // データモードの取得（getModeFromIcom）
      "1a06",
    ]);
  });

  it("起動時にサテライトモードOffのコマンドは送信されないこと（状態の初期値がOffのためスキップされる現状の挙動）", async () => {
    ctx = createIcomContext();
    await ctx.controller.start();

    expect(ctx.sentBodies().some((body) => body.startsWith("165a"))).toBe(false);
  });

  it("起動時に取得した運用モードを、サテライトモードOffのためアップリンクとして通知すること", async () => {
    ctx = createIcomContext();
    ctx.sim.main.mode = "01"; // USB
    await ctx.controller.start();

    const modes = ctx.modeCb.mock.calls.map(([res]) => res.data);
    expect(modes.length).toBeGreaterThan(0);
    expect(modes.every((d) => d !== null && "uplinkMode" in d)).toBe(true);
    expect(modes[modes.length - 1]).toEqual({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
  });

  it("startはApiResponse(true)を返すこと", async () => {
    ctx = createIcomContext();
    const res = await ctx.controller.start();

    expect(res.status).toBe(true);
  });

  it("isReady：シリアルがオープンしている間はtrue、停止後はfalseを返すこと", async () => {
    ctx = createIcomContext();
    expect(ctx.controller.isReady()).toBe(false);

    await ctx.controller.start();
    expect(ctx.controller.isReady()).toBe(true);

    await ctx.controller.stop();
    expect(ctx.controller.isReady()).toBe(false);
  });

  it("stop：シリアルをクローズし、定期処理を停止すること（以降はコマンドを送信しない）", async () => {
    ctx = createIcomContext();
    await ctx.controller.start();
    const serial = ctx.serial();

    await ctx.controller.stop();
    serial.clearSent();
    await vi.advanceTimersByTimeAsync(ctx.intervalMs * 3);

    expect(serial.isOpen()).toBe(false);
    expect(serial.sent).toHaveLength(0);
  });

  it("stop：コールバックを解除すること（以降の受信データは通知されない）", async () => {
    ctx = createIcomContext();
    await ctx.controller.start();
    const serial = ctx.serial();
    ctx.freqCb.mockClear();

    await ctx.controller.stop();
    await serial.emitRecv(ctx.sim.transceiveFreqFrame(435100000));

    expect(ctx.freqCb).not.toHaveBeenCalled();
  });
});
