import { AppConfigRotator } from "@/common/model/AppConfigModel.js";
import RotatorHelper from "@/common/util/RotatorHelper.js";
import { describe, expect, it } from "vitest";

describe("RotatorHelper.isWithinRangeElのテスト", () => {
  it("Elの範囲チェック", () => {
    const rotatorConfig = new AppConfigRotator();
    rotatorConfig.rangeElMin = 0;
    rotatorConfig.rangeElMax = 10;

    expect(RotatorHelper.isWithinRangeEl(rotatorConfig, -1)).toBe(false);
    expect(RotatorHelper.isWithinRangeEl(rotatorConfig, 0)).toBe(true);
    expect(RotatorHelper.isWithinRangeEl(rotatorConfig, 5)).toBe(true);
    expect(RotatorHelper.isWithinRangeEl(rotatorConfig, 10)).toBe(true);
    expect(RotatorHelper.isWithinRangeEl(rotatorConfig, 11)).toBe(false);
  });
});
