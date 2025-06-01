import { AppConfigRotator } from "@/common/model/AppConfigModel";
import RotatorHelper from "@/common/util/RotatorHelper";

describe("RotatorHelper.isWithinRangeAzのテスト", () => {
  test("Azの範囲チェック", () => {
    const rotatorConfig = new AppConfigRotator();
    rotatorConfig.rangeAzMin = 0;
    rotatorConfig.rangeAzMax = 10;

    expect(RotatorHelper.isWithinRangeAz(rotatorConfig, -1)).toBe(false);
    expect(RotatorHelper.isWithinRangeAz(rotatorConfig, 0)).toBe(true);
    expect(RotatorHelper.isWithinRangeAz(rotatorConfig, 5)).toBe(true);
    expect(RotatorHelper.isWithinRangeAz(rotatorConfig, 10)).toBe(true);
    expect(RotatorHelper.isWithinRangeAz(rotatorConfig, 11)).toBe(false);
  });
});
