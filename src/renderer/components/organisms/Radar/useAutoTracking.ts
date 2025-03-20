import AntennaAutoTrackingService from "@/renderer/service/AntennaAutoTrackingService";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { Ref } from "vue";

/**
 * ローテータの自動衛星追尾フック
 */
export default function useAutoTracking(currentDate: Ref<Date>) {
  const tackingService = new AntennaAutoTrackingService();
  const autoStore = useStoreAutoState();

  /**
   * 自動追尾を開始する
   */
  async function startAutoTracking(): Promise<boolean> {
    const result = await tackingService.start(currentDate);

    // 開始の結果をストアに反映（シリアル接続で失敗した場合はfalseになる）
    autoStore.rotatorAuto = result;
    return result;
  }

  /**
   * 自動追尾を停止する
   */
  function stopAutoTracking() {
    // Autoモードのステートを更新
    autoStore.rotatorAuto = false;
  }

  /**
   * Auto状態を監視し、他機能での自動追尾の開始、停止要求に応じる
   */
  autoStore.$subscribe(() => {
    if (autoStore.rotatorAuto) {
      // 処理なし
      // memo: 開始は本機能のみで行われる。他機能では行われないため、ここで開始処理を行う必要なし
    } else {
      // 自動追尾の停止
      tackingService.stop();
    }
  });

  return { startAutoTracking, stopAutoTracking };
}
