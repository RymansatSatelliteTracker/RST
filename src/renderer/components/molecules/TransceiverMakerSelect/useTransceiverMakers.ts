import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import { SelectOption } from "@/renderer/types/vue-types";
import { onMounted, ref } from "vue";

/**
 * 無線機のメーカーのSelectBox向けリストを生成するフック
 */
function useTransceiverMakers(needEmpty: boolean = true) {
  const transceiverMakers = ref<SelectOption[]>();

  /**
   * SelectBoxのデータを設定する
   */
  async function getTransceiverMakers() {
    // 無線機定義を取得
    const config = await ApiAppConfig.getTransceiverConfig();

    // SelectBox用のデータ生成
    const ports: SelectOption[] = [];
    if (needEmpty) {
      ports.push({ title: "", value: "" });
    }
    config.transceivers.forEach((transceiver) => {
      ports.push({ title: transceiver.makerName, value: transceiver.makerId });
    });

    transceiverMakers.value = ports;
  }

  onMounted(getTransceiverMakers);

  return {
    transceiverMakers,
  };
}

export default useTransceiverMakers;
