import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel";
import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ActiveSatHelper from "@/renderer/common/util/ActiveSatHelper";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { SelectOption } from "@/renderer/types/vue-types";
import { onMounted, ref, Ref } from "vue";

/**
 * アクティブ衛星関係のフック
 */
export default function useSatelliteSelectBox(items: Ref<SelectOption[]>) {
  const selectedSatId = ref<number>();
  // 現在の衛星グループID
  let currentSatGroupId: number;

  // 衛星グループごとの前回選択された衛星ID
  let prevSelectedSatIdMap: { [key: number]: number } = {};
  let prevItems: SelectOption[] = [];

  onMounted(async () => {
    // 初期表示時のアクティブ衛星グループで衛星SeceletBoxを更新
    await onChangeSatGrp();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);
  });

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    // 新しい衛星グループでSelectBoxのデータを更新
    updateSatItems();
  }

  /**
   * SelectBoxのデータ変更処理
   */
  async function updateSatItems() {
    // 更新された衛星グループ情報を取得
    const satGrp = await ApiActiveSat.getActiveSatelliteGroup();
    if (!satGrp || !satGrp.mainSattelliteTle) {
      return;
    }

    // 現在のアクティブ衛星
    selectedSatId.value = satGrp.mainSatelliteId;
    const sats = await ActiveSatHelper.fetchActiveSats();

    // リストをクリアする
    items.value = [];

    // グループ内の衛星を取得
    for (let ii = 0; ii < sats.length; ii++) {
      const sat = sats[ii];

      // SelectBox用のデータをリストに追加
      items.value.push({ title: sat.satelliteName, value: sat.satelliteId });
    }

    // 衛星の選択肢が変更されたかをチェック
    if (isUpdateItems(items.value, prevItems)) {
      // 変更ありの場合は前回選択の衛星IDを取得
      const satId = restoreSelectedSatId(items.value, satGrp);

      // 選択衛星が変更された場合は、画面の選択衛星とアクティブ衛星を更新
      // memo: 衛星リストが空の場合はsatId=-1で返ってくるので、その場合は更新不要（次の有効な衛星リストが来たら更新される）
      if (satId >= 0 && selectedSatId.value !== satId) {
        selectedSatId.value = satId;
        updateAppConfig(selectedSatId.value.toString());
      }
    }

    // 前回選択肢として現在の衛星リストを保持
    prevItems = JSON.parse(JSON.stringify(items.value));

    // 現在の衛星グループIDを保持
    currentSatGroupId = satGrp.activeSatelliteGroupId;

    // 選択された衛星IDを衛星グループ毎に保持
    prevSelectedSatIdMap[currentSatGroupId] = selectedSatId.value;
  }

  /**
   * 衛星選択肢（items）が更新されたか判定する
   * @param items 現在の選択肢
   * @param prevItems 変更前の選択肢
   */
  function isUpdateItems(items: SelectOption[], prevItems: SelectOption[]): boolean {
    // サイズが異なる場合
    if (items.length !== prevItems.length) {
      return true;
    }

    // 旧をSetにして、新itemsを追加して、サイズが変わる場合は更新があると判断
    const itemSet = new Set(items.map((item) => item.value));
    const orgSize = itemSet.size;
    prevItems.forEach((item) => itemSet.add(item.value));
    const checkSize = itemSet.size;
    if (orgSize !== checkSize) {
      return true;
    }

    return false;
  }

  /**
   * 前回選択された衛星IDを復元する
   * @param items 現在の衛星リスト(選択肢）
   * @param activeSatGrp 現在の衛星グループ
   * @returns 衛星ID
   */
  function restoreSelectedSatId(items: SelectOption[], activeSatGrp: ActiveSatelliteGroupModel): number {
    // 選択肢がない場合
    if (!items || items.length === 0) {
      return -1;
    }

    // 一旦、先頭を候補にしておく
    let satId = items[0].value;

    // 衛星グループごとの前回選択された衛星IDが存在する場合は、その衛星を選択
    if (activeSatGrp.activeSatelliteGroupId in prevSelectedSatIdMap) {
      satId = prevSelectedSatIdMap[activeSatGrp.activeSatelliteGroupId];
    }

    // ただし、選択肢に当該衛星が存在しない（削除された)場合は、先頭の衛星を選択する
    const index = items.findIndex((item) => item.value === satId);
    if (index < 0) {
      satId = items[0].value;
    }

    return satId;
  }

  /**
   * アクティブ衛星を更新する
   */
  async function updateAppConfig(satId: string) {
    // AppConfigの更新
    const appConfig = await ApiAppConfig.getAppConfig();
    appConfig.mainDisplay.activeSatelliteId = parseInt(satId);
    await ApiAppConfig.storeAppConfig(appConfig);

    // 無線機のAutoをOffにする
    // memo: AutoOnのママでの衛星変更を許容すると、AutoOnにできない衛星の場合の考慮が必要になること、
    //       衛星の変更タイミングによってはRSTと無線機の周波数の同期（特にバンド設定）が崩れるため、AutoをOffにする
    const autoStore = useStoreAutoState();
    autoStore.tranceiverAuto = false;

    // アクティブ衛星の更新を通知
    await ApiActiveSat.refreshAppConfig();
  }

  return { selectedSatId, updateAppConfig };
}
