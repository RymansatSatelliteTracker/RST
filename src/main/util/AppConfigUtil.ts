import Constant from "@/common/Constant";
import {
  AppConfigMainDisplay,
  AppConfigModel,
  AppConfigSatellite,
  AppConfigSatelliteGroup,
} from "@/common/model/AppConfigModel";
import { AppConfigRotatorDevice, AppConfigRotatorModel } from "@/common/model/AppConfigRotatorModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { AppConfigTransceiverDevice, AppConfigTransceiverModel } from "@/common/model/AppConfigTransceiverModel";
import AppConfigSatelliteService from "@/main/service/AppConfigSatelliteService";
import AppMainLogger from "@/main/util/AppMainLogger";
import FileUtil from "@/main/util/FileUtil";
import TransactionRegistry from "@/main/util/TransactionRegistry";
import Store from "electron-store";
import * as path from "path";

// 設定ファイル（JSON）のルートのキー名
const CONFIG_ROOT_KEY = "param";

const DEFAULT_TLE_URL = [
  {
    enable: true,
    url: "http://www.amsat.org/amsat/ftp/keps/current/nasabare.txt",
  },
  {
    enable: true,
    url: "http://celestrak.org/NORAD/elements/amateur.txt",
  },
  {
    enable: true,
    url: "http://celestrak.com/NORAD/elements/cubesat.txt",
  },
  {
    enable: false,
    url: "http://celestrak.com/NORAD/elements/geo.txt",
  },
  {
    enable: true,
    url: "http://celestrak.com/NORAD/elements/stations.txt",
  },
  {
    enable: true,
    url: "http://celestrak.com/NORAD/elements/tle-new.txt",
  },
  {
    enable: false,
    url: "http://celestrak.com/NORAD/elements/visual.txt",
  },
  {
    enable: false,
    url: "http://celestrak.com/NORAD/elements/weather.txt",
  },
];
/**
 * アプリケーション設定のユーティリティ
 */
export class AppConfigUtil {
  private static store = new Store({ name: Constant.Config.CONFIG_FILENAME });

  /**
   * 設定の初期処理
   * @returns AppConfigModel
   */
  public static init(): AppConfigModel {
    // 初期データファイルの配置
    AppConfigUtil.initTransceiverJson();
    AppConfigUtil.initRotatorJson();
    AppConfigUtil.initDefautSatJson();

    // 設定ファイルが未作成の場合、初期値の設定を行う
    if (!FileUtil.exists(AppConfigUtil.store.path)) {
      const config = AppConfigUtil.makeInitConfig();
      AppConfigUtil.storeConfig(config);
    }

    // 現アプリバージョンとアプリケーション設定のバージョンが同一の場合は、そのまま返す
    const config = AppConfigUtil.store.get(CONFIG_ROOT_KEY) as AppConfigModel;
    if (config.appVersion === Constant.appVersion) {
      return config;
    }

    // バージョンが異なる場合は、新定義に移行して保存する
    const mergedConfig = this.migrationConfig(config);
    this.storeConfig(mergedConfig);

    return mergedConfig;
  }

  /**
   * 指定のアプリケーション設定を新定義に移行する
   */
  public static migrationConfig(highPriorityConfig: AppConfigModel): AppConfigModel {
    const appConfig = new AppConfigModel();

    // 各項目が旧定義に存在する場合は、その定義をコピーする
    // 直下の項目関係
    // memo: Object.assignで直下の項目を上書きすると、入れ子系の項目の新定義が失われるので、
    //       一つづつコピーする
    if ("lang" in highPriorityConfig) {
      appConfig.lang = highPriorityConfig.lang;
    }

    // 各項目配下の（入れ子の）定義を旧定義の値で上書き
    // Object.assignを利用して、新定義をベースに旧定義の値で上書き
    Object.assign(appConfig.tle, highPriorityConfig.tle);
    Object.assign(appConfig.satellites, highPriorityConfig.satellites);
    Object.assign(appConfig.satelliteGroups, highPriorityConfig.satelliteGroups);
    Object.assign(appConfig.satelliteSetting, highPriorityConfig.satelliteSetting);
    Object.assign(appConfig.transceiver, highPriorityConfig.transceiver);
    Object.assign(appConfig.rotator, highPriorityConfig.rotator);
    Object.assign(appConfig.groundStation, highPriorityConfig.groundStation);
    Object.assign(appConfig.groundStation2, highPriorityConfig.groundStation2);
    Object.assign(appConfig.mainDisplay, highPriorityConfig.mainDisplay);

    // バージョンは新定義のバージョンで強制変更
    appConfig.appVersion = Constant.appVersion;

    return appConfig;
  }

  /**
   * 設定パラメータを返す
   * @returns
   */
  public static getConfig(): AppConfigModel {
    const appConfig = AppConfigUtil.store.get(CONFIG_ROOT_KEY) as AppConfigModel;
    if (!appConfig) {
      throw new Error("設定ファイルが存在しません。");
    }

    return appConfig;
  }
  /**
   * トランザクション中なら一時ファイルを優先して返す
   */
  public static getConfigTransaction(): AppConfigModel {
    const tempPath = TransactionRegistry.getActiveTempFilePath("appConfig");
    if (tempPath && FileUtil.exists(tempPath)) {
      const text = FileUtil.readText(tempPath);
      const parsed = JSON.parse(text);
      const appConfig = (parsed as any)[CONFIG_ROOT_KEY] as AppConfigModel;
      if (!appConfig) {
        throw new Error("一時設定ファイルの内容が不正です。");
      }
      return appConfig;
    }

    // トランザクション中じゃなければ通常の設定パラメータを返す
    return this.getConfig();
  }

  /**
   * 無線機定義を返す
   */
  public static getTransceiverConfig(): AppConfigTransceiverModel {
    const jsonText = FileUtil.readText(AppConfigUtil.getTransciverConfigPath());
    return JSON.parse(jsonText) as AppConfigTransceiverModel;
  }

  /**
   * 設定ファイルで設定されている、現在の無線機の機器定義を返す
   */
  public static getCurrentTransceiverDevice(): AppConfigTransceiverDevice {
    const configTrn = AppConfigUtil.getConfig().transceiver;
    return AppConfigUtil.findTransceiverDeviceById(configTrn.makerId, configTrn.transceiverId);
  }

  /**
   * 指定の無縁機IDの無線機機器定義を返す
   * @throws {Error} 指定の無線機IDの無線機機器が無線機定義ファイルに存在しない場合
   */
  public static findTransceiverDeviceById(makerId: string, transceiverId: string): AppConfigTransceiverDevice {
    // 無線機で回して
    const transceivers = AppConfigUtil.getTransceiverConfig().transceivers;
    for (let ii = 0; ii < transceivers.length; ii++) {
      const transceiver = transceivers[ii];

      // デバイスで回してIDが一致するデバイスを返す
      for (let jj = 0; jj < transceiver.devices.length; jj++) {
        const device = transceiver.devices[jj];
        if (transceiver.makerId === makerId && device.transceiverId === transceiverId) {
          return device;
        }
      }
    }

    // 定義ファイルが改変されていない場合は、ここに到達しないはず
    throw new Error(
      `指定の無線機IDの無線機機器が無線機定義ファイルに存在しません。makerId=${makerId}, transceiverId=${transceiverId}`
    );
  }
  /**
   * ローテーター定義を返す
   */
  public static getRotatorConfig(): AppConfigRotatorModel {
    const jsonText = FileUtil.readText(AppConfigUtil.getRotatorConfigPath());
    return JSON.parse(jsonText) as AppConfigRotatorModel;
  }

  /**
   * 設定ファイルで設定されている、現在のローテーターの機器定義を返す
   */
  public static getCurrentRotatorDevice(): AppConfigRotatorDevice {
    const configRot = AppConfigUtil.getConfig().rotator;
    return AppConfigUtil.findRotatorDeviceById(configRot.rotatorId);
  }

  /**
   * 指定のローテーターIDのローテーター機器定義を返す
   * @throws {Error} 指定のローテーターIDのローテーター機器がローテーター定義ファイルに存在しない場合
   */
  public static findRotatorDeviceById(rotatorId: string): AppConfigRotatorDevice {
    // ローテーターで回して
    const rotators = AppConfigUtil.getRotatorConfig().rotators;
    for (let ii = 0; ii < rotators.length; ii++) {
      const rotator = rotators[ii];

      // デバイスで回してIDが一致するデバイスを返す
      for (let jj = 0; jj < rotator.devices.length; jj++) {
        const device = rotator.devices[jj];
        if (device.rotatorId === rotatorId) {
          return device;
        }
      }
    }

    // 定義ファイルが改変されていない場合は、ここに到達しないはず
    throw new Error(
      `指定のローテーターIDのローテーター機器がローテーター定義ファイルに存在しません。rotatorId=${rotatorId}`
    );
  }

  /**
   * TLE最終取得日時を保存する
   * @param utc
   */
  public static saveTleLastRetrievedDate(utc: number) {
    const config = AppConfigUtil.getConfig();
    config.tle.lastRetrievedDate = utc;

    // 保存
    AppConfigUtil.storeConfig(config);
  }

  /**
   * 初期値の設定を行う
   */
  private static makeInitConfig(): AppConfigModel {
    const config = new AppConfigModel();

    // TLE最終取得日時は現在日時（UTC）を設定
    config.tle.lastRetrievedDate = Date.now();

    // TLEのURLを設定
    config.tle.urls = DEFAULT_TLE_URL;

    // 衛星グループの初期値設定
    const satGrp = new AppConfigSatelliteGroup();
    // memo: IDは /data/init-data/default_satellite.json の記載と同期をとる必要があるので注意
    satGrp.groupId = 1;
    satGrp.groupName = "Group1";
    satGrp.satelliteIds = [1];
    config.satelliteGroups.push(satGrp);

    // アクティブ衛星としても設定する
    // memo: IDは /data/init-data/default_satellite.json の記載と同期をとる必要があるので注意
    config.mainDisplay.activeSatelliteGroupId = 1;
    config.mainDisplay.activeSatelliteId = 1;

    // 地上局の初期値設定
    config.groundStation.lon = 139.7745380970922; // 日本橋
    config.groundStation.lat = 35.684077508026164;
    config.groundStation.height = 0;

    return config;
  }

  /**
   * 無線機定義ファイルの配置を行う
   */
  private static initTransceiverJson() {
    // 既に無線機定義ファイルが存在する場合は処理終了
    const configPath = AppConfigUtil.getTransciverConfigPath();

    // TODO: 開発中は起動ごとに上書きさせるため、ファイルが存在しても処理を終了しない
    // if (FileUtil.exists(configPath)) {
    //   return;
    // }

    // 初期データを配置する
    const initJsonPath = Constant.Config.INIT_CONFIG_TRANSCEIVER_FILE_PATH;
    FileUtil.copyFile(initJsonPath, configPath);

    AppMainLogger.info(`無線機定義ファイルの初期データを配置しました。 ${configPath}`);
  }

  /**
   * ローテーター定義ファイルの配置を行う
   */
  private static initRotatorJson() {
    // 既にローテーター定義ファイルが存在する場合は処理終了
    const configPath = AppConfigUtil.getRotatorConfigPath();

    // TODO: 開発中は起動ごとに上書きさせるため、ファイルが存在しても処理を終了しない
    // if (FileUtil.exists(configPath)) {
    //   return;
    // }

    // 初期データを配置する
    const initJsonPath = Constant.Config.INIT_CONFIG_ROTATOR_FILE_PATH;
    FileUtil.copyFile(initJsonPath, configPath);

    AppMainLogger.info(`ローテータ定義ファイルの初期データを配置しました。 ${configPath}`);
  }

  /**
   * デフォルト衛星定義の初期データファイルの配置を行う
   */
  public static initDefautSatJson() {
    // 既にデフォルト衛星定義ファイルが存在する場合は処理終了
    const configPath = AppConfigUtil.getDefaultSatConfigPath();
    if (FileUtil.exists(configPath)) {
      return;
    }

    // 初期データを配置する
    const initJsonPath = Constant.Config.INIT_CONFIG_DEFAULT_SATELLITE_FILE_PATH;
    FileUtil.copyFile(initJsonPath, configPath);

    AppMainLogger.info(`衛星定義ファイルの初期データを配置しました。 ${configPath}`);
  }

  /**
   * アプリケーション設定を保存する
   */
  public static storeConfig(config: AppConfigModel) {
    AppConfigUtil.store.set(CONFIG_ROOT_KEY, config);
  }

  /**
   * アプリケーション設定ファイルの保存先フォルダをフルパスで返す
   */
  public static getConfigDir() {
    return path.dirname(AppConfigUtil.store.path);
  }

  /**
   * アプリケーション設定ファイルの保存先を返す
   */
  public static getConfigPath() {
    return AppConfigUtil.store.path;
  }

  /**
   * 無線機設定ファイルの保存先をフルパスで返す
   */
  public static getTransciverConfigPath() {
    return path.join(AppConfigUtil.getConfigDir(), Constant.Config.CONFIG_TRANSCEIVER_FILENAME);
  }

  /**
   * ローテーター設定ファイルの保存先をフルパスで返す
   */
  public static getRotatorConfigPath() {
    return path.join(AppConfigUtil.getConfigDir(), Constant.Config.CONFIG_ROTATOR_FILENAME);
  }

  /**
   * デフォルト衛星定義ファイルの保存先をフルパスで返す
   */
  public static getDefaultSatConfigPath() {
    return path.join(AppConfigUtil.getConfigDir(), Constant.Config.DEFAULT_SATELLITE_FILENAME);
  }

  /**
   * TLEファイルの保存先をフルパスで返す
   */
  public static getTlePath() {
    return path.join(AppConfigUtil.getConfigDir(), Constant.Tle.TLE_FILENAME);
  }

  /**
   * 設定ファイルの情報を衛星設定画面用の形式に変換して取得する
   * @returns AppConfigSatSettingModel
   */
  public static getConfigSatSetting(): AppConfigSatSettingModel {
    const appConfig: AppConfigModel = this.getConfig();
    const appConfigSatSet: AppConfigSatSettingModel = this.transformSatelliteGroupsForSatSetting(appConfig);

    return appConfigSatSet;
  }

  /**
   * メイン表示する衛星グループ、衛星ID情報を返す
   */
  public static getAppConfigMainDisplay(): AppConfigMainDisplay {
    const appConfig: AppConfigModel = this.getConfig();
    return appConfig.mainDisplay;
  }

  /**
   * 設定ファイル用の形式に変換してアプリケーション設定を保存する
   * @param config
   */
  public static storeConfigSatSetting(config: AppConfigSatSettingModel) {
    // satelliteGroupsForSatSettingをsatelliteGroupsに焼き直す
    const appConfig = this.transformSatelliteGroups(config);
    // 保存
    this.storeConfig(appConfig);
  }

  /**
   * satelliteGroupsをsatelliteGroupsForSatSettingに焼き直す
   * @param appConfig
   * @returns
   */
  public static transformSatelliteGroupsForSatSetting(appConfig: AppConfigModel): AppConfigSatSettingModel {
    const appConfigSatSet = new AppConfigSatSettingModel();
    const appConfSatService = new AppConfigSatelliteService();
    // 衛星IDから衛星名を検索して衛星IDと衛星名のオブジェクトの配列を作る
    const newSatGroups = appConfig.satelliteGroups.map((groups) => {
      const satIdentifers = groups.satelliteIds
        .map((satelliteId) => {
          // 衛星IDから該当する衛星デフォルト情報を取得する
          const appConfigSat = appConfSatService.getUserRegisteredAppConfigSatellite(satelliteId, groups.groupId);
          // 返却に必要な衛星IDと衛星名の組み合わせにする
          if (appConfigSat === null) {
            // ないはずだが衛星IDがヒットしなければundefined
            return { satelliteId: satelliteId, satelliteName: "undefined", userRegistered: false };
          } else {
            // デフォルト衛星が取得できたらその情報を返すが
            // ユーザ登録した衛星名があったらそちらを優先する
            return {
              satelliteId: appConfigSat.satelliteId,
              satelliteName: appConfigSat.userRegisteredSatelliteName,
              userRegistered: appConfigSat.userRegistered,
            };
          }
        })
        .filter((item) => item !== null); // null除去
      return { groupId: groups.groupId, groupName: groups.groupName, satellites: satIdentifers };
    });
    // 新しいオブジェクトに値をコピーする
    this.copyMatchingProperties(appConfigSatSet, appConfig);
    // 衛星設定画面用のグループリストに値を設定する
    appConfigSatSet.satelliteGroupsForSatSetting = newSatGroups;
    return appConfigSatSet;
  }

  /**
   * satelliteGroupsForSatSettingをsatelliteGroupsに焼き直す
   * @param config
   * @returns
   */
  public static transformSatelliteGroups(config: AppConfigSatSettingModel): AppConfigModel {
    // idの配列を作成してグループリストの形にする
    config.satelliteGroups = config.satelliteGroupsForSatSetting.map((group) => {
      const satIds = group.satellites.map((sat) => {
        return sat.satelliteId;
      });
      return { groupId: group.groupId, groupName: group.groupName, satelliteIds: satIds };
    });
    const appConfig = new AppConfigModel();
    // オブジェクトの値をコピー
    this.copyMatchingProperties(appConfig, config);

    return appConfig;
  }

  /**
   * 名称が一致しているプロパティの値のみを任意のオブジェクトにコピーする
   * @param target コピー先オブジェクト
   * @param source コピー元オブジェクト
   */
  public static copyMatchingProperties<T extends object, U extends object>(target: T, source: U): void {
    Object.keys(source).forEach((key) => {
      if (key in target) {
        (target as any)[key] = (source as any)[key]; // 型安全のため `any` を使用
      }
    });
  }

  /**
   * アプリケーション設定の衛星を検索する
   * @param satelliteId
   * @param groupdId
   * @returns 見つからなければnull
   */
  public static searchAppConfigSatellite(satelliteId: number, groupdId: number): AppConfigSatellite | null {
    const appConfigSats = this.getConfig().satellites;
    if (appConfigSats.length === 0) return null;
    return appConfigSats.find((sat) => sat.satelliteId === satelliteId && sat.groupId === groupdId) ?? null;
  }
}
