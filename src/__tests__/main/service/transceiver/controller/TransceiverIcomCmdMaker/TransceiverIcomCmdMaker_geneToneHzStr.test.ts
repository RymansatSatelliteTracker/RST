import TransceiverIcomCmdMaker from "@/main/service/transceiver/controller/TransceiverIcomCmdMaker";

describe("TransceiverIcomCmdMaker.geneToneHzStrのテスト", () => {
  it("小数点なしの周波数の場合は３桁＋'0'の文字列を返す", () => {
    const maker = new TransceiverIcomCmdMaker(0x99, "DMY-IC-9700");
    expect(maker["geneToneHzStr"](1)).toBe("000010");
    expect(maker["geneToneHzStr"](12)).toBe("000120");
    expect(maker["geneToneHzStr"](123)).toBe("001230");
    expect(maker["geneToneHzStr"](999)).toBe("009990");
  });

  it("小数点付きの周波数の場合は３桁＋１桁の文字列を返す", () => {
    const maker = new TransceiverIcomCmdMaker(0x99, "DMY-IC-9700");
    expect(maker["geneToneHzStr"](1.2)).toBe("000012");
    expect(maker["geneToneHzStr"](12.3)).toBe("000123");
    expect(maker["geneToneHzStr"](123.4)).toBe("001234");
    expect(maker["geneToneHzStr"](999.9)).toBe("009999");
  });

  it("桁あふれの場合は例外が送出される", () => {
    const maker = new TransceiverIcomCmdMaker(0x99, "DMY-IC-9700");
    expect(() => maker["geneToneHzStr"](1000)).toThrow("toneHzは999.9以下の値を指定してください。");
  });
});
