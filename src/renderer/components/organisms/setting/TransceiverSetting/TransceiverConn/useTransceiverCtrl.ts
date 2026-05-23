import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import ApiSirial from "@/renderer/api/ApiSirial.js";
import ApiTransceiver from "@/renderer/api/ApiTransceiver.js";
import type TransceiverConnForm from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConnForm.js";
import type { Ref } from "vue";

/**
 * 無線機制御関係のフック
 */
export default function useTransceiverCtrl(form: Ref<TransceiverConnForm>) {
  /**
   * シリアル接続
   */
  async function startNewConnect() {
    // 接続テストでシリアルが接続状態になっている場合があるので、一度クローズする
    await ApiSirial.close();

    // 一旦、古い監視を終了させてから、新しい監視を開始する
    await ApiTransceiver.stopCtrl();

    // 無線機が指定されている場合は、無線機の監視を開始する
    const tranConfig = createTransceiverConfig();
    if (!CommonUtil.isEmpty(tranConfig.transceiverId)) {
      await ApiTransceiver.startCtrl();
    }
  }

  /**
   * AppConfigTransceiverを生成する
   */
  function createTransceiverConfig() {
    const transceiverConfig = new AppConfigTransceiver();
    transceiverConfig.port = form.value.port;
    if (form.value.makerId === Constant.Transceiver.MakerId.ICOM) {
      // ICOMの場合はCI-Vアドレスを設定する
      transceiverConfig.civAddress = form.value.civAddress;
    } else {
      transceiverConfig.civAddress = "";
    }
    transceiverConfig.baudrateBps = form.value.borate;
    transceiverConfig.makerId = form.value.makerId;
    transceiverConfig.transceiverId = form.value.transceiverId;
    transceiverConfig.ipAddress = form.value.ipAddress;
    transceiverConfig.ipPort = form.value.ipPort;
    return transceiverConfig;
  }

  return { startNewConnect };
}
