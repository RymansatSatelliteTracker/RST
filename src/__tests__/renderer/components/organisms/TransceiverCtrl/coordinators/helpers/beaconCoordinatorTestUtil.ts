import Constant from "@/common/Constant.js";
import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import type {
  BeaconCoordinatorCallbacks,
  BeaconCoordinatorState,
} from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverBeaconCoordinator.js";
import TransceiverBeaconCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverBeaconCoordinator.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import TransceiverBeaconMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBeaconMgr.js";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import { vi } from "vitest";
import { ref } from "vue";

/** テストで使用するビーコン周波数 */
export const BEACON_HZ = 435610000;

/** テストで使用する現在日時 */
export const CURRENT_DATE = new Date("2026-11-08T00:00:00.000Z");

/**
 * Beacon ON 前の画面状態（Auto ON 中、Rx補正値 +1000Hz、Tx補正値 -500Hz を想定）
 */
export const createState = (): BeaconCoordinatorState => ({
  txFrequency: ref("0145.969.000"),
  rxFrequency: ref("0435.634.000"),
  rxOpeMode: ref("USB"),
  dopplerShiftMode: ref(Constant.Transceiver.DopplerShiftMode.FIXED_SAT),
  isBeaconMode: ref(false),
  isSatelliteMode: ref(true),
  txBaseFreq: ref(145969500),
  rxBaseFreq: ref(435634000),
  txFrequencyAdjustment: ref("-000.500"),
  rxFrequencyAdjustment: ref("+001.000"),
});

/**
 * BeaconCoordinatorのテスト用の構成一式
 */
export interface BeaconCoordinatorFixture {
  state: BeaconCoordinatorState;
  autoStore: { tranceiverAuto: boolean };
  beaconMgr: TransceiverBeaconMgr;
  baseFreqMgr: TransceiverBaseFreqMgr;
  callbacks: {
    [K in keyof BeaconCoordinatorCallbacks]: ReturnType<typeof vi.fn>;
  };
  coordinator: TransceiverBeaconCoordinator;
}

/**
 * BeaconCoordinatorのテスト用の構成一式を生成する
 * @param autoOn AutoモードがONか
 * @param state 画面状態
 */
export const createFixture = (
  autoOn: boolean,
  state: BeaconCoordinatorState = createState()
): BeaconCoordinatorFixture => {
  const autoStore = { tranceiverAuto: autoOn };
  const beaconMgr = new TransceiverBeaconMgr();
  const baseFreqMgr = new TransceiverBaseFreqMgr();
  const callbacks = {
    stopTracking: vi.fn().mockResolvedValue(true),
    restartTracking: vi.fn(),
    // 補正値を反映した基準周波数の再算出（useTransceiverCtrl.calcBaseFreqWithAdjust 相当）
    calcBaseFreqWithAdjust: vi.fn(() => {
      const calculated = baseFreqMgr.calcBaseFreqWithAdjust(
        state.txFrequencyAdjustment.value,
        state.rxFrequencyAdjustment.value
      );
      state.txBaseFreq.value = calculated.txBaseFreq;
      state.rxBaseFreq.value = calculated.rxBaseFreq;
    }),
    applyDopplerShiftNow: vi.fn().mockResolvedValue(undefined),
    getAutoTrackingIntervalMsec: vi.fn(() => 1000),
  };

  const coordinator = new TransceiverBeaconCoordinator(
    state,
    autoStore as never,
    beaconMgr,
    baseFreqMgr,
    new TransceiverModeSettingResolver(),
    ref(CURRENT_DATE),
    callbacks
  );

  return { state, autoStore, beaconMgr, baseFreqMgr, callbacks, coordinator };
};

/**
 * アクティブ衛星の無線設定、AppConfig、ドップラー計算をモックする
 * @param options.beaconHz ビーコン周波数（nullの場合は未設定）
 * @param options.withinRange ドップラーシフトの有効範囲内か
 * @param options.shiftedRxFreq ドップラーシフト補正後のRx周波数
 */
export const mockEnvironment = (
  options: { beaconHz?: number | null; withinRange?: boolean; shiftedRxFreq?: string | null } = {}
) => {
  const { beaconHz = BEACON_HZ, withinRange = true, shiftedRxFreq = "0435.614.000" } = options;

  vi.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
    getActiveSatTransceiverSetting: () => ({
      downlink: { downlinkHz: 435633000, downlinkMode: "USB" },
      uplink: { uplinkHz: 145970000, uplinkMode: "LSB" },
      beacon: { beaconHz, beaconMode: "CW" },
      satelliteMode: true,
      satTrackMode: null,
      dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_SAT,
      toneHz: null,
    }),
  } as unknown as ActiveSatServiceHub);
  vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(new AppConfigModel());
  vi.spyOn(TransceiverDopplerCalc.prototype, "isWithinDopplerShiftActiveRange").mockResolvedValue(withinRange);
  const calcRxSpy = vi
    .spyOn(TransceiverDopplerCalc.prototype, "calcNewRxFreqWithDoppler")
    .mockResolvedValue(shiftedRxFreq);

  return { calcRxSpy };
};
