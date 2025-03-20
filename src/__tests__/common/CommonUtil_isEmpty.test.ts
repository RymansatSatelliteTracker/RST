import CommonUtil from "@/common/CommonUtil";

/**
 * ブランク
 */
test("empty", () => {
  const result = CommonUtil.isEmpty("");
  expect(result).toBe(true);
});

/**
 * null
 */
test("null", () => {
  const result = CommonUtil.isEmpty(null);
  expect(result).toBe(true);
});

/**
 * undefined
 */
test("undefined", () => {
  const result = CommonUtil.isEmpty(undefined);
  expect(result).toBe(true);
});

/**
 * 非ブランク
 */
test("not_empty", () => {
  const result = CommonUtil.isEmpty("テキスト");
  expect(result).toBe(false);
});
