import Constant from "@/common/Constant.js";
import TransceiverYaesuFt991RecvParser from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991RecvParser.js";
import { describe, expect, it } from "vitest";

/**
 * ASCII文字列をBufferに変換する
 */
function buf(s: string): Buffer {
  return Buffer.from(s, "ascii");
}

/**
 * IFの応答（28文字）を生成する（周波数とモード以外は、固定値）
 */
function ifFrame(freqHz: number, modeCode: string): string {
  // IF + P1(3桁) + P2(9桁) + P3(5桁) + P4(1桁) + P5(1桁) + P6(モード) + P7(1桁) + P8(1桁) + P9(2桁) + P10(1桁) + ;
  return `IF001${freqHz.toString().padStart(9, "0")}+0000` + `00${modeCode}` + `00000;`;
}

describe("TransceiverYaesuFt991RecvParser.extractFrames", () => {
  it("終端（;）までのフレームを切り出すこと", () => {
    const res = TransceiverYaesuFt991RecvParser.extractFrames(buf("FA145800000;"));

    expect(res.frames.map((f) => f.toString("ascii"))).toEqual(["FA145800000;"]);
    expect(res.rest).toHaveLength(0);
  });

  it("複数のフレームがまとまって受信された場合は、1フレームずつに分割すること", () => {
    const res = TransceiverYaesuFt991RecvParser.extractFrames(buf("FA145800000;MD02;?;"));

    expect(res.frames.map((f) => f.toString("ascii"))).toEqual(["FA145800000;", "MD02;", "?;"]);
    expect(res.rest).toHaveLength(0);
  });

  it("終端のない（未完結の）データは、restに返すこと", () => {
    const res = TransceiverYaesuFt991RecvParser.extractFrames(buf("FA145800000;FB4350"));

    expect(res.frames.map((f) => f.toString("ascii"))).toEqual(["FA145800000;"]);
    expect(res.rest.toString("ascii")).toBe("FB4350");
  });

  it("restを次の受信データと結合すると、分割して受信されたフレームを切り出せること", () => {
    const first = TransceiverYaesuFt991RecvParser.extractFrames(buf("FA14580"));
    expect(first.frames).toHaveLength(0);

    const second = TransceiverYaesuFt991RecvParser.extractFrames(Buffer.concat([first.rest, buf("0000;")]));
    expect(second.frames.map((f) => f.toString("ascii"))).toEqual(["FA145800000;"]);
  });

  it("空のバッファの場合は、何も返さないこと", () => {
    const res = TransceiverYaesuFt991RecvParser.extractFrames(Buffer.alloc(0));

    expect(res.frames).toHaveLength(0);
    expect(res.rest).toHaveLength(0);
  });
});

describe("TransceiverYaesuFt991RecvParser.isError", () => {
  it("エラー応答（?;）の場合はtrueを返すこと", () => {
    expect(TransceiverYaesuFt991RecvParser.isError(buf("?;"))).toBe(true);
  });

  it("エラー応答以外の場合はfalseを返すこと", () => {
    expect(TransceiverYaesuFt991RecvParser.isError(buf("FA145800000;"))).toBe(false);
  });
});

describe("TransceiverYaesuFt991RecvParser.parseInfo", () => {
  it("IFの応答から、周波数と運用モードを解析すること", () => {
    const frame = buf(ifFrame(145800000, "4"));
    expect(frame.length).toBe(28);

    expect(TransceiverYaesuFt991RecvParser.parseInfo(frame)).toEqual({
      freqHz: 145800000,
      modeText: Constant.Transceiver.OpeMode.FM,
    });
  });

  it("14.250MHzのようにゼロ詰めされた周波数を解析すること", () => {
    expect(TransceiverYaesuFt991RecvParser.parseInfo(buf(ifFrame(14250000, "2")))).toEqual({
      freqHz: 14250000,
      modeText: Constant.Transceiver.OpeMode.USB,
    });
  });

  it("RSTで扱えない運用モードの場合は、modeTextがnullであること", () => {
    expect(TransceiverYaesuFt991RecvParser.parseInfo(buf(ifFrame(145800000, "F")))?.modeText).toBeNull();
  });

  it("長さが異なる、先頭がIFでない、終端がない、周波数が数字でない場合は、nullを返すこと", () => {
    expect(TransceiverYaesuFt991RecvParser.parseInfo(buf("IF001145800000;"))).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.parseInfo(buf(ifFrame(145800000, "4").replace("IF", "OI")))).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.parseInfo(buf(ifFrame(145800000, "4").slice(0, 27) + "X"))).toBeNull();
    expect(
      TransceiverYaesuFt991RecvParser.parseInfo(buf(ifFrame(145800000, "4").replace("145800000", "14580000A")))
    ).toBeNull();
  });
});

describe("TransceiverYaesuFt991RecvParser.parseFreqA / parseMode / parseIsTransmitting", () => {
  it("FAの応答、通知から、周波数を解析すること", () => {
    expect(TransceiverYaesuFt991RecvParser.parseFreqA(buf("FA014250000;"))).toBe(14250000);
  });

  it("FA以外、桁数の違い、数字以外の場合は、周波数をnullとすること", () => {
    expect(TransceiverYaesuFt991RecvParser.parseFreqA(buf("FB014250000;"))).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.parseFreqA(buf("FA0142500;"))).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.parseFreqA(buf("FA01425000A;"))).toBeNull();
  });

  it("MD0の応答、通知から、運用モードを解析すること", () => {
    expect(TransceiverYaesuFt991RecvParser.parseMode(buf("MD02;"))).toBe(Constant.Transceiver.OpeMode.USB);
    expect(TransceiverYaesuFt991RecvParser.parseMode(buf("MD0C;"))).toBe(Constant.Transceiver.OpeMode.USB_D);
  });

  it("RSTで扱えない運用モードの場合はnull、MD0でない場合はundefinedを返すこと", () => {
    expect(TransceiverYaesuFt991RecvParser.parseMode(buf("MD0F;"))).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.parseMode(buf("MD12;"))).toBeUndefined();
    expect(TransceiverYaesuFt991RecvParser.parseMode(buf("FA014250000;"))).toBeUndefined();
  });

  it("TXの応答から、送信中かを解析すること（0：受信、1：CAT送信中、2：本体で送信中）", () => {
    expect(TransceiverYaesuFt991RecvParser.parseIsTransmitting(buf("TX0;"))).toBe(false);
    expect(TransceiverYaesuFt991RecvParser.parseIsTransmitting(buf("TX1;"))).toBe(true);
    expect(TransceiverYaesuFt991RecvParser.parseIsTransmitting(buf("TX2;"))).toBe(true);
  });

  it("TXの応答として解析できない場合は、nullを返すこと", () => {
    expect(TransceiverYaesuFt991RecvParser.parseIsTransmitting(buf("TX3;"))).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.parseIsTransmitting(buf("TX;"))).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.parseIsTransmitting(buf("FA014250000;"))).toBeNull();
  });
});

describe("TransceiverYaesuFt991RecvParser.codeToModeText", () => {
  it.each([
    ["1", Constant.Transceiver.OpeMode.LSB],
    ["2", Constant.Transceiver.OpeMode.USB],
    ["3", Constant.Transceiver.OpeMode.CW],
    ["4", Constant.Transceiver.OpeMode.FM],
    ["5", Constant.Transceiver.OpeMode.AM],
    ["6", Constant.Transceiver.OpeMode.RTTY],
    ["7", Constant.Transceiver.OpeMode.CW],
    ["8", Constant.Transceiver.OpeMode.LSB_D],
    ["9", Constant.Transceiver.OpeMode.RTTY],
    ["A", Constant.Transceiver.OpeMode.FM_D],
    ["B", Constant.Transceiver.OpeMode.FM],
    ["C", Constant.Transceiver.OpeMode.USB_D],
    ["D", Constant.Transceiver.OpeMode.AM],
    ["E", Constant.Transceiver.OpeMode.DV],
  ])("運用モードのコード%sを%sに変換すること（CW-R、RTTY-USB、FM-N、AM-N、C4FMを含む）", (code, expected) => {
    expect(TransceiverYaesuFt991RecvParser.codeToModeText(code)).toBe(expected);
  });

  it("不明なコードの場合はnullを返すこと", () => {
    expect(TransceiverYaesuFt991RecvParser.codeToModeText("0")).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.codeToModeText("F")).toBeNull();
    expect(TransceiverYaesuFt991RecvParser.codeToModeText("")).toBeNull();
  });
});
