import Constant from "@/common/Constant";
import { BeaconType, DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiAppConfigSatellite from "@/renderer/api/ApiAppConfigSatellite";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper";
import GroundStationServiceFactory from "@/renderer/common/util/GroundStationServiceFactory";
import OrbitLineServiceFactory from "@/renderer/common/util/OrbitLineServiceFactory";
import SatelliteServiceFactory from "@/renderer/common/util/SatelliteServiceFactory";
import FrequencyTrackService from "@/renderer/service/FrequencyTrackService";
import GroundStationService from "@/renderer/service/GroundStationService";
import OrbitLineService from "@/renderer/service/OrbitLineService";
import OverlapPassesService from "@/renderer/service/OverlapPassesService";
import SatelliteService from "@/renderer/service/SatelliteService";
import type { GroundStation } from "@/renderer/types/location-type";
import { PassesCache } from "@/renderer/types/pass-type";

/**
 * アクティブ衛星関係のハブクラス
 */
export default class ActiveSatServiceHub {
  // シングルトンインスタンス
  private static instance: ActiveSatServiceHub = new ActiveSatServiceHub();

  // // 現在の基準時刻
  // private baseDate: Date = new Date();

  private activeSatIndex: number = 0;

  // 地上局1(自局)の位置
  private groundStation: GroundStation | null = null;
  // 地上局2(他局)の位置
  private groundStation2: GroundStation | null = null;

  // 衛星グループ、アクティブ衛星が変更された場合のコールバックリスト
  private activeSatChangeCallbacks: Function[] = [];

  // 基準時刻が変更された場合のコールバックリスト
  private baseDateChangeCallbacks: Function[] = [];

  // アクティブ衛星のSatelliteService
  private satService: SatelliteService | null = null;
  // 衛星グループのSatelliteServiceリスト
  private satServices: SatelliteService[] = [];
  // 衛星グループのSatelliteServiceリスト（アクティブ衛星を除いたもの）
  private withoutActiveSatServices: SatelliteService[] = [];
  // 人工衛星の軌道クラス
  private orbitLineService: OrbitLineService | null = null;
  // 地上局クラス
  private groundStationService: GroundStationService | null = null;
  // 重複可視時間クラス
  private overlapPassesService: OverlapPassesService | null = null;
  // アクティブ衛星の周波数計算サービス
  private frequencyTrackService: FrequencyTrackService | null = null;

  // アクティブ衛星のアップリンク設定
  private uplinkFreq: UplinkType | null = null;
  // アクティブ衛星のダウンリンク設定
  private downlinkFreq: DownlinkType | null = null;
  // アクティブ衛星のビーコン設定
  private beaconFreq: BeaconType | null = null;
  // アクティブ衛星のトラッキングモード
  private satTrackMode: string | null = null;

  /**
   * シングルトンのため、コンストラクタは隠蔽
   */
  private constructor() {}

  /**
   * シングルトンインタンスを返す
   */
  public static getInstance() {
    return this.instance;
  }

  /**
   * アクティブ衛星情報の取得を開始する
   */
  public async start() {
    // 最新情報を取得
    await this.onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    await ApiActiveSat.onChangeActiveSatelliteGroup(async () => {
      await this.onChangeSatGrp();
    });
  }

  /**
   * 衛星パス抽出最小仰角を更新する
   */
  public async updateSatChoiceMinEl(satChoiceMinEl: number) {
    if (!this.satService) {
      return;
    }

    // 地上局
    this.groundStationService = await GroundStationServiceFactory.create(this.satService, satChoiceMinEl);

    // 2か所の地上局が有効な場合は、重複するAOS/LOSを取得する
    const appConfig = await ApiAppConfig.getAppConfig();
    if (appConfig.groundStation2.enable) {
      this.overlapPassesService = await GroundStationServiceFactory.createOverlapPassesService(
        this.satService,
        satChoiceMinEl
      );
    } else {
      this.overlapPassesService = null;
    }

    // コールバックを実行
    this.activeSatChangeCallbacks.forEach((callback) => {
      callback();
    });
  }

  /**
   * 衛星グループ、アクティブ衛星が変更された場合のコールバックを追加する
   */
  public addOnChangeActiveSat(callback: Function) {
    this.activeSatChangeCallbacks.push(callback);
  }

  /**
   * 基準時刻が変更された場合のコールバックを追加する
   */
  public addOnChangeBaseDate(callback: Function) {
    this.baseDateChangeCallbacks.push(callback);
  }

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  private async onChangeSatGrp() {
    // 現在のアクティブ衛星でSatelliteServiceを生成しなおす
    this.satService = await SatelliteServiceFactory.createByActiveSat();
    if (!this.satService) {
      return;
    }

    // 衛星グループのSatelliteServiceリスト
    this.satServices = await SatelliteServiceFactory.createBySatGroup();
    this.withoutActiveSatServices = await SatelliteServiceFactory.createBySatGroup(false);

    // 人工衛星の軌道
    this.orbitLineService = await OrbitLineServiceFactory.create(this.satService);

    // 地上局
    this.groundStationService = await GroundStationServiceFactory.create(this.satService);

    // 2か所の地上局が有効な場合は、重複するAOS/LOSを取得する
    const appConfig = await ApiAppConfig.getAppConfig();
    if (appConfig.groundStation2.enable) {
      this.overlapPassesService = await GroundStationServiceFactory.createOverlapPassesService(this.satService);
    } else {
      this.overlapPassesService = null;
    }

    // アクティブ衛星の周波数計算サービス
    this.frequencyTrackService = new FrequencyTrackService(this.satService);

    // アクティブ衛星のIndex
    this.activeSatIndex = await this.getSatIndex();

    // 地上局1(自局)の位置
    this.groundStation = {
      enable: true,
      latitude: appConfig.groundStation.lat,
      longitude: appConfig.groundStation.lon,
      height: appConfig.groundStation.height,
    };

    // 地上局2(他局)の位置
    this.groundStation2 = {
      enable: appConfig.groundStation2.enable,
      latitude: appConfig.groundStation2.lat,
      longitude: appConfig.groundStation2.lon,
      height: appConfig.groundStation2.height,
    };

    // アクティブ衛星の無線設定を取得する
    await this.getTransceiverSetting();

    // コールバックを実行
    this.activeSatChangeCallbacks.forEach((callback) => {
      callback();
    });
  }

  /**
   * グループ内のアクティブ衛星のIndexを返す
   */
  private async getSatIndex() {
    // 衛星グループを取得
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      return 0;
    }

    // グループ内のアクティブ衛星のIndexを返す
    for (let ii = 0; ii < satGrp.activeSatellites.length; ii++) {
      const activeSat = satGrp.activeSatellites[ii];
      if (satGrp.mainSatelliteId === activeSat.satelliteId) {
        return ii;
      }
    }

    return 0;
  }

  /**
   * アクティブ衛星の無線設定を取得する
   */
  private async getTransceiverSetting() {
    // 衛星グループを取得
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      return 0;
    }

    const appConfigSatellite = await ApiAppConfigSatellite.getUserRegisteredAppConfigSatellite(satGrp.mainSatelliteId);
    if (appConfigSatellite) {
      // アクティブ衛星のアップリンク設定
      switch (appConfigSatellite.autoModeUplinkFreq) {
        case 2:
          // アップリンク設定が2の場合は、設定2を使用する
          this.uplinkFreq = {
            uplinkHz: appConfigSatellite.uplink2.uplinkHz ?? null,
            uplinkMode: appConfigSatellite.uplink2.uplinkMode,
          };
          break;
        case 3:
          // アップリンク設定が3の場合は、設定3を使用する
          this.uplinkFreq = {
            uplinkHz: appConfigSatellite.uplink3.uplinkHz ?? null,
            uplinkMode: appConfigSatellite.uplink3.uplinkMode,
          };
          break;
        default:
          // それ以外の場合は、設定1を使用する
          this.uplinkFreq = {
            uplinkHz: appConfigSatellite.uplink1.uplinkHz ?? null,
            uplinkMode: appConfigSatellite.uplink1.uplinkMode,
          };
          break;
      }

      // アクティブ衛星のダウンリンク設定
      switch (appConfigSatellite.autoModeDownlinkFreq) {
        case 2:
          // ダウンリンク設定が2の場合は、設定2を使用する
          this.downlinkFreq = {
            downlinkHz: appConfigSatellite.downlink2.downlinkHz ?? null,
            downlinkMode: appConfigSatellite.downlink2.downlinkMode,
          };
          break;
        case 3:
          // ダウンリンク設定が3の場合は、設定3を使用する
          this.downlinkFreq = {
            downlinkHz: appConfigSatellite.downlink3.downlinkHz ?? null,
            downlinkMode: appConfigSatellite.downlink3.downlinkMode,
          };
          break;
        default:
          // それ以外は設定1を使用する
          this.downlinkFreq = {
            downlinkHz: appConfigSatellite.downlink1.downlinkHz ?? null,
            downlinkMode: appConfigSatellite.downlink1.downlinkMode,
          };
          break;
      }

      // アクティブ衛星のビーコン設定
      this.beaconFreq = {
        beaconHz: appConfigSatellite.beacon.beaconHz ?? null,
        beaconMode: appConfigSatellite.beacon.beaconMode,
      };

      // アクティブ衛星のトラッキングモード
      this.satTrackMode = appConfigSatellite.enableSatelliteMode ? appConfigSatellite.satelliteMode : null;
    }

    return 0;
  }

  /**
   * アクティブ衛星の直近のAOS/LOS情報を返す
   */
  public async getOrbitPassAsync(date: Date): Promise<PassesCache | null> {
    if (!this.satService || !this.groundStationService) {
      return null;
    }

    // 現在の基準日時を元に、追尾開始・終了時間を加味した基準日時を取得する
    // memo: 素の基準日時を渡すと、LOS後に次のパスが取れてしまうため（余白的な追尾が出来ないため）
    //       追尾開始・終了時間を加味した基準日時を元にパスを取得する
    const appConfig = await ApiAppConfig.getAppConfig();
    const baseDate = AutoTrackingHelper.getOffsetBaseDate(appConfig, date);

    // 2か所の地上局が有効な場合は、重複するAOS/LOSを取得する
    // （有効な場合：this.overlapPassesService != null）
    if (this.overlapPassesService) {
      const passes = await this.overlapPassesService.getOverlapPassesListAsync(
        baseDate,
        new Date(date.getTime() + Constant.Time.MILLISECONDS_IN_DAY)
      );

      // 取得できた場合は、直近の（リストの先頭の）データを返す
      if (passes && passes.length > 0) {
        return passes[0];
      }

      return null;
    }

    // 地上局が１つの場合
    // 人工衛星の直近のAOS/LOSを返す
    return await this.groundStationService.getOrbitPassAsync(baseDate);
  }

  /**
   * アクティブ衛星のSatelliteServiceのインスタンスを返す
   */
  public getSatService(): SatelliteService | null {
    return this.satService;
  }

  /**
   * 現在の衛星グループのSatelliteServiceリストを返す
   */
  public getSatGroupSatServices(withActiveSat: boolean = true): SatelliteService[] {
    // アクティブ衛星も含める場合
    if (withActiveSat) {
      return this.satServices;
    }

    return this.withoutActiveSatServices;
  }

  /**
   * 現在の衛星グループのOrbitLineServiceのインスタンスを返す
   */
  public getOrbitLineService(): OrbitLineService | null {
    return this.orbitLineService;
  }

  /**
   * 現在の地上局のGroundStationServiceのインスタンスを返す
   */
  public getGroundStationService(): GroundStationService | null {
    return this.groundStationService;
  }

  /**
   * 重複可視時間クラスのインスタンスを返す
   */
  public getOverlapPassesService(): OverlapPassesService | null {
    return this.overlapPassesService;
  }

  /**
   * アクティブ衛星の周波数計算サービスのインスタンスを返す
   */
  public getFrequencyTrackService(): FrequencyTrackService | null {
    return this.frequencyTrackService;
  }

  /**
   * アクティブ衛星のIndexを返す
   */
  public getActiveSatIndex(): number {
    return this.activeSatIndex;
  }

  /**
   * アクティブ衛星の無線設定を返す
   */
  public async getActiveSatTransceiverSetting(): Promise<{
    downlink: DownlinkType | null;
    uplink: UplinkType | null;
    beacon: BeaconType | null;
    satTrackMode: string | null;
  }> {
    return {
      downlink: this.downlinkFreq,
      uplink: this.uplinkFreq,
      beacon: this.beaconFreq,
      satTrackMode: this.satTrackMode,
    };
  }

  /**
   * 地上局1(自局)の位置を返す
   */
  public getGroundStation(): GroundStation | null {
    return this.groundStation;
  }

  /**
   * 地上局2(他局)の位置を返す
   */
  public getGroundStation2(): GroundStation | null {
    return this.groundStation2;
  }
}
