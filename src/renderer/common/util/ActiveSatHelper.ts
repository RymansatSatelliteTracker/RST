import { ActiveSatelliteModel } from "@/common/model/ActiveSatModel";
import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import TleUtil from "@/main/util/TleUtil";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiAppConfigSatellite from "@/renderer/api/ApiAppConfigSatellite";
import ApiTle from "@/renderer/api/ApiTle";

/**
 * アクティブ衛星グループ、アクティブ衛星関係のヘルパ
 */
export default class ActiveSatHelper {
  /**
   * 現在アクティブな衛星グループの衛星リストを返す
   */
  public static async fetchActiveSats(): Promise<ActiveSatelliteModel[]> {
    // AppConfigから衛星グループを取得
    const appConfig = await ApiAppConfig.getAppConfig();

    // アクティブ衛星グループIDから衛星グループを取得
    appConfig.mainDisplay.activeSatelliteGroupId;
    const gr = appConfig.satelliteGroups.find((group) => {
      return group.groupId === appConfig.mainDisplay.activeSatelliteGroupId;
    });
    if (!gr) {
      return [];
    }

    // グループ内の衛星を取得
    const sats: ActiveSatelliteModel[] = [];
    for (let ii = 0; ii < gr.satelliteIds.length; ii++) {
      const satId = gr.satelliteIds[ii];
      const sat: AppConfigSatellite = await ApiAppConfigSatellite.getUserRegisteredAppConfigSatellite(
        satId,
        gr.groupId
      );

      const satModel = new ActiveSatelliteModel();
      satModel.satelliteId = satId;

      // ユーザ設定衛星の場合
      if (sat.userRegistered) {
        sats.push(this.getSatByUserReg(satId, sat));
        continue;
      }

      // ユーザ設定衛星でない場合
      sats.push(await this.getSatByAppConfig(sat));
    }

    return sats;
  }

  /**
   * ユーザ設定衛星情報を取得する
   */
  private static getSatByUserReg(satId: number, sat: AppConfigSatellite): ActiveSatelliteModel {
    const satModel = new ActiveSatelliteModel();
    satModel.satelliteId = satId;

    // 衛星名
    satModel.satelliteName = sat.userRegisteredSatelliteName;

    // TLE
    // ユーザが登録した衛星のTLEは２行なので、ユーザー登録衛星名とTLEを結合してTLE文字列を生成
    const tleText = `${sat.userRegisteredSatelliteName}\n${sat.userRegisteredTle}`;
    satModel.tle = TleUtil.toTleStrings(tleText);

    return satModel;
  }

  /**
   * ユーザ設定衛星情報を取得する
   */
  private static async getSatByAppConfig(sat: AppConfigSatellite): Promise<ActiveSatelliteModel> {
    const satModel = new ActiveSatelliteModel();
    satModel.satelliteId = sat.satelliteId;

    // 衛星名
    // ユーザ設定がない場合はdefaultSatの衛星名がここに入っている
    satModel.satelliteName = sat.userRegisteredSatelliteName;

    // TLEはNorad IDから取得
    const tles = await ApiTle.getTlesByNoradIds([sat.noradId]);
    satModel.tle = tles[0];

    return satModel;
  }
}
