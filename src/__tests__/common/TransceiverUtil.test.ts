import TransceiverUtil from "@/common/util/TransceiverUtil";

describe("TransceiverUtil", () => {
  test("周波数をドット区切りの文字列に変換する", () => {
    expect(TransceiverUtil.formatWithDot(11000000000)).toBe("1000.000.000");
    expect(TransceiverUtil.formatWithDot(1000000000)).toBe("1000.000.000");
    expect(TransceiverUtil.formatWithDot(100000)).toBe("0000.100.000");
    expect(TransceiverUtil.formatWithDot(100)).toBe("0000.000.100");
    expect(TransceiverUtil.formatWithDot(1)).toBe("0000.000.001");
    expect(TransceiverUtil.formatWithDot(1.1)).toBe("0000.000.001");
  });

  test("ドット区切りの文字列に数値の周波数に変換する", () => {
    expect(TransceiverUtil.parseNumber("1000.000.000")).toBe(1000000000);
    expect(TransceiverUtil.parseNumber("0000.100.000")).toBe(100000);
    expect(TransceiverUtil.parseNumber("0000.000.100")).toBe(100);
    expect(TransceiverUtil.parseNumber("0000.000.001")).toBe(1);
  });
});
