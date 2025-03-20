import { ActiveSatelliteGroupModel, ActiveSatelliteModel } from "@/common/model/ActiveSatModel";
import { AppConfigMainDisplay } from "@/common/model/AppConfigModel";
import { getMainWindow } from "@/main/main";
import DefaultSatelliteCacheService from "@/main/service/DefaultSatelliteCacheService";
import TleService from "@/main/service/TleService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import TleUtil from "@/main/util/TleUtil";
import { TleStrings } from "@/renderer/types/satellite-type";

/**
 * アクティブ衛星サービス
 * 例外的にシングルトンです。
 */
export default class ActiveSatService {
  // シングルトンインスタンス
  private static instance: ActiveSatService = new ActiveSatService();
  private static tleServie = new TleService();

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
   * AppConfigの衛星グループの更新が行われた場合にコールする
   */
  public refresh() {
    // 変更後のデータを取得し、コールバックを発火
    const satGrp = this.getActiveSatGroup();
    // 優先的に発火させるコールバックを先にコール
    getMainWindow().webContents.send("onChangePriorityActiveSatelliteGroup", satGrp);
    getMainWindow().webContents.send("onChangeActiveSatelliteGroup", satGrp);
  }

  /**
   * アクティブ衛星グループと、その衛星データを返す
   */
  public getActiveSatGroup(): ActiveSatelliteGroupModel {
    const mainDisp = AppConfigUtil.getAppConfigMainDisplay();
    const grpModel = new ActiveSatelliteGroupModel();
    grpModel.activeSatelliteGroupId = mainDisp.activeSatelliteGroupId;
    grpModel.mainSatelliteId = mainDisp.activeSatelliteId;

    // グループ内の衛星データをリストで取得
    grpModel.activeSatellites = this.createActiveSatModel(mainDisp);

    // メイン表示衛星のTLEを取得
    grpModel.mainSattelliteTle = this.getActiveSatTleBySatId(mainDisp.activeSatelliteId);

    return grpModel;
  }

  /**
   * 衛星IDからTLEを返す
   */
  public getActiveSatTleBySatId(satId: number): TleStrings | null {
    // デフォルト衛星設定経由でTLEを取得
    const cacheService = new DefaultSatelliteCacheService();
    const defSat = cacheService.getDefaultSatelliteBySatelliteIdSync(satId);

    let tleString: TleStrings | null = null;
    if (defSat) {
      tleString = ActiveSatService.tleServie.getTlesByNoradId(defSat.noradId);
    }

    // 手動追加された衛星の場合（デフォルト衛星設定から取得出来なかった場合）
    // AppConfif.satellites 経由でTLEを取得する
    if (!tleString) {
      const appConfig = AppConfigUtil.getConfig();
      const sat = appConfig.satellites.find((sat) => sat.satelliteId === satId);
      if (sat) {
        // ユーザが登録した衛星のTLEは２行なので、ユーザー登録衛星名とTLEを結合してTLE文字列を生成
        const tleText = `${sat.userRegisteredSatelliteName}\n${sat.userRegisteredTle}`;
        tleString = TleUtil.toTleStrings(tleText);
      }
    }

    return tleString;
  }

  /**
   * アクティブ衛星グループ内の衛星データを生成して返す
   */
  private createActiveSatModel(mainDisp: AppConfigMainDisplay): ActiveSatelliteModel[] {
    const appConfig = AppConfigUtil.getConfig();

    // 衛星グループ設定からアクティブ衛星IDリストを生成
    const satIds = [];
    for (let ii = 0; ii < appConfig.satelliteGroups.length; ii++) {
      const gr = appConfig.satelliteGroups[ii];
      if (mainDisp.activeSatelliteGroupId !== gr.groupId) {
        continue;
      }

      // 衛星IDをリストに追加
      for (let jj = 0; jj < gr.satelliteIds.length; jj++) {
        satIds.push(gr.satelliteIds[jj]);
      }
    }

    // 衛星グループ内の衛星で回す
    const activeSats: ActiveSatelliteModel[] = [];
    for (let ii = 0; ii < satIds.length; ii++) {
      const satId = satIds[ii];

      // 衛星リストに格納
      const activeSat = new ActiveSatelliteModel();
      activeSat.satelliteId = satId;
      activeSat.tle = this.getActiveSatTleBySatId(satId);
      activeSats.push(activeSat);
    }

    return activeSats;
  }
}
