import { SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import { AppConfigModel } from "./AppConfigModel";
/**
 * 衛星設定画面用の設定ファイル
 */
export class AppConfigSatSettingModel extends AppConfigModel {
  // リスト
  public satelliteGroupsForSatSetting: AppConfigSatelliteGroupForSatSetting[] = [];
}

/**
 * 衛星設定画面用の衛星グループ
 */
export class AppConfigSatelliteGroupForSatSetting {
  // グループID
  public groupId = -1;
  // グループ名
  public groupName = "";
  // 衛星リスト
  public satellites: SatelliteIdentiferType[] = [];
}
