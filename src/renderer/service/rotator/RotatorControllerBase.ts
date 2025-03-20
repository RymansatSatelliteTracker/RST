import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";

/**
 * ローテーターのコントローラの親クラス
 */
export default abstract class RotatorControllerBase {
  /**
   * ローテーター位置を設定する
   */
  public abstract setPosition(pos: AntennaPositionModel): void;
}
