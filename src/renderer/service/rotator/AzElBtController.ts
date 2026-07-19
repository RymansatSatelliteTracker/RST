import type { AntennaPositionModel } from "@/common/model/AntennaPositionModel.js";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking.js";
import RotatorControllerBase from "@/renderer/service/rotator/RotatorControllerBase.js";

/**
 * AZ EL Bluetooth Rotatorのコントローラ
 */
export default class AzElBtController extends RotatorControllerBase {
  /**
   * ローテーター位置を設定する
   */
  public async setPosition(pos: AntennaPositionModel) {
    await ApiAntennaTracking.setAntennaPosition(pos);
  }
}
