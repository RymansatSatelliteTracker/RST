import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import ApiSirial from "@/renderer/api/ApiSirial.js";
import ApiTransceiver from "@/renderer/api/ApiTransceiver.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import type TransceiverConnForm from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConnForm.js";
import emitter from "@/renderer/util/EventBus.js";
import type { Ref } from "vue";
import { computed } from "vue";

/**
 * 無線機接続テストのフック
 */
export default function useTransceiverTestConnect(
  form: Ref<TransceiverConnForm>,
  isSerialOpen: Ref<boolean>,
  loadingTestBtn: Ref<boolean>,
  _startNewConnect: () => Promise<void>
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
    // 選択中の機種のストップビットでオープンする
    const stopBits = await getStopBits();
    const resultOpen = await ApiSirial.tryOpen(form.value.port, parseInt(form.value.borate), stopBits);
    if (!resultOpen) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.ERR_SERIAL_CONNECT_ABORT));
      loadingTestBtn.value = false;
      return;
    }

    // テスト後はクローズする
    await ApiSirial.close();

    loadingTestBtn.value = false;
    isSerialOpen.value = true;

    emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.ERR_SERIAL_CONNECT_SUCCESS));
  }

  /**
   * 選択中の機種のストップビットを無線機定義から取得する（定義がない場合は1）
   */
  async function getStopBits(): Promise<1 | 2> {
    const config = await ApiAppConfig.getTransceiverConfig();
    const maker = config.transceivers.find((m) => m.makerId === form.value.makerId);
    const device = maker?.devices.find((d) => d.transceiverId === form.value.transceiverId);
    return device?.stopBits ?? 1;
  }

  return { connTest, validTest };
}
