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
});
