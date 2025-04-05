import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import DateUtil from "@/renderer/util/DateUtil";
import { onMounted, ref, watch, type Ref } from "vue";

/**
 * 人工衛星の直近のAOS/LOSまでの残時間を取得する
 * @param {Ref<Date>} currentDate 現在日時
 * @returns {string | null} 直近のAOS/LOSまでの残時間文字列
 */
export default function useAos(currentDate: Ref<Date>) {
  const passCountdown = ref<string | null>(null);

  onMounted(async () => {
    // 初期表示時のアクティブ衛星でAOSを更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);
  });

  // currentDateの変更を監視して直近のAOSを更新する
  watch(currentDate, async () => {
    await updatePassList();
  });

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    await updatePassList();
  }

  /**
   * アクティブ衛星の直近のAOS/LOSまでの残時間を更新する
   */
  async function updatePassList() {
    const satelliteService = ActiveSatServiceHub.getInstance().getSatService();
    const groundStationService = ActiveSatServiceHub.getInstance().getGroundStationService();
    if (!satelliteService || !groundStationService) {
      return;
    }

    // 現在の基準日時を元に、追尾開始・終了時間を加味した基準日時を取得する
    // memo: 素の基準日時を渡すと、LOS後に次のパスが取れてしまうため（余白的な追尾が出来ないため）
    //       追尾開始・終了時間を加味した基準日時を元にパスを取得する
    const appConfig = await ApiAppConfig.getAppConfig();
    const baseDate = AutoTrackingHelper.getOffsetBaseDate(appConfig, currentDate.value);

    // 人工衛星の直近のAOS/LOSを取得する
    const passesCache = await groundStationService.getOrbitPassAsync(baseDate);

    if (passesCache && passesCache.aos && passesCache.los) {
      // 人工衛星が可視/不可視判定を取得する
      // memo: 元の基準時間と追尾開始・終了時間のどちらかが可視の場合は可視とする
      let isVisible = await groundStationService.isSatelliteVisibleAsync(currentDate.value);
      isVisible = isVisible || (await groundStationService.isSatelliteVisibleAsync(baseDate));

      if (isVisible) {
        // 現在日時で人工衛星が可視の場合は直近のLOSまでの残時間を取得する
        passCountdown.value = `LOS ${DateUtil.formatMsToDHMS(passesCache.los.date.getTime() - currentDate.value.getTime())}`;
      } else {
        // 現在日時で人工衛星が不可視の場合は直近のAOSまでの残時間を取得する
        passCountdown.value = `AOS ${DateUtil.formatMsToDHMS(passesCache.aos.date.getTime() - currentDate.value.getTime())}`;
      }

      return;
    }

    // 現在日時で人工衛星の直近のAOS/LOSが取得できない場合は残時間を初期化する
    passCountdown.value = null;
  }

  return { passCountdown };
}
