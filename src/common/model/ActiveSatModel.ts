import type { OmmItem } from "@/common/model/OmmModel.js";

/**
 * アクティブ衛星グループモデル
 */
export class ActiveSatelliteGroupModel {
  // アクティブ衛星グループID
  public activeSatelliteGroupId = -1;

  // グループ内の衛星リスト
  public activeSatellites: ActiveSatelliteModel[] = [];

  // メイン表示中の衛星ID
  public mainSatelliteId = -1;

  // メイン表示中の衛星のOMM
  public mainSatelliteOmm: OmmItem | null = null;
}

/**
 * アクティブ衛星モデル
 */
export class ActiveSatelliteModel {
  // 衛星ID
  public satelliteId = -1;

  // 衛星名
  public satelliteName = "";

  // OMM設定
  public omm: OmmItem | null = null;
}
