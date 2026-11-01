import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bcd,
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

describe("TransceiverIcomController.initAutoOn / autoOff", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  /**
   * サテライトモードOnで開始し、送信履歴をクリアする
   */
  async function startSatelliteMode() {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    ctx.serial().clearSent();
  }

  it("サテライトモードOff：Rxの周波数・運用モード・データモードのみを設定し、トーンは設定しないこと（現状の挙動）", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);

    await ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", 67);

    expect(ctx.sentBodies()).toEqual([`00${bcd(435100000)}`, "0605", "1a060000"]);
  });

  it("サテライトモードOn：メイン（Rx）→サブ（Tx）の順に周波数・運用モード・データモードを設定し、FM-Dのトーンを設定すること", async () => {
    await startSatelliteMode();

    await ctx.controller.initAutoOn(145900000, 435100000, "FM-D", "USB", 88.5);

    expect(ctx.sentBodies()).toEqual([
      // メイン（Rx）：setSatelliteModeの後でメインが選択済みのため、切り替えは送信されない
      `00${bcd(435100000)}`,
      "0601",
      "1a060000",
      // サブ（Tx）
      "07d1",
      `00${bcd(145900000)}`,
      "0605",
      "1a060101",
      // トーンOn、トーン周波数88.5Hz
      "164201",
      "1b00000885",
    ]);
    expect(ctx.sim.main.freqHz).toBe(435100000);
    expect(ctx.sim.sub.freqHz).toBe(145900000);
    expect(ctx.sim.isToneOn).toBe(true);
  });

  it("サテライトモードOn：処理後はサブバンドが選択されたままとなり、次回はメインへの切り替えから始まること（現状の挙動）", async () => {
    await startSatelliteMode();
    await ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", 67);
    ctx.serial().clearSent();

    await ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", 67);

    expect(ctx.sim.isMain).toBe(false);
    expect(ctx.sentBodies()[0]).toBe("07d0");
  });

  it("サテライトモードOn：TxがFMでトーンHzがない場合は、トーンOffを送信すること", async () => {
    await startSatelliteMode();

    await ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", null);

    const bodies = ctx.sentBodies();
    expect(bodies[bodies.length - 1]).toBe("164200");
    expect(bodies.some((body) => body.startsWith("1b00"))).toBe(false);
  });

  it("サテライトモードOn：TxがFM系以外の場合は、トーンHzがあってもトーンOffを送信すること", async () => {
    await startSatelliteMode();

    await ctx.controller.initAutoOn(145900000, 435100000, "USB", "USB", 88.5);

    const bodies = ctx.sentBodies();
    expect(bodies[bodies.length - 1]).toBe("164200");
    expect(bodies.some((body) => body.startsWith("1b00"))).toBe(false);
  });

  it("autoOff：サブ→メインの順でトーンOffを送信すること", async () => {
    await startSatelliteMode();

    await ctx.controller.autoOff();

    expect(ctx.sentBodies()).toEqual(["07d1", "164200", "07d0", "164200"]);
  });
});
