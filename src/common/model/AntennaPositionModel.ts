/**
 * アンテナ位置
 */
export class AntennaPositionModel {
  public constructor(azimuth: number = 0, elevation: number = 0) {
    this.azimuth = azimuth;
    this.elevation = elevation;
  }

  public azimuth = 0;
  public elevation = 0;
}
