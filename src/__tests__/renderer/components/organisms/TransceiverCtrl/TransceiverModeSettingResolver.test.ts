import I18nMsgs from "@/common/I18nMsgs";
import TransceiverModeSettingResolver, {
  TransceiverSettingLike,
} from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeSettingResolver";

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

describe("TransceiverModeSettingResolver", () => {
  let resolver: TransceiverModeSettingResolver;

  beforeEach(() => {
    // 各テスト前に新しいインスタンスを生成する
    resolver = new TransceiverModeSettingResolver();
  });

  // ──────────────────────────────────────────────
  describe("canUseBeaconMode", () => {
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

    it("beaconModeが未設定（null）の場合はfalseを返すこと", () => {
      const setting: TransceiverSettingLike = {
        ...fullSetting,
        beacon: { beaconHz: 145000000, beaconMode: null },
      };
      expect(resolver.canUseBeaconMode(setting)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  describe("resolveOnModeStart - Beaconモード開始時（isBeaconMode=true）", () => {
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

    it("ビーコン設定がnullの場合はエラー通知が返ること", () => {
      const setting: TransceiverSettingLike = { ...fullSetting, beacon: null };

      const result = resolver.resolveOnModeStart(true, setting);

      expect(result.noticeMessageKeys).toContain(I18nMsgs.CHK_ERR_NO_BEACON_FREQ);
    });
  });

  // ──────────────────────────────────────────────
  describe("resolveOnModeStart - Autoモード開始時（isBeaconMode=false）", () => {
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

    it("uplinkModeがnullの場合はtxOpeModeがUNSET（空文字）になること", () => {
      const setting: TransceiverSettingLike = {
        uplink: { uplinkHz: 2430000000, uplinkMode: null },
        downlink: fullSetting.downlink,
        beacon: fullSetting.beacon,
      };

      const result = resolver.resolveOnModeStart(false, setting);

      expect(result.txOpeMode).toBe("");
    });

    it("downlinkModeがnullの場合はrxOpeModeがUNSET（空文字）になること", () => {
      const setting: TransceiverSettingLike = {
        uplink: fullSetting.uplink,
        downlink: { downlinkHz: 480000000, downlinkMode: null },
        beacon: fullSetting.beacon,
      };

      const result = resolver.resolveOnModeStart(false, setting);

      expect(result.rxOpeMode).toBe("");
    });
  });

  // ──────────────────────────────────────────────
  describe("resolveWhenBeaconOffInAuto", () => {
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
});
