import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigModel, AppConfigRotator, AppConfigTransceiver } from "@/common/model/AppConfigModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse, LangType } from "@/common/types/types";
import WebClient from "@/common/WebClient";
import SerialComm from "@/main/common/SerialComm";
import ActiveSatService from "@/main/service/ActiveSatService";
import AppConfigSatelliteService from "@/main/service/AppConfigSatelliteService";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import GeoLocationService from "@/main/service/GeoLocationService";
import RotatorService from "@/main/service/RotatorService";
import SerialTrialService from "@/main/service/SerialTrialService";
import TleService from "@/main/service/TleService";
import TransceiverService from "@/main/service/TransceiverSerivice";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
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
  ipcMain.handle("getAppConfig", (event) => {
    return AppConfigUtil.getConfig();
  });

  /**
   * アプリケーション設定を保存する
   */
  ipcMain.handle("storeAppConfig", (event, config: AppConfigModel) => {
    return AppConfigUtil.storeConfig(config);
  });

  /**
   * メイン表示する衛星グループ、衛星ID情報を返す
   */
  ipcMain.handle("getActiveSatelliteGroup", (event): ActiveSatelliteGroupModel => {
    return ActiveSatService.getInstance().getActiveSatGroup();
  });

  /**
   * メイン表示する衛星グループ、衛星ID情報を更新した
   */
  ipcMain.handle("refreshAppConfig", (event) => {
    return ActiveSatService.getInstance().refresh();
  });

  /**
   * 衛星設定画面用のアプリケーション設定を返す
   */
  ipcMain.handle("getAppConfigSatSetting", (event) => {
    return AppConfigUtil.getConfigSatSetting();
  });

  /**
   * 衛星設定画面用のアプリケーション設定を保存する
   */
  ipcMain.handle(
    "storeAppConfigSatSetting",
    async (event, config: AppConfigSatSettingModel, isTleUpdate: boolean): Promise<ApiResponse<void>> => {
      return await new AppConfigSatelliteService().store(config, isTleUpdate);
    }
  );

  /**
   * ローテーター定義を返す
   */
  ipcMain.handle("getRotatorConfig", (event) => {
    return AppConfigUtil.getRotatorConfig();
  });

  /**
   * 無線機定義を返す
   */
  ipcMain.handle("getTransceiverConfig", (event) => {
    return AppConfigUtil.getTransceiverConfig();
  });

  /**
   * 指定のNORAD IDのTLEを返す
   */
  ipcMain.handle("getTlesByNoradIds", (event, noradIds: string) => {
    return new TleService().getTlesByNoradIds(noradIds);
  });

  /**
   * GeoLocationを返す
   */
  ipcMain.handle("getGeoLocation", async (event) => {
    return await new GeoLocationService().getGeoLocation();
  });

  /**
   * 保存済みの衛星識別情報を返す
   */
  ipcMain.handle("getSavedSatelliteIdentifer", (event) => {
    return new DefaultSatelliteService().getSavedSatelliteIdentifer();
  });

  /**
   * 衛星IDに一致するデフォルト衛星情報を取得を返す
   */
  ipcMain.handle("getDefaultSatelliteBySatelliteId", (event, satelliteId: number, useAppConfigIfExists: boolean) => {
    return new DefaultSatelliteService().getDefaultSatelliteBySatelliteId(satelliteId, useAppConfigIfExists);
  });

  /**
   * デフォルト衛星情報を追加する
   */
  ipcMain.handle("addDefaultSatellite", (event, satelliteName: string) => {
    return new DefaultSatelliteService().addDefaultSatellite(satelliteName);
  });

  /**
   * デフォルト衛星情報をリフレッシュして再作成する
   */
  ipcMain.handle("reCreateDefaultSatellite", (event) => {
    return new DefaultSatelliteService().reCreateDefaultSatellite();
  });

  /**
   * 衛星IDに一致するアプリケーション設定かデフォルト衛星情報を取得を返す
   */
  ipcMain.handle("getUserRegisteredAppConfigSatellite", (event, satelliteId: number, groupdId: number) => {
    return new AppConfigSatelliteService().getUserRegisteredAppConfigSatellite(satelliteId, groupdId);
  });

  /**
   * ローテータ関係・監視を開始する
   * @param reqRotConfig ローテータ設定（省略時はAppConfigから取得）
   */
  ipcMain.handle(
    "startAntennaCtrl",
    async (event, reqRotConfig: AppConfigRotator | null = null): Promise<ApiResponse<void>> => {
      return await RotatorService.getInstance().restart(reqRotConfig);
    }
  );

  /**
   * ローテータ関係・監視を終了する
   */
  ipcMain.handle("stopAntennaCtrl", async (event) => {
    return await RotatorService.getInstance().stop();
  });

  /**
   * ローテータ関係・指定の位置にアンテナを移動する
   */
  ipcMain.handle("setAntennaPosition", (event, antennaPositionModel: AntennaPositionModel) => {
    return RotatorService.getInstance().setAntennaPosition(antennaPositionModel);
  });

  /**
   * ローテータ関係・アンテナ位置の変更イベント
   */
  ipcMain.handle("onChangeAntennaPosition", async (event, res: ApiResponse<AntennaPositionModel>) => {
    return res;
  });

  /**
   * ローテータ関係・ローテータのデバイスが切断された際のイベント
   */
  ipcMain.handle("onRoratorDisconnect", async (event) => {
    return;
  });

  /**
   * 共通系・アクティブなシリアルポートのリストを返す
   */
  ipcMain.handle("getActiveSerialPorts", async (event): Promise<string[]> => {
    return await SerialComm.getPortList();
  });

  /**
   * シリアルポートをオープンする（試行）
   */
  ipcMain.handle("openSerialPortTry", async (event, comName: string, baudRate: number): Promise<boolean> => {
    return await new SerialTrialService().open(comName, baudRate);
  });

  /**
   * シリアルポートをクローズする
   */
  ipcMain.handle("closeSerialPort", async (event): Promise<boolean> => {
    return await new SerialTrialService().close();
  });

  /**
   * 言語設定の変更イベント
   */
  ipcMain.handle("onDispLangChange", async (event, lang: LangType) => {
    return lang;
  });

  /**
   * 無線機関係・監視を開始する
   * @param reqTransceiverConfig 無線機設定（省略時はAppConfigから取得）
   */
  ipcMain.handle(
    "startTransceiverCtrl",
    async (event, reqTransceiverConfig: AppConfigTransceiver | null = null): Promise<ApiResponse<void>> => {
      return await TransceiverService.getInstance().restart(reqTransceiverConfig);
    }
  );

  /**
   * 無線機関係・監視を終了する
   */
  ipcMain.handle("stopTransceiverCtrl", async (event) => {
    return await TransceiverService.getInstance().stop();
  });

  /**
   * 無線機との接続が準備完了かどうかを返す
   */
  ipcMain.handle("isTransceiverReady", async (event) => {
    return await TransceiverService.getInstance().isTransceiverReady();
  });

  /**
   * 無線機関係・AutoOn時の初期処理
   */
  ipcMain.handle(
    "transceiverInitAutoOn",
    async (event, txFreqHz: number, rxFreqHz: number, txMode: string, rxMode: string, toneHz: number | null) => {
      return await TransceiverService.getInstance().initAutoOn(txFreqHz, rxFreqHz, txMode, rxMode, toneHz);
    }
  );

  /**
   * 無線機関係・AutoOff
   */
  ipcMain.handle("transceiverAutoOff", async (event) => {
    return await TransceiverService.getInstance().autoOff();
  });

  /**
   * 無線機関係・無線機周波数を変更する
   */
  ipcMain.handle("setTransceiverFrequency", async (event, frequencyModel: UplinkType | DownlinkType) => {
    return await TransceiverService.getInstance().setTransceiverFrequency(frequencyModel);
  });

  /**
   * 無線機関係・無線機周波数の変更イベント
   */
  ipcMain.handle("onChangeTransceiverFrequency", async (event, res: ApiResponse<UplinkType | DownlinkType>) => {
    return res;
  });

  /**
   * 無線機関係・無線機モードを変更する
   */
  ipcMain.handle("setTransceiverMode", (event, modeModel: UplinkType | DownlinkType) => {
    return TransceiverService.getInstance().setTransceiverMode(modeModel);
  });

  /**
   * 無線機関係・無線機モードの変更イベント
   */
  ipcMain.handle("onChangeTransceiverMode", async (event, res: ApiResponse<UplinkType | DownlinkType>) => {
    return res;
  });

  /**
   * 無線機関係・サテライトモードを変更する
   */
  ipcMain.handle("setSatelliteMode", async (event, isSatelliteMode: boolean) => {
    return await TransceiverService.getInstance().setSatelliteMode(isSatelliteMode);
  });

  /**
   * ドップラーシフト待機イベント
   */
  ipcMain.handle("dopplerShiftWaitingCallback", async (event, res: ApiResponse<boolean>) => {
    return res;
  });

  /**
   * 無線機周波数保存イベント
   */
  ipcMain.handle("onSaveTransceiverFrequency", async (evnet) => {});

  /**
   * URLから読み込み可能なTLEが取得できるか確認する
   */
  ipcMain.handle("canGetValidTle", async (event, url: string): Promise<boolean> => {
    return new TleService().canGetValidTle(url, new WebClient());
  });

  /**
   * 通知メッセージイベント
   */
  ipcMain.handle("onNoticeMessage", async (event, args: any) => {
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
  ipcMain.removeHandler("getTlesByNoradIds");
  ipcMain.removeHandler("getGeoLocation");
  ipcMain.removeHandler("getSavedSatelliteIdentifer");
  ipcMain.removeHandler("getDefaultSatelliteBySatelliteId");
  ipcMain.removeHandler("addDefaultSatellite");
  ipcMain.removeHandler("reCreateDefaultSatellite");
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
  ipcMain.removeHandler("canGetValidTle");
  ipcMain.removeHandler("onNoticeMessage");

  initialized = false;
}
