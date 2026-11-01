import Constant from "@/common/Constant.js";
import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomRecvParser.getValueFromDataMode", () => {
  it.each([Constant.Transceiver.OpeMode.LSB_D, Constant.Transceiver.OpeMode.USB_D, Constant.Transceiver.OpeMode.FM_D])(
    "データモード付きの運用モード（%s）の場合は'01'を返すこと",
    (mode) => {
      expect(TransceiverIcomRecvParser.getValueFromDataMode(mode)).toBe("01");
    }
  );

  it.each([
    Constant.Transceiver.OpeMode.LSB,
    Constant.Transceiver.OpeMode.USB,
    Constant.Transceiver.OpeMode.FM,
    Constant.Transceiver.OpeMode.AM,
    Constant.Transceiver.OpeMode.CW,
    Constant.Transceiver.OpeMode.RTTY,
    Constant.Transceiver.OpeMode.DV,
    "",
  ])("データモードなしの運用モード（'%s'）の場合は'00'を返すこと", (mode) => {
    expect(TransceiverIcomRecvParser.getValueFromDataMode(mode)).toBe("00");
  });
});

describe("TransceiverIcomRecvParser.parseDataMode", () => {
  it("データモードOff（00）を返すこと", () => {
    expect(TransceiverIcomRecvParser.parseDataMode("fefee07c1a060000fd")).toBe("00");
  });

  it("データモードOn（01）を返すこと", () => {
    expect(TransceiverIcomRecvParser.parseDataMode("fefee07c1a060101fd")).toBe("01");
  });

  it("00/01以外の値の場合はnullを返すこと", () => {
    expect(TransceiverIcomRecvParser.parseDataMode("fefee07c1a060201fd")).toBeNull();
    expect(TransceiverIcomRecvParser.parseDataMode("fefee07c1a06fd")).toBeNull();
  });
});
