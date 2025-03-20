import ApiSirial from "@/renderer/api/ApiSirial";
import { SelectOption } from "@/renderer/types/vue-types";
import { ModelRef, ref } from "vue";

/**
 * 有効なシリアルポートを取得し、SelectBox向けのリストを生成するフック
 */
function useActiveSerialPorts(selectedValue: ModelRef<string>, needEmpty: boolean = true) {
  const serialPorts = ref<SelectOption[]>();

  /**
   * SelectBoxのデータを設定する
   */
  async function getActiveSerialPorts() {
    const activePorts = await ApiSirial.getActiveSerialPorts();
    const ports: SelectOption[] = [];

    if (needEmpty) {
      ports.push({ title: "", value: "" });
    }

    activePorts.forEach((portName: string) => {
      ports.push({ title: portName, value: portName });
    });

    // 選択状態の復元
    restoreSelectedVal(activePorts);

    // 選択肢を設定
    serialPorts.value = ports;
  }

  /**
   * 選択状態を復元する。
   * 現在の選択肢にselectedの値が存在する場合は、その選択肢をselectedにする。
   * 存在しない場合は、先頭の選択肢をselectedにする。
   */
  function restoreSelectedVal(ports: string[]) {
    const index = ports.findIndex((port) => {
      return selectedValue.value === port;
    });
    if (index >= 0) {
      selectedValue.value = ports[index];
      return;
    }

    selectedValue.value = "";
  }

  return {
    serialPorts,
    getActiveSerialPorts,
  };
}

export default useActiveSerialPorts;
