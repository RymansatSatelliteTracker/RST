import { AppConfigModel } from "@/common/model/AppConfigModel";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper";

describe("AutoTrackingHelper", () => {
  describe("getOffsetBaseDate", () => {
    const baseDate = new Date("2026-01-01T12:00:00Z");

    it("無線機の開始・終了時刻が大きい場合、無線機側の値でオフセットすること", () => {
      const appConfig = new AppConfigModel();
      appConfig.rotator.startAgoMinute = 3;
      appConfig.transceiver.autoTrackingStartEndTime = "5";

      const result = AutoTrackingHelper.getOffsetBaseDate(appConfig, baseDate);

      expect(result.getTime()).toBe(baseDate.getTime() - 5 * 60 * 1000);
    });

    it("ローテータの開始・終了時刻が大きい場合、ローテータ側の値でオフセットすること", () => {
      const appConfig = new AppConfigModel();
      appConfig.rotator.startAgoMinute = 7;
      appConfig.transceiver.autoTrackingStartEndTime = "4";

      const result = AutoTrackingHelper.getOffsetBaseDate(appConfig, baseDate);

      expect(result.getTime()).toBe(baseDate.getTime() - 7 * 60 * 1000);
    });

    it("無線機の開始・終了時刻が数値でない場合、ローテータ側の値を採用すること", () => {
      const appConfig = new AppConfigModel();
      appConfig.rotator.startAgoMinute = 6;
      appConfig.transceiver.autoTrackingStartEndTime = "abc";

      const result = AutoTrackingHelper.getOffsetBaseDate(appConfig, baseDate);

      expect(result.getTime()).toBe(baseDate.getTime() - 6 * 60 * 1000);
    });
  });
});
