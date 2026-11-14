import CommonUtil from "@/common/CommonUtil.js";
import { expect, it } from "vitest";

/**
 * ブランク
 */
it("empty", () => {
  const result = CommonUtil.isEmpty("");
  expect(result).toBe(true);
});

/**
 * null
 */
it("null", () => {
  const result = CommonUtil.isEmpty(null);
  expect(result).toBe(true);
});

/**
 * undefined
 */
it("undefined", () => {
  const result = CommonUtil.isEmpty(undefined);
  expect(result).toBe(true);
});

/**
 * 非ブランク
 */
it("not_empty", () => {
  const result = CommonUtil.isEmpty("テキスト");
  expect(result).toBe(false);
});
