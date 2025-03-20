import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * 人工衛星の位置を取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @param {Ref<number>} offsetLongitude 地図の中心経度のオフセット
 * @returns {*} 人工衛星の位置
 */
const useSatelliteLocation = (currentDate: Ref<Date>, offsetLongitude: Ref<number>) => {
  const satelliteLocation = ref<Map<number, number[]>>(new Map());
  let intervalId: number;

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    // 人工衛星の位置を更新
    updateLocation();
  }

  /**
   * 人工衛星の位置を更新する
   */
  function updateLocation() {
    // 現在の人工衛星の座標を取得する
    const satelliteServices = ActiveSatServiceHub.getInstance().getSatGroupSatServices();
    satelliteLocation.value = new Map(
      satelliteServices.map((satelliteService) => {
        const location = satelliteService.getTargetPolarLocationInDegree(currentDate.value, offsetLongitude.value);
        return [
          satelliteServices.indexOf(satelliteService),
          location ? [location.latitude, location.longitude] : [0.0, 0.0],
        ];
      })
    );
  }

  /**
   * アクティブ衛星を更新する
   */
  async function updateAppConfig(index: number) {
    // インデックスから衛星IDを取得する
    const satId = await getSatIdByIndex(index);
    if (!satId) {
      return;
    }

    // AppConfigの更新
    const appConfig = await ApiAppConfig.getAppConfig();
    appConfig.mainDisplay.activeSatelliteId = satId;
    await ApiAppConfig.storeAppConfig(appConfig);

    // アクティブ衛星の更新を通知
    await ApiActiveSat.refreshAppConfig();
  }

  /**
   * インデックスから衛星IDを返す
   */
  async function getSatIdByIndex(index: number) {
    // 更新された衛星グループ情報を取得
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      return;
    }

    // 予防
    if (!satGrp.activeSatellites[index]) {
      return null;
    }

    return satGrp.activeSatellites[index].satelliteId;
  }

  onMounted(async () => {
    // 初期表示時の衛星グループで画面を更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 1秒ごとに人工衛星の位置を更新する
    intervalId = window.setInterval(updateLocation, 1000) as number;
  });

  // currentDateの変更を監視して1500ms以上増減した場合は人工衛星の位置を更新する
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

  return { satelliteLocation, updateAppConfig };
};

export default useSatelliteLocation;
