import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { SatAzEl } from "@/renderer/types/satellite-type";
import CanvasUtil from "@/renderer/util/CanvasUtil";
import { computed, Ref } from "vue";

type CenterPosition = {
  x: number;
  y: number;
};

/**
 * 衛星のパスの描画フック
 * @param canvasRef 画面のCanvas要素（のref）
 * @param radiusPx レーダの半径（px）
 * @param center レーダの中心
 * @param tracking トラッキングデータ
 */
export default function useDrawSat(radiusPx: number, center: CenterPosition, activeSat: Ref<SatAzEl | null>) {
  /**
   * 衛星位置を示すStyle
   */
  const satPosStyle = computed(() => {
    if (!activeSat.value) return { display: "none" };
    if (activeSat.value.az < 0 || activeSat.value.el < 0) {
      return { display: "none" };
    }

    // 衛星の色
    const activeSatIndex = ActiveSatServiceHub.getInstance().getActiveSatIndex();
    const satColor = CanvasUtil.getSatelliteColorCode(activeSatIndex);

    const cartesian = CanvasUtil.polar2Cartesian(activeSat.value.az, activeSat.value.el, radiusPx);
    return {
      top: `${center.y + cartesian.y - 5}px`,
      left: `${center.x + cartesian.x - 5}px`,
      "border-radius": "50%",
      "background-color": satColor,
    };
  });

  return { satPosStyle };
}
