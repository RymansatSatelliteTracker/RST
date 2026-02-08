import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { ref, Ref } from "vue";

/**
 * レーダークリック時のCanvas座標を方位仰角に変換する
 * @param canvasRef レーダーのCanvas
 * @param radarRadiusPx レーダーの半径（px）
 * @returns radarClick: レーダークリックのハンドラ
 */
export default function useCanvasPosToAntennaPos(canvasRef: Ref<HTMLCanvasElement | null>, radarRadiusPx: number) {
  // レーダクリック時の移動先
  const destPosition: Ref<AntennaPositionModel> = ref(new AntennaPositionModel());

  // Autoの状態
  const autoStore = useStoreAutoState();

  /**
   * レーダー部のCanvasクリック
   */
  function radarClick(event: MouseEvent) {
    if (!event.target) {
      return;
    }

    // Auto状態の場合はレーダ部クリックは無効
    if (autoStore.isRotatorAutoMode()) {
      return;
    }

    const rect = canvasRef!.value!.getBoundingClientRect();
    const canvasX = event.clientX - Math.floor(rect.left);
    const canvasY = event.clientY - Math.floor(rect.top);

    const antennaPos = canvasPosToAntennaPos(canvasX, canvasY);
    if (!antennaPos) {
      return;
    }

    destPosition.value = antennaPos;
  }

  /**
   * レーダーのCanvas座標をアンテナの方位と仰角に変換する
   * @returns == null: レーダの円外が指定されている場合
   */
  function canvasPosToAntennaPos(canvasX: number, canvasY: number): AntennaPositionModel | null {
    // Canvas座標をレーダの中心を原点とした値に変換（レーダ中心Canvas座標）
    const x = canvasX - radarRadiusPx;
    const y = (canvasY - radarRadiusPx) * -1;

    // レーダ中心Canvas座標値を「-90～90 x -90～90」の座標値に変換
    const degX = (x / radarRadiusPx) * 90;
    const degY = (y / radarRadiusPx) * 90;

    // 仰角を算出（斜辺の長さを取得）
    const shahenLen = Math.sqrt(degX ** 2 + degY ** 2);

    // 斜辺が90を超過する場合は、レーダの円外をクリックしているため処理を終了する
    if (shahenLen > 90) {
      return null;
    }

    // レーダの外側が0度なので-90して絶対値を取る
    const degEl = Math.abs(shahenLen - 90);

    // 方位を算出（レーダ中心を原点とした角度を取得）
    const radAz = Math.atan2(degY, degX);
    let degAz = radAz * (180 / Math.PI);

    // レーダの北側が0度だが、atan2の角度はレーダー中心座標の角度のため、
    // 90度からの差分を360度に足して真北０度から角度を算出する
    degAz = Math.abs(360 + (90 - degAz)) % 360;

    return new AntennaPositionModel(degAz, degEl);
  }

  return {
    radarClick,
    destPosition,
  };
}
