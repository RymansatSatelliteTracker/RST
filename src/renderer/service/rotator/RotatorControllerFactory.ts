import Constant from "@/common/Constant.js";
import { InvalidArgumentError } from "@/common/exceptions.js";
import { AppConfigRotatorDevice } from "@/common/model/AppConfigRotatorModel.js";
import AzElBtController from "@/renderer/service/rotator/AzElBtController.js";
import DevAntennaController from "@/renderer/service/rotator/DevAntennaController.js";
import RotatorControllerBase from "@/renderer/service/rotator/RotatorControllerBase.js";
import St2Controller from "@/renderer/service/rotator/St2Controller.js";

/**
 * RotatorController のファクトリ
 */
export default class RotatorControllerFactory {
  /**
   * RotatorController を生成する
   */
  public static async getController(deviceConfig: AppConfigRotatorDevice): Promise<RotatorControllerBase> {
    switch (deviceConfig.commnadType) {
      // Bluetooth AZ/EL Rotator
      case Constant.Rotator.CmdType.BT_AZ_EL_ROTATOR:
        return new AzElBtController();

      // ST-2
      case Constant.Rotator.CmdType.FOX_DELTA_ST2:
        return new St2Controller();

      //   // RSP Antenna IO
      // case Constant.Rotator.CmdType.RSP_V1_0:
      //   return new SerialAntennaController();

      // シミュレータ
      case Constant.Rotator.CmdType.SIMULATOR:
        return new DevAntennaController();

      default:
        break;
    }

    throw new InvalidArgumentError(
      `無効なローテーター機器が指定されました。rotatorCmdType=${deviceConfig.commnadType}`
    );
  }
}
