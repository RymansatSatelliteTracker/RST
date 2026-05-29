import type { TransceiverSettingLike } from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";

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

describe("TransceiverModeSettingResolver.resolveWhenBeaconOffInAuto", () => {
  let resolver: TransceiverModeSettingResolver;

  beforeEach(() => {
    resolver = new TransceiverModeSettingResolver();
  });

  it("Tx/Rx両方設定済みの場合はtxFreq/rxFreqが設定されること", () => {
    const result = resolver.resolveWhenBeaconOffInAuto(fullSetting);

    expect(result.txFreq).toBe("2430.000.000");
    expect(result.rxFreq).toBe("0480.000.000");
    expect(result.txOpeMode).toBe("FM");
    expect(result.rxOpeMode).toBe("FM");
    expect(result.noticeMessageKeys).toHaveLength(0);
  });

  it("アップリンクが未設定の場合はtxFreqがundefinedで通知なしであること", () => {
    const setting: TransceiverSettingLike = {
      uplink: null,
      downlink: fullSetting.downlink,
      beacon: fullSetting.beacon,
    };

    const result = resolver.resolveWhenBeaconOffInAuto(setting);

    // Tx未設定でも通知は出さない（ビーコンOFF時は現状維持）
    expect(result.txFreq).toBeUndefined();
    expect(result.noticeMessageKeys).toHaveLength(0);
    expect(result.rxFreq).toBe("0480.000.000");
  });

  it("ダウンリンクが未設定の場合はrxFreqがundefinedで通知なしであること", () => {
    const setting: TransceiverSettingLike = {
      uplink: fullSetting.uplink,
      downlink: null,
      beacon: fullSetting.beacon,
    };

    const result = resolver.resolveWhenBeaconOffInAuto(setting);

    expect(result.rxFreq).toBeUndefined();
    expect(result.noticeMessageKeys).toHaveLength(0);
    expect(result.txFreq).toBe("2430.000.000");
  });

  it("Tx/Rx両方未設定の場合はtxFreq/rxFreqともundefinedで通知なしであること", () => {
    const setting: TransceiverSettingLike = {
      uplink: null,
      downlink: null,
      beacon: fullSetting.beacon,
    };

    const result = resolver.resolveWhenBeaconOffInAuto(setting);

    expect(result.txFreq).toBeUndefined();
    expect(result.rxFreq).toBeUndefined();
    expect(result.noticeMessageKeys).toHaveLength(0);
  });
});
