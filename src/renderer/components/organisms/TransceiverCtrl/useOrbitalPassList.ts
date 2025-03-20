import Constant from "@/common/Constant";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { PassesCache } from "@/renderer/types/pass-type";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * 人工衛星のAOSリストを取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @returns {orbitalPassList} 人工衛星のAOSリスト
 */
const useOrbitalPassList = (currentDate: Ref<Date>) => {
  const orbitalPassList = ref<PassesCache[] | null>(null);
  let intervalId: number;

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    await updatePassList();
  }

  /**
   * AOSリストを更新する
   */
  async function updatePassList() {
    const groundStationService = ActiveSatServiceHub.getInstance().getGroundStationService();

    // 起動直後の場合に地上局サービスが未設定の場合があるのでガード
    if (!groundStationService) {
      return;
    }

    // 人工衛星のAOSリストを取得する
    orbitalPassList.value = await groundStationService.getOrbitPassListAsync(
      currentDate.value,
      new Date(currentDate.value.getTime() + Constant.Time.MILLISECONDS_IN_DAY)
    );
  }

  onMounted(async () => {
    // 初期表示時のアクティブ衛星で画面を更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 10秒ごとにAOSリストを更新する
    intervalId = window.setInterval(updatePassList, 10000) as number;
  });

  // currentDateの変更を監視して1500ms以上増減した場合はAOSリストを更新する
  let lastDate = currentDate.value.getTime();
  watch(currentDate, async (newValue) => {
    const newTime = newValue.getTime();
    if (Math.abs(newTime - lastDate) > 1500) {
      await updatePassList();
    }
    lastDate = newTime;
  });

  // コンポーネントのアンマウント時にタイマーを破棄する
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return { orbitalPassList };
};

export default useOrbitalPassList;
