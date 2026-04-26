<!-- 表示衛星タブ右側のリストボックスとリスト -->
<template>
  <div>
    <!-- 衛星リスト -->
    <v-row>
      <v-col cols="10">
        <VirtualScrollList
          style="overflow-y: auto"
          :items="satellites"
          :itemName="'satelliteName'"
          :itemKey="'satelliteId'"
          :height="355"
          @itemDblClick="showEditSatelliteInfo"
          ref="listRef"
        ></VirtualScrollList>
        <!-- ダブルクリックしたら衛星情報を表示 -->
        <EditSatelliteInfo
          v-if="enableEditSatelliteInfo"
          :isShow="enableEditSatelliteInfo"
          :selectedItem="selectedSatelliteItem"
          @onOk="onCloseEditSatelliteInfo"
          @onCancel="onCloseEditSatelliteInfo"
        />
      </v-col>

      <!-- アイテムを上下に移動、および削除するためのボタン -->
      <v-col cols="2">
        <div class="d-flex flex-column">
          <v-btn icon @click="listRef?.moveItemUp" :disabled="!listRef?.canMoveUp" variant="plain">
            <v-icon size="30" :icon="mdiArrowUpBold"></v-icon>
          </v-btn>
          <v-btn icon @click="listRef?.moveItemDown" :disabled="!listRef?.canMoveDown" variant="plain">
            <v-icon size="30" :icon="mdiArrowDownBold"></v-icon>
          </v-btn>
          <v-btn icon @click="listRef?.deleteItem" :disabled="!listRef?.canDelete" variant="plain">
            <v-icon size="30" :icon="mdiDelete"></v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { DefaultSatelliteType, SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import EditSatelliteInfo from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfo.vue";

import VirtualScrollList from "@/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue";
import { mdiArrowDownBold, mdiArrowUpBold, mdiDelete } from "@mdi/js";

// 衛星リスト
const satellites = defineModel<DefaultSatelliteType[]>("satellites", { default: [] });

// 選択されたアイテム
const selectedSatelliteItem = ref<SatelliteIdentiferType>({
  satelliteId: -1,
  satelliteName: "",
  userRegistered: false,
  noradId: "",
});
// 衛星情報編集画面表示用のフラグ
const enableEditSatelliteInfo = ref(false);
// リストの関数を使用するためのref
const listRef = ref<InstanceType<typeof VirtualScrollList> | null>(null);

/**
 * 衛星情報編集画面を表示する
 * @param index
 */
function showEditSatelliteInfo(item: SatelliteIdentiferType) {
  enableEditSatelliteInfo.value = true;
  selectedSatelliteItem.value = item;
}
/**
 * 衛星情報編集画面を閉じる
 */
function onCloseEditSatelliteInfo() {
  enableEditSatelliteInfo.value = false;
}
</script>
<style lang="scss" scoped>
@import "./FrequencyEditorList.scss";
</style>
