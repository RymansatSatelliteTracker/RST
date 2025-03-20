import AstronomyUtil from "@/renderer/util/AstronomyUtil";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * 太陽の緯度/経度を取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @param {Ref<number>} offsetLongitude 地図の中心経度のオフセット
 * @returns {sunLocation} 太陽の緯度/経度
 */
const useSunLocation = (currentDate: Ref<Date>, offsetLongitude: Ref<number>) => {
  // 太陽の緯度/経度
  const sunLocation = ref<[number, number]>([0.0, 0.0]);
  let intervalId: number;

  const updateLocation = () => {
    // 太陽の黄緯/黄経を計算する
    const sunEcliptic = AstronomyUtil.calculateSunEclipticLongitudeInRadian(currentDate.value);
    // 太陽の黄緯/黄経を赤道座標に変換する
    const equatorialCoords = AstronomyUtil.translateEclipticToEquatorialInRadian(sunEcliptic);
    // 太陽の赤経から南中している地球上の経度を計算する
    const solarNoonLongitude = AstronomyUtil.calculateLongitudeInDegree(
      currentDate.value,
      CoordinateCalcUtil.radianToDegree(equatorialCoords.rightAscension),
      offsetLongitude.value
    );
    sunLocation.value = [CoordinateCalcUtil.radianToDegree(equatorialCoords.declination), solarNoonLongitude];
  };

  onMounted(() => {
    updateLocation();
    // 1秒ごとに太陽の緯度/経度を更新する
    intervalId = window.setInterval(updateLocation, 1000) as number;
  });

  // currentDateの変更を監視して1500ms以上増減した場合は太陽の緯度/経度を更新する
  let lastDate = currentDate.value.getTime();
  watch(currentDate, (newValue) => {
    const newTime = newValue.getTime();
    if (Math.abs(newTime - lastDate) > 1500) {
      updateLocation();
    }
    lastDate = newTime;
  });

  // コンポーネントのアンマウント時にタイマーを破棄する
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return { sunLocation };
};

export default useSunLocation;
