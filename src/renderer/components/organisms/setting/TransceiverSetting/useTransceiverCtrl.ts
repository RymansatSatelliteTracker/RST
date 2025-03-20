import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel";
import ApiSirial from "@/renderer/api/ApiSirial";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import TransceiverSettingForm from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverSettingForm";
import { Ref } from "vue";

/**
 * 無線機制御関係のフック
 */
export default function useTransceiverCtrl(form: Ref<TransceiverSettingForm>) {
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
      await ApiTransceiver.startCtrl(tranConfig);
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
