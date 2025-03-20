import Constant from "@/common/Constant";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { PassesCache } from "@/renderer/types/pass-type";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

/**
 * 2か所の地上局から同時に人工衛星が観測できる重複する可視時間リストを取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @returns {overlapPassList;isGroundStation2Enable} 重複する可視時間リスト、地上局2の有効/無効
 */
const useOverlapPassList = (currentDate: Ref<Date>) => {
  // 重複する可視時間リスト
  const overlapPassList = ref<PassesCache[] | null>(null);
  // 地上局2の有効/無効
  const isGroundStation2Enable = ref<boolean>(false);
  let intervalId: number;

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    await updateOverlapPassList();
  }

  /**
   * 可視時間リストを更新する
   */
  async function updateOverlapPassList() {
    const groundStation2 = ActiveSatServiceHub.getInstance().getGroundStation2();

    if (groundStation2) {
      // 地上局2の有効/無効を更新
      isGroundStation2Enable.value = groundStation2.enable;
    }

    const overlapPassesService = ActiveSatServiceHub.getInstance().getOverlapPassesService();

    // 起動直後の場合に地上局サービスが未設定の場合があるのでガード
    if (!overlapPassesService) {
      overlapPassList.value = null;
      return;
    }

    // 重複する可視時間リストを取得する
    overlapPassList.value = await overlapPassesService.getOverlapPassesListAsync(
      currentDate.value,
      new Date(currentDate.value.getTime() + Constant.Time.MILLISECONDS_IN_DAY)
    );
  }

  onMounted(async () => {
    // 初期表示時のアクティブ衛星で画面を更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 10秒ごとに重複する可視時間リストを更新する
    intervalId = window.setInterval(updateOverlapPassList, 10000) as number;
  });

  // currentDateの変更を監視して1500ms以上増減した場合は重複する可視時間リストを更新する
  let lastDate = currentDate.value.getTime();
  watch(currentDate, async (newValue) => {
    const newTime = newValue.getTime();
    if (Math.abs(newTime - lastDate) > 1500) {
      await updateOverlapPassList();
    }
    lastDate = newTime;
  });

  // コンポーネントのアンマウント時にタイマーを破棄する
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return { overlapPassList, isGroundStation2Enable };
};

export default useOverlapPassList;
