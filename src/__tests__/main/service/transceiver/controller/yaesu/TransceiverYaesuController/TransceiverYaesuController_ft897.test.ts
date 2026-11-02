import Constant from "@/common/Constant.js";
import { fireIpcEvent } from "@/main/main.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFt897Context,
  disposeYaesuContext,
  type YaesuTestContext,
} from "../../helpers/yaesuControllerTestUtil.js";
import type { Ft897Simulator } from "../../helpers/YaesuRadioSimulators.js";

vi.mock("@/main/common/SerialComm.js", async () => ({
  default: (await import("../../helpers/FakeSerialComm.js")).default,
}));
vi.mock("@/main/main.js", () => ({ fireIpcEvent: vi.fn(), getMainWindow: vi.fn() }));
const mockWarn = vi.hoisted(() => vi.fn());
vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: mockWarn, error: vi.fn() },
}));
vi.mock("@/main/util/I18nUtil4Main.js", () => ({ default: { getMsg: vi.fn(() => "msg") } }));

// コマンド（16進数文字列）
const SPLIT_ON = "0000000002";
const SPLIT_OFF = "0000000082";
const TOGGLE_VFO = "0000000081";
const GET_TX_STATUS = "00000000f7";
const GET_FREQ_MODE = "0000000003";

/**
 * 周波数の設定コマンド（16進数文字列）を返す
 */
function freqCmd(freqHz: number): string {
  return Math.round(freqHz / 10)
    .toString()
    .padStart(8, "0")
    .concat("01");
}

/**
 * Tx VFOの設定コマンド列（送信状態の確認→VFO切替→設定→VFO切替）を返す
 */
function txOps(...cmds: string[]): string[] {
  return [GET_TX_STATUS, TOGGLE_VFO, ...cmds, TOGGLE_VFO];
}

describe("TransceiverYaesuController（FT-897）", () => {
  let ctx: YaesuTestContext<Ft897Simulator>;

  afterEach(async () => {
    await disposeYaesuContext(ctx);
    mockWarn.mockClear();
    vi.mocked(fireIpcEvent).mockClear();
  });

  /**
   * 開始し、サテライトモードOnにして、送信履歴等をクリアする
   */
  async function startSatelliteMode() {
    ctx = createFt897Context();
    await ctx.start();
    await ctx.run(ctx.controller.setSatelliteMode(true));
    ctx.clear();
  }

  describe("start / stop", () => {
    it("機種定義のストップビット（2）でシリアルを開き、SPLIT Offを送信し、現在の周波数・モードを読み取ること", async () => {
      ctx = createFt897Context();

      await ctx.start();

      expect(ctx.serial().options).toEqual({ stopBits: 2 });
      expect(ctx.sentHex()).toEqual([SPLIT_OFF, GET_FREQ_MODE]);
    });

    it("起動時に読み取った周波数・モードを、サテライトモードOffのため、アップリンクとして通知し、送信の一時停止はしないこと", async () => {
      ctx = createFt897Context();

      await ctx.start();

      expect(ctx.freqData()).toEqual([{ uplinkHz: 145800000, uplinkMode: "" }]);
      expect(ctx.modeData()).toEqual([{ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM }]);
      expect(ctx.waitCb).not.toHaveBeenCalled();
    });

    it("isReadyは、接続中はtrue、停止後はfalseを返すこと。停止時に、FT-897は何も送信しないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      expect(ctx.controller.isReady()).toBe(true);
      ctx.clear();

      await ctx.run(ctx.controller.stop());

      expect(ctx.controller.isReady()).toBe(false);
      expect(ctx.sentHex()).toEqual([]);
    });
  });

  describe("Rxの設定と読み取り（サテライトモードOff）", () => {
    it("Rxの周波数・運用モードの要求は、定期処理で送信し、その周期は読み取りを行わないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();

      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      await ctx.controller.setMode({ downlinkHz: null, downlinkMode: Constant.Transceiver.OpeMode.USB });
      // 呼び出しただけでは送信しない
      expect(ctx.sentHex()).toEqual([]);

      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([freqCmd(145900000), "0100000007"]);
    });

    it("RSTが送信した値は、次の周期の読み取りで、無線機側の操作とは判定しないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([GET_FREQ_MODE]);
      expect(ctx.freqCb).not.toHaveBeenCalled();
      expect(ctx.waitCb).not.toHaveBeenCalled();
    });

    it("RSTが別のアマチュアバンドの周波数を設定した直後の読み取りを、VFOの切り替えと誤認しないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      await ctx.controller.setFreq({ downlinkHz: 435100000, downlinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.cycle();

      expect(mockWarn).not.toHaveBeenCalled();
      expect(ctx.freqCb).not.toHaveBeenCalled();
    });

    it("設定できない周波数（1200MHz帯）の要求は、送信せずに破棄し、再試行しないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();

      await ctx.controller.setFreq({ downlinkHz: 1265000000, downlinkMode: "" });
      await ctx.cycle();
      await ctx.cycle();

      // 1周期目：要求を破棄する（設定の周期のため、読み取りは行わない）。2周期目：読み取りのみ（再試行しない）
      expect(ctx.sentHex()).toEqual([GET_FREQ_MODE]);
      expect(ctx.freqCb).not.toHaveBeenCalled();
    });

    it("サテライトモードOffでは、Tx（アップリンク）の要求は送信しないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM });
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([GET_FREQ_MODE]);
    });
  });

  describe("サテライトモード", () => {
    it("Onにすると、SPLIT Onを送信し、現在の周波数・モードを、ダウンリンクとして通知すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();

      const res = await ctx.run(ctx.controller.setSatelliteMode(true));

      expect(res).toBe(true);
      expect(ctx.sentHex()).toEqual([SPLIT_ON, GET_FREQ_MODE]);
      expect(ctx.freqData()).toEqual([{ downlinkHz: 145800000, downlinkMode: "" }]);
      expect(ctx.modeData()).toEqual([{ downlinkHz: null, downlinkMode: Constant.Transceiver.OpeMode.FM }]);
      expect(ctx.sim.isSplit).toBe(true);
    });

    it("同じ値の場合は、何も送信せずtrueを返すこと", async () => {
      await startSatelliteMode();

      const res = await ctx.run(ctx.controller.setSatelliteMode(true));

      expect(res).toBe(true);
      expect(ctx.sentHex()).toEqual([]);
    });

    it("シリアル未接続の場合は、falseを返し、未接続メッセージを通知すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.serial().simulateDisconnect();

      const res = await ctx.run(ctx.controller.setSatelliteMode(true));

      expect(res).toBe(false);
      expect(vi.mocked(fireIpcEvent)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(fireIpcEvent).mock.calls[0][0]).toBe("onNoticeMessage");
    });
  });

  describe("Txの設定（サテライトモードOn）", () => {
    it("Txの周波数・運用モードは、Tx VFOへ切り替えて設定し、Rx VFOへ戻すこと", async () => {
      await startSatelliteMode();

      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([
        ...txOps(freqCmd(145900000)),
        ...txOps("0800000007"),
        // Rxの設定がない周期は、読み取りを行う
        GET_FREQ_MODE,
      ]);
      expect(ctx.sim.vfos[1].freqHz).toBe(145900000);
      // 処理後は、Rx VFOが表示されている
      expect(ctx.sim.displayed).toBe(0);
    });

    it("FMの場合、前回送信した周波数との差が500Hz未満の更新は、送信しないこと（Tx VFOの切り替えの頻度を抑える）", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900499, uplinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([GET_FREQ_MODE]);
    });

    it("FMの場合、前回送信した周波数との差が500Hz以上の更新は、送信すること", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900500, uplinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([...txOps(freqCmd(145900500)), GET_FREQ_MODE]);
    });

    it("SSBの場合は、50Hz未満の更新は送信せず、50Hz以上の更新は送信すること", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900049, uplinkMode: "" });
      await ctx.cycle();
      expect(ctx.sentHex()).toEqual([GET_FREQ_MODE]);
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900050, uplinkMode: "" });
      await ctx.cycle();
      expect(ctx.sentHex()).toEqual([...txOps(freqCmd(145900050)), GET_FREQ_MODE]);
    });

    it("送信間引きで送信しなかった値との差は、次の更新で、前回送信した値からの差として判定すること", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();

      // 400Hz、450Hzと少しずつ変化しても、前回送信した値（145.900.000）からの差が500Hz以上になるまでは送信しない
      await ctx.controller.setFreq({ uplinkHz: 145900400, uplinkMode: "" });
      await ctx.cycle();
      await ctx.controller.setFreq({ uplinkHz: 145900450, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900550, uplinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([...txOps(freqCmd(145900550)), GET_FREQ_MODE]);
    });

    it("Txの運用モードを変更した場合は、周波数の差が閾値未満でも、周波数も送信すること", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB });
      await ctx.controller.setFreq({ uplinkHz: 145900100, uplinkMode: "" });
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([...txOps(freqCmd(145900100)), ...txOps("0100000007"), GET_FREQ_MODE]);
    });

    it("強制設定（isForce）の場合は、差が閾値未満でも送信すること", async () => {
      await startSatelliteMode();
      await ctx.controller.setMode({ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.FM });
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" }, true);
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([...txOps(freqCmd(145900000)), GET_FREQ_MODE]);
    });

    it("送信中は、Tx VFOの設定を行わず、要求を保持して、受信に戻った次の周期に送信すること", async () => {
      await startSatelliteMode();
      await ctx.controller.setFreq({ uplinkHz: 145900000, uplinkMode: "" });
      ctx.sim.isTransmitting = true;

      await ctx.cycle();
      // VFOは切り替えず、送信ステータスの確認のみ（周波数の設定の後、読み取り）
      expect(ctx.sentHex()).toEqual([GET_TX_STATUS, GET_FREQ_MODE]);
      ctx.clear();

      ctx.sim.isTransmitting = false;
      await ctx.cycle();
      expect(ctx.sentHex()).toEqual([...txOps(freqCmd(145900000)), GET_FREQ_MODE]);
    });
  });

  describe("無線機側の操作の検知（ポーリング）", () => {
    it("同一バンド内で周波数が変更された場合は、アップリンクとして通知し、ドップラーシフトの待機を通知すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();
      ctx.sim.vfos[0].freqHz = 145810000;

      await ctx.cycle();

      expect(ctx.freqData()).toEqual([{ uplinkHz: 145810000, uplinkMode: "" }]);
      expect(ctx.waitCb.mock.calls.map(([res]) => res.data)).toEqual([true]);
    });

    it("サテライトモードOnでは、ダウンリンクとして通知すること", async () => {
      await startSatelliteMode();
      ctx.sim.vfos[0].freqHz = 145810000;

      await ctx.cycle();

      expect(ctx.freqData()).toEqual([{ downlinkHz: 145810000, downlinkMode: "" }]);
    });

    it("運用モードが変更された場合は、通知する（ドップラーシフトの待機は通知しない）こと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();
      ctx.sim.vfos[0].mode = 0x01;

      await ctx.cycle();

      expect(ctx.modeData()).toEqual([{ uplinkHz: null, uplinkMode: Constant.Transceiver.OpeMode.USB }]);
      expect(ctx.waitCb).not.toHaveBeenCalled();
    });

    it("変更を検知した後は、一時停止の間、RSTからの送信を行わず（読み取りのみ）、一時停止の解除後に送信すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.sim.vfos[0].freqHz = 145810000;
      await ctx.cycle();
      ctx.clear();

      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      await ctx.cycle();
      expect(ctx.sentHex()).toEqual([GET_FREQ_MODE]);

      await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS);
      ctx.clear();
      await ctx.cycle();
      expect(ctx.sentHex()).toEqual([freqCmd(145900000)]);
    });

    it("一時停止中に、さらに変更を検知した場合は、一時停止の時間が延長されること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.sim.vfos[0].freqHz = 145810000;
      await ctx.cycle();

      await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS - 500);
      ctx.sim.vfos[0].freqHz = 145820000;
      await ctx.cycle();
      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      ctx.clear();

      // 最初の検知からはTRANSCEIVE_WAIT_MSを過ぎているが、2回目の検知から数えると、一時停止中
      await vi.advanceTimersByTimeAsync(Constant.Transceiver.TRANSCEIVE_WAIT_MS - 500);
      await ctx.cycle();
      expect(ctx.sentHex().some((hex) => hex === freqCmd(145900000))).toBe(false);
    });

    it("前回の値からアマチュアバンドをまたぐ変化は、VFOが切り替えられたとみなし、通知せず、警告ログを出力すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();
      // VFO-A（145.8MHz）からVFO-B（435MHz）に切り替えられた
      ctx.sim.displayed = 1;

      await ctx.cycle();

      expect(ctx.freqCb).not.toHaveBeenCalled();
      expect(ctx.waitCb).not.toHaveBeenCalled();
      expect(mockWarn).toHaveBeenCalledTimes(1);
    });

    it("VFOが元に戻された場合は、次の読み取りで、通常の処理に復帰すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.sim.displayed = 1;
      await ctx.cycle();
      ctx.clear();
      mockWarn.mockClear();

      ctx.sim.displayed = 0;
      ctx.sim.vfos[0].freqHz = 145810000;
      await ctx.cycle();

      expect(mockWarn).not.toHaveBeenCalled();
      expect(ctx.freqData()).toEqual([{ uplinkHz: 145810000, uplinkMode: "" }]);
    });

    it("RSTから周波数の設定要求がある場合は、無線機から読み取った周波数を、反映しないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      // 送信の一時停止中に要求を出し、要求が保持されたまま読み取りが行われる状態にする
      ctx.sim.vfos[0].freqHz = 145810000;
      await ctx.cycle();
      await ctx.controller.setFreq({ downlinkHz: 145900000, downlinkMode: "" });
      ctx.clear();
      ctx.sim.vfos[0].freqHz = 145820000;

      await ctx.cycle();

      expect(ctx.freqCb).not.toHaveBeenCalled();
    });

    it("DIGを受信した場合、RSTが直前に要求したLSB-Dを維持し、通知しないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      await ctx.controller.setMode({ downlinkHz: null, downlinkMode: Constant.Transceiver.OpeMode.LSB_D });
      await ctx.cycle();
      await vi.advanceTimersByTimeAsync(1000);
      ctx.clear();

      await ctx.cycle();

      // DIG（0x0a）に設定されており、RSTの要求（LSB-D）を維持する
      expect(ctx.sim.current.mode).toBe(0x0a);
      expect(ctx.modeCb).not.toHaveBeenCalled();
    });
  });

  describe("initAutoOn / autoOff", () => {
    it("サテライトモードOff：Rxの周波数・運用モードのみを設定すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "USB", 88.5));

      expect(ctx.sentHex()).toEqual([freqCmd(435100000), "0100000007"]);
    });

    it("サテライトモードOn：Rx→Txの順に、周波数・運用モードを設定し、FMの場合はトーンを設定すること（Txの周波数は閾値によらず送信）", async () => {
      await startSatelliteMode();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "USB", 88.5));

      expect(ctx.sentHex()).toEqual([
        // Rx
        freqCmd(435100000),
        "0100000007",
        // Tx
        ...txOps(freqCmd(145900000)),
        ...txOps("0800000007"),
        // トーン（CTCSS ENC On、88.5Hz）
        ...txOps("4a0000000a", "088508850b"),
      ]);
      expect(ctx.sim.toneMode).toBe("4a");
      expect(ctx.sim.toneFreq).toBe("08850885");
    });

    it("サテライトモードOn：TxがFM系以外の場合は、トーン周波数があっても、トーンをOffにすること", async () => {
      await startSatelliteMode();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "USB", "USB", 88.5));

      const sent = ctx.sentHex();
      expect(sent.slice(-4)).toEqual(txOps("8a0000000a"));
      expect(sent.some((hex) => hex.endsWith("0b"))).toBe(false);
    });

    it("サテライトモードOn：TxがFMでトーン周波数がない場合は、トーンをOffにすること", async () => {
      await startSatelliteMode();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", null));

      expect(ctx.sentHex().slice(-4)).toEqual(txOps("8a0000000a"));
    });

    it("同じ値で2回AutoOnした場合も、Txの周波数を送信すること（強制送信）", async () => {
      await startSatelliteMode();
      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", null));
      ctx.clear();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", null));

      expect(ctx.sentHex()).toContain(freqCmd(145900000));
      expect(ctx.sentHex()).toContain(freqCmd(435100000));
    });

    it("autoOff：Tx VFOへ切り替えて、トーンをOffにすること", async () => {
      await startSatelliteMode();

      await ctx.run(ctx.controller.autoOff());

      expect(ctx.sentHex()).toEqual(txOps("8a0000000a"));
    });

    it("シリアル未接続の場合は、何もしないこと", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.serial().simulateDisconnect();
      ctx.clear();

      await ctx.run(ctx.controller.initAutoOn(145900000, 435100000, "FM", "FM", 88.5));
      await ctx.run(ctx.controller.autoOff());

      expect(ctx.sentHex()).toEqual([]);
    });
  });

  describe("接続の異常", () => {
    it("起動から2秒間、無線機から一度も応答がない場合は、定期処理を停止し、シリアルを切断して、受信タイムアウトを通知すること", async () => {
      ctx = createFt897Context();
      ctx.sim.muted = true;
      await ctx.start();
      ctx.clear();

      await vi.advanceTimersByTimeAsync(2500);
      await ctx.cycle();

      expect(ctx.serial().isOpen()).toBe(false);
      expect(ctx.freqCb).toHaveBeenCalledTimes(1);
      expect(ctx.freqCb.mock.calls[0][0].status).toBe(false);
      expect(ctx.modeCb).toHaveBeenCalledTimes(1);
      expect(ctx.modeCb.mock.calls[0][0].status).toBe(false);
    });

    it("起動から2秒が経過する前は、応答がなくても、タイムアウトとしないこと", async () => {
      ctx = createFt897Context();
      ctx.sim.muted = true;
      await ctx.start();
      ctx.clear();

      await ctx.cycle();

      expect(ctx.serial().isOpen()).toBe(true);
      expect(ctx.freqCb).not.toHaveBeenCalled();
    });

    it("シリアルが切断された場合は、未接続メッセージを通知し、定期処理を停止すること", async () => {
      ctx = createFt897Context();
      await ctx.start();
      ctx.clear();
      vi.mocked(fireIpcEvent).mockClear();

      ctx.serial().simulateDisconnect();
      await ctx.cycle();
      await ctx.cycle();

      expect(ctx.sentHex()).toEqual([]);
      expect(vi.mocked(fireIpcEvent)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(fireIpcEvent).mock.calls[0][0]).toBe("onNoticeMessage");
    });
  });
});
