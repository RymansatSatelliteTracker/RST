import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";

/**
 * アプリケーション内で管理しておく衛星周波数設定
 */
export class FrequencyModel {
  // ルート
  public frequency: Frequency = new Frequency();
}

export class Frequency {
  // 最終更新日時（UnixTime）
  public lastUpdateTime: number = -1;
  // 衛星設定リスト
  public satellites: DefaultSatelliteType[] = [];
}
