import AstronomyUtil from "@/renderer/util/AstronomyUtil";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * 月の緯度/経度、月齢を計算する
 * @param {Ref<Date>} currentDate 現在日時
 * @param {Ref<number>} offsetLongitude 地図の中心経度のオフセット
 * @returns {moonLocation;moonAge} 月の緯度/経度、月齢
 */
const useMoon = (currentDate: Ref<Date>, offsetLongitude: Ref<number>) => {
  // 月の緯度/経度
  const moonLocation = ref<[number, number]>([0.0, 0.0]);
  // 月齢
  const moonAge = ref<number>(0.0);
  let intervalId: number;

  const updateLocation = () => {
    // 月の黄緯/黄経を計算する
    const eclipticCoords = {
      latitude: AstronomyUtil.calculateMoonEclipticLatitudeInRadian(currentDate.value),
      longitude: AstronomyUtil.calculateMoonEclipticLongitudeInRadian(currentDate.value),
    };
    // 月の黄緯/黄経を赤道座標に変換する
    const equatorialCoords = AstronomyUtil.translateEclipticToEquatorialInRadian(eclipticCoords);
    // 月の赤緯/赤経から南中している地球上の緯度/経度を計算する
    moonLocation.value = [
      CoordinateCalcUtil.radianToDegree(equatorialCoords.declination),
      AstronomyUtil.calculateLongitudeInDegree(
        currentDate.value,
        CoordinateCalcUtil.radianToDegree(equatorialCoords.rightAscension),
        offsetLongitude.value
      ),
    ];
    // 月齢を計算する
    moonAge.value = AstronomyUtil.calculateMoonAge(currentDate.value);
  };

  onMounted(() => {
    updateLocation();
    // 1秒ごとに月の緯度/経度を更新する
    intervalId = window.setInterval(updateLocation, 1000) as number;
  });

  // currentDateの変更を監視して1500ms以上増減した場合は月の緯度/経度を更新する
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

  return { moonLocation, moonAge };
};

export default useMoon;
