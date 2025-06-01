import { AppConfigRotator } from "@/common/model/AppConfigModel";
import RotatorHelper from "@/common/util/RotatorHelper";

describe("RotatorHelper.isWithinRangeElのテスト", () => {
  test("Elの範囲チェック", () => {
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
