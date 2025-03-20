import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import RotatorControllerBase from "@/renderer/service/rotator/RotatorControllerBase";

/**
 * Fox Delta ST-2のコントローラ
 */
export default class St2Controller extends RotatorControllerBase {
  /**
   * ローテーター位置を設定する
   */
  public async setPosition(pos: AntennaPositionModel) {
    await ApiAntennaTracking.setAntennaPosition(pos);
  }
}
