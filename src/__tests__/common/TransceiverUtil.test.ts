import TransceiverUtil from "@/common/util/TransceiverUtil";

describe("TransceiverUtil", () => {
  test("周波数をMHzの数値からHzの数値に変換する", () => {
    expect(TransceiverUtil.mhzToHz(1)).toBe(1000000);
    expect(TransceiverUtil.mhzToHz(1.5)).toBe(1500000);
  });

  test("周波数をHzの数値からMHzの数値に変換する", () => {
    expect(TransceiverUtil.hzToMhz(1000000)).toBe(1);
    expect(TransceiverUtil.hzToMhz(1500000)).toBe(1.5);
  });

  test("周波数をHzの数値からMHzの文字列に変換する", () => {
    expect(TransceiverUtil.hzToMhzString(1000000)).toBe("0001.000");
    expect(TransceiverUtil.hzToMhzString(1500000)).toBe("0001.500");
    expect(TransceiverUtil.hzToMhzString(123456789)).toBe("0123.456");
  });

  test("周波数をMHzの数値からMHzの文字列に変換する", () => {
    expect(TransceiverUtil.mhzToMhzString(1.0)).toBe("0001.000");
    expect(TransceiverUtil.mhzToMhzString(1.5)).toBe("0001.500");
    expect(TransceiverUtil.mhzToMhzString(123.456)).toBe("0123.456");
  });

  test("周波数をドット区切りの文字列に変換する", () => {
    expect(TransceiverUtil.formatWithDot(1000000000)).toBe("1000.000.000");
    expect(TransceiverUtil.formatWithDot(100000)).toBe("0000.100.000");
    expect(TransceiverUtil.formatWithDot(100)).toBe("0000.000.100");
    expect(TransceiverUtil.formatWithDot(1)).toBe("0000.000.001");
  });

  test("ドット区切りの文字列に数値の周波数に変換する", () => {
    expect(TransceiverUtil.parseNumber("1000.000.000")).toBe(1000000000);
    expect(TransceiverUtil.parseNumber("0000.100.000")).toBe(100000);
    expect(TransceiverUtil.parseNumber("0000.000.100")).toBe(100);
    expect(TransceiverUtil.parseNumber("0000.000.001")).toBe(1);
  });
});
