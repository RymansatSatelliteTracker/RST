import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomRecvParser.parseFreq", () => {
  it("周波数データ（BCD、下位桁から順）を周波数（Hz）に変換すること", () => {
    // 145.580.000Hz → データ部は下位桁から "00 00 58 45 01"
    expect(TransceiverIcomRecvParser.parseFreq("fefee07c030000584501fd")).toBe(145580000);
  });

  it("各桁の位置が正しく変換されること", () => {
    // 1.234.567.890Hz → データ部は "90 78 56 34 12"
    expect(TransceiverIcomRecvParser.parseFreq("fefee07c039078563412fd")).toBe(1234567890);
  });

  it("430MHz帯の周波数を変換すること", () => {
    // 435.000.000Hz → データ部は "00 00 00 35 04"
    expect(TransceiverIcomRecvParser.parseFreq("fefee0a2030000003504fd")).toBe(435000000);
  });

  it("周波数0の場合は0を返すこと", () => {
    expect(TransceiverIcomRecvParser.parseFreq("fefee07c030000000000fd")).toBe(0);
  });

  it("トランシーブ（コマンド00）の周波数データも同じ位置から変換すること", () => {
    expect(TransceiverIcomRecvParser.parseFreq("fefee07c000000584501fd")).toBe(145580000);
  });
});
