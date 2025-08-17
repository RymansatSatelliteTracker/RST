// useModeStateManager.ts
import Constant from "@/common/Constant";
import { ref, Ref } from "vue";

// モードごとの状態の型
export interface ModeState {
  // ダウンリンク周波数
  rxFrequency: string;
  // ダウンリンク運用モード
  rxOpeMode: string;
  // サテライトモードのトラッキングモード
  isSatTrackingModeNormal: boolean;
}

/**
 * デフォルトの状態を生成
 * @returns 初期状態のModeState
 */
function createDefaultState(): ModeState {
  return {
    rxFrequency: "0480.000.000",
    rxOpeMode: Constant.Transceiver.OpeMode.UNSET,
    isSatTrackingModeNormal: true,
  };
}

/**
 * モードごとの状態を管理するフック
 * @returns 状態の保存・読み込み関数
 */
export function useModeStateManager() {
  // モードごとの状態を保持するマップ
  const stateMap: Record<string, Ref<ModeState>> = {
    [Constant.Transceiver.SatelliteMode.SATELLITE]: ref<ModeState>(createDefaultState()),
    [Constant.Transceiver.SatelliteMode.SPLIT]: ref<ModeState>(createDefaultState()),
    [""]: ref<ModeState>(createDefaultState()),
  };

  /**
   * モードの状態を保存・読み込みする関数
   * @param mode モード名
   * @param partial
   */
  function save(mode: string, partial: Partial<ModeState>) {
    const current = stateMap[mode].value;
    stateMap[mode].value = { ...current, ...partial };
  }

  /**
   * モードの状態を読み込む関数
   * @param mode モード名
   */
  function load(mode: string): ModeState {
    return stateMap[mode].value;
  }

  return {
    save,
    load,
  };
}
