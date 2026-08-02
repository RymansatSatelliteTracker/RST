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
          <v-btn variant="plain" size="x-large" :disabled="!canMoveRight" @click="moveSelectedToRight">
            <v-icon size="50" :icon="mdiArrowRightBold"></v-icon>
          </v-btn>
        </v-col>

        <!-- 右側のリストボックスとリスト -->
        <v-col cols="6">
          <SelectControlledItemList
            v-show="satelliteGroups"
            v-model:selected-satellites="rightItems"
            v-model:satellite-groups="satelliteGroups"
          ></SelectControlledItemList>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>
<script setup lang="ts">
import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import type { AppConfigSatelliteGroupForSatSetting } from "@/common/model/AppConfigSatelliteSettingModel.js";
import type { SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import FilterableItemList from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/FilterableItemList/FilterableItemList.vue";
import SelectControlledItemList from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/SelectControlledItemList/SelectControlledItemList.vue";
import emitter from "@/renderer/util/EventBus.js";
import { mdiArrowRightBold } from "@mdi/js";
import { computed, ref, useTemplateRef } from "vue";
import type { ComponentExposed } from "vue-component-type-helpers";

// 衛星グループリスト
const satelliteGroups = defineModel<AppConfigSatelliteGroupForSatSetting[]>("satelliteGroups", { default: [] });

// 右側のリストに表示しているアイテム
const rightItems = ref<SatelliteIdentiferType[]>([]);
// リストの関数を使用するためのref
const filtListRef = useTemplateRef<ComponentExposed<typeof FilterableItemList>>("filtListRef");

/**
 * 選択したアイテムが右に移動可能かどうかを判断
 */
const canMoveRight = computed(() => {
  // memo: env.d.tsの"*.vue"shimの都合上、ESLintの型解析ではFilterableItemListの公開プロパティの型を解決できないため無効化する
  // （vue-tscでは正しく型付けされていることを確認済み）
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return filtListRef.value?.selectedItems.length !== 0;
});

/**
 * 左から右へ選択したアイテムを移動(左は削除しない)
 */
function moveSelectedToRight() {
  const toBeRegistedItems: SatelliteIdentiferType[] = [];
  const duplicateSats: string[] = [];
  // memo: env.d.tsの"*.vue"シムの都合上、ESLintの型解析ではFilterableItemListの公開プロパティの型を解決できないため無効化する
  // （vue-tscでは正しく型付けされていることを確認済み）
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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

  // memo: env.d.tsの"*.vue"シムの都合上、ESLintの型解析ではFilterableItemListの公開プロパティの型を解決できないため無効化する
  // （vue-tscでは正しく型付けされていることを確認済み）
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  filtListRef.value?.clearSelect();
}
</script>

<style></style>
