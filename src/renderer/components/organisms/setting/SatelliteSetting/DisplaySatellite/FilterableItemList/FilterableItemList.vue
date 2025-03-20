<!-- 表示衛星タブ左側のフィルタテキストボックスとリスト -->
<template>
  <div>
    <v-row>
      <v-col>
        <TextField v-model="filterText" :label="I18nUtil.getMsg(I18nMsgs.GCOM_SEARCH)"></TextField>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <VirtualScrollList
          style="overflow-y: auto"
          :items="filteredItems"
          :itemName="'satelliteName'"
          :itemKey="'satelliteId'"
          :height="355"
          :selectMode="'inclusive'"
          @itemDblClick="showEditSatelliteInfo"
          ref="listRef"
        ></VirtualScrollList>
        <!-- ダブルクリックしたら衛星情報を表示 -->
        <EditSatelliteInfo
          v-if="enableEditSatelliteInfo"
          :isShow="enableEditSatelliteInfo"
          :selectedItem="selectedEditSatelliteItem"
          @onOk="onCloseEditSatelliteInfo"
          @onCancel="onCloseEditSatelliteInfo"
        />
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import { SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import ApiDefaultSatellite from "@/renderer/api/ApiDefaultSatellite";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import VirtualScrollList from "@/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue";
import EditSatelliteInfo from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfo.vue";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
import { computed, onMounted, ref } from "vue";

// 衛星情報編集画面表示用のフラグ
const enableEditSatelliteInfo = ref(false);
// 衛星情報編集画面に表示用の選択されたアイテム
const selectedEditSatelliteItem = ref<SatelliteIdentiferType>();
// フィルタテキスト
const filterText = ref("");
// リストに表示するアイテム
const items = ref<SatelliteIdentiferType[]>([]);
// リストの関数を使用するためのref
const listRef = ref<InstanceType<typeof VirtualScrollList> | null>(null);

/**
 * コンポーネントのマウント時にデフォルト衛星定義を読み込む
 */
onMounted(function () {
  ApiDefaultSatellite.getSavedSatelliteIdentifer()
    .then((satIdentifer: SatelliteIdentiferType[]) => {
      if (satIdentifer) {
        // 衛星名でソートして値を格納する
        items.value = satIdentifer.sort((a, b) => a.satelliteName.localeCompare(b.satelliteName));
      }
    })
    .catch((error) => {
      AppRendererLogger.error("cannot get DefaultSatellite: " + error);
    });
});

/**
 * フィルタテキストに基づいてアイテムをフィルタリング
 */
const filteredItems = computed(function () {
  let ret = [];
  if (!filterText.value) {
    ret = items.value;
  } else {
    ret = items.value.filter((item) => item.satelliteName.toLowerCase().includes(filterText.value.toLowerCase()));
  }

  return ret;
});

/**
 * 衛星情報表示画面を表示する
 */
function showEditSatelliteInfo(item: SatelliteIdentiferType) {
  enableEditSatelliteInfo.value = true;
  selectedEditSatelliteItem.value = item;
}
/**
 * 衛星情報表示画面を閉じる
 */
function onCloseEditSatelliteInfo() {
  enableEditSatelliteInfo.value = false;
}

// 親に公開する
const selectedItems = computed(() => listRef.value?.selectedItems ?? []);
function clearSelect() {
  listRef.value?.clearSelect();
}

defineExpose({
  clearSelect,
  selectedItems,
});
</script>

<style lang="scss" scoped>
@import "./FilterableItemList.scss";
</style>
