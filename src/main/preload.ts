import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import {
  AppConfigModel,
  AppConfigRotator,
  AppConfigSatellite,
  AppConfigTransceiver,
} from "@/common/model/AppConfigModel";
import { AppConfigRotatorModel } from "@/common/model/AppConfigRotatorModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { AppConfigTransceiverModel } from "@/common/model/AppConfigTransceiverModel";
import { MessageModel } from "@/common/model/MessageModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse, LangType } from "@/common/types/types";
import type { TleStrings } from "@/renderer/types/satellite-type";
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
/**
 * ここにレンダラに公開するAPIを定義する
 */
const apiHandler = {
  /**
   * アプリケーション設定を返す
   */
  getAppConfig: function (): Promise<AppConfigModel> {
    return ipcRenderer.invoke("getAppConfig");
  },

  /**
   * アプリケーション設定を保存する
   */
  storeAppConfig: function (config: AppConfigModel) {
    return ipcRenderer.invoke("storeAppConfig", config);
  },

  /**
   * 衛星設定画面用のアプリケーション設定を返す
   */
  getAppConfigSatSetting: function (): Promise<AppConfigSatSettingModel> {
    return ipcRenderer.invoke("getAppConfigSatSetting");
  },

  /**
   * 衛星設定画面用のアプリケーション設定を保存する
   */
  storeAppConfigSatSetting: function (config: AppConfigSatSettingModel, isTleUpdate: boolean): Promise<void> {
    return ipcRenderer.invoke("storeAppConfigSatSetting", config, isTleUpdate);
  },

  /**
   * メイン表示する衛星グループとその衛星情報を返す
   */
  getActiveSatelliteGroup: function (): Promise<ActiveSatelliteGroupModel> {
    return ipcRenderer.invoke("getActiveSatelliteGroup");
  },

  /**
   * 衛星グループ、衛星ID情報を更新した場合にコールする
   */
  refreshAppConfig: function () {
    return ipcRenderer.invoke("refreshAppConfig");
  },

  /**
   * メイン表示する衛星グループ、衛星ID情報が保存された場合の変更イベント
   */
  onChangeActiveSatelliteGroup: (callback: Function) => {
    ipcRenderer.on(
      "onChangeActiveSatelliteGroup",
      (event: IpcRendererEvent, satGrpModel: ActiveSatelliteGroupModel) => {
        callback(satGrpModel);
      }
    );
  },

  /**
   * ローテーター定義を返す
   */
  getRotatorConfig: function (): Promise<AppConfigRotatorModel> {
    return ipcRenderer.invoke("getRotatorConfig");
  },

  /**
   * 無線機定義を返す
   */
  getTransceiverConfig: function (): Promise<AppConfigTransceiverModel> {
    return ipcRenderer.invoke("getTransceiverConfig");
  },

  /**
   * 衛星識別情報を返す
   * 呼び出し例）const ret = await window.rstApi.getSavedSatelliteIdentifer();
   */
  getSavedSatelliteIdentifer: function (): Promise<string> {
    return ipcRenderer.invoke("getSavedSatelliteIdentifer");
  },

  /**
   * 衛星IDに一致するデフォルト衛星情報を取得を返す
   * 呼び出し例）const ret = await window.rstApi.getDefaultSatelliteBySatelliteId();
   */
  getDefaultSatelliteBySatelliteId: function (
    satelliteId: number,
    useDefaultAppConfigIfExists: boolean
  ): Promise<string> {
    return ipcRenderer.invoke("getDefaultSatelliteBySatelliteId", satelliteId, useDefaultAppConfigIfExists);
  },

  /**
   * デフォルト衛星情報を追加する
   * 呼び出し例）const ret = await window.rstApi.addDefaultSatellite(satelliteName);
   */
  addDefaultSatellite: function (satelliteName: string): Promise<number> {
    return ipcRenderer.invoke("addDefaultSatellite", satelliteName);
  },

  /**
   * デフォルト衛星情報をリフレッシュして再作成する
   * 呼び出し例）const ret = await window.rstApi.reCreateDefaultSatellite();
   */
  reCreateDefaultSatellite: function (): Promise<boolean> {
    return ipcRenderer.invoke("reCreateDefaultSatellite");
  },

  /**
   * 衛星IDに一致するアプリケーション設定かデフォルト衛星情報を取得を返す
   * 呼び出し例）const ret = await window.rstApi.getUserRegisteredAppConfigSatellite(satelliteId);
   */
  getUserRegisteredAppConfigSatellite: function (satelliteId: number, groupdId: number): Promise<AppConfigSatellite> {
    return ipcRenderer.invoke("getUserRegisteredAppConfigSatellite", satelliteId, groupdId);
  },

  /**
   * 指定のNORAD IDのTLEを返す
   * 呼び出し例）const ret = await window.rstApi.getTlesByNoradIds(["xxx", "yyy"]);
   */
  getTlesByNoradIds: function (noradIds: string): Promise<TleStrings[]> {
    return ipcRenderer.invoke("getTlesByNoradIds", noradIds);
  },

  /**
   * GeoLocationを返す
   */
  getGeoLocation: function (): Promise<{ latitude: string; longitude: string } | null> {
    return ipcRenderer.invoke("getGeoLocation");
  },

  /**
   * ローテータ関係・監視を開始する
   * @param rotConfig ローテータ設定（省略時はAppConfigから取得）
   */
  startAntennaCtrl: function (rotConfig: AppConfigRotator | null = null): Promise<ApiResponse<void>> {
    return ipcRenderer.invoke("startAntennaCtrl", rotConfig);
  },

  /**
   * ローテータ関係・監視を終了する
   */
  stopAntennaCtrl: function () {
    return ipcRenderer.invoke("stopAntennaCtrl");
  },

  /**
   * ローテータ関係・指定の位置にアンテナを移動する
   */
  setAntennaPosition: function (antennaPositionModel: AntennaPositionModel) {
    return ipcRenderer.invoke("setAntennaPosition", antennaPositionModel);
  },

  /**
   * ローテータ関係・アンテナ位置の変更イベント
   */
  onChangeAntennaPosition: (callback: Function) => {
    ipcRenderer.on("onChangeAntennaPosition", (event: IpcRendererEvent, res: ApiResponse<AntennaPositionModel>) => {
      callback(res);
    });
  },

  /**
   * ローテータ関係・ローテータのデバイスが切断された際のイベント
   */
  onRoratorDisconnect: (callback: Function) => {
    ipcRenderer.on("onRoratorDisconnect", (event: IpcRendererEvent) => {
      callback();
    });
  },

  /**
   * 無線機関係・監視を開始する
   * @param reqTransceiverConfig 無線機設定（省略時はAppConfigから取得）
   */
  startTransceiverCtrl: function (
    reqTransceiverConfig: AppConfigTransceiver | null = null
  ): Promise<ApiResponse<void>> {
    return ipcRenderer.invoke("startTransceiverCtrl", reqTransceiverConfig);
  },

  /**
   * 無線機関係・監視を終了する
   */
  stopTransceiverCtrl: function () {
    return ipcRenderer.invoke("stopTransceiverCtrl");
  },

  /**
   * 無線機関係・AutoOn時の初期処理
   */
  transceiverInitAutoOn: function (
    txFreqHz: number,
    rxFreqHz: number,
    txMode: string,
    rxMode: string,
    toneHz: number | null
  ): Promise<ApiResponse<void>> {
    return ipcRenderer.invoke("transceiverInitAutoOn", txFreqHz, rxFreqHz, txMode, rxMode, toneHz);
  },

  /**
   * 無線機関係・AutoOff
   */
  transceiverAutoOff: function (): Promise<ApiResponse<void>> {
    return ipcRenderer.invoke("transceiverAutoOff");
  },
  /**
   * 無線機関係・周波数設定コマンドを送信する
   */
  setTransceiverFrequency: function (frequencyModel: UplinkType | DownlinkType): Promise<void> {
    return ipcRenderer.invoke("setTransceiverFrequency", frequencyModel);
  },

  /**
   * 無線機関係・周波数の変更イベント
   */
  onChangeTransceiverFrequency: (callback: Function) => {
    ipcRenderer.on(
      "onChangeTransceiverFrequency",
      (event: IpcRendererEvent, res: ApiResponse<UplinkType | DownlinkType>) => {
        callback(res);
      }
    );
  },

  /**
   * 無線機関係・モード設定コマンドを送信する
   * @param {(UplinkType | DownlinkType)} modeModel モード設定
   */
  setTransceiverMode: function (modeModel: UplinkType | DownlinkType): Promise<void> {
    return ipcRenderer.invoke("setTransceiverMode", modeModel);
  },

  /**
   * 無線機関係・モードの変更イベント
   */
  onChangeTransceiverMode: (callback: Function) => {
    ipcRenderer.on(
      "onChangeTransceiverMode",
      (event: IpcRendererEvent, res: ApiResponse<UplinkType | DownlinkType>) => {
        callback(res);
      }
    );
  },

  /**
   * 無線機関係・サテライトモードを変更する
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  setSatelliteMode: function (isSatelliteMode: boolean): Promise<void> {
    return ipcRenderer.invoke("setSatelliteMode", isSatelliteMode);
  },

  /**
   * ドップラーシフト待機イベント
   */
  dopplerShiftWaitingCallback: (callback: Function) => {
    ipcRenderer.on("dopplerShiftWaitingCallback", (event: IpcRendererEvent, res: ApiResponse<boolean>) => {
      callback(res);
    });
  },

  /**
   * 共通系・アクティブなシリアルポートのリストを返す
   */
  getActiveSerialPorts: function (): Promise<string[]> {
    return ipcRenderer.invoke("getActiveSerialPorts");
  },

  /**
   * シリアルポートをオープンする（試行）
   */
  openSerialPortTry: function (comName: string, baudRate: number): Promise<boolean> {
    return ipcRenderer.invoke("openSerialPortTry", comName, baudRate);
  },
  /**
   * シリアルポートをクローズする
   */
  closeSerialPort: function (): Promise<boolean> {
    return ipcRenderer.invoke("closeSerialPort");
  },

  /**
   * 言語設定の変更イベント
   * メイン側で以下の記載を行うと"onDispLangChange"が発火し、レンダラ側のコールバックが実行される
   * mainWindow.webContents.send("onDispLangChange", "ja");
   */
  onDispLangChange: (callback: Function) => {
    ipcRenderer.on("onDispLangChange", (event: IpcRendererEvent, lang: LangType) => {
      callback(lang);
    });
  },
  /**
   * 無線機周波数保存イベント
   * メイン側で以下の記載を行うと"onSaveTransceiverFrequency"が発火し、レンダラ側のコールバックが実行される
   * mainWindow.webContents.send("onSaveTransceiverFrequency");
   */
  onSaveTransceiverFrequency: (callback: Function) => {
    ipcRenderer.on("onSaveTransceiverFrequency", (event: IpcRendererEvent) => {
      callback();
    });
  },
  /**
   * URLから読み込み可能なTLEが取得できるか確認する
   * 呼び出し例）const canGet = await window.rstApi.canGetValidTle(url);
   */
  canGetValidTle: function (url: string): Promise<boolean> {
    return ipcRenderer.invoke("canGetValidTle", url);
  },
  /**
   * 通知メッセージイベント
   * メイン側で以下の記載を行うと"onNoticeMessage"が発火し、レンダラ側のコールバックが実行される
   * mainWindow.webContents.send("onNoticeMessage", message);
   */
  onNoticeMessage: (callback: Function) => {
    ipcRenderer.on("onNoticeMessage", (event: IpcRendererEvent, args: any) => {
      callback(args[0] as MessageModel);
    });
  },
};

// rendererプロセスに公開（アプリ関係）
contextBridge.exposeInMainWorld("rstApi", apiHandler);

// rendererプロセスに公開（electron関係）
contextBridge.exposeInMainWorld("electronApi", {
  // ファイルオープンダイアログ
  // 使用例）const filePath = await window.openFile()
  openFileDialog: () => ipcRenderer.invoke("dialog:openFile"),
});
