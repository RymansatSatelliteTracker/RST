import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomRecvParser.trimRecvData", () => {
  it("プリアンブル（fefe）から始まるデータはそのまま返すこと", () => {
    expect(TransceiverIcomRecvParser.trimRecvData("fefee07cfbfd")).toBe("fefee07cfbfd");
  });

  it("先頭に付いている'00'を読み捨てること", () => {
    expect(TransceiverIcomRecvParser.trimRecvData("00fefee07cfbfd")).toBe("fefee07cfbfd");
    expect(TransceiverIcomRecvParser.trimRecvData("0000fefee07cfbfd")).toBe("fefee07cfbfd");
  });

  it("プリアンブルより前の任意のデータを読み捨てること", () => {
    expect(TransceiverIcomRecvParser.trimRecvData("abfefee07cfbfd")).toBe("fefee07cfbfd");
  });

  it("プリアンブルが含まれない場合は空文字を返すこと", () => {
    expect(TransceiverIcomRecvParser.trimRecvData("00e07cfbfd")).toBe("");
    expect(TransceiverIcomRecvParser.trimRecvData("")).toBe("");
  });
});
