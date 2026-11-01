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

describe("TransceiverIcomController 無線機起点のデータ受信（トランシーブ）の処理", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  /**
   * サテライトモードOnで開始し、起動直後の取得を済ませる
   */
  async function startSatelliteMode() {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    await runOneCycle(ctx);
    ctx.serial().clearSent();
    ctx.freqCb.mockClear();
    ctx.modeCb.mockClear();
    ctx.waitCb.mockClear();
  }

  it("サテライトモードOff：周波数データを、現在のバンドを問い合わせた上でアップリンクとして通知し、ドップラーシフトの待機を通知すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(435200000));
    await settle();

    expect(ctx.sentBodies()).toEqual(["07d2", "07d2"]);
    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([{ uplinkHz: 435200000, uplinkMode: "" }]);
    expect(ctx.waitCb.mock.calls.map(([res]) => res.data)).toEqual([true]);
  });

  it("サテライトモードOn：メインバンドの周波数データはダウンリンクとして通知すること", async () => {
    await startSatelliteMode();

    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(435200000));
    await settle();

    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([{ downlinkHz: 435200000, downlinkMode: "" }]);
    expect(ctx.waitCb.mock.calls.map(([res]) => res.data)).toEqual([true]);
  });

  it("サテライトモードOn：サブバンドの周波数データはアップリンクとして通知すること", async () => {
    await startSatelliteMode();
    // 無線機側でサブバンドが選択されている
    ctx.sim.isMain = false;

    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(145950000));
    await settle();

    expect(ctx.freqCb.mock.calls.map(([res]) => res.data)).toEqual([{ uplinkHz: 145950000, uplinkMode: "" }]);
  });

  it("サテライトモードOff：運用モードデータを、データモードを取得した上でアップリンクとして通知すること", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    await ctx.serial().emitRecv(ctx.sim.transceiveModeFrame("01"));
    await settle();

    expect(ctx.sentBodies()).toEqual(["07d2", "07d2", "1a06"]);
    expect(ctx.modeCb.mock.calls.map(([res]) => res.data)).toEqual([
      { uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB },
    ]);
    expect(ctx.waitCb.mock.calls.map(([res]) => res.data)).toEqual([false]);
  });

  it("サテライトモードOn：現在の運用モードと同一の運用モードデータは通知しないこと", async () => {
    await startSatelliteMode();

    // 現在のRx運用モードはFM（05）
    await ctx.serial().emitRecv(ctx.sim.transceiveModeFrame("05"));
    await settle();

    expect(ctx.modeCb).not.toHaveBeenCalled();
  });

  it("サテライトモードOn：異なる運用モードデータは、メインならダウンリンクとして通知すること", async () => {
    await startSatelliteMode();

    await ctx.serial().emitRecv(ctx.sim.transceiveModeFrame("01"));
    await settle();

    expect(ctx.modeCb.mock.calls.map(([res]) => res.data)).toEqual([
      { downlinkHz: null, downlinkMode: Constant.Transceiver.OpeMode.USB },
    ]);
  });

  it("RSTからの運用モードの更新要求がある場合は、無線機からの運用モードデータを反映しないこと", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await runOneCycle(ctx);
    ctx.modeCb.mockClear();

    await ctx.controller.setMode({ downlinkHz: null, downlinkMode: "LSB" });
    await ctx.serial().emitRecv(ctx.sim.transceiveModeFrame("01"));
    await settle();

    expect(ctx.modeCb).not.toHaveBeenCalled();
  });
});

describe("TransceiverIcomController 無線機側操作後の送信一時停止", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  /**
   * 開始後、起動直後の取得を済ませる
   */
  async function startAndSettle() {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await runOneCycle(ctx);
    ctx.serial().clearSent();
  }

  it("周波数データの受信後、TRANSCEIVE_WAIT_MSの間は定期処理で送信せず、経過後に再開すること", async () => {
    await startAndSettle();
    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(435200000));
    await settle();
    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    ctx.serial().clearSent();

    // 待機中（TRANSCEIVE_WAIT_MS未満）
    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS - 100);
    await settle();
    expect(ctx.sentBodies()).toEqual([]);

    // 待機の解除後
    await runOneCycle(ctx);
    await runOneCycle(ctx);
    expect(ctx.sentBodies()).toContain(`00${bcd(435100000)}`);
  });

  it("運用モードデータの受信後は、TRANSCEIVE_MODE_WAIT_MSの間、送信を一時停止すること", async () => {
    await startAndSettle();
    await ctx.serial().emitRecv(ctx.sim.transceiveModeFrame("01"));
    await settle();
    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    ctx.serial().clearSent();

    // 周波数の待機時間（TRANSCEIVE_WAIT_MS）を過ぎても、運用モードの待機時間内は送信しない
    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_MODE_WAIT_MS - 100);
    await settle();
    expect(ctx.sentBodies()).toEqual([]);

    await runOneCycle(ctx);
    await runOneCycle(ctx);
    expect(ctx.sentBodies()).toContain(`00${bcd(435100000)}`);
  });

  it("待機中に再度周波数データを受信した場合、待機時間が延長されること", async () => {
    await startAndSettle();
    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(435200000));
    await settle();
    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });

    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS - 500);
    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(435210000));
    await settle();
    ctx.serial().clearSent();

    // 最初の受信からはTRANSCEIVE_WAIT_MSを過ぎているが、再受信から数えると待機中
    await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS - 500);
    await settle();
    expect(ctx.sentBodies()).toEqual([]);
  });

  it("取得応答（03）を受信した場合は、待機中でも一時停止を解除すること", async () => {
    await startAndSettle();
    await ctx.serial().emitRecv(ctx.sim.transceiveFreqFrame(435200000));
    await settle();
    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });

    // 無線機起点でない周波数の取得応答（03）を受信
    await ctx.serial().emitRecv(ctx.sim.frame(`03${bcd(435200000)}`));
    await settle();
    ctx.serial().clearSent();

    await runOneCycle(ctx);

    expect(ctx.sentBodies()).toContain(`00${bcd(435100000)}`);
  });
});
