import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import RotatorControllerBase from "@/renderer/service/rotator/RotatorControllerBase";

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
