<!-- 表示衛星タブ右側のリストボックスとリスト -->
<template>
  <div>
    <!-- 衛星リスト -->
    <v-row>
      <v-col cols="10">
        <VirtualScrollList
          ref="listRef"
          style="overflow-y: auto"
          :items="satellites"
          :item-name="'satelliteName'"
          :height="355"
          @item-dbl-click="showEditSatelliteInfo"
        ></VirtualScrollList>
        <!-- ダブルクリックしたら衛星情報を表示 -->
        <EditFrequencySatelliteInfo
          v-if="enableEditSatelliteInfo"
          v-model:is-show="enableEditSatelliteInfo"
          v-model:satellite="selectedSatelliteItem"
          @on-ok="onOkEditSatelliteInfo"
          @on-cancel="onCancelEditSatelliteInfo"
        />
      </v-col>

      <!-- アイテムを上下に移動、および削除するためのボタン -->
      <v-col cols="2">
        <div class="d-flex flex-column">
          <v-btn icon variant="plain" @click="showAddSatelliteInfo">
            <v-icon size="30" :icon="mdiPlusCircle"></v-icon>
          </v-btn>
          <v-btn icon :disabled="!listRef?.canMoveUp" variant="plain" @click="listRef?.moveItemUp">
            <v-icon size="30" :icon="mdiArrowUpBold"></v-icon>
          </v-btn>
          <v-btn icon :disabled="!listRef?.canMoveDown" variant="plain" @click="listRef?.moveItemDown">
            <v-icon size="30" :icon="mdiArrowDownBold"></v-icon>
          </v-btn>
          <v-btn icon :disabled="!listRef?.canDelete" variant="plain" @click="listRef?.deleteItem">
            <v-icon size="30" :icon="mdiDelete"></v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes.js";
import { createDefaultSatellite } from "@/common/util/DefaultSatelliteUtil.js";
import EditFrequencySatelliteInfo from "@/renderer/components/organisms/setting/SatelliteSetting/FrequencyEditor/EditFrequencySatelliteInfo/EditFrequencySatelliteInfo.vue";

import VirtualScrollList from "@/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue";
import { mdiArrowDownBold, mdiArrowUpBold, mdiDelete, mdiPlusCircle } from "@mdi/js";

// 衛星リスト
const satellites = defineModel<DefaultSatelliteType[]>("satellites", { default: [] });

// 選択されたアイテム
const selectedSatelliteItem = ref<DefaultSatelliteType>(createDefaultSatellite(-1, "", ""));
// 衛星情報編集画面表示用のフラグ
const enableEditSatelliteInfo = ref(false);
// 新規追加中かどうか
const isNewSatellite = ref(false);
// 新規追加した衛星のindex
const newSatelliteIndex = ref(-1);
// リストの関数を使用するためのref
const listRef = ref<InstanceType<typeof VirtualScrollList> | null>(null);

/**
 * 衛星情報追加画面を表示する
 */
function showAddSatelliteInfo() {
  satellites.value.push(createDefaultSatellite(-1, "", ""));
  newSatelliteIndex.value = satellites.value.length - 1;
  selectedSatelliteItem.value = satellites.value[newSatelliteIndex.value];
  isNewSatellite.value = true;
  enableEditSatelliteInfo.value = true;
}

/**
 * 衛星情報編集画面を表示する
 * @param index
 */
function showEditSatelliteInfo(item: DefaultSatelliteType) {
  isNewSatellite.value = false;
  newSatelliteIndex.value = -1;
  enableEditSatelliteInfo.value = true;
  selectedSatelliteItem.value = item;
}

/**
 * 衛星情報編集画面をOKで閉じる
 */
function onOkEditSatelliteInfo() {
  isNewSatellite.value = false;
  newSatelliteIndex.value = -1;
  enableEditSatelliteInfo.value = false;
}

/**
 * 衛星情報編集画面をCancelで閉じる
 */
function onCancelEditSatelliteInfo() {
  if (isNewSatellite.value && newSatelliteIndex.value > -1) {
    satellites.value.splice(newSatelliteIndex.value, 1);
  }
  isNewSatellite.value = false;
  newSatelliteIndex.value = -1;
  enableEditSatelliteInfo.value = false;
}
</script>
<style lang="scss" scoped>
@use "./FrequencyEditorList" as *;
</style>
