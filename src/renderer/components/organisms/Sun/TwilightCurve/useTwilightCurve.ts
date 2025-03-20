import Constant from "@/common/Constant";
import AstronomyUtil from "@/renderer/util/AstronomyUtil";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";
import { Feature, Polygon } from "geojson";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * 薄明曲線を取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @param {Ref<number>} offsetLongitude 地図の中心経度のオフセット
 * @returns {twilightCurve} 薄明曲線
 */
const useTwilightCurve = (currentDate: Ref<Date>, offsetLongitude: Ref<number>) => {
  // 薄明曲線
  const twilightCurve = ref<Feature<Polygon>>();
  let intervalId: number;

  const update = () => {
    // 現在日時からグリニッジ恒星時を計算する
    const gmst = AstronomyUtil.getGst(currentDate.value);
    // 太陽の黄緯/黄経を計算する
    const sunEcliptic = AstronomyUtil.calculateSunEclipticLongitudeInRadian(currentDate.value);
    // 太陽の黄緯/黄経を赤道座標に変換する
    const equatorialCoords = AstronomyUtil.translateEclipticToEquatorialInRadian(sunEcliptic);

    const lnglats: number[][] = [];
    const diffDeg = 360.0 / Constant.Astronomy.TWILIGHT_CURVE_NUM_POINTS;
    for (let longitude = offsetLongitude.value; longitude < 360.0 + offsetLongitude.value; longitude += diffDeg) {
      // 薄明曲線上の緯度を計算する
      const latitude = AstronomyUtil.calculateLatitude(
        gmst,
        CoordinateCalcUtil.degreeToRadian(longitude),
        equatorialCoords
      );
      lnglats.push([longitude, CoordinateCalcUtil.radianToDegree(latitude)]);
    }
    // 薄明曲線の終点を追加する
    const latitude = AstronomyUtil.calculateLatitude(
      gmst,
      Math.PI * 2.0 + CoordinateCalcUtil.degreeToRadian(offsetLongitude.value),
      equatorialCoords
    );
    lnglats.push([360.0 + offsetLongitude.value, CoordinateCalcUtil.radianToDegree(latitude)]);

    // 太陽が地球の南半球にあるときは配列を逆転する
    if (equatorialCoords.declination > 0) {
      lnglats.push([360.0 + offsetLongitude.value, -90.0]);
      lnglats.push([offsetLongitude.value, -90.0]);
      lnglats.push(lnglats[0]);
      lnglats.reverse();
    } else {
      lnglats.push([360.0 + offsetLongitude.value, 90.0]);
      lnglats.push([offsetLongitude.value, 90.0]);
      lnglats.push(lnglats[0]);
    }
    twilightCurve.value = {
      type: "Feature",
      properties: {
        datetime: currentDate.value.toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [lnglats],
      },
    };
  };

  onMounted(() => {
    update();
    // 1秒ごとに薄明曲線を更新する
    intervalId = window.setInterval(update, 1000) as number;
  });

  // currentDateの変更を監視して1500ms以上増減した場合は薄明曲線を更新する
  let lastDate = currentDate.value.getTime();
  watch(currentDate, (newValue) => {
    const newTime = newValue.getTime();
    if (Math.abs(newTime - lastDate) > 1500) {
      update();
    }
    lastDate = newTime;
  });

  // コンポーネントのアンマウント時にタイマーを破棄する
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return { twilightCurve };
};

export default useTwilightCurve;
