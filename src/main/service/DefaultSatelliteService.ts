import Constant from "@/common/Constant";
import { DefaultSatelliteModel } from "@/common/model/DefaultSatelliteModel";
import { FrequencyModel } from "@/common/model/FrequencyModel";
import { TleItemMap } from "@/common/model/TleModel";
import { DefaultSatelliteType, SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import TleService from "@/main/service/TleService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import AppMainLogger from "@/main/util/AppMainLogger";
import ElectronUtil from "@/main/util/ElectronUtil";
import FileUtil from "@/main/util/FileUtil";
import fs from "fs";
import path from "path";

/**
 * デフォルト衛星定義サービス
 */
export default class DefaultSatelliteService {
  private defSatJson: DefaultSatelliteModel = new DefaultSatelliteModel();
  constructor() {
    this.init();
  }

  /**
   * ファイルからデフォルト衛星定義を取得してメンバ変数に格納する
   */
  public init() {
    // デフォルト衛星定義が保存されたパスを取得する
    const savePathSat = path.join(ElectronUtil.getUserDir(), Constant.Config.DEFAULT_SATELLITE_FILENAME);
    if (fs.existsSync(savePathSat)) {
      const fileContentSat = fs.readFileSync(savePathSat, "utf-8");
      this.defSatJson = DefaultSatelliteModel.getInitializedModelFromData(JSON.parse(fileContentSat).defaultSatellite);
    }
  }

  /**
   * デフォルト衛星情報を更新する
   * @param isFrequencyUpdated
   * @returns
   */
  public async updateDefaultSatelliteService(isFrequencyUpdated = true): Promise<string> {
    // TLEを取得
    const tleItemMap: TleItemMap = this.getLatestTLE();

    // デフォルト衛星定義が保存されたパスを取得する
    const savePathSat = path.join(ElectronUtil.getUserDir(), Constant.Config.DEFAULT_SATELLITE_FILENAME);

    // memo: デフォルト衛星定義ファイルはアプリ起動時に、存在しなければ自動作成されるが、
    //       ユーザ操作での削除を考慮して、ファイルが存在しない場合は初期データを作成する
    if (!fs.existsSync(savePathSat)) {
      AppConfigUtil.initDefautSatJson();
    }

    const defaultSatData = FileUtil.readJson(savePathSat);
    this.defSatJson = DefaultSatelliteModel.getInitializedModelFromData(defaultSatData.defaultSatellite);

    // TLEから情報を取得してデフォルト衛星定義を更新する
    for (const tleItem of Object.values(tleItemMap)) {
      this.defSatJson.addSatellite(tleItem.name, tleItem.id);
    }

    // 衛星周波数設定で更新する
    if (isFrequencyUpdated) {
      let freqModel = new FrequencyModel();
      const savePathFrq = path.join(ElectronUtil.getUserDir(), Constant.Config.FREQUENCY_FILENAME);
      if (fs.existsSync(savePathFrq)) {
        const fileContentFrq = fs.readFileSync(savePathFrq, "utf-8");
        freqModel = JSON.parse(fileContentFrq);
      }

      this.defSatJson.updateSatellites(freqModel.frequency.satellites);
    }

    fs.writeFileSync(savePathSat, this.defSatJson.getJsonString());

    return "OK";
  }

  /**
   * 保存済みの衛星識別情報を返却する
   * @returns 衛星識別情報
   */
  public async getSavedSatelliteIdentifer(): Promise<SatelliteIdentiferType[]> {
    const tleItemMap: TleItemMap = this.getLatestTLE();
    // デフォルト衛星定義から衛星識別情報を取得
    const satIdentifer: SatelliteIdentiferType[] = this.defSatJson.getSatelliteIdentifer(tleItemMap);

    return satIdentifer;
  }

  /**
   * 衛星IDに一致する衛星識別情報を取得
   * @param satelliteId
   * @returns
   */
  public async getDefaultSatelliteBySatelliteId(satelliteId: number): Promise<DefaultSatelliteType | null> {
    // デフォルト衛星定義から衛星識別情報を取得

    const satIdentifer: DefaultSatelliteType | null = this.defSatJson.getDefaultSatelliteBySatelliteId(satelliteId);
    return satIdentifer;
  }
  /**
   * 衛星IDに一致する衛星識別情報を取得(同期)
   * @param satelliteId
   * @returns
   */
  public getDefaultSatelliteBySatelliteIdSync(satelliteId: number): DefaultSatelliteType | null {
    // デフォルト衛星定義から衛星識別情報を取得

    const satIdentifer: DefaultSatelliteType | null = this.defSatJson.getDefaultSatelliteBySatelliteId(satelliteId);
    return satIdentifer;
  }

  /**
   * デフォルト衛星定義追加
   * @param satelliteName
   * @returns satelliteId(更新時は-1)
   */
  public async addDefaultSatellite(satelliteName: string): Promise<number> {
    const savePathSat = path.join(ElectronUtil.getUserDir(), Constant.Config.DEFAULT_SATELLITE_FILENAME);
    const satelliteId: number = this.defSatJson.addSatellite(satelliteName);
    fs.writeFileSync(savePathSat, this.defSatJson.getJsonString());

    return satelliteId;
  }

  /**
   * デフォルト衛星定義を一度リフレッシュして作り直す
   * @returns
   */
  public async reCreateDefaultSatellite(): Promise<boolean> {
    // デフォルト衛星定義のリフレッシュ
    const ret1 = await this.refreshDefaultSatellite();
    if (!ret1) return false;
    AppMainLogger.info("デフォルト衛星定義のリフレッシュ");
    // TLE最終取得日時を更新する
    AppConfigUtil.saveTleLastRetrievedDate(Date.now() - Constant.Time.MILLISECONDS_IN_DAY);
    // TLEの取得
    try {
      await new TleService().getTleAndSave();
    } catch (e) {
      AppMainLogger.error(e);
      return false;
    }
    AppMainLogger.info("TLEの取得");
    // デフォルト衛星定義の更新
    const ret3 = await this.updateDefaultSatelliteService();
    if (!ret3) return false;
    AppMainLogger.info("デフォルト衛星定義の更新");

    return true;
  }
  /**
   * デフォルト衛星定義をリフレッシュする
   * @returns boolean
   */
  private async refreshDefaultSatellite(): Promise<boolean> {
    // 保持するリストを作成
    const userRegistSatelliteIds = AppConfigUtil.getConfig().satellites.map((sat) => sat.satelliteId);
    const groupRegistSatelliteIds = AppConfigUtil.getConfig()
      .satelliteGroups.map((gp) => gp.satelliteIds)
      .flat();
    const keepSatelliteIds = [...new Set([...userRegistSatelliteIds, ...groupRegistSatelliteIds])];
    // リフレッシュ
    this.defSatJson.refreshDefaultSatelliteModel(keepSatelliteIds);
    // 保存
    const savePathSat = path.join(ElectronUtil.getUserDir(), Constant.Config.DEFAULT_SATELLITE_FILENAME);
    if (!fs.existsSync(savePathSat)) return false;
    fs.writeFileSync(savePathSat, this.defSatJson.getJsonString());
    return true;
  }

  /**
   * tle.jsonに存在するTLEを取得する
   * @returns TleItemMap
   */
  private getLatestTLE(): TleItemMap {
    const savePathTle = AppConfigUtil.getTlePath();
    const tleData = FileUtil.readJson(savePathTle);

    const tleItemMap: TleItemMap = tleData.tleItemMap;
    const retTleItemMap: TleItemMap = {};
    Object.values(tleItemMap).forEach((tleItem) => {
      if (tleItem.isInLatestTLE) {
        retTleItemMap[tleItem.id] = tleItem;
      }
    });
    return retTleItemMap;
  }
}
