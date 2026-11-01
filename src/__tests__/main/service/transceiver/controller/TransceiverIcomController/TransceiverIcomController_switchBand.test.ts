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

describe("TransceiverIcomController バンド入れ替え（switchBandIfNeed）", () => {
  let ctx: IcomTestContext;

  afterEach(async () => {
    await disposeIcomContext(ctx);
  });

  /**
   * サテライトモードOn（無線機のメイン：435MHz、サブ：145.9MHz）で開始し、送信履歴をクリアする
   */
  async function startSatelliteMode() {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    await runOneCycle(ctx);
    ctx.serial().clearSent();
  }

  it("RSTのRxと無線機のメインが異なるバンド帯の場合、入れ替えコマンドを送信し、再取得の後にRx周波数を設定すること", async () => {
    await startSatelliteMode();

    await ctx.controller.setFreq({ downlinkHz: 145800000, downlinkMode: "" });
    await runOneCycle(ctx);

    const bodies = ctx.sentBodies();
    expect(bodies[0]).toBe("07b0");
    expect(bodies).toContain(`00${bcd(145800000)}`);
    // 入れ替えの後に、周波数・モードを再取得してから設定する
    expect(bodies.indexOf("03")).toBeGreaterThan(0);
    expect(bodies.indexOf(`00${bcd(145800000)}`)).toBeGreaterThan(bodies.indexOf("03"));
    expect(ctx.sim.main.freqHz).toBe(145800000);
    expect(ctx.sim.sub.freqHz).toBe(435000000);
  });

  it("同一バンド帯の場合は入れ替えないこと", async () => {
    await startSatelliteMode();

    await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).not.toContain("07b0");
  });

  it("RSTのRxがアマチュアバンド外の場合は入れ替えないこと", async () => {
    await startSatelliteMode();

    await ctx.controller.setFreq({ downlinkHz: 100000000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).not.toContain("07b0");
  });

  it("無線機のメインがアマチュアバンド外の場合は入れ替えないこと", async () => {
    ctx = createIcomContext();
    ctx.sim.main.freqHz = 100000000;
    await startAndClear(ctx);
    await ctx.controller.setSatelliteMode(true);
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setFreq({ downlinkHz: 145800000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).not.toContain("07b0");
  });

  it("サテライトモードOffの場合は入れ替えないこと", async () => {
    ctx = createIcomContext();
    await startAndClear(ctx);
    await runOneCycle(ctx);
    ctx.serial().clearSent();

    await ctx.controller.setFreq({ downlinkHz: 145800000, downlinkMode: "" });
    await runOneCycle(ctx);

    expect(ctx.sentBodies()).not.toContain("07b0");
    expect(ctx.sentBodies()[0]).toBe(`00${bcd(145800000)}`);
  });
});
