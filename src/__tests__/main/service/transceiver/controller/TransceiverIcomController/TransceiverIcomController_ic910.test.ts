import Constant from "@/common/Constant.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bcd,
  CIV_IC910,
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

describe("TransceiverIcomController IC-910固有の挙動", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  /**
   * IC-910のコンテキストを生成する
   */
  function createIc910Context() {
    return createIcomContext({ civAddress: CIV_IC910, transceiverId: Constant.Transceiver.TransceiverId.ICOM_IC910 });
  }

  it("現在のバンドを無線機に問い合わせない（07 D2を送信しない）こと", async () => {
    ctx = createIc910Context();
    await ctx.controller.start();

    expect(ctx.sentBodies()).toEqual(["0700", "1a05012701", "03", "03", "04", "1a06", "1a06"]);
    expect(ctx.sentBodies()).not.toContain("07d2");
  });

  it("サテライトモードの設定は、IC-910用のコマンド（1A 07）を送信すること", async () => {
    ctx = createIc910Context();
    await startAndClear(ctx);

    await ctx.controller.setSatelliteMode(true);

    expect(ctx.sentBodies()[0]).toBe("1a0701");
    expect(ctx.sim.isSatelliteMode).toBe(true);
  });

  it("メインバンドへの切り替えの応答がFBでない場合、次の周期で再度切り替えること", async () => {
    ctx = createIc910Context();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    ctx.serial().clearSent();
    // メインバンドへの切り替えにNG（FA）を返す
    ctx.sim.override = (body) => (body[0] === 0x07 && body[1] === 0xd0 ? [ctx.sim.ng()] : undefined);

    await ctx.controller.setFreq({ downlinkHz: 435120000, downlinkMode: "" });
    await runOneCycle(ctx);
    ctx.sim.override = null;
    ctx.serial().clearSent();
    await runOneCycle(ctx);

    expect(ctx.sentBodies()[0]).toBe("07d0");
  });

  it("メインバンドへの切り替えに失敗しても、Rx周波数の設定を送信すること（無線機側はサブバンドのまま。現状の挙動）", async () => {
    ctx = createIc910Context();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    ctx.serial().clearSent();
    ctx.sim.override = (body) => (body[0] === 0x07 && body[1] === 0xd0 ? [ctx.sim.ng()] : undefined);

    await ctx.controller.setFreq({ downlinkHz: 435120000, downlinkMode: "" });
    await runOneCycle(ctx);

    const bodies = ctx.sentBodies();
    expect(bodies.indexOf(`00${bcd(435120000)}`)).toBeGreaterThan(bodies.indexOf("07d0"));
    // 無線機はサブバンドのままのため、Rx周波数がサブバンド（Tx）に設定されてしまう
    expect(ctx.sim.isMain).toBe(false);
    expect(ctx.sim.sub.freqHz).toBe(435120000);
  });
});
