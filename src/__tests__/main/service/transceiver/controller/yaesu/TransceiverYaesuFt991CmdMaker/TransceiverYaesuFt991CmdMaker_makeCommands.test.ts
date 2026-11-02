import Constant from "@/common/Constant.js";
import TransceiverYaesuFt991CmdMaker from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991CmdMaker.js";
import { describe, expect, it } from "vitest";

/**
 * コマンドのバイト列をASCII文字列で返す
 */
function ascii(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("ascii");
}

describe("TransceiverYaesuFt991CmdMaker 周波数の設定", () => {
  const maker = new TransceiverYaesuFt991CmdMaker();

  it("VFO-Aの周波数を、9桁のゼロ詰めで設定するコマンド（FA）を返すこと", () => {
    expect(ascii(maker.makeSetFreqA(145800000))).toBe("FA145800000;");
    expect(ascii(maker.makeSetFreqA(14250000))).toBe("FA014250000;");
    expect(ascii(maker.makeSetFreqA(30000))).toBe("FA000030000;");
  });

  it("VFO-Bの周波数を、9桁のゼロ詰めで設定するコマンド（FB）を返すこと", () => {
    expect(ascii(maker.makeSetFreqB(435000000))).toBe("FB435000000;");
    expect(ascii(maker.makeSetFreqB(470000000))).toBe("FB470000000;");
  });

  it("小数点以下は四捨五入されること", () => {
    expect(ascii(maker.makeSetFreqA(145800000.4))).toBe("FA145800000;");
    expect(ascii(maker.makeSetFreqA(145800000.6))).toBe("FA145800001;");
  });

  it.each([
    [30000, true],
    [145800000, true],
    [470000000, true],
    [29999, false],
    [470000001, false],
    [1265000000, false],
    [0, false],
    [Number.NaN, false],
  ])("周波数%sが設定可能な範囲（30kHz〜470MHz）内かの判定は%sであること", (freqHz, expected) => {
    expect(TransceiverYaesuFt991CmdMaker.isFreqInRange(freqHz)).toBe(expected);
  });
});

describe("TransceiverYaesuFt991CmdMaker 各コマンドの生成", () => {
  const maker = new TransceiverYaesuFt991CmdMaker();

  it("運用モードの設定コマンド（MD0）を返すこと", () => {
    expect(ascii(maker.makeSetMode("2"))).toBe("MD02;");
    expect(ascii(maker.makeSetMode("C"))).toBe("MD0C;");
  });

  it("VFOの入れ替えコマンド（SV）を返すこと", () => {
    expect(ascii(maker.makeSwapVfo())).toBe("SV;");
  });

  it("SPLITのコマンド（FT）を返すこと（Onは送信VFOをVFO-B、OffはVFO-A）", () => {
    expect(ascii(maker.makeSetSplit(true))).toBe("FT3;");
    expect(ascii(maker.makeSetSplit(false))).toBe("FT2;");
  });

  it("読み取りコマンド（IF、TX）を返すこと", () => {
    expect(ascii(maker.makeGetInfo())).toBe("IF;");
    expect(ascii(maker.makeGetTxState())).toBe("TX;");
  });

  it("自動通知（AI）のコマンドを返すこと", () => {
    expect(ascii(maker.makeSetAutoInfo(true))).toBe("AI1;");
    expect(ascii(maker.makeSetAutoInfo(false))).toBe("AI0;");
  });

  it("CTCSSの動作のコマンド（CT0）を返すこと（Onは送信時のみのENC）", () => {
    expect(ascii(maker.makeSetCtcss(true))).toBe("CT02;");
    expect(ascii(maker.makeSetCtcss(false))).toBe("CT00;");
  });
});

describe("TransceiverYaesuFt991CmdMaker トーンの設定", () => {
  const maker = new TransceiverYaesuFt991CmdMaker();

  it("トーン周波数を、トーン番号（3桁のゼロ詰め）で設定するコマンド（CN00）を返すこと", () => {
    expect(ascii(maker.makeSetCtcssTone(67.0))).toBe("CN00000;");
    expect(ascii(maker.makeSetCtcssTone(88.5))).toBe("CN00008;");
    expect(ascii(maker.makeSetCtcssTone(100.0))).toBe("CN00012;");
    expect(ascii(maker.makeSetCtcssTone(254.1))).toBe("CN00049;");
  });

  it("トーン周波数が文字列で渡された場合も、変換できること（設定ファイルでは文字列で保持されるため）", () => {
    expect(ascii(maker.makeSetCtcssTone("88.5" as unknown as number))).toBe("CN00008;");
  });

  it("RSTのトーン周波数のリストの全ての値が、リストの並びと同じ番号に変換されること（FT-991のトーン番号の表と同じ並び）", () => {
    Constant.Transceiver.ToneFrequency.forEach((toneHz, idx) => {
      expect(TransceiverYaesuFt991CmdMaker.toneHzToNo(toneHz)).toBe(idx);
    });
    expect(Constant.Transceiver.ToneFrequency).toHaveLength(50);
  });

  it("設定できないトーン周波数の場合は、例外を送出すること", () => {
    expect(() => maker.makeSetCtcssTone(88.0)).toThrow("設定できないトーン周波数");
    expect(() => maker.makeSetCtcssTone(300)).toThrow("設定できないトーン周波数");
  });
});

describe("TransceiverYaesuFt991CmdMaker.modeTextToCode", () => {
  it.each([
    [Constant.Transceiver.OpeMode.LSB, "1"],
    [Constant.Transceiver.OpeMode.USB, "2"],
    [Constant.Transceiver.OpeMode.CW, "3"],
    [Constant.Transceiver.OpeMode.FM, "4"],
    [Constant.Transceiver.OpeMode.AM, "5"],
    [Constant.Transceiver.OpeMode.RTTY, "6"],
    [Constant.Transceiver.OpeMode.LSB_D, "8"],
    [Constant.Transceiver.OpeMode.FM_D, "A"],
    [Constant.Transceiver.OpeMode.USB_D, "C"],
  ])("RSTの運用モード%sを、FT-991のコード%sに変換すること", (modeText, code) => {
    expect(TransceiverYaesuFt991CmdMaker.modeTextToCode(modeText)).toBe(code);
  });

  it("設定できない運用モード（DV、未設定、不明な値）の場合はnullを返すこと", () => {
    expect(TransceiverYaesuFt991CmdMaker.modeTextToCode(Constant.Transceiver.OpeMode.DV)).toBeNull();
    expect(TransceiverYaesuFt991CmdMaker.modeTextToCode("")).toBeNull();
    expect(TransceiverYaesuFt991CmdMaker.modeTextToCode("XXX")).toBeNull();
  });
});
