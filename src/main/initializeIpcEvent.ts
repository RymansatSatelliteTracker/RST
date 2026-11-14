import type { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel.js";
import type { AntennaPositionModel } from "@/common/model/AntennaPositionModel.js";
import type { AppConfigModel, AppConfigRotator, AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import type { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel.js";
import type { FrequencyModel } from "@/common/model/FrequencyModel.js";
import type { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import type { ApiResponse, LangType } from "@/common/types/types.js";
import WebClient from "@/common/WebClient.js";
import SerialComm from "@/main/common/SerialComm.js";
import ActiveSatService from "@/main/service/ActiveSatService.js";
import AppConfigSatelliteService from "@/main/service/AppConfigSatelliteService.js";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService.js";
import GeoLocationService from "@/main/service/GeoLocationService.js";
import RepoFrequencyService from "@/main/service/RepoFrequencyService.js";
import OmmService from "@/main/service/OmmService.js";
import RotatorService from "@/main/service/RotatorService.js";
import SerialTrialService from "@/main/service/SerialTrialService.js";
import TransceiverService from "@/main/service/TransceiverSerivice.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import { ipcMain } from "electron";

// 初期化済みか
let initialized = false;

/**
 * IPCイベントの初期化を行う（ipcMainへイベントハンドラを登録する）
 */
export function initializeIpcEvents() {
  // 初期化済みの場合は処理終了
  if (initialized) {
    return;
  }
  initialized = true;

  /**
   * アプリケーション設定を返す
   */
  ipcMain.handle("getAppConfig", (_event) => {
    return AppConfigUtil.getConfig();
  });

  /**
   * アプリケーション設定を保存する
   */
  ipcMain.handle("storeAppConfig", (_event, config: AppConfigModel) => {
    return AppConfigUtil.storeConfig(config);
  });

  /**
   * メイン表示する衛星グループ、衛星ID情報を返す
   */
  ipcMain.handle("getActiveSatelliteGroup", (_event): ActiveSatelliteGroupModel => {
    return ActiveSatService.getInstance().getActiveSatGroup();
  });

  /**
   * メイン表示する衛星グループ、衛星ID情報を更新した
   */
  ipcMain.handle("refreshAppConfig", (_event) => {
    return ActiveSatService.getInstance().refresh();
  });

  /**
   * 衛星設定画面用のアプリケーション設定を返す
   */
  ipcMain.handle("getAppConfigSatSetting", (_event) => {
    return AppConfigUtil.getConfigSatSetting();
  });

  /**
   * メイン表示する衛星グループ、衛星ID情報を返す
   */
  ipcMain.handle("getAppConfigMainDisplay", (_event) => {
    return AppConfigUtil.getAppConfigMainDisplay();
  });

  /**
   * 衛星設定画面用のアプリケーション設定を保存する
   */
  ipcMain.handle(
    "storeAppConfigSatSetting",
    async (_event, config: AppConfigSatSettingModel, isTleUpdate: boolean): Promise<ApiResponse<void>> => {
      return await new AppConfigSatelliteService().store(config, isTleUpdate);
    }
  );

  /**
   * ローテーター定義を返す
   */
  ipcMain.handle("getRotatorConfig", (_event) => {
    return AppConfigUtil.getRotatorConfig();
  });

  /**
   * 無線機定義を返す
   */
  ipcMain.handle("getTransceiverConfig", (_event) => {
    return AppConfigUtil.getTransceiverConfig();
  });

  /**
   * 指定のNORAD IDの軌道要素データをOMMで返す
   */
  ipcMain.handle("getOmmsByNoradIds", (_event, noradIds: string) => {
    return new OmmService().getOmmsByNoradIds(noradIds);
  });

  /**
   * GeoLocationを返す
   */
  ipcMain.handle("getGeoLocation", async (_event) => {
    return await new GeoLocationService().getGeoLocation();
  });

  /**
   * 保存済みの衛星識別情報を返す
   */
  ipcMain.handle("getSavedSatelliteIdentifer", (_event) => {
    return new DefaultSatelliteService().getSavedSatelliteIdentifer();
  });

  /**
   * リポジトリ登録用の保存済み周波数設定情報を返す
   */
  ipcMain.handle("getRepoFrequency", (_event) => {
    return new RepoFrequencyService().getRepoFrequency();
  });

  /**
   * リポジトリ登録用の周波数設定情報を保存する
   */
  ipcMain.handle("storeRepoFrequency", (_event, frequencyModel: FrequencyModel) => {
    return new RepoFrequencyService().storeRepoFrequency(frequencyModel);
  });

  /**
   * 衛星IDに一致するデフォルト衛星情報を取得を返す
   */
  ipcMain.handle("getDefaultSatelliteBySatelliteId", (_event, satelliteId: number, useAppConfigIfExists: boolean) => {
    return new DefaultSatelliteService().getDefaultSatelliteBySatelliteId(satelliteId, useAppConfigIfExists);
  });

  /**
   * デフォルト衛星情報を追加する
   */
  ipcMain.handle("addDefaultSatellite", (_event, satelliteName: string) => {
    return new DefaultSatelliteService().addDefaultSatellite(satelliteName);
  });

  /**
   * 衛星IDに一致するアプリケーション設定かデフォルト衛星情報を取得を返す
   */
  ipcMain.handle("getUserRegisteredAppConfigSatellite", (_event, satelliteId: number, groupdId: number) => {
    return new AppConfigSatelliteService().getUserRegisteredAppConfigSatellite(satelliteId, groupdId);
  });

  /**
   * ローテータ関係・監視を開始する
   * @param reqRotConfig ローテータ設定（省略時はAppConfigから取得）
   */
  ipcMain.handle(
    "startAntennaCtrl",
    async (_event, reqRotConfig: AppConfigRotator | null = null): Promise<ApiResponse<void>> => {
      return await RotatorService.getInstance().restart(reqRotConfig);
    }
  );

  /**
   * ローテータ関係・監視を終了する
   */
  ipcMain.handle("stopAntennaCtrl", async (_event) => {
    return await RotatorService.getInstance().stop();
  });

  /**
   * ローテータ関係・指定の位置にアンテナを移動する
   */
  ipcMain.handle("setAntennaPosition", (_event, antennaPositionModel: AntennaPositionModel) => {
    return RotatorService.getInstance().setAntennaPosition(antennaPositionModel);
  });

  /**
   * ローテータ関係・アンテナ位置の変更イベント
   */
  ipcMain.handle("onChangeAntennaPosition", (_event, res: ApiResponse<AntennaPositionModel>) => {
    return res;
  });

  /**
   * ローテータ関係・ローテータのデバイスが切断された際のイベント
   */
  ipcMain.handle("onRoratorDisconnect", (_event) => {
    return;
  });

  /**
   * 共通系・アクティブなシリアルポートのリストを返す
   */
  ipcMain.handle("getActiveSerialPorts", async (_event): Promise<string[]> => {
    return await SerialComm.getPortList();
  });

  /**
   * シリアルポートをオープンする（試行）
   */
  ipcMain.handle("openSerialPortTry", async (_event, comName: string, baudRate: number): Promise<boolean> => {
    return await new SerialTrialService().open(comName, baudRate);
  });

  /**
   * シリアルポートをクローズする
   */
  ipcMain.handle("closeSerialPort", async (_event): Promise<boolean> => {
    return await new SerialTrialService().close();
  });

  /**
   * 言語設定の変更イベント
   */
  ipcMain.handle("onDispLangChange", (_event, lang: LangType) => {
    return lang;
  });

  /**
   * 無線機関係・監視を開始する
   * @param reqTransceiverConfig 無線機設定（省略時はAppConfigから取得）
   */
  ipcMain.handle(
    "startTransceiverCtrl",
    async (_event, reqTransceiverConfig: AppConfigTransceiver | null = null): Promise<ApiResponse<void>> => {
      return await TransceiverService.getInstance().restart(reqTransceiverConfig);
    }
  );

  /**
   * 無線機関係・監視を終了する
   */
  ipcMain.handle("stopTransceiverCtrl", async (_event) => {
    return await TransceiverService.getInstance().stop();
  });

  /**
   * 無線機との接続が準備完了かどうかを返す
   */
  ipcMain.handle("isTransceiverReady", async (_event) => {
    return await TransceiverService.getInstance().isTransceiverReady();
  });

  /**
   * 無線機関係・AutoOn時の初期処理
   */
  ipcMain.handle(
    "transceiverInitAutoOn",
    async (_event, txFreqHz: number, rxFreqHz: number, txMode: string, rxMode: string, toneHz: number | null) => {
      return await TransceiverService.getInstance().initAutoOn(txFreqHz, rxFreqHz, txMode, rxMode, toneHz);
    }
  );

  /**
   * 無線機関係・AutoOff
   */
  ipcMain.handle("transceiverAutoOff", async (_event) => {
    return await TransceiverService.getInstance().autoOff();
  });

  /**
   * 無線機関係・無線機周波数を変更する
   */
  ipcMain.handle(
    "setTransceiverFrequency",
    async (_event, frequencyModel: UplinkType | DownlinkType, isForce?: boolean) => {
      return await TransceiverService.getInstance().setTransceiverFrequency(frequencyModel, isForce);
    }
  );

  /**
   * 無線機関係・無線機周波数の変更イベント
   */
  ipcMain.handle("onChangeTransceiverFrequency", (_event, res: ApiResponse<UplinkType | DownlinkType>) => {
    return res;
  });

  /**
   * 無線機関係・無線機モードを変更する
   */
  ipcMain.handle("setTransceiverMode", (_event, modeModel: UplinkType | DownlinkType) => {
    return TransceiverService.getInstance().setTransceiverMode(modeModel);
  });

  /**
   * 無線機関係・無線機モードの変更イベント
   */
  ipcMain.handle("onChangeTransceiverMode", (_event, res: ApiResponse<UplinkType | DownlinkType>) => {
    return res;
  });

  /**
   * 無線機関係・サテライトモードを変更する
   */
  ipcMain.handle("setSatelliteMode", async (_event, isSatelliteMode: boolean) => {
    return await TransceiverService.getInstance().setSatelliteMode(isSatelliteMode);
  });

  /**
   * ドップラーシフト待機イベント
   */
  ipcMain.handle("dopplerShiftWaitingCallback", (_event, res: ApiResponse<boolean>) => {
    return res;
  });

  /**
   * 無線機周波数保存イベント
   */
  ipcMain.handle("onSaveTransceiverFrequency", (_evnet) => {});

  /**
   * URLから読み込み可能な軌道要素データが取得できるか確認する
   */
  ipcMain.handle("canGetValidOmm", async (_event, url: string): Promise<boolean> => {
    return new OmmService().canGetValidOmm(url, new WebClient());
  });

  /**
   * 通知メッセージイベント
   */
  ipcMain.handle("onNoticeMessage", (_event, args: unknown) => {
    return args;
  });
}

/**
 * IPCイベントを開放する（ipcMainへイベントハンドラを削除する）
 */
export function releaseIpcEvents() {
  // 未初期化の場合は処理終了
  if (!initialized) {
    return;
  }

  // イベントハンドラを削除
  ipcMain.removeHandler("getAppConfig");
  ipcMain.removeHandler("storeAppConfig");
  ipcMain.removeHandler("getAppConfigSatSetting");
  ipcMain.removeHandler("storeAppConfigSatSetting");
  ipcMain.removeHandler("getRotatorConfig");
  ipcMain.removeHandler("getTransceiverConfig");
  ipcMain.removeHandler("getOmmsByNoradIds");
  ipcMain.removeHandler("getGeoLocation");
  ipcMain.removeHandler("getSavedSatelliteIdentifer");
  ipcMain.removeHandler("getDefaultSatelliteBySatelliteId");
  ipcMain.removeHandler("addDefaultSatellite");
  ipcMain.removeHandler("getUserRegisteredAppConfigSatellite");
  ipcMain.removeHandler("startAntennaCtrl");
  ipcMain.removeHandler("stopAntennaCtrl");
  ipcMain.removeHandler("setAntennaPosition");
  ipcMain.removeHandler("onChangeAntennaPosition");
  ipcMain.removeHandler("onRoratorDisconnect");
  ipcMain.removeHandler("getActiveSerialPorts");
  ipcMain.removeHandler("openSerialPortTry");
  ipcMain.removeHandler("closeSerialPort");
  ipcMain.removeHandler("onDispLangChange");
  ipcMain.removeHandler("startTransceiverCtrl");
  ipcMain.removeHandler("stopTransceiverCtrl");
  ipcMain.removeHandler("isTransceiverReady");
  ipcMain.removeHandler("transceiverInitAutoOn");
  ipcMain.removeHandler("transceiverAutoOff");
  ipcMain.removeHandler("getActiveSatelliteGroup");
  ipcMain.removeHandler("refreshAppConfig");
  ipcMain.removeHandler("setTransceiverFrequency");
  ipcMain.removeHandler("onChangeTransceiverFrequency");
  ipcMain.removeHandler("setTransceiverMode");
  ipcMain.removeHandler("onChangeTransceiverMode");
  ipcMain.removeHandler("setSatelliteMode");
  ipcMain.removeHandler("dopplerShiftWaitingCallback");
  ipcMain.removeHandler("onSaveTransceiverFrequency");
  ipcMain.removeHandler("canGetValidOmm");
  ipcMain.removeHandler("onNoticeMessage");

  initialized = false;
}
