/**
 * TLE JSONモデル
 */
export class TleJsonModel {
  public tleItemMap: TleItemMap = {};
}

/**
 * TLEデータマップ
 */
export type TleItemMap = { [key: string]: TleItem };

/**
 * TLEモデル
 */
export class TleItem {
  public id = "";
  public name = "";
  public epoch = 0;
  public line1 = "";
  public line2 = "";
  public isInLatestTLE = true;
}
