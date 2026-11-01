import Constant from "@/common/Constant.js";
import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomRecvParser.parseMode", () => {
  it.each([
    ["00", Constant.Transceiver.OpeMode.LSB],
    ["01", Constant.Transceiver.OpeMode.USB],
    ["02", Constant.Transceiver.OpeMode.AM],
    ["03", Constant.Transceiver.OpeMode.CW],
    ["04", Constant.Transceiver.OpeMode.RTTY],
    ["05", Constant.Transceiver.OpeMode.FM],
    ["17", Constant.Transceiver.OpeMode.DV],
  ])("運用モードコード%sを%sに変換すること", (code, expected) => {
    expect(TransceiverIcomRecvParser.parseMode(`fefee07c04${code}01fd`)).toBe(expected);
  });

  it("未知の運用モードコードの場合はnullを返すこと", () => {
    expect(TransceiverIcomRecvParser.parseMode("fefee07c040701fd")).toBeNull();
    expect(TransceiverIcomRecvParser.parseMode("fefee07c04ff01fd")).toBeNull();
  });

  it("トランシーブ（コマンド01）の運用モードデータも同じ位置から変換すること", () => {
    expect(TransceiverIcomRecvParser.parseMode("fefee07c010501fd")).toBe(Constant.Transceiver.OpeMode.FM);
  });

  it("データモードの有無は運用モードの変換結果に影響しないこと（データモードは別コマンドで取得する）", () => {
    expect(TransceiverIcomRecvParser.parseMode("fefee07c040101fd")).toBe(Constant.Transceiver.OpeMode.USB);
  });
});
