import Constant from "@/common/Constant.js";
import TransceiverYaesuFt897RecvParser from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897RecvParser.js";
import { describe, expect, it } from "vitest";

describe("TransceiverYaesuFt897RecvParser.parseFreqAndMode", () => {
  it("周波数（10Hz単位のBCD）と運用モードを解析すること（マニュアルの例：43 97 00 00 01 → 439.70MHz、USB）", () => {
    expect(TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.from([0x43, 0x97, 0x00, 0x00, 0x01]))).toEqual({
      freqHz: 439700000,
      modeText: Constant.Transceiver.OpeMode.USB,
    });
  });

  it("144MHz帯の周波数を解析すること", () => {
    expect(TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.from([0x14, 0x58, 0x12, 0x34, 0x08]))).toEqual({
      freqHz: 145812340,
      modeText: Constant.Transceiver.OpeMode.FM,
    });
  });

  it("RSTで扱えない運用モードの場合は、modeTextがnullであること", () => {
    expect(
      TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.from([0x14, 0x58, 0x00, 0x00, 0x7f]))?.modeText
    ).toBeNull();
  });

  it("BCDではない値（A〜Fの桁）が含まれる場合は、nullを返すこと", () => {
    expect(TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.from([0x1a, 0x58, 0x00, 0x00, 0x01]))).toBeNull();
    expect(TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.from([0x14, 0x5f, 0x00, 0x00, 0x01]))).toBeNull();
  });

  it("5バイトでない場合は、nullを返すこと", () => {
    expect(TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.from([0x14, 0x58, 0x00, 0x00]))).toBeNull();
    expect(
      TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.from([0x14, 0x58, 0x00, 0x00, 0x01, 0x00]))
    ).toBeNull();
    expect(TransceiverYaesuFt897RecvParser.parseFreqAndMode(Buffer.alloc(0))).toBeNull();
  });
});

describe("TransceiverYaesuFt897RecvParser.parseIsTransmitting", () => {
  it("PTT（bit7）が0の場合は、送信中として扱うこと", () => {
    expect(TransceiverYaesuFt897RecvParser.parseIsTransmitting(Buffer.from([0x00]))).toBe(true);
    expect(TransceiverYaesuFt897RecvParser.parseIsTransmitting(Buffer.from([0x7f]))).toBe(true);
  });

  it("PTT（bit7）が1の場合は、受信中として扱うこと", () => {
    expect(TransceiverYaesuFt897RecvParser.parseIsTransmitting(Buffer.from([0x80]))).toBe(false);
    expect(TransceiverYaesuFt897RecvParser.parseIsTransmitting(Buffer.from([0xff]))).toBe(false);
  });

  it("1バイトでない場合は、nullを返すこと", () => {
    expect(TransceiverYaesuFt897RecvParser.parseIsTransmitting(Buffer.alloc(0))).toBeNull();
    expect(TransceiverYaesuFt897RecvParser.parseIsTransmitting(Buffer.from([0x80, 0x00]))).toBeNull();
  });
});

describe("TransceiverYaesuFt897RecvParser.codeToModeText", () => {
  it.each([
    [0x00, Constant.Transceiver.OpeMode.LSB],
    [0x01, Constant.Transceiver.OpeMode.USB],
    [0x02, Constant.Transceiver.OpeMode.CW],
    [0x03, Constant.Transceiver.OpeMode.CW],
    [0x04, Constant.Transceiver.OpeMode.AM],
    [0x06, Constant.Transceiver.OpeMode.FM],
    [0x08, Constant.Transceiver.OpeMode.FM],
    [0x88, Constant.Transceiver.OpeMode.FM],
    // DIGは、側波帯を判別できないため、USB-Dとして扱う
    [0x0a, Constant.Transceiver.OpeMode.USB_D],
    [0x0c, Constant.Transceiver.OpeMode.FM_D],
  ])("運用モードのコード%sを%sに変換すること（CWR、WFM、FMN、DIG、PKTを含む）", (code, expected) => {
    expect(TransceiverYaesuFt897RecvParser.codeToModeText(code)).toBe(expected);
  });

  it("不明なコードの場合はnullを返すこと", () => {
    expect(TransceiverYaesuFt897RecvParser.codeToModeText(0x05)).toBeNull();
    expect(TransceiverYaesuFt897RecvParser.codeToModeText(0xff)).toBeNull();
  });
});

describe("TransceiverYaesuFt897RecvParser.extractFrames", () => {
  it("自動通知がないため、受信データは全て破棄し、フレームを返さないこと", () => {
    const res = TransceiverYaesuFt897RecvParser.extractFrames(Buffer.from([0x01, 0x02, 0x03]));

    expect(res.frames).toHaveLength(0);
    expect(res.rest).toHaveLength(0);
  });
});
