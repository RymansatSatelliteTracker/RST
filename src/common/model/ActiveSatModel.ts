import { TleStrings } from "@/renderer/types/satellite-type";

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

  // メイン表示中の衛星のTLE
  public mainSattelliteTle: TleStrings | null = null;
}

/**
 * アクティブ衛星モデル
 */
export class ActiveSatelliteModel {
  // 衛星ID
  public satelliteId = -1;

  // 衛星名
  public satelliteName = "";

  // TLE設定
  public tle: TleStrings | null = null;
}
