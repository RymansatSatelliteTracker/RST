import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper.js";

describe("AutoTrackingHelper", () => {
  describe("getRotatorOffsetBaseDate", () => {
    const baseDate = new Date("2026-01-01T12:00:00Z");

    it("ローテータの開始・終了時刻でオフセットすること", () => {
      const appConfig = new AppConfigModel();
      appConfig.rotator.startAgoMinute = 8;
      appConfig.transceiver.autoTrackingStartEndTime = "3";

      const result = AutoTrackingHelper.getRotatorOffsetBaseDate(appConfig, baseDate);

      expect(result.getTime()).toBe(baseDate.getTime() - 8 * 60 * 1000);
    });
  });
});
