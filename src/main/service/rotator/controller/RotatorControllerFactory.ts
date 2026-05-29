import Constant from "@/common/Constant.js";
import { InvalidArgumentError } from "@/common/exceptions.js";
import type { AppConfigRotator } from "@/common/model/AppConfigModel.js";
import type { AppConfigRotatorDevice } from "@/common/model/AppConfigRotatorModel.js";
import RotatorBtAzElController from "@/main/service/rotator/controller/RotatorBtAzElController.js";
import type RotatorControllerBase from "@/main/service/rotator/controller/RotatorControllerBase.js";
import RotatorRspUsbIoController from "@/main/service/rotator/controller/RotatorRspUsbIoController.js";
import RotatorSimController from "@/main/service/rotator/controller/RotatorSimController.js";
import RotatorSt2Controller from "@/main/service/rotator/controller/RotatorSt2Controller.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

/**
 * AntennaControllerのファクトリ
 */
export default class RotatorControllerFactory {
  /**
   * AntennaControllerを生成する
   * @param rotatorCmdType ローテーター機器の種別
   */
  public static async getController(
    rotatorConfig: AppConfigRotator,
    deviceConfig: AppConfigRotatorDevice
  ): Promise<RotatorControllerBase> {
    switch (deviceConfig.commnadType) {
      // RSP Antenna IO
      case Constant.Rotator.CmdType.RSP_V1_0:
        AppMainLogger.info(`RSP Antenna IO のコントローラが選択されました。`);
        return new RotatorRspUsbIoController();

      // Bluetooth AZ/EL Rotator
      case Constant.Rotator.CmdType.BT_AZ_EL_ROTATOR:
        AppMainLogger.info(`Bluetooth AZ/EL Rotator のコントローラが選択されました。`);
        return new RotatorBtAzElController(rotatorConfig);

      // ST-2
      case Constant.Rotator.CmdType.FOX_DELTA_ST2:
        AppMainLogger.info(`ST-2 のコントローラが選択されました。`);
        return new RotatorSt2Controller(rotatorConfig);

      // シミュレータ
      case Constant.Rotator.CmdType.SIMULATOR:
        AppMainLogger.info(`シミュレータのコントローラが選択されました。`);
        return new RotatorSimController();

      default:
        break;
    }

    throw new InvalidArgumentError(
      `無効なローテーター機器が指定されました。rotatorCmdType=${deviceConfig.commnadType}`
    );
  }
}
