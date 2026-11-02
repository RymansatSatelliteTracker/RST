import Constant from "@/common/Constant.js";
import { InvalidArgumentError } from "@/common/exceptions.js";
import type { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import type TransceiverControllerBase from "@/main/service/transceiver/controller/TransceiverControllerBase.js";
import TransceiverIcomController from "@/main/service/transceiver/controller/TransceiverIcomController.js";
import type { TransceiverYaesuProtocol } from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuProtocol.js";
import TransceiverYaesuController from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuController.js";
import TransceiverYaesuFt897Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897Protocol.js";
import TransceiverYaesuFt991Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991Protocol.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

/**
 * TransceiverControllerのファクトリ
 */
export default class TransceiverControllerFactory {
  /**
   * TransceiverControllerを生成する
   * @param transceiverConfig 無線機設定
   */
  public static getController(transceiverConfig: AppConfigTransceiver): Promise<TransceiverControllerBase> {
    return Promise.resolve().then(() => this.selectController(transceiverConfig));
  }

  /**
   * 無線機メーカーに応じたTransceiverControllerを選択する
   */
  private static selectController(transceiverConfig: AppConfigTransceiver): TransceiverControllerBase {
    switch (transceiverConfig.makerId) {
      // ICOMの無線機
      case Constant.Transceiver.MakerId.ICOM:
        AppMainLogger.info(`ICOMの無線機が指定されました。`);
        return new TransceiverIcomController(transceiverConfig);

      // YAESUの無線機
      case Constant.Transceiver.MakerId.YAESU: {
        AppMainLogger.info(`YAESUの無線機が指定されました。`);
        const protocol = this.selectYaesuProtocol(transceiverConfig);
        // ストップビットは、無線機定義ファイルの値を使用する（省略時は1）
        const device = AppConfigUtil.findTransceiverDeviceById(
          transceiverConfig.makerId,
          transceiverConfig.transceiverId
        );
        return new TransceiverYaesuController(transceiverConfig, protocol, device.stopBits ?? 1);
      }

      default:
        break;
    }

    throw new InvalidArgumentError(
      `無効な無線機メーカーが指定されました。transceiverMakerId=${transceiverConfig.makerId}`
    );
  }

  /**
   * YAESUの機種に応じたCAT制御を選択する
   * @throws {InvalidArgumentError} 未対応の機種の場合
   */
  private static selectYaesuProtocol(transceiverConfig: AppConfigTransceiver): TransceiverYaesuProtocol {
    switch (transceiverConfig.transceiverId) {
      // FT-991 / FT-991A
      case Constant.Transceiver.TransceiverId.YAESU_FT991:
        return new TransceiverYaesuFt991Protocol();

      // FT-897 / FT-897D
      case Constant.Transceiver.TransceiverId.YAESU_FT897:
        return new TransceiverYaesuFt897Protocol();

      default:
        break;
    }

    throw new InvalidArgumentError(
      `無効な無線機機種が指定されました。makerId=${transceiverConfig.makerId}, transceiverId=${transceiverConfig.transceiverId}`
    );
  }
}
