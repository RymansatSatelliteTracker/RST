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
          :height="355"
          @itemDblClick="showEditSatelliteInfo"
          ref="listRef"
        ></VirtualScrollList>
        <!-- ダブルクリックしたら衛星情報を表示 -->
        <EditFrequencySatelliteInfo
          v-if="enableEditSatelliteInfo"
          v-model:isShow="enableEditSatelliteInfo"
          v-model:satellite="selectedSatelliteItem"
          @onOk="onOkEditSatelliteInfo"
          @onCancel="onCancelEditSatelliteInfo"
        />
      </v-col>

      <!-- アイテムを上下に移動、および削除するためのボタン -->
      <v-col cols="2">
        <div class="d-flex flex-column">
          <v-btn icon @click="showAddSatelliteInfo" variant="plain">
            <v-icon size="30" :icon="mdiPlusCircle"></v-icon>
          </v-btn>
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

import Constant from "@/common/Constant";
import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";
import EditFrequencySatelliteInfo from "@/renderer/components/organisms/setting/SatelliteSetting/FrequencyEditor/EditFrequencySatelliteInfo/EditFrequencySatelliteInfo.vue";

import VirtualScrollList from "@/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue";
import { mdiArrowDownBold, mdiArrowUpBold, mdiDelete, mdiPlusCircle } from "@mdi/js";

// 衛星リスト
const satellites = defineModel<DefaultSatelliteType[]>("satellites", { default: [] });

/**
 * 空の衛星情報を作成する
 */
function createEmptySatellite(): DefaultSatelliteType {
  return {
    satelliteId: -1,
    satelliteName: "",
    noradId: "",
    uplink1: { uplinkHz: null, uplinkMode: "" },
    uplink2: { uplinkHz: null, uplinkMode: "" },
    uplink3: { uplinkHz: null, uplinkMode: "" },
    downlink1: { downlinkHz: null, downlinkMode: "" },
    downlink2: { downlinkHz: null, downlinkMode: "" },
    downlink3: { downlinkHz: null, downlinkMode: "" },
    beacon: { beaconHz: null, beaconMode: "" },
    toneHz: null,
    enableSatelliteMode: false,
    satelliteMode: Constant.Transceiver.TrackingMode.NORMAL,
    outline: "",
  };
}

// 選択されたアイテム
const selectedSatelliteItem = ref<DefaultSatelliteType>(createEmptySatellite());
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
  satellites.value.push(createEmptySatellite());
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
@import "./FrequencyEditorList.scss";
</style>
