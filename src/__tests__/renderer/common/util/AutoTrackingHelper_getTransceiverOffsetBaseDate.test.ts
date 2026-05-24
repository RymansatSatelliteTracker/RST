import { AppConfigModel } from "@/common/model/AppConfigModel";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper";
import { describe, expect, it } from "vitest";

describe("AutoTrackingHelper", () => {
  describe("getTransceiverOffsetBaseDate", () => {
    const baseDate = new Date("2026-01-01T12:00:00Z");

    it("無線機の開始・終了時刻でオフセットすること", () => {
      const appConfig = new AppConfigModel();
      appConfig.rotator.startAgoMinute = 8;
      appConfig.transceiver.autoTrackingStartEndTime = "3";

      const result = AutoTrackingHelper.getTransceiverOffsetBaseDate(appConfig, baseDate);

      expect(result.getTime()).toBe(baseDate.getTime() - 3 * 60 * 1000);
    });
  });
});
