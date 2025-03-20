import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { SelectOption } from "@/renderer/types/vue-types";
import { onMounted, ref, Ref } from "vue";

/**
 * アクティブ衛星グループ関係のフック
 */
export default function useSatelliteSelectBox(items: Ref<SelectOption[]>) {
  const selectedSatGroupId = ref<number>();

  onMounted(async () => {
    // 初期表示時のアクティブ衛星グループでSeceletBoxを更新
    await onChangeAppConfig();

    // AppConfigが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeAppConfig);
  });

  /**
   * AppConfigが変更された場合のイベントハンドラ
   */
  async function onChangeAppConfig() {
    // 表示対象の衛星グループを取得
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      return;
    }

    // SelectBoxのデータを更新
    await getSatItems();

    // 現在のアクティブ衛星グループのIndexを取得
    const index = items.value.findIndex((item: any) => {
      return item.value === satGrp.activeSatelliteGroupId && !item.props.disabled;
    });

    // 現在のアクティブ衛星グループがリストに存在する場合は、更新前の選択状態を保持する。
    if (index >= 0) {
      // 選択されていた衛星グループが存在する場合は、その衛星グループを選択状態にする
      selectedSatGroupId.value = items.value[index].value;
    }
    // リストに存在しない場合
    else {
      // 先頭を選択状態にする
      selectedSatGroupId.value = items.value[0].value;

      // AppConfigの更新
      updateAppConfig(items.value[0].value);
    }
  }

  /**
   * SelectBoxのデータを取得する
   */
  async function getSatItems() {
    // 更新された衛星グループ情報を取得
    const config = await ApiAppConfig.getAppConfig();
    const groups = config.satelliteGroups;

    // リストをクリアする
    items.value = [];

    // グループ内の衛星を取得
    for (let ii = 0; ii < groups.length; ii++) {
      const group = groups[ii];

      // グループ内に衛星が存在しない場合は選択不可
      const disabled = group.satelliteIds.length === 0;

      // SelectBox用のデータをリストに追加
      items.value.push({ title: group.groupName, value: group.groupId, props: { disabled } });
    }
  }

  /**
   * アクティブ衛星を更新する
   */
  async function updateAppConfig(groupId: string) {
    // AppConfigの更新
    const appConfig = await ApiAppConfig.getAppConfig();
    appConfig.mainDisplay.activeSatelliteGroupId = parseInt(groupId);
    await ApiAppConfig.storeAppConfig(appConfig);

    // アクティブ衛星の更新を通知
    await ApiActiveSat.refreshAppConfig();
  }

  return { selectedSatGroupId, updateAppConfig };
}
