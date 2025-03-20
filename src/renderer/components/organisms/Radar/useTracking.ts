import GroundStationHelper from "@/renderer/common/util/GroundStationHelper";
import GroundStationServiceFactory from "@/renderer/common/util/GroundStationServiceFactory";
import SatelliteServiceFactory from "@/renderer/common/util/SatelliteServiceFactory";
import { SatAzEl } from "@/renderer/types/satellite-type";
import { onUnmounted, Ref } from "vue";

/**
 * 衛星の軌跡、衛星位置関係のフック
 */
export default function useTracking(activeSat: Ref<SatAzEl | null>, currentDate: Ref<Date>) {
  let intervalId: NodeJS.Timeout | null = null;

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  /**
   * 衛星の追跡を開始する
   */
  async function startTraking() {
    if (intervalId) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(refreshSatPos, 1000);
  }

  /**
   * 衛星の軌跡、衛星位置を更新する
   */
  async function refreshSatPos() {
    if (!activeSat.value) {
      activeSat.value = { az: -1, el: -1 };
      return;
    }

    // アクティブ衛星でSatelliteService、GroundStationServiceを生成
    const satService = await SatelliteServiceFactory.createByActiveSat();
    if (!satService) {
      activeSat.value = { az: -1, el: -1 };
      return;
    }

    const groundStationService = await GroundStationServiceFactory.create(satService);

    // 現在日時で人工衛星が可視/不可視判定を取得する
    const isVisible = await groundStationService.isSatelliteVisibleAsync(currentDate.value);
    if (!isVisible) {
      activeSat.value = { az: -1, el: -1 };
      return;
    }

    // 衛星位置データを取得
    const groundStationLocation = await GroundStationHelper.getEcefLocation();
    const pos: SatAzEl = {
      az: satService.getSatelliteAzimuthAngle(currentDate.value, groundStationLocation) ?? 0,
      el: satService.getSatelliteElevationAngle(currentDate.value, groundStationLocation) ?? 0,
    };

    // 衛星位置データを取得
    activeSat.value.az = pos.az;
    activeSat.value.el = pos.el;
  }

  return { startTraking };
}
