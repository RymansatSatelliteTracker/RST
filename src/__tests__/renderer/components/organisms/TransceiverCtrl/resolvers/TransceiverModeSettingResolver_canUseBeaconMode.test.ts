import type {
  TransceiverSettingLike,
} from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver";

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

describe("TransceiverModeSettingResolver.canUseBeaconMode", () => {
  let resolver: TransceiverModeSettingResolver;

  beforeEach(() => {
    resolver = new TransceiverModeSettingResolver();
  });

  it("ビーコン周波数と運用モードが両方設定済みの場合はtrueを返すこと", () => {
    expect(resolver.canUseBeaconMode(fullSetting)).toBe(true);
  });

  it("ビーコン設定がnullの場合はfalseを返すこと", () => {
    const setting: TransceiverSettingLike = { ...fullSetting, beacon: null };
    expect(resolver.canUseBeaconMode(setting)).toBe(false);
  });

  it("beaconHzが未設定の場合はfalseを返すこと", () => {
    const setting: TransceiverSettingLike = {
      ...fullSetting,
      beacon: { beaconHz: null, beaconMode: "CW" },
    };
    expect(resolver.canUseBeaconMode(setting)).toBe(false);
  });

  it("beaconModeが未設定(null)の場合はfalseを返すこと", () => {
    const setting: TransceiverSettingLike = {
      ...fullSetting,
      beacon: { beaconHz: 145000000, beaconMode: null },
    };
    expect(resolver.canUseBeaconMode(setting)).toBe(false);
  });

  it("beaconModeが空文字の場合はtrueを返すこと", () => {
    const setting: TransceiverSettingLike = {
      ...fullSetting,
      beacon: { beaconHz: 145000000, beaconMode: "" },
    };
    expect(resolver.canUseBeaconMode(setting)).toBe(true);
  });
});
