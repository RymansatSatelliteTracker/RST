import CommonUtil from "@/common/CommonUtil";

/**
 * CommonUtil.isNumberのテスト
 */
describe("CommonUtil.isNumber", () => {
  /**
   * ブランク
   */
  test("empty", () => {
    const result = CommonUtil.isNumber("");
    expect(result).toBe(false);
  });

  /**
   * null
   */
  test("null", () => {
    const result = CommonUtil.isNumber(null);
    expect(result).toBe(false);
  });

  /**
   * undefined
   */
  test("undefined", () => {
    const result = CommonUtil.isNumber(undefined);
    expect(result).toBe(false);
  });

  /**
   * テキスト
   */
  test("text", () => {
    const result = CommonUtil.isNumber("テキスト");
    expect(result).toBe(false);
  });

  /**
   * 数値
   */
  test("number0", () => {
    const result = CommonUtil.isNumber(0);
    expect(result).toBe(true);
  });

  test("number1", () => {
    const result = CommonUtil.isNumber(1);
    expect(result).toBe(true);
  });

  test("number1_1", () => {
    const result = CommonUtil.isNumber(1.1);
    expect(result).toBe(true);
  });

  test("numberMinus1_1", () => {
    const result = CommonUtil.isNumber(1.1);
    expect(result).toBe(true);
  });

  test("numberMinus1", () => {
    const result = CommonUtil.isNumber(-1);
    expect(result).toBe(true);
  });

  test("numberMinus0", () => {
    const result = CommonUtil.isNumber(-0);
    expect(result).toBe(true);
  });
});
