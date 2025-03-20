import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { onMounted, ref } from "vue";

/**
 * 地図描画に必要な情報を取得する
 * @returns {*} 地上局1(自局)の位置、地上局2(他局)の位置
 */
const useMap = () => {
  // 地上局1(自局)の位置
  const groundStation = ref<[number, number]>([0.0, 0.0]);
  // 地上局2(他局)の位置
  const groundStation2 = ref<[number, number]>([0.0, 0.0]);
  // 地図の中心経度のオフセット
  const offsetLongitude = ref<number>(-180.0);
  // 地上局2の有効/無効
  const isGroundStation2Enable = ref<boolean>(false);

  /**
   * 表示中の地上局が変更された場合のイベントハンドラ
   */
  async function onChangeGroundStation() {
    await updateGroundStation();
  }

  /**
   * 地上局情報を更新する
   */
  async function updateGroundStation() {
    // 地上局1(自局)の位置を取得
    const activeGroundStation = ActiveSatServiceHub.getInstance().getGroundStation();
    if (activeGroundStation) {
      // 地上局1(自局)の位置を更新
      groundStation.value = [activeGroundStation.latitude, activeGroundStation.longitude];
      // 地図の中心経度のオフセットを更新
      offsetLongitude.value = activeGroundStation.longitude - 180.0;
    }

    // 地上局2(他局)の位置を取得
    const activeGroundStation2 = ActiveSatServiceHub.getInstance().getGroundStation2();
    if (activeGroundStation2) {
      // 地上局2(他局)の位置を更新
      groundStation2.value = [activeGroundStation2.latitude, activeGroundStation2.longitude];
      // 地上局2の有効/無効を更新
      isGroundStation2Enable.value = activeGroundStation2.enable;
    }
  }

  onMounted(async () => {
    // 初期表示時の地上局で画面を更新
    await onChangeGroundStation();

    // 地上局が変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeGroundStation);
  });

  return { groundStation, groundStation2, offsetLongitude, isGroundStation2Enable };
};

export default useMap;
