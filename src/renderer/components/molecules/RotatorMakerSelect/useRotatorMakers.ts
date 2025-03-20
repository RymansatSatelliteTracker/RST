import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import { SelectOption } from "@/renderer/types/vue-types";
import { onMounted, ref } from "vue";

/**
 * ローテーターのメーカーのSelectBox向けリストを生成するフック
 */
function useRotatorMakers(needEmpty: boolean = true) {
  const rotatorMakers = ref<SelectOption[]>();

  /**
   * SelectBoxのデータを設定する
   */
  async function getRotatorMakers() {
    // ローテーター定義を取得
    const config = await ApiAppConfig.getRotatorConfig();

    // SelectBox用のデータ生成
    const ports: SelectOption[] = [];
    if (needEmpty) {
      ports.push({ title: "", value: "" });
    }
    config.rotators.forEach((rotator) => {
      ports.push({ title: rotator.makerName, value: rotator.makerId });
    });

    rotatorMakers.value = ports;
  }

  onMounted(getRotatorMakers);

  return {
    rotatorMakers,
  };
}

export default useRotatorMakers;
