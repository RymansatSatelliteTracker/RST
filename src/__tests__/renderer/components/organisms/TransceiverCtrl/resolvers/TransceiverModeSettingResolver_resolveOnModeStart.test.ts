import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import TransceiverModeSettingResolver, {
  TransceiverSettingLike,
} from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver";

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

describe("TransceiverModeSettingResolver.resolveOnModeStart", () => {
  let resolver: TransceiverModeSettingResolver;

  beforeEach(() => {
    resolver = new TransceiverModeSettingResolver();
  });

  describe("Beaconモード開始時（isBeaconMode=true）", () => {
    it("ビーコン設定が揃っている場合はrxFreqとrxOpeModeが設定されること", () => {
      const result = resolver.resolveOnModeStart(true, fullSetting);

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

      const result = resolver.resolveOnModeStart(true, setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_BEACON_FREQ);
      expect(result.rxFreq).toBeUndefined();
    });

    it("ビーコン運用モードが未設定の場合はエラー通知が返ること", () => {
      const setting: TransceiverSettingLike = {
        ...fullSetting,
        beacon: { beaconHz: 145000000, beaconMode: null },
      };

      const result = resolver.resolveOnModeStart(true, setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_BEACON_FREQ);
    });

    it("ビーコン運用モードが空文字の場合は設定済みとして反映されること", () => {
      const setting: TransceiverSettingLike = {
        ...fullSetting,
        beacon: { beaconHz: 145000000, beaconMode: "" },
      };

      const result = resolver.resolveOnModeStart(true, setting);

      expect(result.rxFreq).toBe("0145.000.000");
      expect(result.rxOpeMode).toBe("");
      expect(result.noticeMessageKeys).toHaveLength(0);
    });

    it("ビーコン設定がnullの場合はエラー通知が返ること", () => {
      const setting: TransceiverSettingLike = { ...fullSetting, beacon: null };

      const result = resolver.resolveOnModeStart(true, setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_BEACON_FREQ);
    });
  });

  describe("Autoモード開始時（isBeaconMode=false）", () => {
    it("Tx/Rx両方設定済みの場合はtxFreq/rxFreq/txOpeMode/rxOpeModeが全て設定されること", () => {
      const result = resolver.resolveOnModeStart(false, fullSetting);

      expect(result.txFreq).toBe("2430.000.000");
      expect(result.rxFreq).toBe("0480.000.000");
      expect(result.txOpeMode).toBe("FM");
      expect(result.rxOpeMode).toBe("FM");
      expect(result.noticeMessageKeys).toHaveLength(0);
    });

    it("Tx/Rx両方未設定の場合はCHK_ERR_NO_FREQが通知されること", () => {
      const setting: TransceiverSettingLike = {
        uplink: null,
        downlink: null,
        beacon: fullSetting.beacon,
      };

      const result = resolver.resolveOnModeStart(false, setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_FREQ);
      expect(result.txFreq).toBeUndefined();
      expect(result.rxFreq).toBeUndefined();
    });

    it("アップリンクのみ未設定の場合はCHK_ERR_NO_UPLINK_FREQが通知されること", () => {
      const setting: TransceiverSettingLike = {
        uplink: null,
        downlink: fullSetting.downlink,
        beacon: fullSetting.beacon,
      };

      const result = resolver.resolveOnModeStart(false, setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_UPLINK_FREQ);
      expect(result.txFreq).toBeUndefined();
      // ダウンリンクは設定されているのでrxFreqは存在する
      expect(result.rxFreq).toBe("0480.000.000");
    });

    it("ダウンリンクのみ未設定の場合はCHK_ERR_NO_DOWNLINK_FREQが通知されること", () => {
      const setting: TransceiverSettingLike = {
        uplink: fullSetting.uplink,
        downlink: null,
        beacon: fullSetting.beacon,
      };

      const result = resolver.resolveOnModeStart(false, setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_DOWNLINK_FREQ);
      expect(result.rxFreq).toBeUndefined();
      // アップリンクは設定されているのでtxFreqは存在する
      expect(result.txFreq).toBe("2430.000.000");
    });

    it("uplinkModeがnullの場合はtxOpeModeがUNSETになること", () => {
      const setting: TransceiverSettingLike = {
        uplink: { uplinkHz: 2430000000, uplinkMode: null },
        downlink: fullSetting.downlink,
        beacon: fullSetting.beacon,
      };

      const result = resolver.resolveOnModeStart(false, setting);

      expect(result.txOpeMode).toBe(Constant.Transceiver.OpeMode.UNSET);
    });

    it("downlinkModeがnullの場合はrxOpeModeがUNSETになること", () => {
      const setting: TransceiverSettingLike = {
        uplink: fullSetting.uplink,
        downlink: { downlinkHz: 480000000, downlinkMode: null },
        beacon: fullSetting.beacon,
      };

      const result = resolver.resolveOnModeStart(false, setting);

      expect(result.rxOpeMode).toBe(Constant.Transceiver.OpeMode.UNSET);
    });
  });
});
