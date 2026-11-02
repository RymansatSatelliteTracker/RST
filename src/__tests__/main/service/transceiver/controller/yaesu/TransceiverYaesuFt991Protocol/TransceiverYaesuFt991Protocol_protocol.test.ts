import Constant from "@/common/Constant.js";
import TransceiverYaesuFt991Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991Protocol.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProtocolIo, runWithTimers, type YaesuResponder } from "../../helpers/yaesuProtocolTestUtil.js";

vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

/**
 * 無線機の応答を生成する
 * @param txState 送信状態（TX;）の応答。0：受信、1：CAT送信中。nullの場合は無応答
 * @param info 状態（IF;）の応答。nullの場合は無応答
 */
function responder(txState: string | null, info: string | null = null): YaesuResponder {
  return (sent) => {
    const cmd = sent.toString("ascii");
    if (cmd === "TX;") {
      return txState === null ? [] : [Buffer.from(`TX${txState};`, "ascii")];
    }
    if (cmd === "IF;") {
      return info === null ? [] : [Buffer.from(info, "ascii")];
    }
    return [];
  };
}

// IFの応答（28文字）：周波数145.800.000Hz、運用モードFM（4）
const IF_FM_145800000 = "IF001145800000+000000400000;";

describe("TransceiverYaesuFt991Protocol", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("init / term / refreshAutoInfo", () => {
    it("initで、自動通知（AI1）を有効にし、SPLIT OFF（FT2）にすること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol);

      await protocol.init(t.io);

      expect(t.sentAscii()).toEqual(["AI1;", "FT2;"]);
    });

    it("termで自動通知（AI0）を無効にし、refreshAutoInfoでAI1を再送すること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol);

      await protocol.term(t.io);
      await protocol.refreshAutoInfo(t.io);

      expect(t.sentAscii()).toEqual(["AI0;", "AI1;"]);
    });

    it("自動通知に対応し、5周期に1回の読み取りを行い、周波数の分解能が1Hz、コマンド間隔がないこと", () => {
      const protocol = new TransceiverYaesuFt991Protocol();

      expect(protocol.supportsAutoInfo).toBe(true);
      expect(protocol.pollEveryCycles).toBe(5);
      expect(protocol.freqResolutionHz).toBe(1);
      expect(protocol.interCommandDelayMs).toBe(0);
    });
  });

  describe("周波数の設定", () => {
    it("Rxの周波数はVFO-A（FA）、Txの周波数はVFO-B（FB）に設定すること（VFOの入れ替えなし）", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol);

      expect(await protocol.setFreq(t.io, "RX", 435100000)).toBe(true);
      expect(await protocol.setFreq(t.io, "TX", 145900000)).toBe(true);

      expect(t.sentAscii()).toEqual(["FA435100000;", "FB145900000;"]);
    });

    it.each([29999, 470000001, 1265000000, 0])(
      "設定できない周波数（%sHz）は、送信せずに、trueを返すこと（再試行しない）",
      async (freqHz) => {
        const protocol = new TransceiverYaesuFt991Protocol();
        const t = createProtocolIo(protocol);

        expect(await protocol.setFreq(t.io, "RX", freqHz)).toBe(true);
        expect(await protocol.setFreq(t.io, "TX", freqHz)).toBe(true);

        expect(t.sent).toHaveLength(0);
      }
    );
  });

  describe("運用モードの設定", () => {
    it("Rxの運用モードは、VFOを入れ替えずに、MD0で設定すること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol);

      expect(await protocol.setMode(t.io, "RX", Constant.Transceiver.OpeMode.USB_D)).toBe(true);

      expect(t.sentAscii()).toEqual(["MD0C;"]);
    });

    it("Txの運用モードは、送信中でないことを確認し、VFOを入れ替えて設定し、元に戻すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0"));

      const res = await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM));

      expect(res).toBe(true);
      expect(t.sentAscii()).toEqual(["TX;", "SV;", "MD04;", "SV;"]);
    });

    it("Txの運用モードの設定時、送信中（CATによる送信）の場合は、VFOを入れ替えず、falseを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("1"));

      const res = await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM));

      expect(res).toBe(false);
      expect(t.sentAscii()).toEqual(["TX;"]);
    });

    it("Txの運用モードの設定時、送信中（無線機本体による送信）の場合も、VFOを入れ替えず、falseを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("2"));

      expect(await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM))).toBe(false);
      expect(t.sentAscii()).toEqual(["TX;"]);
    });

    it("Txの運用モードの設定時、送信状態を取得できない（無応答）場合も、VFOを入れ替えず、falseを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder(null));

      expect(await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM))).toBe(false);
      expect(t.sentAscii()).toEqual(["TX;"]);
    });

    it.each([Constant.Transceiver.OpeMode.DV, "", "XXX"])(
      "設定できない運用モード（'%s'）は、送信せずに、trueを返すこと（再試行しない）",
      async (modeText) => {
        const protocol = new TransceiverYaesuFt991Protocol();
        const t = createProtocolIo(protocol, responder("0"));

        expect(await protocol.setMode(t.io, "RX", modeText)).toBe(true);
        expect(await protocol.setMode(t.io, "TX", modeText)).toBe(true);

        expect(t.sent).toHaveLength(0);
      }
    );
  });

  describe("SPLIT・トーン", () => {
    it("SPLIT On（FT3）、Off（FT2）を送信すること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol);

      await protocol.setSplit(t.io, true);
      await protocol.setSplit(t.io, false);

      expect(t.sentAscii()).toEqual(["FT3;", "FT2;"]);
    });

    it("トーンOnは、VFOを入れ替えて、CTCSSの動作（CT02）とトーン番号（CN00）を設定し、元に戻すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0"));

      const res = await runWithTimers(protocol.setTone(t.io, 88.5));

      expect(res).toBe(true);
      expect(t.sentAscii()).toEqual(["TX;", "SV;", "CT02;", "CN00008;", "SV;"]);
    });

    it("トーンOffは、VFOを入れ替えて、CTCSSの動作をOff（CT00）にし、元に戻すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0"));

      const res = await runWithTimers(protocol.setTone(t.io, null));

      expect(res).toBe(true);
      expect(t.sentAscii()).toEqual(["TX;", "SV;", "CT00;", "SV;"]);
    });

    it("設定できないトーン周波数は、VFOを入れ替えず、送信せずに、trueを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0"));

      expect(await protocol.setTone(t.io, 88.0)).toBe(true);

      expect(t.sent).toHaveLength(0);
    });

    it("送信中は、トーンを設定せずに、falseを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("2"));

      expect(await runWithTimers(protocol.setTone(t.io, null))).toBe(false);
      expect(t.sentAscii()).toEqual(["TX;"]);
    });
  });

  describe("VFOの入れ替え中の自動通知の除外", () => {
    it("VFOの入れ替え中に受信した自動通知は、無視すること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      let inSwap: ReturnType<typeof protocol.parseNotify> | null = null;
      const t = createProtocolIo(protocol, (sent) => {
        const cmd = sent.toString("ascii");
        if (cmd === "TX;") {
          return [Buffer.from("TX0;", "ascii")];
        }
        // 運用モードの設定中（VFOの入れ替え中）に、通知を受信する
        if (cmd === "MD04;") {
          inSwap = protocol.parseNotify(Buffer.from("FA145900000;", "ascii"));
        }
        return [];
      });

      await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM));

      expect(inSwap).toEqual([]);
    });

    it("VFOの入れ替えの終了後、500msは自動通知を無視し、その後は解析すること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0"));
      await runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM));
      const notify = Buffer.from("FA145800000;", "ascii");

      expect(protocol.parseNotify(notify)).toEqual([]);

      await vi.advanceTimersByTimeAsync(499);
      expect(protocol.parseNotify(notify)).toEqual([]);

      await vi.advanceTimersByTimeAsync(1);
      expect(protocol.parseNotify(notify)).toEqual([{ type: "FREQ", freqHz: 145800000 }]);
    });

    it("設定の処理で例外が発生しても、VFOを元に戻し、通知の除外は一定時間後に終了すること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0"));
      const origSend = t.io.send.bind(t.io);
      vi.spyOn(t.io, "send").mockImplementation(async (bytes) => {
        if (Buffer.from(bytes).toString("ascii") === "MD04;") {
          throw new Error("send error");
        }
        return await origSend(bytes);
      });

      await expect(runWithTimers(protocol.setMode(t.io, "TX", Constant.Transceiver.OpeMode.FM))).rejects.toThrow(
        "send error"
      );

      expect(t.sentAscii()).toEqual(["TX;", "SV;", "SV;"]);
      await vi.advanceTimersByTimeAsync(500);
      expect(protocol.parseNotify(Buffer.from("FA145800000;", "ascii"))).toEqual([{ type: "FREQ", freqHz: 145800000 }]);
    });
  });

  describe("parseNotify", () => {
    const protocol = new TransceiverYaesuFt991Protocol();
    const parse = (s: string) => protocol.parseNotify(Buffer.from(s, "ascii"));

    it("FA（VFO-Aの周波数）は、周波数の通知として解析すること", () => {
      expect(parse("FA014250000;")).toEqual([{ type: "FREQ", freqHz: 14250000 }]);
    });

    it("MD0（運用モード）は、運用モードの通知として解析すること（RSTで扱えないモードはnull）", () => {
      expect(parse("MD02;")).toEqual([{ type: "MODE", modeText: Constant.Transceiver.OpeMode.USB }]);
      expect(parse("MD0F;")).toEqual([{ type: "MODE", modeText: null }]);
    });

    it("IF（VFO-Aの状態）は、周波数と運用モードの通知として解析すること", () => {
      expect(parse(IF_FM_145800000)).toEqual([
        { type: "FREQ", freqHz: 145800000 },
        { type: "MODE", modeText: Constant.Transceiver.OpeMode.FM },
      ]);
    });

    it("エラー応答（?;）は、エラーの通知として返すこと", () => {
      expect(parse("?;")).toEqual([{ type: "ERROR" }]);
    });

    it("Tx（VFO-B）の通知（FB、OI）、その他のコマンド、解析できないデータは、破棄すること", () => {
      expect(parse("FB145900000;")).toEqual([]);
      expect(parse(IF_FM_145800000.replace("IF", "OI"))).toEqual([]);
      expect(parse("FT3;")).toEqual([]);
      expect(parse("AI1;")).toEqual([]);
      expect(parse("XX;")).toEqual([]);
    });
  });

  describe("readRx", () => {
    it("IF;を送信し、応答から周波数と運用モードを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0", IF_FM_145800000));

      const res = await runWithTimers(protocol.readRx(t.io));

      expect(res).toEqual({ freqHz: 145800000, modeText: Constant.Transceiver.OpeMode.FM });
      expect(t.sentAscii()).toEqual(["IF;"]);
    });

    it("応答がない場合は、nullを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0", null));

      expect(await runWithTimers(protocol.readRx(t.io))).toBeNull();
    });

    it("応答を解析できない場合は、nullを返すこと", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, responder("0", "IF001;"));

      expect(await runWithTimers(protocol.readRx(t.io))).toBeNull();
    });

    it("IFの応答の前に自動通知を受信した場合も、IFの応答を返し、通知は別に受け取ること", async () => {
      const protocol = new TransceiverYaesuFt991Protocol();
      const t = createProtocolIo(protocol, (sent) =>
        sent.toString("ascii") === "IF;" ? [Buffer.from(`FA145700000;${IF_FM_145800000}`, "ascii")] : []
      );

      const res = await runWithTimers(protocol.readRx(t.io));

      expect(res?.freqHz).toBe(145800000);
      expect(t.notified.map((b) => b.toString("ascii"))).toEqual(["FA145700000;"]);
    });
  });

  describe("getTxFreqSendThresholdHz / resolveRecvMode", () => {
    const protocol = new TransceiverYaesuFt991Protocol();

    it("Tx周波数は、VFO-Bに直接設定でき、受信に影響しないため、送信間引きの閾値は常に0であること", () => {
      for (const mode of Object.values(Constant.Transceiver.OpeMode) as string[]) {
        expect(protocol.getTxFreqSendThresholdHz(mode)).toBe(0);
      }
    });

    it("受信した運用モードは、そのまま返すこと", () => {
      expect(protocol.resolveRecvMode(Constant.Transceiver.OpeMode.USB_D, Constant.Transceiver.OpeMode.LSB_D)).toBe(
        Constant.Transceiver.OpeMode.USB_D
      );
    });
  });
});
