import Constant from "@/common/Constant.js";
import TransceiverYaesuFt897Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897Protocol.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProtocolIo, runWithTimers, type YaesuResponder } from "../../helpers/yaesuProtocolTestUtil.js";

vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// コマンド（16進数文字列）
const TOGGLE_VFO = "0000000081";
const GET_TX_STATUS = "00000000f7";
const GET_FREQ_MODE = "0000000003";

/**
 * 送信ステータス（F7）には、指定の値を返す無線機の応答を生成する
 * @param txStatus 送信ステータスの応答（0x80：受信中、0x00：送信中）。nullの場合は無応答
 * @param freqMode 周波数・モードの読み取り（03）の応答
 */
function responder(txStatus: number | null, freqMode: number[] = [0x14, 0x58, 0x00, 0x00, 0x08]): YaesuResponder {
  return (sent) => {
    const hex = sent.toString("hex");
    if (hex === GET_TX_STATUS) {
      return txStatus === null ? [] : [Buffer.from([txStatus])];
    }
    if (hex === GET_FREQ_MODE) {
      return [Buffer.from(freqMode)];
    }
    return [];
  };
}

describe("TransceiverYaesuFt897Protocol", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("init / term / refreshAutoInfo", () => {
    it("initで、SPLIT OFF（82）のみを送信すること（VFOは切り替えない）", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol);

      await protocol.init(t.io);

      expect(t.sentHex()).toEqual(["0000000082"]);
    });

    it("termとrefreshAutoInfoでは、何も送信しないこと（自動通知がないため）", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol);

      await protocol.term(t.io);
      await protocol.refreshAutoInfo(t.io);

      expect(t.sent).toHaveLength(0);
    });

    it("自動通知に非対応で、毎周期の読み取りを行い、周波数の分解能が10Hzであること", () => {
      const protocol = new TransceiverYaesuFt897Protocol();

      expect(protocol.supportsAutoInfo).toBe(false);
      expect(protocol.pollEveryCycles).toBe(1);
      expect(protocol.freqResolutionHz).toBe(10);
      expect(protocol.parseNotify(Buffer.from([0x01]))).toEqual([]);
    });
  });

  describe("Rxの設定", () => {
    it("Rx VFOが表示されている場合は、VFOを切り替えずに、周波数を設定すること", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));

      const res = await protocol.setFreq(t.io, "RX", 435100000);

      expect(res).toBe(true);
      expect(t.sentHex()).toEqual(["4351000001"]);
    });

    it("Rxの運用モードを設定すること（USB-DはDIG、FM-DはPKT）", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));

      await protocol.setMode(t.io, "RX", Constant.Transceiver.OpeMode.USB_D);
      await protocol.setMode(t.io, "RX", Constant.Transceiver.OpeMode.FM_D);
      await protocol.setMode(t.io, "RX", Constant.Transceiver.OpeMode.LSB);

      expect(t.sentHex()).toEqual(["0a00000007", "0c00000007", "0000000007"]);
    });
  });

  describe("Txの設定（VFOの切り替え）", () => {
    it("Tx周波数は、送信中でないことを確認し、Tx VFOへ切り替えて設定し、Rx VFOへ戻すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));

      const res = await runWithTimers(protocol.setFreq(t.io, "TX", 145900000));

      expect(res).toBe(true);
      expect(t.sentHex()).toEqual([GET_TX_STATUS, TOGGLE_VFO, "1459000001", TOGGLE_VFO]);
    });

    it("Txの運用モードも、同様にTx VFOへ切り替えて設定し、Rx VFOへ戻すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));

      const res = await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM));

      expect(res).toBe(true);
      expect(t.sentHex()).toEqual([GET_TX_STATUS, TOGGLE_VFO, "0800000007", TOGGLE_VFO]);
    });

    it("Tx VFOの設定の後は、Rx VFOに戻っているため、続くRxの設定ではVFOを切り替えないこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));
      await runWithTimers(protocol.setFreq(t.io, "TX", 145900000));
      t.clearSent();

      await protocol.setFreq(t.io, "RX", 435100000);

      expect(t.sentHex()).toEqual(["4351000001"]);
    });

    it("送信中の場合は、VFOを切り替えず、設定せずにfalseを返すこと（次周期に再試行）", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x00));

      const res = await runWithTimers(protocol.setFreq(t.io, "TX", 145900000));

      expect(res).toBe(false);
      expect(t.sentHex()).toEqual([GET_TX_STATUS]);
    });

    it("送信ステータスを取得できない（無応答）場合も、VFOを切り替えず、falseを返すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(null));

      const res = await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM));

      expect(res).toBe(false);
      expect(t.sentHex()).toEqual([GET_TX_STATUS]);
    });

    it("Tx VFOの設定の処理に失敗した場合も、Rx VFOへ戻すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));
      // 設定コマンドの送信で例外を発生させる
      const origSend = t.io.send.bind(t.io);
      let isThrown = false;
      vi.spyOn(t.io, "send").mockImplementation(async (bytes) => {
        if (!isThrown && Buffer.from(bytes).toString("hex") === "1459000001") {
          isThrown = true;
          throw new Error("send error");
        }
        return await origSend(bytes);
      });

      await expect(runWithTimers(protocol.setFreq(t.io, "TX", 145900000))).rejects.toThrow("send error");

      expect(t.sentHex()).toEqual([GET_TX_STATUS, TOGGLE_VFO, TOGGLE_VFO]);
    });
  });

  describe("設定できない値", () => {
    it.each([29999, 470000001, 1265000000, 0])(
      "設定できない周波数（%sHz）は、送信せずに、trueを返すこと（再試行しない）",
      async (freqHz) => {
        const protocol = new TransceiverYaesuFt897Protocol();
        const t = createProtocolIo(protocol, responder(0x80));

        expect(await protocol.setFreq(t.io, "RX", freqHz)).toBe(true);
        expect(await protocol.setFreq(t.io, "TX", freqHz)).toBe(true);

        expect(t.sent).toHaveLength(0);
      }
    );

    it.each([Constant.Transceiver.OpeMode.RTTY, Constant.Transceiver.OpeMode.DV, "XXX"])(
      "設定できない運用モード（%s）は、送信せずに、trueを返すこと（再試行しない）",
      async (modeText) => {
        const protocol = new TransceiverYaesuFt897Protocol();
        const t = createProtocolIo(protocol, responder(0x80));

        expect(await protocol.setMode(t.io, "RX", modeText)).toBe(true);
        expect(await protocol.setMode(t.io, "TX", modeText)).toBe(true);

        expect(t.sent).toHaveLength(0);
      }
    );
  });

  describe("SPLIT・トーン", () => {
    it("SPLIT On（02）、Off（82）を送信すること", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol);

      await protocol.setSplit(t.io, true);
      await protocol.setSplit(t.io, false);

      expect(t.sentHex()).toEqual(["0000000002", "0000000082"]);
    });

    it("トーンOnは、Tx VFOへ切り替えて、トーンの動作（CTCSS ENC）とトーン周波数を設定し、Rx VFOへ戻すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));

      const res = await runWithTimers(protocol.setTone(t.io, 88.5));

      expect(res).toBe(true);
      expect(t.sentHex()).toEqual([GET_TX_STATUS, TOGGLE_VFO, "4a0000000a", "088508850b", TOGGLE_VFO]);
    });

    it("トーンOffは、Tx VFOへ切り替えて、トーンの動作をOffにし、Rx VFOへ戻すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));

      const res = await runWithTimers(protocol.setTone(t.io, null));

      expect(res).toBe(true);
      expect(t.sentHex()).toEqual([GET_TX_STATUS, TOGGLE_VFO, "8a0000000a", TOGGLE_VFO]);
    });

    it("設定できないトーン周波数は、VFOを切り替えず、送信せずに、trueを返すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80));

      expect(await protocol.setTone(t.io, 0)).toBe(true);

      expect(t.sent).toHaveLength(0);
    });

    it("送信中は、トーンを設定せずにfalseを返すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x00));

      expect(await runWithTimers(protocol.setTone(t.io, null))).toBe(false);
      expect(t.sentHex()).toEqual([GET_TX_STATUS]);
    });
  });

  describe("readRx", () => {
    it("周波数・モードの読み取り（03）を送信し、応答を解析すること", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80, [0x43, 0x97, 0x00, 0x00, 0x01]));

      const res = await runWithTimers(protocol.readRx(t.io));

      expect(res).toEqual({ freqHz: 439700000, modeText: Constant.Transceiver.OpeMode.USB });
      expect(t.sentHex()).toEqual([GET_FREQ_MODE]);
    });

    it("応答がない場合は、nullを返すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol);

      expect(await runWithTimers(protocol.readRx(t.io))).toBeNull();
    });

    it("応答を解析できない場合（BCDではない値）は、nullを返すこと", async () => {
      const protocol = new TransceiverYaesuFt897Protocol();
      const t = createProtocolIo(protocol, responder(0x80, [0xff, 0xff, 0xff, 0xff, 0x01]));

      expect(await runWithTimers(protocol.readRx(t.io))).toBeNull();
    });
  });

  describe("getTxFreqSendThresholdHz / resolveRecvMode", () => {
    const protocol = new TransceiverYaesuFt897Protocol();

    it.each([
      [Constant.Transceiver.OpeMode.LSB, 50],
      [Constant.Transceiver.OpeMode.USB, 50],
      [Constant.Transceiver.OpeMode.CW, 50],
      [Constant.Transceiver.OpeMode.LSB_D, 50],
      [Constant.Transceiver.OpeMode.USB_D, 50],
      [Constant.Transceiver.OpeMode.FM, 500],
      [Constant.Transceiver.OpeMode.FM_D, 500],
      [Constant.Transceiver.OpeMode.AM, 500],
      ["", 50],
    ])("運用モード'%s'のTx周波数の送信間引きの閾値は%sHzであること", (modeText, expected) => {
      expect(protocol.getTxFreqSendThresholdHz(modeText)).toBe(expected);
    });

    it("DIGで受信したUSB-Dは、RSTが保持しているモードがLSB-Dの場合は、LSB-Dを維持すること", () => {
      expect(protocol.resolveRecvMode(Constant.Transceiver.OpeMode.USB_D, Constant.Transceiver.OpeMode.LSB_D)).toBe(
        Constant.Transceiver.OpeMode.LSB_D
      );
    });

    it("上記以外は、受信したモードをそのまま返すこと", () => {
      expect(protocol.resolveRecvMode(Constant.Transceiver.OpeMode.USB_D, Constant.Transceiver.OpeMode.USB)).toBe(
        Constant.Transceiver.OpeMode.USB_D
      );
      expect(protocol.resolveRecvMode(Constant.Transceiver.OpeMode.FM, Constant.Transceiver.OpeMode.LSB_D)).toBe(
        Constant.Transceiver.OpeMode.FM
      );
    });
  });
});
