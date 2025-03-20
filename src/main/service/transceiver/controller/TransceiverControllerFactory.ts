import Constant from "@/common/Constant";
import { InvalidArgumentError } from "@/common/exceptions";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import TransceiverControllerBase from "@/main/service/transceiver/controller/TransceiverControllerBase";
import TransceiverIcomController from "@/main/service/transceiver/controller/TransceiverIcomController";
import AppMainLogger from "@/main/util/AppMainLogger";

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
