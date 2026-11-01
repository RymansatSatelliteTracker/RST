import Constant from "@/common/Constant.js";
import TransceiverIcomCmdMaker, { CivCommand } from "@/main/service/transceiver/controller/TransceiverIcomCmdMaker.js";
import { describe, expect, it } from "vitest";

// IC-9700のCI-Vアドレス
const CIV = 0xa2;
// コマンド共通のプレフィックス（プリアンブル×2、無線機のCI-Vアドレス、PCアドレス）
const PREFIX = [0xfe, 0xfe, CIV, 0xe0];
// コマンド共通のサフィックス（ポストアンブル）
const SUFFIX = [0xfd];

/**
 * プレフィックスとサフィックスを付与したコマンドのバイト列を返す
 */
function cmd(...body: number[]): number[] {
  return [...PREFIX, ...body, ...SUFFIX];
}

describe("TransceiverIcomCmdMaker 各コマンドの生成", () => {
  const maker = new TransceiverIcomCmdMaker(CIV, "DMY-IC-9700");

  it("コマンドにプレフィックス（FE FE CI-Vアドレス E0）とサフィックス（FD）が付与されること", () => {
    const res = Array.from(maker.makeGetFreq());
    expect(res.slice(0, 4)).toEqual(PREFIX);
    expect(res[res.length - 1]).toBe(CivCommand.POSTAMBLE);
  });

  it("コンストラクタで指定したCI-Vアドレスが使われること", () => {
    const maker7c = new TransceiverIcomCmdMaker(0x7c, "DMY-IC-9100");
    expect(Array.from(maker7c.makeGetFreq())).toEqual([0xfe, 0xfe, 0x7c, 0xe0, 0x03, 0xfd]);
  });

  it("makeSetTranceive：トランシーブOn/Offのコマンド（1A 05 01 27 xx）を返すこと", () => {
    expect(Array.from(maker.makeSetTranceive(0x01))).toEqual(cmd(0x1a, 0x05, 0x01, 0x27, 0x01));
    expect(Array.from(maker.makeSetTranceive(0x00))).toEqual(cmd(0x1a, 0x05, 0x01, 0x27, 0x00));
  });

  it("makeSwitchVfoA：VFO-Aへの切り替えコマンド（07 00）を返すこと", () => {
    expect(Array.from(maker.makeSwitchVfoA())).toEqual(cmd(0x07, 0x00));
  });

  it("makeGetBand：現在のバンドの取得コマンド（07 D2）を返すこと", () => {
    expect(Array.from(maker.makeGetBand())).toEqual(cmd(0x07, 0xd2));
  });

  it("makeSwitchToMainBand：メインバンドへの切り替えコマンド（07 D0）を返すこと", () => {
    expect(Array.from(maker.makeSwitchToMainBand())).toEqual(cmd(0x07, 0xd0));
  });

  it("makeSwitchToSubBand：サブバンドへの切り替えコマンド（07 D1）を返すこと", () => {
    expect(Array.from(maker.makeSwitchToSubBand())).toEqual(cmd(0x07, 0xd1));
  });

  it("makeSetInvertBand：メイン／サブの入れ替えコマンド（07 B0）を返すこと", () => {
    expect(Array.from(maker.makeSetInvertBand())).toEqual(cmd(0x07, 0xb0));
  });

  it("makeGetFreq：周波数の取得コマンド（03）を返すこと", () => {
    expect(Array.from(maker.makeGetFreq())).toEqual(cmd(0x03));
  });

  it("makeGetMode：運用モードの取得コマンド（04）を返すこと", () => {
    expect(Array.from(maker.makeGetMode())).toEqual(cmd(0x04));
  });

  it("makeSetOpeMode：運用モードの設定コマンド（06 xx）を返すこと", () => {
    expect(Array.from(maker.makeSetOpeMode("00"))).toEqual(cmd(0x06, 0x00));
    expect(Array.from(maker.makeSetOpeMode("05"))).toEqual(cmd(0x06, 0x05));
    expect(Array.from(maker.makeSetOpeMode("17"))).toEqual(cmd(0x06, 0x17));
  });

  it("makeSetDataMode：データモードOffはフィルター00で設定コマンド（1A 06 00 00）を返すこと", () => {
    expect(Array.from(maker.makeSetDataMode(CivCommand.DataMode.OFF))).toEqual(cmd(0x1a, 0x06, 0x00, 0x00));
  });

  it("makeSetDataMode：データモードOnはフィルター01で設定コマンド（1A 06 01 01）を返すこと", () => {
    expect(Array.from(maker.makeSetDataMode(CivCommand.DataMode.ON))).toEqual(cmd(0x1a, 0x06, 0x01, 0x01));
  });

  it("makeGetDataMode：データモードの取得コマンド（1A 06）を返すこと", () => {
    expect(Array.from(maker.makeGetDataMode())).toEqual(cmd(0x1a, 0x06));
  });

  it("makeSetToneCmd：TONE On/Offのコマンド（16 42 xx）を返すこと", () => {
    expect(Array.from(maker.makeSetToneCmd(true))).toEqual(cmd(0x16, 0x42, 0x01));
    expect(Array.from(maker.makeSetToneCmd(false))).toEqual(cmd(0x16, 0x42, 0x00));
  });

  it("makeSetToneFreqCmd：TONE周波数の設定コマンド（1B 00 + BCD3バイト）を返すこと", () => {
    // 88.5Hz → "000885"
    expect(Array.from(maker.makeSetToneFreqCmd(88.5))).toEqual(cmd(0x1b, 0x00, 0x00, 0x08, 0x85));
    // 67Hz → "000670"
    expect(Array.from(maker.makeSetToneFreqCmd(67))).toEqual(cmd(0x1b, 0x00, 0x00, 0x06, 0x70));
    // 254.1Hz → "002541"
    expect(Array.from(maker.makeSetToneFreqCmd(254.1))).toEqual(cmd(0x1b, 0x00, 0x00, 0x25, 0x41));
  });
});

describe("TransceiverIcomCmdMaker.makeSetFreq", () => {
  const maker = new TransceiverIcomCmdMaker(CIV, "DMY-IC-9700");

  it("周波数をBCD（下位桁から順の5バイト）で設定コマンド（00）を返すこと", () => {
    // 145.580.000Hz → "0145580000" → 00 00 58 45 01
    expect(Array.from(maker.makeSetFreq(145580000))).toEqual(cmd(0x00, 0x00, 0x00, 0x58, 0x45, 0x01));
  });

  it("各桁の位置が正しくエンコードされること", () => {
    // 1.234.567.890Hz → 90 78 56 34 12
    expect(Array.from(maker.makeSetFreq(1234567890))).toEqual(cmd(0x00, 0x90, 0x78, 0x56, 0x34, 0x12));
  });

  it("小数点以下は切り捨てられること", () => {
    expect(Array.from(maker.makeSetFreq(435000000.9))).toEqual(cmd(0x00, 0x00, 0x00, 0x00, 0x35, 0x04));
  });

  it("周波数0の場合は全桁0のコマンドを返すこと", () => {
    expect(Array.from(maker.makeSetFreq(0))).toEqual(cmd(0x00, 0x00, 0x00, 0x00, 0x00, 0x00));
  });
});

describe("TransceiverIcomCmdMaker サテライトモードのコマンド（機種による違い）", () => {
  it("IC-910以外：サテライトモード設定は16 5A xx、取得は16 5Aを返すこと", () => {
    const maker = new TransceiverIcomCmdMaker(CIV, "DMY-IC-9700");
    expect(Array.from(maker.makeSetSatelliteMode(true))).toEqual(cmd(0x16, 0x5a, 0x01));
    expect(Array.from(maker.makeSetSatelliteMode(false))).toEqual(cmd(0x16, 0x5a, 0x00));
    expect(Array.from(maker.makeGetSatelliteMode())).toEqual(cmd(0x16, 0x5a));
  });

  it("IC-910：サテライトモード設定は1A 07 xx、取得は1A 07を返すこと", () => {
    const maker = new TransceiverIcomCmdMaker(0x60, Constant.Transceiver.TransceiverId.ICOM_IC910);
    const p = [0xfe, 0xfe, 0x60, 0xe0];
    expect(Array.from(maker.makeSetSatelliteMode(true))).toEqual([...p, 0x1a, 0x07, 0x01, 0xfd]);
    expect(Array.from(maker.makeSetSatelliteMode(false))).toEqual([...p, 0x1a, 0x07, 0x00, 0xfd]);
    expect(Array.from(maker.makeGetSatelliteMode())).toEqual([...p, 0x1a, 0x07, 0xfd]);
  });
});
