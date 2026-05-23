import CommonUtil from "@/common/CommonUtil.js";
import { describe, expect, it } from "vitest";

describe("CommonUtil_toString", () => {
  it("null_undefined系", () => {
    expect(CommonUtil.toString(null)).toBe("");
    expect(CommonUtil.toString(undefined)).toBe("");
  });

  it("number", () => {
    expect(CommonUtil.toString(0)).toBe("0");
    expect(CommonUtil.toString(-1)).toBe("-1");
    expect(CommonUtil.toString(1)).toBe("1");
  });

  it("string", () => {
    expect(CommonUtil.toString("")).toBe("");
    expect(CommonUtil.toString("abc")).toBe("abc");
  });
});
