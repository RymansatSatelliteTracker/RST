/**
 * 衛星登録フォーム
 */
export default class RegistSatelliteForm {
  public satelliteId: number = -1; // 画面非表示項目
  public satelliteName: string = "";
  public tle: string = "";
  public epochUtcDate: string = "";
  public semiMajorAxisKm: string = "";
  public raanDeg: string = "";
  public eccentricity: string = "";
  public argumentOfPerigeeDeg: string = "";
  public inclinationDeg: string = "";
  public meanAnomalyDeg: string = "";
}
