import Constant from "@/common/Constant";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import DateUtil from "@/renderer/util/DateUtil";
import { onMounted, ref, watch, type Ref } from "vue";

/**
 * 人工衛星の直近の重複するAOS/LOSまでの残時間を取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @returns {string | null} 直近の重複するAOS/LOSまでの残時間文字列
 */
export default function useOverlapAos(currentDate: Ref<Date>) {
  const overlapPassCountdown = ref<string | null>(null);

  onMounted(async () => {
    // 初期表示時のアクティブ衛星でAOSを更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);
  });

  // currentDateの変更を監視して直近の重複するAOSを更新する
  watch(currentDate, async () => {
    await updatePassList();
  });

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    await updatePassList();
  }

  async function updatePassList() {
    const overlapPassesService = ActiveSatServiceHub.getInstance().getOverlapPassesService();
    if (!overlapPassesService) {
      overlapPassCountdown.value = null;
      return;
    }

    // 人工衛星の直近の重複するAOS/LOSを取得する
    const passesCache = await overlapPassesService.getOverlapPassesListAsync(
      currentDate.value,
      new Date(currentDate.value.getTime() + Constant.Time.MILLISECONDS_IN_DAY)
    );

    if (passesCache && passesCache[0] && passesCache[0].aos && passesCache[0].los) {
      // 現在日時で2か所の地上局から人工衛星が可視/不可視判定を取得する
      const isVisible = await overlapPassesService.isSatelliteVisibleAsync(currentDate.value);
      if (isVisible) {
        // 現在日時で人工衛星が可視の場合は直近の重複するLOSまでの残時間を取得する
        overlapPassCountdown.value = `LOS ${DateUtil.formatMsToDHMS(passesCache[0].los.date.getTime() - currentDate.value.getTime())}`;
      } else {
        // 現在日時で人工衛星が不可視の場合は直近の重複するAOSまでの残時間を取得する
        overlapPassCountdown.value = `AOS ${DateUtil.formatMsToDHMS(passesCache[0].aos.date.getTime() - currentDate.value.getTime())}`;
      }

      return;
    }

    // 現在日時で人工衛星の直近の重複するAOS/LOSが取得できない場合は残時間を初期化する
    overlapPassCountdown.value = null;
  }

  return { overlapPassCountdown };
}
