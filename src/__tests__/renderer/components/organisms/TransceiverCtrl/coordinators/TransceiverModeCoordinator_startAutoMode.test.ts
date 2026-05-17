import Constant from "@/common/Constant";
import { AppConfigModel } from "@/common/model/AppConfigModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TransceiverModeCoordinator, {
  ModeCoordinatorState,
} from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverModeCoordinator";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver";
import emitter from "@/renderer/util/EventBus";
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
    jest.restoreAllMocks();
  });

  it("無線機設定が未完了の場合はfalseを返し、isReadyを呼ばないこと", async () => {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.port = "";
    appConfig.transceiver.transceiverId = "IC-9700";
    appConfig.transceiver.baudrateBps = "9600";

    const coordinator = createCoordinator();

    jest.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
    const getMsgSpy = jest.spyOn(I18nUtil, "getMsg").mockReturnValue("設定未完了");
    const emitSpy = jest.spyOn(emitter, "emit");
    const isReadySpy = jest.spyOn(ApiTransceiver, "isReady").mockResolvedValue({
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

    jest.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
    const isReadySpy = jest.spyOn(ApiTransceiver, "isReady").mockResolvedValue({
      status: false,
      data: false,
      message: null,
    });
    const getMsgSpy = jest.spyOn(I18nUtil, "getMsg").mockReturnValue("未接続");
    const emitSpy = jest.spyOn(emitter, "emit");

    const result = await coordinator.startAutoMode();

    expect(result).toBe(false);
    expect(isReadySpy).toHaveBeenCalledTimes(1);
    expect(getMsgSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(Constant.GlobalEvent.NOTICE_ERR, "未接続");
  });
});
