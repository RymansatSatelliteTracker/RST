import { AppConfigRotator } from "@/common/model/AppConfigModel";
import RotatorHelper from "@/common/util/RotatorHelper";

describe("RotatorHelper.isWithinRangeのテスト", () => {
  test("Az,Elの範囲チェック", () => {
    const rotatorConfig = new AppConfigRotator();
    rotatorConfig.rangeAzMin = 0;
    rotatorConfig.rangeAzMax = 10;
    rotatorConfig.rangeElMin = 0;
    rotatorConfig.rangeElMax = 10;

    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: -1, elevation: -1 })).toBe(false);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: -1, elevation: 0 })).toBe(false);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: 0, elevation: -1 })).toBe(false);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: 0, elevation: 0 })).toBe(true);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: 5, elevation: 5 })).toBe(true);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: 10, elevation: 10 })).toBe(true);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: 11, elevation: 10 })).toBe(false);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: 10, elevation: 11 })).toBe(false);
    expect(RotatorHelper.isWithinRange(rotatorConfig, { azimuth: 11, elevation: 11 })).toBe(false);
  });
});
