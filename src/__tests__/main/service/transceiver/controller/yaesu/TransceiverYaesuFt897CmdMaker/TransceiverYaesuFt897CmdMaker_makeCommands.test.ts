import Constant from "@/common/Constant.js";
import TransceiverYaesuFt897CmdMaker from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897CmdMaker.js";
import { describe, expect, it } from "vitest";

describe("TransceiverYaesuFt897CmdMaker.makeSetFreq", () => {
  const maker = new TransceiverYaesuFt897CmdMaker();

  it("周波数を、10Hz単位のBCD（上位桁から順の4バイト）で設定するコマンド（01）を返すこと", () => {
    // マニュアルの例：21.17500MHz → 02 11 75 00
    expect(Array.from(maker.makeSetFreq(21175000))).toEqual([0x02, 0x11, 0x75, 0x00, 0x01]);
    // マニュアルの例：439.70MHz → 43 97 00 00
    expect(Array.from(maker.makeSetFreq(439700000))).toEqual([0x43, 0x97, 0x00, 0x00, 0x01]);
  });

  it("144MHz帯、430MHz帯の周波数を変換すること", () => {
    expect(Array.from(maker.makeSetFreq(145800000))).toEqual([0x14, 0x58, 0x00, 0x00, 0x01]);
    expect(Array.from(maker.makeSetFreq(435123450))).toEqual([0x43, 0x51, 0x23, 0x45, 0x01]);
  });

  it("10Hz未満は四捨五入されること", () => {
    expect(Array.from(maker.makeSetFreq(145800004))).toEqual([0x14, 0x58, 0x00, 0x00, 0x01]);
    expect(Array.from(maker.makeSetFreq(145800005))).toEqual([0x14, 0x58, 0x00, 0x01, 0x01]);
  });

  it("下限、上限の周波数を変換すること", () => {
    expect(Array.from(maker.makeSetFreq(30000))).toEqual([0x00, 0x00, 0x30, 0x00, 0x01]);
    expect(Array.from(maker.makeSetFreq(470000000))).toEqual([0x47, 0x00, 0x00, 0x00, 0x01]);
  });

  it.each([
    [30000, true],
    [145800000, true],
    [470000000, true],
    [29999, false],
    [470000001, false],
    [0, false],
    [Number.NaN, false],
  ])("周波数%sが設定可能な範囲（30kHz〜470MHz）内かの判定は%sであること", (freqHz, expected) => {
    expect(TransceiverYaesuFt897CmdMaker.isFreqInRange(freqHz)).toBe(expected);
  });
});

describe("TransceiverYaesuFt897CmdMaker 各コマンドの生成", () => {
  const maker = new TransceiverYaesuFt897CmdMaker();

  it("運用モードの設定コマンド（07）を返すこと", () => {
    expect(Array.from(maker.makeSetMode(0x01))).toEqual([0x01, 0x00, 0x00, 0x00, 0x07]);
    expect(Array.from(maker.makeSetMode(0x0c))).toEqual([0x0c, 0x00, 0x00, 0x00, 0x07]);
  });

  it("VFO A/Bの切り替えコマンド（81）を返すこと", () => {
    expect(Array.from(maker.makeToggleVfo())).toEqual([0x00, 0x00, 0x00, 0x00, 0x81]);
  });

  it("SPLITのOn（02）、Off（82）のコマンドを返すこと", () => {
    expect(Array.from(maker.makeSetSplit(true))).toEqual([0x00, 0x00, 0x00, 0x00, 0x02]);
    expect(Array.from(maker.makeSetSplit(false))).toEqual([0x00, 0x00, 0x00, 0x00, 0x82]);
  });

  it("トーンの動作の設定コマンド（0A）を返すこと（Onは送信時のみのCTCSS ENC：4A、Offは8A）", () => {
    expect(Array.from(maker.makeSetToneMode(true))).toEqual([0x4a, 0x00, 0x00, 0x00, 0x0a]);
    expect(Array.from(maker.makeSetToneMode(false))).toEqual([0x8a, 0x00, 0x00, 0x00, 0x0a]);
  });

  it("読み取りコマンド（周波数・モード：03、送信ステータス：F7）を返すこと", () => {
    expect(Array.from(maker.makeGetFreqMode())).toEqual([0x00, 0x00, 0x00, 0x00, 0x03]);
    expect(Array.from(maker.makeGetTxStatus())).toEqual([0x00, 0x00, 0x00, 0x00, 0xf7]);
  });
});

describe("TransceiverYaesuFt897CmdMaker.makeSetToneFreq", () => {
  const maker = new TransceiverYaesuFt897CmdMaker();

  it("トーン周波数を、0.1Hz単位のBCDで、送信用と受信用に同じ値を設定するコマンド（0B）を返すこと", () => {
    // マニュアルの例：88.5Hz → 08 85
    expect(Array.from(maker.makeSetToneFreq(88.5))).toEqual([0x08, 0x85, 0x08, 0x85, 0x0b]);
    // マニュアルの例：100.0Hz → 10 00
    expect(Array.from(maker.makeSetToneFreq(100.0))).toEqual([0x10, 0x00, 0x10, 0x00, 0x0b]);
    expect(Array.from(maker.makeSetToneFreq(67.0))).toEqual([0x06, 0x70, 0x06, 0x70, 0x0b]);
    expect(Array.from(maker.makeSetToneFreq(254.1))).toEqual([0x25, 0x41, 0x25, 0x41, 0x0b]);
  });

  it("トーン周波数が文字列で渡された場合も、変換できること（設定ファイルでは文字列で保持されるため）", () => {
    expect(Array.from(maker.makeSetToneFreq("88.5" as unknown as number))).toEqual([0x08, 0x85, 0x08, 0x85, 0x0b]);
  });

  it("設定できないトーン周波数（0以下、1000Hz以上、数値でない）の場合は、例外を送出すること", () => {
    expect(() => maker.makeSetToneFreq(0)).toThrow("設定できないトーン周波数");
    expect(() => maker.makeSetToneFreq(-1)).toThrow("設定できないトーン周波数");
    expect(() => maker.makeSetToneFreq(1000)).toThrow("設定できないトーン周波数");
    expect(() => maker.makeSetToneFreq(Number.NaN)).toThrow("設定できないトーン周波数");
  });
});

describe("TransceiverYaesuFt897CmdMaker.modeTextToCode", () => {
  it.each([
    [Constant.Transceiver.OpeMode.LSB, 0x00],
    [Constant.Transceiver.OpeMode.USB, 0x01],
    [Constant.Transceiver.OpeMode.CW, 0x02],
    [Constant.Transceiver.OpeMode.AM, 0x04],
    [Constant.Transceiver.OpeMode.FM, 0x08],
    // USB-D、LSB-DはDIG、FM-DはPKT
    [Constant.Transceiver.OpeMode.LSB_D, 0x0a],
    [Constant.Transceiver.OpeMode.USB_D, 0x0a],
    [Constant.Transceiver.OpeMode.FM_D, 0x0c],
  ])("RSTの運用モード%sを、FT-897のコード%sに変換すること", (modeText, code) => {
    expect(TransceiverYaesuFt897CmdMaker.modeTextToCode(modeText)).toBe(code);
  });

  it("設定できない運用モード（RTTY、DV、未設定、不明な値）の場合はnullを返すこと", () => {
    expect(TransceiverYaesuFt897CmdMaker.modeTextToCode(Constant.Transceiver.OpeMode.RTTY)).toBeNull();
    expect(TransceiverYaesuFt897CmdMaker.modeTextToCode(Constant.Transceiver.OpeMode.DV)).toBeNull();
    expect(TransceiverYaesuFt897CmdMaker.modeTextToCode("")).toBeNull();
    expect(TransceiverYaesuFt897CmdMaker.modeTextToCode("XXX")).toBeNull();
  });
});
