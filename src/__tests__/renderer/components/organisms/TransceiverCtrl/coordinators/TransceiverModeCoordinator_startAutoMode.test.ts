import Constant from "@/common/Constant.js";
import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import ApiTransceiver from "@/renderer/api/ApiTransceiver.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import type { ModeCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverModeCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import emitter from "@/renderer/util/EventBus.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const createState = (): ModeCoordinatorState => ({
  txFrequency: ref("2430.000.000"),
  rxFrequency: ref("0480.000.000"),
  txOpeMode: ref("FM"),
  rxOpeMode: ref("FM"),
  satelliteMode: ref(Constant.Transceiver.SatelliteMode.UNSET),
  isSatelliteMode: ref(false),
  isSatTrackingModeNormal: ref(true),
  dopplerShiftMode: ref(Constant.Transceiver.DopplerShiftMode.FIXED_SAT),
  savedTxFrequency: ref(""),
  savedRxFrequency: ref(""),
  execTxDopplerShiftCorrection: ref(false),
  execRxDopplerShiftCorrection: ref(false),
  txFrequencyAdjustment: ref("+000.000"),
  rxFrequencyAdjustment: ref("+000.000"),
});

const createCoordinator = (
  autoOn: boolean = false,
  state: ModeCoordinatorState = createState()
): TransceiverModeCoordinator => {
  return new TransceiverModeCoordinator(
    state,
    { tranceiverAuto: autoOn } as never,
    new TransceiverModeSettingResolver(),
    new TransceiverBaseFreqMgr(),
    () => {},
    () => {}
  );
};

describe("TransceiverModeCoordinator.startAutoMode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("無線機設定が未完了の場合はfalseを返し、isReadyを呼ばないこと", async () => {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.port = "";
    appConfig.transceiver.transceiverId = "IC-9700";
    appConfig.transceiver.baudrateBps = "9600";

    const coordinator = createCoordinator();

    vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
    const getMsgSpy = vi.spyOn(I18nUtil, "getMsg").mockReturnValue("設定未完了");
    const emitSpy = vi.spyOn(emitter, "emit");
    const isReadySpy = vi.spyOn(ApiTransceiver, "isReady").mockResolvedValue({
      status: true,
      data: true,
      message: null,
    });

    const result = await coordinator.startAutoMode();

    expect(result).toBe(false);
    expect(getMsgSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(Constant.GlobalEvent.NOTICE_INFO, "設定未完了");
    expect(isReadySpy).not.toHaveBeenCalled();
  });

  it("無線機接続が未準備の場合はfalseを返し、エラー通知を行うこと", async () => {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.port = "COM3";
    appConfig.transceiver.transceiverId = "IC-9700";
    appConfig.transceiver.baudrateBps = "9600";

    const coordinator = createCoordinator();

    vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
    const isReadySpy = vi.spyOn(ApiTransceiver, "isReady").mockResolvedValue({
      status: false,
      data: false,
      message: null,
    });
    const getMsgSpy = vi.spyOn(I18nUtil, "getMsg").mockReturnValue("未接続");
    const emitSpy = vi.spyOn(emitter, "emit");

    const result = await coordinator.startAutoMode();

    expect(result).toBe(false);
    expect(isReadySpy).toHaveBeenCalledTimes(1);
    expect(getMsgSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(Constant.GlobalEvent.NOTICE_ERR, "未接続");
  });

  it.each([
    Constant.Transceiver.DopplerShiftMode.FIXED_SAT,
    Constant.Transceiver.DopplerShiftMode.FIXED_RX,
    Constant.Transceiver.DopplerShiftMode.FIXED_TX,
  ])("アクティブ衛星の固定モード（%s）がメイン画面の固定モードへ設定されること", async (dopplerShiftMode) => {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.port = "COM3";
    appConfig.transceiver.transceiverId = "IC-9700";
    appConfig.transceiver.baudrateBps = "9600";
    appConfig.transceiver.autoTrackingIntervalSec = "1";

    // 衛星設定とは異なる値を初期値にしておく
    const state = createState();
    state.dopplerShiftMode.value = "INITIAL";
    const coordinator = createCoordinator(false, state);

    vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
    vi.spyOn(ApiTransceiver, "isReady").mockResolvedValue({ status: true, data: true, message: null });
    vi.spyOn(ApiTransceiver, "setSatelliteMode").mockResolvedValue(true);
    vi.spyOn(ApiTransceiver, "transceiverInitAutoOn").mockResolvedValue(undefined);
    vi.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
      getSatService: () => null,
      getActiveSatTransceiverSetting: () => ({
        downlink: { downlinkHz: 435633000, downlinkMode: "USB" },
        uplink: { uplinkHz: 145970000, uplinkMode: "LSB" },
        beacon: null,
        satelliteMode: false,
        satTrackMode: null,
        dopplerShiftMode,
        toneHz: null,
      }),
    } as unknown as ActiveSatServiceHub);

    const result = await coordinator.startAutoMode();

    expect(result).toBe(true);
    expect(state.dopplerShiftMode.value).toBe(dopplerShiftMode);
  });

  it("固定モードを設定しない指定の場合、メイン画面の固定モードが維持されること", async () => {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.port = "COM3";
    appConfig.transceiver.transceiverId = "IC-9700";
    appConfig.transceiver.baudrateBps = "9600";
    appConfig.transceiver.autoTrackingIntervalSec = "1";

    // 手動選択された固定モードを想定する
    const state = createState();
    state.dopplerShiftMode.value = Constant.Transceiver.DopplerShiftMode.FIXED_TX;
    const coordinator = createCoordinator(false, state);

    vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
    vi.spyOn(ApiTransceiver, "isReady").mockResolvedValue({ status: true, data: true, message: null });
    vi.spyOn(ApiTransceiver, "setSatelliteMode").mockResolvedValue(true);
    vi.spyOn(ApiTransceiver, "transceiverInitAutoOn").mockResolvedValue(undefined);
    vi.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
      getSatService: () => null,
      getActiveSatTransceiverSetting: () => ({
        downlink: { downlinkHz: 435633000, downlinkMode: "USB" },
        uplink: { uplinkHz: 145970000, uplinkMode: "LSB" },
        beacon: null,
        satelliteMode: false,
        satTrackMode: null,
        dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_RX,
        toneHz: null,
      }),
    } as unknown as ActiveSatServiceHub);

    const result = await coordinator.startAutoMode({ applyDopplerShiftMode: false });

    expect(result).toBe(true);
    expect(state.dopplerShiftMode.value).toBe(Constant.Transceiver.DopplerShiftMode.FIXED_TX);
  });
  it("onBeforeAutoOnを指定した場合、無線機へのAuto開始連携の直前に呼ばれ、その変更が連携されること", async () => {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.port = "COM3";
    appConfig.transceiver.transceiverId = "IC-9700";
    appConfig.transceiver.baudrateBps = "9600";
    appConfig.transceiver.autoTrackingIntervalSec = "1";

    const state = createState();
    const coordinator = createCoordinator(false, state);

    vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
    vi.spyOn(ApiTransceiver, "isReady").mockResolvedValue({ status: true, data: true, message: null });
    vi.spyOn(ApiTransceiver, "setSatelliteMode").mockResolvedValue(true);
    const initAutoOnSpy = vi.spyOn(ApiTransceiver, "transceiverInitAutoOn").mockResolvedValue(undefined);
    vi.spyOn(ActiveSatServiceHub, "getInstance").mockReturnValue({
      getSatService: () => null,
      getActiveSatTransceiverSetting: () => ({
        downlink: { downlinkHz: 435633000, downlinkMode: "USB" },
        uplink: { uplinkHz: 145970000, uplinkMode: "LSB" },
        beacon: { beaconHz: 435610000, beaconMode: "CW" },
        satelliteMode: true,
        satTrackMode: null,
        dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_RX,
        toneHz: null,
      }),
    } as unknown as ActiveSatServiceHub);

    // Beaconの引き継ぎを想定し、Rxをビーコン側へ切り替える
    const onBeforeAutoOn = vi.fn(() => {
      // 呼ばれた時点で衛星設定の周波数が設定済みであること
      expect(state.rxFrequency.value).toBe("0435.633.000");
      expect(initAutoOnSpy).not.toHaveBeenCalled();
      state.rxFrequency.value = "0435.610.000";
      state.rxOpeMode.value = "CW";
      return Promise.resolve();
    });

    const result = await coordinator.startAutoMode({ applyDopplerShiftMode: false, onBeforeAutoOn });

    expect(result).toBe(true);
    expect(onBeforeAutoOn).toHaveBeenCalledTimes(1);
    expect(initAutoOnSpy).toHaveBeenCalledWith(145970000, 435610000, "LSB", "CW", null);
    // 固定モードは設定しない指定のため維持される
    expect(state.dopplerShiftMode.value).toBe(Constant.Transceiver.DopplerShiftMode.FIXED_SAT);
    // Autoモード終了時の戻り先は、衛星設定の周波数（Beaconへの切替前）
    expect(state.savedRxFrequency.value).toBe("0435.633.000");
  });
});
