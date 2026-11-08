import I18nMsgs from "@/common/I18nMsgs.js";
import type { TransceiverSettingLike } from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import { beforeEach, describe, expect, it } from "vitest";

// テスト用の設定データファクトリ
const makeUplinkSetting = (uplinkHz: number, uplinkMode: string) => ({ uplinkHz, uplinkMode });
const makeDownlinkSetting = (downlinkHz: number, downlinkMode: string) => ({ downlinkHz, downlinkMode });
const makeBeaconSetting = (beaconHz: number, beaconMode: string) => ({ beaconHz, beaconMode });

// Tx/Rx/Beacon全て設定済みの基本設定
const fullSetting: TransceiverSettingLike = {
  uplink: makeUplinkSetting(2430000000, "FM"),
  downlink: makeDownlinkSetting(480000000, "FM"),
  beacon: makeBeaconSetting(145000000, "CW"),
};

describe("TransceiverModeSettingResolver.resolveBeaconModeSetting", () => {
  let resolver: TransceiverModeSettingResolver;

  beforeEach(() => {
    resolver = new TransceiverModeSettingResolver();
  });

  describe("Beaconモード開始時", () => {
    it("ビーコン設定が揃っている場合はrxFreqとrxOpeModeが設定されること", () => {
      const result = resolver.resolveBeaconModeSetting(fullSetting);

      // ビーコンモードではRxのみ変更し、Txは変更しない
      expect(result.rxFreq).toBe("0145.000.000");
      expect(result.rxOpeMode).toBe("CW");
      expect(result.txFreq).toBeUndefined();
      expect(result.txOpeMode).toBeUndefined();
      expect(result.noticeMessageKeys).toHaveLength(0);
    });

    it("ビーコン周波数が未設定の場合はエラー通知が返ること", () => {
      const setting: TransceiverSettingLike = {
        ...fullSetting,
        beacon: { beaconHz: null, beaconMode: "CW" },
      };

      const result = resolver.resolveBeaconModeSetting(setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_BEACON_FREQ);
      expect(result.rxFreq).toBeUndefined();
    });

    it("ビーコン運用モードが未設定の場合はエラー通知が返ること", () => {
      const setting: TransceiverSettingLike = {
        ...fullSetting,
        beacon: { beaconHz: 145000000, beaconMode: null },
      };

      const result = resolver.resolveBeaconModeSetting(setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_BEACON_FREQ);
    });

    it("ビーコン運用モードが空文字の場合は設定済みとして反映されること", () => {
      const setting: TransceiverSettingLike = {
        ...fullSetting,
        beacon: { beaconHz: 145000000, beaconMode: "" },
      };

      const result = resolver.resolveBeaconModeSetting(setting);

      expect(result.rxFreq).toBe("0145.000.000");
      expect(result.rxOpeMode).toBe("");
      expect(result.noticeMessageKeys).toHaveLength(0);
    });

    it("ビーコン設定がnullの場合はエラー通知が返ること", () => {
      const setting: TransceiverSettingLike = { ...fullSetting, beacon: null };

      const result = resolver.resolveBeaconModeSetting(setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_BEACON_FREQ);
    });
  });
});
