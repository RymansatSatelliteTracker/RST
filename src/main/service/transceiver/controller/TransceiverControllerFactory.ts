import Constant from "@/common/Constant.js";
import { InvalidArgumentError } from "@/common/exceptions.js";
import type { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import type TransceiverControllerBase from "@/main/service/transceiver/controller/TransceiverControllerBase.js";
import TransceiverIcomController from "@/main/service/transceiver/controller/TransceiverIcomController.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

/**
 * TransceiverControllerのファクトリ
 */
export default class TransceiverControllerFactory {
  /**
   * TransceiverControllerを生成する
   * @param transceiverConfig 無線機設定
   */
  public static async getController(transceiverConfig: AppConfigTransceiver): Promise<TransceiverControllerBase> {
    switch (transceiverConfig.makerId) {
      // ICOMの無線機
      case Constant.Transceiver.MakerId.ICOM:
        AppMainLogger.info(`ICOMの無線機が指定されました。`);
        return new TransceiverIcomController(transceiverConfig);

      // YAESUの無線機
      // case Constant.Transceiver.MakerId.YAESU:
      //   AppMainLogger.info(`YAESUの無線機が指定されました。`);
      //   return new TransceiverYaesuController(transceiverConfig);

      default:
        break;
    }

    throw new InvalidArgumentError(
      `無効な無線機メーカーが指定されました。transceiverMakerId=${transceiverConfig.makerId}`
    );
  }
}
