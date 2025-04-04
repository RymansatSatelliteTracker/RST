import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import ApiSirial from "@/renderer/api/ApiSirial";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TransceiverConnForm from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConnForm";
import emitter from "@/renderer/util/EventBus";
import { computed, Ref } from "vue";

/**
 * 無線機接続テストのフック
 */
export default function useTransceiverTestConnect(
  form: Ref<TransceiverConnForm>,
  isSerialOpen: Ref<boolean>,
  loadingTestBtn: Ref<boolean>,
  startNewConnect: () => Promise<void>
) {
  /**
   * 接続テストが可能か
   */
  const validTest = computed(() => {
    if (CommonUtil.isEmpty(form.value.port)) {
      return false;
    }
    if (CommonUtil.isEmpty(form.value.borate)) {
      return false;
    }
    if (form.value.makerId === Constant.Transceiver.MakerId.ICOM) {
      if (CommonUtil.isEmpty(form.value.civAddress)) {
        return false;
      }
    }
    return true;
  });

  /**
   * 接続テストクリック
   */
  async function connTest() {
    // 一旦クローズする
    await ApiSirial.close();
    await ApiTransceiver.stopCtrl();

    // テストモードの入力欄を無効化する
    isSerialOpen.value = false;

    loadingTestBtn.value = true;
    const resultOpen = await ApiSirial.tryOpen(form.value.port, parseInt(form.value.borate));
    if (!resultOpen) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.ERR_SERIAL_CONNECT_ABORT));
      loadingTestBtn.value = false;
      return;
    }

    // 接続開始
    await startNewConnect();

    loadingTestBtn.value = false;
    isSerialOpen.value = true;

    emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.ERR_SERIAL_CONNECT_SUCCESS));
  }

  return { connTest, validTest };
}
