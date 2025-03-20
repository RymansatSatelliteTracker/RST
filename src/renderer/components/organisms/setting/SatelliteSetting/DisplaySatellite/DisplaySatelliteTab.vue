<!-- 表示衛星タブ -->
<template>
  <div>
    <v-sheet theme="dark" outlined width="100%" height="100%" class="pa-3">
      <v-row>
        <!-- 左側のフィルタテキストボックスとリスト -->
        <!-- ボタンとハイライトは青、バツは赤 -->
        <v-col cols="5">
          <FilterableItemList ref="filtListRef"></FilterableItemList>
        </v-col>

        <!-- アイテムを移動するためのボタン -->
        <v-col cols="1" class="d-flex flex-column align-center justify-center">
          <v-btn @click="moveSelectedToRight" variant="plain" size="x-large" :disabled="!canMoveRight">
            <v-icon size="50" :icon="mdiArrowRightBold"></v-icon>
          </v-btn>
        </v-col>

        <!-- 右側のリストボックスとリスト -->
        <v-col cols="6">
          <SelectControlledItemList
            v-show="satelliteGroups"
            v-model:selectedSatellites="rightItems"
            v-model:satelliteGroups="satelliteGroups"
          ></SelectControlledItemList>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>
<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigSatelliteGroupForSatSetting } from "@/common/model/AppConfigSatelliteSettingModel";
import { SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import FilterableItemList from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/FilterableItemList/FilterableItemList.vue";
import SelectControlledItemList from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/SelectControlledItemList/SelectControlledItemList.vue";
import emitter from "@/renderer/util/EventBus";
import { mdiArrowRightBold } from "@mdi/js";
import { computed, ref } from "vue";

// 衛星グループリスト
const satelliteGroups = defineModel<AppConfigSatelliteGroupForSatSetting[]>("satelliteGroups", { default: [] });

// 右側のリストに表示しているアイテム
const rightItems = ref<SatelliteIdentiferType[]>([]);
// リストの関数を使用するためのref
const filtListRef = ref<InstanceType<typeof FilterableItemList> | null>(null);

/**
 * 選択したアイテムが右に移動可能かどうかを判断
 */
const canMoveRight = computed(() => {
  return filtListRef.value?.selectedItems.length !== 0;
});

/**
 * 左から右へ選択したアイテムを移動(左は削除しない)
 */
function moveSelectedToRight() {
  const toBeRegistedItems: SatelliteIdentiferType[] = [];
  const duplicateSats: string[] = [];
  filtListRef.value?.selectedItems.forEach((leftItem: SatelliteIdentiferType) => {
    // idが一致する場合は移動しない
    if (rightItems.value.some((rightItem) => rightItem.satelliteId === leftItem.satelliteId)) {
      duplicateSats.push(leftItem.satelliteName);
    } else {
      toBeRegistedItems.push(leftItem);
    }
  });
  // snackbarは1つしか表示できないため、重複メッセージを表示した場合は
  // 前のメッセージが閉じた後にエラーメッセージを表示するためのタイムアウト時間
  let nextSnackBarTimeout = 0;

  // すでに登録されている場合はエラーメッセージを表示
  if (duplicateSats.length !== 0) {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_DUPLICATE_MOVE) + "(" + duplicateSats.join(",") + ")";
    emitter.emit(Constant.GlobalEvent.NOTICE_ERR, message);
    nextSnackBarTimeout = Constant.SnackBar.DISP_TIMEOUT_MS + 200;
  }
  // グループの衛星数が10より多い場合はエラーメッセージを表示
  const expectedNum = rightItems.value.length + toBeRegistedItems.length;
  if (expectedNum > Constant.SatSetting.MAX_NUM_OF_SAT_IN_GROUP) {
    setTimeout(() => {
      emitter.emit(
        Constant.GlobalEvent.NOTICE_ERR,
        I18nUtil.getMsg(I18nMsgs.CHK_ERR_MAX_SATNUM, String(Constant.SatSetting.MAX_NUM_OF_SAT_IN_GROUP))
      );
    }, nextSnackBarTimeout);
    return;
  }

  // pushして追加
  toBeRegistedItems.forEach((item) => {
    rightItems.value.push(item);
  });

  filtListRef.value?.clearSelect();
}
</script>

<style></style>
