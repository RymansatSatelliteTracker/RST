import CommonUtil from "@/common/CommonUtil";
import { describe, expect, it } from "vitest";

/**
 * CommonUtil.isNumberのテスト
 */
describe("CommonUtil.isNumber", () => {
  /**
   * ブランク
   */
  it("empty", () => {
    const result = CommonUtil.isNumber("");
    expect(result).toBe(false);
  });

  /**
   * null
   */
  it("null", () => {
    const result = CommonUtil.isNumber(null);
    expect(result).toBe(false);
  });

  /**
   * undefined
   */
  it("undefined", () => {
    const result = CommonUtil.isNumber(undefined);
    expect(result).toBe(false);
  });

  /**
   * テキスト
   */
  it("text", () => {
    const result = CommonUtil.isNumber("テキスト");
    expect(result).toBe(false);
  });

  /**
   * 数値
   */
  it("number0", () => {
    const result = CommonUtil.isNumber(0);
    expect(result).toBe(true);
  });

  it("number1", () => {
    const result = CommonUtil.isNumber(1);
    expect(result).toBe(true);
  });

  it("number1_1", () => {
    const result = CommonUtil.isNumber(1.1);
    expect(result).toBe(true);
  });

  it("numberMinus1_1", () => {
    const result = CommonUtil.isNumber(1.1);
    expect(result).toBe(true);
  });

  it("numberMinus1", () => {
    const result = CommonUtil.isNumber(-1);
    expect(result).toBe(true);
  });

  it("numberMinus0", () => {
    const result = CommonUtil.isNumber(-0);
    expect(result).toBe(true);
  });
});
