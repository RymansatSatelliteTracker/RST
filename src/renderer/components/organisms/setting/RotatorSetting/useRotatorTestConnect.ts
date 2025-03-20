import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiSirial from "@/renderer/api/ApiSirial";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import RotatorSettingForm from "@/renderer/components/organisms/setting/RotatorSetting/RotatorSettingForm";
import emitter from "@/renderer/util/EventBus";
import { computed, Ref } from "vue";

/**
 * ローテーター接続テストのフック
 */
export default function useRotatorTestConnect(
  form: Ref<RotatorSettingForm>,
  isSerialOpen: Ref<boolean>,
  loadingTestBtn: Ref<boolean>,
  currentPos: Ref<AntennaPositionModel>,
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
    return true;
  });

  /**
   * 接続テストクリック
   */
  async function connTest() {
    // 一旦クローズする
    await ApiSirial.close();
    await ApiAntennaTracking.stopCtrl();

    // テストモードの入力欄を無効化する
    isSerialOpen.value = false;

    loadingTestBtn.value = true;
    const resultOpen = await ApiSirial.tryOpen(form.value.port, parseInt(form.value.borate));
    if (!resultOpen) {
      // 接続失敗のトースト表示
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.SERIAL_CONNECTION_FAILED));
      loadingTestBtn.value = false;
      return;
    }

    // 接続開始
    await startNewConnect();

    loadingTestBtn.value = false;
    isSerialOpen.value = true;

    // 接続成功のトースト表示
    emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.SERIAL_CONNECTION_SUCCESS));

    // 位置指定の初期値として、現在のアンテナ位置を設定
    form.value.testAz = currentPos.value.azimuth.toString();
    form.value.testEl = currentPos.value.elevation.toString();

    // 現在の指定位置に移動開始
    // memo: 直前の指定位置がローテータ側で残っている場合があるため、現在の指定位置への移動を行う必要がある
    const pos = new AntennaPositionModel();
    pos.azimuth = parseInt(form.value.testAz);
    pos.elevation = parseInt(form.value.testEl);
    await ApiAntennaTracking.setAntennaPosition(pos);
  }

  return { connTest, validTest };
}
