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

    /**
     * 無線機とローテータのいずれかがAutoOnか判定する
     */
    function isAutoMode() {
      return rotatorAuto.value || tranceiverAuto.value;
    }

    /**
     * ローテータがAutoOnか判定する
     */
    function isRotatorAutoMode() {
      return rotatorAuto.value;
    }

    return { rotatorAuto, tranceiverAuto, isAutoMode, isRotatorAutoMode };
  },
  {
    // 再起動時の状態の保持は不要
    persist: false,
  }
);
