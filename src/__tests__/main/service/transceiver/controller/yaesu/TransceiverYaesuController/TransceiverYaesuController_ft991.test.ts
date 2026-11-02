import Constant from "@/common/Constant.js";
import { fireIpcEvent } from "@/main/main.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFt991Context,
  disposeYaesuContext,
  type YaesuTestContext,
} from "../../helpers/yaesuControllerTestUtil.js";
import type { Ft991Simulator } from "../../helpers/YaesuRadioSimulators.js";

vi.mock("@/main/common/SerialComm.js", async () => ({
  default: (await import("../../helpers/FakeSerialComm.js")).default,
}));
vi.mock("@/main/main.js", () => ({ fireIpcEvent: vi.fn(), getMainWindow: vi.fn() }));
const mockWarn = vi.hoisted(() => vi.fn());
vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: mockWarn, error: vi.fn() },
}));
vi.mock("@/main/util/I18nUtil4Main.js", () => ({ default: { getMsg: vi.fn(() => "msg") } }));

// Txの運用モード、トーンを設定するための、VFOの入れ替えを伴うコマンド列
const swapOps = (...cmds: string[]) => ["TX;", "SV;", ...cmds, "SV;"];

describe("TransceiverYaesuController（FT-991）", () => {
  let ctx: YaesuTestContext<Ft991Simulator>;

  afterEach(async () => {
    await disposeYaesuContext(ctx);
    mockWarn.mockClear();
    vi.mocked(fireIpcEvent).mockClear();
  });

  /**
   * 開始し、送信履歴等をクリアする
   */
  async function startAndClear() {
    ctx = createFt991Context();
    await ctx.start();
    ctx.clear();
  }

  /**
   * 開始し、サテライトモードOnにして、送信履歴等をクリアする
   */
  async function startSatelliteMode() {
    ctx = createFt991Context();
    await ctx.start();
    await ctx.run(ctx.controller.setSatelliteMode(true));
    ctx.clear();
  }

  describe("start / stop", () => {
    it("機種定義のストップビット（2）でシリアルを開き、AIを有効にし、SPLIT Offにして、現在の周波数・モードを読み取ること", async () => {
      ctx = createFt991Context();

      await ctx.start();

      expect(ctx.serial().options).toEqual({ stopBits: 2 });
      expect(ctx.sentAscii()).toEqual(["AI1;", "FT2;", "IF;"]);
      expect(ctx.sim.isAutoInfo).toBe(true);
    });

    it("起動時に読み取った周波数・モードを、サテライトモードOffのため、アップリンクとして通知すること", async () => {
      ctx = createFt991Context();

      await ctx.start();

      expect(ctx.freqData()).toEqual([{ uplinkHz: 145800000, uplinkMode: "" }]);
      expect(ctx.modeData()).toEqual([{ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM }]);
    });

    it("停止時に、AIを無効にし、シリアルを切断すること", async () => {
      await startAndClear();

      await ctx.run(ctx.controller.stop());

      expect(ctx.sentAscii()).toEqual(["AI0;"]);
      expect(ctx.controller.isReady()).toBe(false);
      expect(ctx.sim.isAutoInfo).toBe(false);
    });
  });

  describe("定期読み取り（5周期に1回）", () => {
    it("4周期は何も送信せず、5周期目に、AIの再有効化と、周波数・モードの読み取りを行うこと", async () => {
      await startAndClear();

      for (let i = 1; i <= 4; i++) {
        await ctx.cycle();
        expect(ctx.sentAscii(), `${i}周期目`).toEqual([]);
      }
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual(["AI1;", "IF;"]);
    });

    it("5周期ごとに繰り返すこと", async () => {
      await startAndClear();

      for (let i = 1; i <= 10; i++) {
        await ctx.cycle();
      }

      expect(ctx.sentAscii()).toEqual(["AI1;", "IF;", "AI1;", "IF;"]);
    });

    it("読み取りの周期でも、その周期にRxの設定を送信した場合は、読み取りを行わないこと", async () => {
      await startAndClear();
      for (let i = 1; i <= 4; i++) {
        await ctx.cycle();
      }

      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual(["FA145900000;"]);
    });

    it("読み取りで、無線機側で変更されていた周波数を検知した場合は、通知し、ドップラーシフトの待機を通知すること", async () => {
      await startAndClear();
      ctx.sim.a.freqHz = 145810000;
      for (let i = 1; i <= 5; i++) {
        await ctx.cycle();
      }

      expect(ctx.freqData()).toEqual([{ uplinkHz: 145810000, uplinkMode: "" }]);
      expect(ctx.waitCb.mock.calls.map(([res]) => res.data)).toEqual([true]);
    });

    it("読み取りで、前回の値からアマチュアバンドをまたぐ変化を検知した場合は、通知せず、警告ログを出力すること", async () => {
      await startAndClear();
      ctx.sim.a.freqHz = 435100000;
      for (let i = 1; i <= 5; i++) {
        await ctx.cycle();
      }

      expect(ctx.freqCb).not.toHaveBeenCalled();
      expect(mockWarn).toHaveBeenCalledTimes(1);
    });
  });

  describe("自動通知（AI）による無線機側の操作の検知", () => {
    it("周波数（FA）の通知を、アップリンクとして通知し、ドップラーシフトの待機を通知すること", async () => {
      await startAndClear();

      await ctx.serial().emitRecvAscii(ctx.sim.notifyFreqA(145810000));

      expect(ctx.freqData()).toEqual([{ uplinkHz: 145810000, uplinkMode: "" }]);
      expect(ctx.waitCb.mock.calls.map(([res]) => res.data)).toEqual([true]);
    });

    it("サテライトモードOnでは、ダウンリンクとして通知すること", async () => {
      await startSatelliteMode();

      await ctx.serial().emitRecvAscii(ctx.sim.notifyFreqA(145810000));

      expect(ctx.freqData()).toEqual([{ downlinkHz: 145810000, downlinkMode: "" }]);
    });

    it("運用モード（MD0）の通知を通知する（ドップラーシフトの待機は通知しない）こと", async () => {
      await startAndClear();

      await ctx.serial().emitRecvAscii("MD02;");

      expect(ctx.modeData()).toEqual([{ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB }]);
      expect(ctx.waitCb).not.toHaveBeenCalled();
    });

    it("現在の値と同一の通知は、通知しないこと", async () => {
      await startAndClear();

      await ctx.serial().emitRecvAscii(ctx.sim.notifyFreqA(145800000));
      await ctx.serial().emitRecvAscii("MD04;");

      expect(ctx.freqCb).not.toHaveBeenCalled();
      expect(ctx.modeCb).not.toHaveBeenCalled();
    });

    it("Tx（VFO-B）の通知（FB）は、破棄すること", async () => {
      await startAndClear();

      await ctx.serial().emitRecvAscii("FB145900000;");

      expect(ctx.freqCb).not.toHaveBeenCalled();
    });

    it("エラー応答（?;）は、警告ログのみとし、通知しないこと", async () => {
      await startAndClear();

      await ctx.serial().emitRecvAscii("?;");

      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(ctx.freqCb).not.toHaveBeenCalled();
      expect(ctx.modeCb).not.toHaveBeenCalled();
    });

    it("複数の通知がまとまって受信された場合は、それぞれを処理すること", async () => {
      await startAndClear();

      await ctx.serial().emitRecvAscii(`${ctx.sim.notifyFreqA(145810000)}MD02;`);

      expect(ctx.freqData()).toEqual([{ uplinkHz: 145810000, uplinkMode: "" }]);
      expect(ctx.modeData()).toEqual([{ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB }]);
    });

    it("通知を受けた後は、一時停止の間、定期処理で何も送信しない（読み取りも行わない）こと。一時停止の解除後に送信すること", async () => {
      await startAndClear();
      await ctx.serial().emitRecvAscii(ctx.sim.notifyFreqA(145810000));
      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      ctx.clear();

      await ctx.cycle();
      expect(ctx.sentAscii()).toEqual([]);

      await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS);
      await ctx.cycle();
      expect(ctx.sentAscii()).toEqual(["FA145900000;"]);
    });

    it("運用モードの通知を受けた後は、TRANSCEIVE_MODE_WAIT_MSの間、送信を一時停止すること", async () => {
      await startAndClear();
      await ctx.serial().emitRecvAscii("MD02;");
      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      ctx.clear();

      await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_MODE_WAIT_MS - 100);
      await ctx.cycle();
      expect(ctx.sentAscii()).toEqual([]);

      await vi.advanceTimersByTimeAsync(100);
      await ctx.cycle();
      expect(ctx.sentAscii()).toEqual(["FA145900000;"]);
    });

    it("RSTから周波数の設定要求がある場合は、通知された周波数を、反映しないこと", async () => {
      await startAndClear();
      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });

      await ctx.serial().emitRecvAscii(ctx.sim.notifyFreqA(145810000));

      expect(ctx.freqCb).not.toHaveBeenCalled();
    });

    it("Rxの設定の直後に、同一の値が通知された場合は、通知しないこと", async () => {
      await startAndClear();
      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      await ctx.cycle();

      await ctx.serial().emitRecvAscii(ctx.sim.notifyFreqA(145900000));

      expect(ctx.freqCb).not.toHaveBeenCalled();
      expect(ctx.waitCb).not.toHaveBeenCalled();
    });
  });

  describe("Rxの設定", () => {
    it("Rxの周波数（FA）・運用モード（MD0）の要求は、定期処理で送信すること", async () => {
      await startAndClear();

      await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
      await ctx.controller.setMode({ downlinkHz: null, downlinkMode: Constant.Transceiver.OpeMode.USB_D });
      expect(ctx.sentAscii()).toEqual([]);
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual(["FA435100000;", "MD0C;"]);
    });

    it("設定できない周波数（1200MHz帯）の要求は、送信せずに破棄し、再試行しないこと", async () => {
      await startAndClear();

      await ctx.controller.setFreq({ downlinkHz: 1265000000, downlinkMode: "" });
      await ctx.cycle();
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual([]);
    });
  });

  describe("Txの設定（サテライトモードOn）", () => {
    it("サテライトモードの切替で、FT3（SPLIT On）を送信し、現在の周波数・モードを、ダウンリンクとして通知すること", async () => {
      await startAndClear();

      const res = await ctx.run(ctx.controller.setSatelliteMode(true));

      expect(res).toBe(true);
      expect(ctx.sentAscii()).toEqual(["FT3;", "IF;"]);
      expect(ctx.freqData()).toEqual([{ downlinkHz: 145800000, downlinkMode: "" }]);
      expect(ctx.sim.isSplit).toBe(true);
    });

    it("Txの周波数はVFO-B（FB）へ直接設定し、運用モードはVFOを入れ替えて設定すること", async () => {
      await startSatelliteMode();

      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual(["FB145900000;", ...swapOps("MD02;")]);
      // Txの運用モードはVFO-Bに設定され、Rx（VFO-A）の運用モード、周波数は変わらない
      expect(ctx.sim.b).toEqual({ freqHz: 145900000, mode: "2" });
      expect(ctx.sim.a).toEqual({ freqHz: 145800000, mode: "4" });
    });

    it("Tx周波数は、送信間引きを行わず、変化のたびに送信すること（VFOの入れ替えが不要なため）", async () => {
      await startSatelliteMode();
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900100, uplinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual(["FB145900100;"]);
    });

    it("Tx周波数の更新のみの場合は、VFOを入れ替えないこと", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900500, uplinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual(["FB145900500;"]);
    });

    it("送信中は、Txの運用モードの設定（VFOの入れ替え）を行わず、要求を保持して、受信に戻った次の周期に設定すること", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
      ctx.sim.txState = "2";

      await ctx.cycle();
      expect(ctx.sentAscii()).toEqual(["TX;"]);
      ctx.clear();

      ctx.sim.txState = "0";
      await ctx.cycle();
      expect(ctx.sentAscii()).toEqual(swapOps("MD02;"));
    });

    it("サテライトモードOffでは、Txの要求は送信しないこと", async () => {
      await startAndClear();

      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual([]);
    });

    it("サテライトモードをOnにしたとき、それまでに要求されていたTxは、次の周期で送信すること", async () => {
      await startAndClear();
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
      await ctx.cycle();
      await ctx.run(ctx.controller.setSatelliteMode(true));
      ctx.clear();

      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual(["FB145900000;", ...swapOps("MD02;")]);
    });
  });

  describe("initAutoOn / autoOff", () => {
    it("サテライトモードOn：Rx→Txの順に周波数・運用モードを設定し、FMの場合はトーンを設定すること", async () => {
      await startSatelliteMode();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "USB", 88.5));

      expect(ctx.sentAscii()).toEqual([
        // Rx
        "FA435100000;",
        "MD02;",
        // Tx
        "FB145900000;",
        ...swapOps("MD04;"),
        // トーン（CTCSS ENC、トーン番号008（88.5Hz））
        ...swapOps("CT02;", "CN00008;"),
      ]);
      expect(ctx.sim.ctcss).toBe("2");
      expect(ctx.sim.toneNo).toBe("008");
    });

    it("サテライトモードOn：TxがFM系以外の場合は、トーン周波数があっても、トーンをOffにすること", async () => {
      await startSatelliteMode();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "USB", "USB", 88.5));

      expect(ctx.sentAscii().slice(-4)).toEqual(swapOps("CT00;"));
    });

    it("サテライトモードOff：Rxの周波数・運用モードのみを設定すること", async () => {
      await startAndClear();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "USB", 88.5));

      expect(ctx.sentAscii()).toEqual(["FA435100000;", "MD02;"]);
    });

    it("autoOff：VFOを入れ替えて、トーンをOffにすること", async () => {
      await startSatelliteMode();

      await ctx.run(ctx.controller.autoOff());

      expect(ctx.sentAscii()).toEqual(swapOps("CT00;"));
      expect(ctx.sim.ctcss).toBe("0");
    });
  });

  describe("接続の異常", () => {
    it("起動から2秒間、無線機から一度も応答がない場合は、シリアルを切断し、受信タイムアウトを通知すること", async () => {
      ctx = createFt991Context();
      ctx.sim.muted = true;
      await ctx.start();
      ctx.clear();

      await vi.advanceTimersByTimeAsync(2500);
      await ctx.cycle();

      expect(ctx.serial().isOpen()).toBe(false);
      expect(ctx.freqCb.mock.calls[0][0].status).toBe(false);
      expect(ctx.modeCb.mock.calls[0][0].status).toBe(false);
    });

    it("シリアルが切断された場合は、未接続メッセージを通知すること", async () => {
      await startAndClear();
      vi.mocked(fireIpcEvent).mockClear();

      ctx.serial().simulateDisconnect();
      await ctx.cycle();

      expect(ctx.sentAscii()).toEqual([]);
      expect(vi.mocked(fireIpcEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(fireIpcEvent).mock.calls[0][0]).toBe("onNoticeMessage");
    });
  });
});
