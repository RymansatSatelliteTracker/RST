<!-- 表示衛星タブ右側のリストボックスとリスト -->
<template>
  <div>
    <v-row>
      <!-- グループのリストボックス -->
      <v-col col="9">
        <v-select
          v-model="selectedGroup"
          :items="satelliteGroups"
          item-title="groupName"
          item-value="groupId"
          density="compact"
          variant="outlined"
          hide-details
          class="selectbox"
          return-object
        ></v-select>
      </v-col>
      <!-- グループボタン -->
      <v-col cols="3" class="d-flex flex-column align-center justify-center">
        <v-btn @click="showGroupSatellite" variant="outlined" size="small">
          {{ I18nUtil.getMsg(I18nMsgs.G31_GROUP) }}
        </v-btn>
        <GroupSatellite
          v-if="enableGroupSatellite"
          :isShow="enableGroupSatellite"
          :satelliteGroups="satelliteGroups"
          @onOk="onOkShowGroupSatellite"
          @onCancel="onCloseShowGroupSatellite"
        />
      </v-col>
    </v-row>

    <!-- グループごとの衛星リスト -->
    <v-row>
      <v-col cols="9">
        <VirtualScrollList
          style="overflow-y: auto"
          :items="selectedSatellites"
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
          :selectedGroupId="selectedGroup.groupId"
          @onOk="onCloseEditSatelliteInfo"
          @onCancel="onCloseEditSatelliteInfo"
        />
      </v-col>

      <!-- アイテムを上下に移動、および削除するためのボタン -->
      <v-col cols="3">
        <div class="d-flex flex-column">
          <div class="menu__item" @click="showRegistSatellite">
            <img
              src="/src/renderer/assets/sat.png"
              :class="['sat__btn__icon', { active: canRegist }]"
              :style="{ cursor: canRegist ? 'pointer' : 'default' }"
            />
            <RegistSatellite
              v-if="enableRegistSatellite"
              :isShow="enableRegistSatellite"
              :selectedSatelliteItem="selectedSatelliteItem"
              :selectedGroupId="selectedGroup.groupId"
              :selectedSatellites="selectedSatellites"
              @onOk="onCloseRegistSatellite"
              @onCancel="onCloseRegistSatellite"
            />
          </div>
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
import { computed, onUnmounted, ref, watch } from "vue";

import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigSatelliteGroupForSatSetting } from "@/common/model/AppConfigSatelliteSettingModel";
import { SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import EditSatelliteInfo from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfo.vue";
import GroupSatellite from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/GroupSatellite/GroupSatellite.vue";
import RegistSatellite from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/RegistSatellite.vue";

import Constant from "@/common/Constant";
import VirtualScrollList from "@/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue";
import emitter from "@/renderer/util/EventBus";
import { mdiArrowDownBold, mdiArrowUpBold, mdiDelete } from "@mdi/js";

// 衛星グループリスト
const satelliteGroups = defineModel<AppConfigSatelliteGroupForSatSetting[]>("satelliteGroups", { default: [] });
// 選択されたグループ
const selectedGroup = ref({ groupName: "", groupId: -1, satellites: [] } as AppConfigSatelliteGroupForSatSetting);
// グループに所属する衛星リスト
const selectedSatellites = defineModel<SatelliteIdentiferType[]>("selectedSatellites", { default: [] });
// 衛星リストから選択したアイテムのインデックス
const selectedItemIndex = ref<number | null>(null);

// 選択されたアイテム
const selectedSatelliteItem = ref({ satelliteId: -1, satelliteName: "", userRegistered: false });
// 衛星グループ画面表示用のフラグ
const enableGroupSatellite = ref(false);
// 衛星登録画面表示用のフラグ
const enableRegistSatellite = ref(false);
// 衛星情報編集画面表示用のフラグ
const enableEditSatelliteInfo = ref(false);
// リストの関数を使用するためのref
const listRef = ref<InstanceType<typeof VirtualScrollList> | null>(null);

// 画面表示時にデータ更新する
// deepCopyにするとnewとoldが同じになってしまうので展開して別のオブジェクトとして扱う
watch(
  () => [...satelliteGroups.value],
  (newGroups, oldGroups) => {
    const newGroupNames = JSON.stringify(newGroups.map((group) => group.groupName));
    const oldGroupNames = JSON.stringify(oldGroups.map((group) => group.groupName));

    // グループ名の情報が変わらないのであれば何もしない
    if (newGroupNames === oldGroupNames) return;

    if (satelliteGroups.value.length > 0) {
      // 選択されたグループの初期値
      selectedGroup.value = satelliteGroups.value[0];
      // グループに所属する衛星リストの初期値
      selectedSatellites.value = satelliteGroups.value[0].satellites;
    } else {
      selectedGroup.value = { groupName: "", groupId: -1, satellites: [] };
      selectedSatellites.value = [];
    }
  },
  { deep: true } // ここはdeepじゃないと反応しない
);

watch(
  () => selectedGroup.value,
  () => {
    selectGroup();
  },
  { deep: true }
);

// watchで見ているので画面を閉じる際にデータをクリアする
onUnmounted(() => {
  satelliteGroups.value = [];
});

/**
 * 選択したアイテムに対して衛星登録画面が表示可能かを判断
 */
const canRegist = computed(() => {
  const items = listRef.value?.selectedItems;
  if (!items) return false;
  if (items.length > 1) return false;
  return checkCanRegist(items[0]);
});

/**
 * 選択したアイテムに対して衛星登録画面が表示可能かを判断(他関数からの呼び出し用)
 */
function checkCanRegist(item: SatelliteIdentiferType | null): boolean {
  if (item) {
    return item.userRegistered;
  } else {
    // 選択していなければ新規登録扱いなので常に表示可能
    return true;
  }
}

/**
 * グループ選択時にTLEリストを更新
 */
function selectGroup() {
  selectedSatellites.value = selectedGroup.value.satellites;
  selectedItemIndex.value = null; // リセット
}

/**
 * 衛星グループ画面を表示する
 */
function showGroupSatellite() {
  enableGroupSatellite.value = true;
}
/**
 * 衛星グループ画面画面を閉じる
 */
function onCloseShowGroupSatellite() {
  enableGroupSatellite.value = false;
}
/**
 * 衛星グループ画面画面をOKで閉じる
 */
function onOkShowGroupSatellite(newSatelliteGroups: AppConfigSatelliteGroupForSatSetting[]) {
  satelliteGroups.value = newSatelliteGroups;
  enableGroupSatellite.value = false;
}

/**
 * 衛星登録画面を表示する
 */
function showRegistSatellite() {
  const items = listRef.value?.selectedItems;
  if (!items) return;
  if (items.length > 1) return;
  const item = items[0];

  if (!checkCanRegist(item)) return;

  // 新規登録かつグループの衛星数が10より多い場合はエラーメッセージを表示
  if (!item && selectedSatellites.value.length >= Constant.SatSetting.MAX_NUM_OF_SAT_IN_GROUP) {
    emitter.emit(
      Constant.GlobalEvent.NOTICE_ERR,
      I18nUtil.getMsg(I18nMsgs.CHK_ERR_MAX_SATNUM, String(Constant.SatSetting.MAX_NUM_OF_SAT_IN_GROUP))
    );
    return;
  }

  enableRegistSatellite.value = true;
  if (item) {
    selectedSatelliteItem.value = item;
  } else {
    selectedSatelliteItem.value = { satelliteId: -1, satelliteName: "", userRegistered: false };
  }
}

/**
 * 衛星登録画面を閉じる
 */
function onCloseRegistSatellite() {
  enableRegistSatellite.value = false;
}

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
@import "./SelectControlledItemList.scss";
</style>
