import { CivCommand } from "@/main/service/transceiver/controller/TransceiverIcomCmdMaker.js";
import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomRecvParser.parseCurrentBand", () => {
  it("メインバンドの応答の場合は'00'を返すこと", () => {
    expect(TransceiverIcomRecvParser.parseCurrentBand("fefee07c07d200fd")).toBe(CivCommand.Band.MAIN);
  });

  it("サブバンドの応答の場合は'01'を返すこと", () => {
    expect(TransceiverIcomRecvParser.parseCurrentBand("fefee07c07d201fd")).toBe(CivCommand.Band.SUB);
  });

  it("タイムアウト（'TIMEOUT'）の場合はメインバンドと一致しない値を返すこと", () => {
    expect(TransceiverIcomRecvParser.parseCurrentBand("TIMEOUT")).not.toBe(CivCommand.Band.MAIN);
  });
});
