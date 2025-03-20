import Constant from "@/common/Constant";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * 未選択の人工衛星の可視範囲を取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @param {Ref<number>} offsetLongitude 地図の中心経度のオフセット
 * @returns {*} 人工衛星の可視範囲
 */
export default function useVisibilityDashRange(currentDate: Ref<Date>, offsetLongitude: Ref<number>) {
  // 可視範囲配列を初期化する
  const visibilityDashRangeList = ref<[number, number][][]>([]);

  // 人工衛星の可視範囲の描画ポイントの数
  const numPoints = Constant.VisibilityRange.NUM_POINTS;
  let intervalId: number;

  /**
   * 可視範囲を更新する
   */
  const updateVisibilityRange = async () => {
    visibilityDashRangeList.value = [];

    const satelliteServices = ActiveSatServiceHub.getInstance().getSatGroupSatServices(false);
    const promises = satelliteServices.map(async (satelliteService) => {
      const location = satelliteService.getTargetPolarLocationInDegree(currentDate.value, offsetLongitude.value);
      if (!location) {
        return [];
      }
      // 人工衛星の可視範囲の半径[単位:km]
      let visibleAngleRad = satelliteService.getSatelliteVisibleAngle(location);
      if (!visibleAngleRad) {
        return [];
      }
      visibleAngleRad *= Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM;

      const lengthOfOneDegree = (Math.PI / 180) * Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM;

      const pointsPromises: Promise<[number, number]>[] = Array.from({ length: numPoints + 1 }, (_, i) => {
        return new Promise((resolve) => {
          const radian = CoordinateCalcUtil.degreeToRadian((i * 360) / numPoints);
          const latitude = location.latitude + (visibleAngleRad / lengthOfOneDegree) * Math.cos(radian);
          const longitude =
            location.longitude +
            (visibleAngleRad / (lengthOfOneDegree * Math.cos(CoordinateCalcUtil.degreeToRadian(latitude)))) *
              Math.sin(radian);
          resolve([latitude, longitude]);
        });
      });

      return await Promise.all(pointsPromises);
    });

    visibilityDashRangeList.value = await Promise.all(promises);
  };

  onMounted(async () => {
    // 初期表示時の衛星グループで画面を更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 1秒ごとに可視範囲を更新する
    intervalId = window.setInterval(updateVisibilityRange, 1000) as number;
  });

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    await updateVisibilityRange();
  }

  // currentDateの変更を監視して1500ms以上増減した場合は可視範囲を更新する
  let lastDate = currentDate.value.getTime();
  watch(currentDate, async (newValue) => {
    const newTime = newValue.getTime();
    if (Math.abs(newTime - lastDate) > 1500) {
      await updateVisibilityRange();
    }
    lastDate = newTime;
  });

  // コンポーネントのアンマウント時にタイマーを破棄する
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return { visibilityDashRangeList };
}
