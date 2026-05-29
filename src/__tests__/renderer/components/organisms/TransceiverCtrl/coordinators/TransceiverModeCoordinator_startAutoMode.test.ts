import Constant from "@/common/Constant.js";
import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import ApiTransceiver from "@/renderer/api/ApiTransceiver.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import type { ModeCoordinatorState } from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverModeCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import emitter from "@/renderer/util/EventBus.js";
import { ref } from "vue";

const createState = (): ModeCoordinatorState => ({
  txFrequency: ref("2430.000.000"),
  rxFrequency: ref("0480.000.000"),
  txOpeMode: ref("FM"),
  rxOpeMode: ref("FM"),
  satelliteMode: ref(Constant.Transceiver.SatelliteMode.UNSET),
  isSatelliteMode: ref(false),
  isSatTrackingModeNormal: ref(true),
  savedTxFrequency: ref(""),
  savedRxFrequency: ref(""),
  savedTxOpeMode: ref(""),
  savedRxOpeMode: ref(""),
  isBeaconMode: ref(false),
  execTxDopplerShiftCorrection: ref(false),
  execRxDopplerShiftCorrection: ref(false),
  txFrequencyAdjustment: ref("+000.000"),
  rxFrequencyAdjustment: ref("+000.000"),
});

const createCoordinator = (autoOn: boolean = false): TransceiverModeCoordinator => {
  return new TransceiverModeCoordinator(
    createState(),
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
});
