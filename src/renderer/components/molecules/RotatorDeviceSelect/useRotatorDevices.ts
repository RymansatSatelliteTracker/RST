import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigRotatorDevice } from "@/common/model/AppConfigRotatorModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { SelectOption } from "@/renderer/types/vue-types";
import { ModelRef, ref, watch } from "vue";

/**
 * ローテーターの機種のSelectBox向けリストを生成するフック
 */
function useRotatorDevices(makerIdRef: ModelRef<string>, selectedVal: ModelRef<string>, needEmpty: boolean = true) {
  const rotatorDevices = ref<SelectOption[]>();

  // ダイアログ表示時のSelectBox再表示
  getRotatorDevices(makerIdRef.value, needEmpty);

  // メーカー名の変更時に機種の選択リストを変動させる
  watch(makerIdRef, () => {
    getRotatorDevices(makerIdRef.value, needEmpty);
  });

  return {
    rotatorDevices,
  };

  /**
   * SelectBoxのデータを設定する
   */
  async function getRotatorDevices(makerId: string, needEmpty: boolean) {
    // メーカーがブランクの場合はデバイスの選択は不可
    if (CommonUtil.isEmpty(makerId)) {
      selectedVal.value = "";
      rotatorDevices.value = [{ title: I18nUtil.getMsg(I18nMsgs.G51_NEED_SELECT_MAKER), value: "" }];
      return;
    }

    // ローテーター定義を取得
    const config = await ApiAppConfig.getRotatorConfig();

    // 機種のリストを抽出
    const index = config.rotators.findIndex((rotator) => {
      return rotator.makerId === makerId;
    });
    // 存在しないメーカー名（ここまで到達している場合は、ありえないはず）
    if (index < 0) {
      return;
    }
    const configDevices = config.rotators[index].devices;

    // SelectBox用のデータ生成
    const devices: SelectOption[] = [];
    if (needEmpty) {
      devices.push({ title: "", value: "" });
    }
    configDevices.forEach((device: AppConfigRotatorDevice) => {
      devices.push({ title: device.deviceName, value: device.rotatorId });
    });

    // 選択状態を復元
    restoreSelectedVal(devices);

    // 選択肢を設定
    rotatorDevices.value = devices;
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

export default useRotatorDevices;
