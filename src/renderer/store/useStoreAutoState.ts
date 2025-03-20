import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * Autoモードの状態を管理するストア
 */
export const useStoreAutoState = defineStore(
  "autoState",
  () => {
    // 無線機のAuto状態
    const tranceiverAuto = ref(false);
    // ローテータのAuto状態
    const rotatorAuto = ref(false);

    function isAutoMode() {
      return rotatorAuto.value || tranceiverAuto.value;
    }

    return { rotatorAuto, tranceiverAuto, isAutoMode };
  },
  {
    // 再起動時の状態の保持は不要
    persist: false,
  }
);
