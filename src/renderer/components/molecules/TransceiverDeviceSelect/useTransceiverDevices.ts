import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTransceiverDevice } from "@/common/model/AppConfigTransceiverModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { SelectOption } from "@/renderer/types/vue-types";
import { ModelRef, ref, watch } from "vue";

/**
 * 無線機の機種のSelectBox向けリストを生成するフック
 */
function useTransceiverDevices(makerIdRef: ModelRef<string>, selectedVal: ModelRef<string>, needEmpty: boolean = true) {
  const transceiverDevices = ref<SelectOption[]>();

  // ダイアログ表示時のSelectBox再表示
  getTransceiverDevices(makerIdRef.value, needEmpty);

  // メーカー名の変更時に機種の選択リストを変動させる
  watch(makerIdRef, () => {
    getTransceiverDevices(makerIdRef.value, needEmpty);
  });

  return {
    transceiverDevices,
  };

  /**
   * SelectBoxのデータを設定する
   */
  async function getTransceiverDevices(makerId: string, needEmpty: boolean) {
    // メーカーがブランクの場合はデバイスの選択は不可
    if (CommonUtil.isEmpty(makerId)) {
      selectedVal.value = "";
      transceiverDevices.value = [{ title: I18nUtil.getMsg(I18nMsgs.ERR_NO_MAKER_SELECT), value: "" }];
      return;
    }

    // 無線機定義を取得
    const config = await ApiAppConfig.getTransceiverConfig();

    // 機種のリストを抽出
    const index = config.transceivers.findIndex((transceiver) => {
      return transceiver.makerId === makerId;
    });
    // 存在しないメーカー名（ここまで到達している場合は、ありえないはず）
    if (index < 0) {
      return;
    }
    const configDevices = config.transceivers[index].devices;

    // SelectBox用のデータ生成
    const devices: SelectOption[] = [];
    if (needEmpty) {
      devices.push({ title: "", value: "" });
    }
    configDevices.forEach((device: AppConfigTransceiverDevice) => {
      devices.push({ title: device.deviceName, value: device.transceiverId });
    });

    // 選択状態を復元
    restoreSelectedVal(devices);

    // 選択肢を設定
    transceiverDevices.value = devices;
  }

  /**
   * 選択状態を復元する。
   * 現在の選択肢にselectedの値が存在する場合は、その選択肢をselectedにする。
   * 存在しない場合は、先頭の選択肢をselectedにする。
   */
  function restoreSelectedVal(devices: SelectOption[]) {
    const index = devices.findIndex((device: SelectOption) => {
      return selectedVal.value === device.value;
    });
    if (index >= 0) {
      selectedVal.value = devices[index].value;
      return;
    }

    selectedVal.value = devices[0].value;
  }
}

export default useTransceiverDevices;
