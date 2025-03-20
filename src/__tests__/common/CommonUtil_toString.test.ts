import CommonUtil from "@/common/CommonUtil";

describe("CommonUtil_toString", () => {
  test("null_undefined系", () => {
    expect(CommonUtil.toString(null)).toBe("");
    expect(CommonUtil.toString(undefined)).toBe("");
  });

  test("number", () => {
    expect(CommonUtil.toString(0)).toBe("0");
    expect(CommonUtil.toString(-1)).toBe("-1");
    expect(CommonUtil.toString(1)).toBe("1");
  });

  test("string", () => {
    expect(CommonUtil.toString("")).toBe("");
    expect(CommonUtil.toString("abc")).toBe("abc");
  });
});
