<!-- 衛星グループ -->
<template>
  <v-dialog v-model="isShow" persistent max-width="500">
    <v-card theme="dark" outlined width="100%" height="100%" class="pa-3">
      <v-card-title class="headline" style="user-select: none">
        {{ I18nUtil.getMsg(I18nMsgs.G31_SATELLITE_GROUP) }}</v-card-title
      >
      <v-divider class="mb-4"></v-divider>
      <v-card-text>
        <div>
          <v-row>
            <!-- グループの追加入力 -->
            <v-col col="10">
              <TextField v-model="inputGroupName" />
            </v-col>
            <!-- グループ追加ボタン -->
            <v-col cols="2" class="d-flex flex-column align-center justify-center">
              <v-btn @click="addItem" variant="outlined" :disabled="!canAdd" size="small">
                {{ I18nUtil.getMsg(I18nMsgs.GCOM_ADD) }}
              </v-btn>
            </v-col>
          </v-row>

          <!-- グループリスト -->
          <v-row>
            <v-col cols="10">
              <VirtualScrollList
                style="overflow-y: auto"
                :items="satelliteGroupsLocal"
                :itemName="'groupName'"
                :itemKey="'groupKey'"
                :height="358"
                ref="listRef"
              ></VirtualScrollList>
              <!-- グループ名変更用ダイアログ -->
              <v-dialog v-model="isDialogShow" max-width="500">
                <v-card theme="dark" outlined width="100%" height="100%" class="pa-3">
                  <v-card-text>
                    <TextField
                      v-model="satelliteGroupsLocal[selectedItemIndex].groupName"
                      @keyup.enter="isDialogShow = false"
                    ></TextField>
                  </v-card-text>
                </v-card>
              </v-dialog>
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
                <v-btn icon @click="editItems" :disabled="!canEdit" variant="plain">
                  <v-icon size="30" :icon="mdiPencil"></v-icon>
                </v-btn>
                <v-btn icon @click="listRef?.deleteItem" :disabled="!canDelete" variant="plain">
                  <v-icon size="30" :icon="mdiDelete"></v-icon>
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="onOk" variant="outlined" size="large">{{ I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK) }}</v-btn>
        <v-btn @click="onCancel" variant="outlined" size="large" class="ml-5">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigSatelliteGroupForSatSetting } from "@/common/model/AppConfigSatelliteSettingModel";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import VirtualScrollList from "@/renderer/components/molecules/VirtualScrollList/VirtualScrollList.vue";
import { mdiArrowDownBold, mdiArrowUpBold, mdiDelete, mdiPencil } from "@mdi/js";
import { computed, onMounted, ref, toRaw } from "vue";

// ダイアログ表示用
const isShow = defineModel<boolean>("isShow", {
  default: false,
});
// グループ名編集用ダイアログ用
const isDialogShow = ref<boolean>(false);
// 衛星グループリスト
const satelliteGroups = defineModel<AppConfigSatelliteGroupForSatSetting[]>("satelliteGroups", { default: [] });
// 衛星グループリスト(画面内)
const satelliteGroupsLocal = ref<AppConfigSatelliteGroupForSatSetting[]>([]);
// リストの関数を使用するためのref
const listRef = ref<InstanceType<typeof VirtualScrollList> | null>(null);

// 入力するグループ名
const inputGroupName = ref<string>("");
// 親に通知用のイベント
const emits = defineEmits<{
  (e: "onOk", groups: AppConfigSatelliteGroupForSatSetting[]): void;
  (e: "onCancel"): void;
}>();

onMounted(() => {
  satelliteGroupsLocal.value = JSON.parse(JSON.stringify(toRaw(satelliteGroups.value)));
});

/**
 * アイテムを追加
 */
function addItem() {
  if (inputGroupName.value) {
    const newGroup = new AppConfigSatelliteGroupForSatSetting();
    newGroup.groupName = inputGroupName.value;
    satelliteGroupsLocal.value.push(newGroup);
    inputGroupName.value = "";
  }
}

/**
 * アイテムを編集
 */
function editItems() {
  if (listRef.value?.selectedItems[0]) {
    isDialogShow.value = true;
  }
}

/**
 * アイテム追加可能かを判断
 */
const canAdd = computed(() => {
  return inputGroupName.value.length > 0;
});

// 衛星リストから選択したアイテムのインデックス
const selectedItemIndex = computed(() => {
  return listRef.value?.selectedItemIndexes[0] ?? -1;
});

// 編集可能かどうか（条件はdeleteの共通の条件と同じ）
const canEdit = computed(() => {
  return listRef.value?.canDelete;
});

// 削除可能かどうか（この画面では1件未満にならないようにする）
const canDelete = computed(() => {
  return listRef.value?.canDelete && satelliteGroupsLocal.value.length > 1;
});

/**
 * Okボタン押下時の処理
 */
async function onOk() {
  const setSettingModel = await ApiAppConfig.getAppConfigSatSetting();

  // groupIDを採番する（初回作成の場合は１、既存データが存在する場合は＋１）
  const appGroups = [...setSettingModel.satelliteGroupsForSatSetting];
  let nextGroupId = 1;
  if (appGroups.length > 0) {
    nextGroupId = appGroups.reduce((acc, cur) => (acc.groupId > cur.groupId ? acc : cur)).groupId + 1;
  }

  satelliteGroupsLocal.value.forEach((groups) => {
    if (groups.groupId < 0) {
      groups.groupId = nextGroupId;
      nextGroupId += 1;
    }
  });

  // アクティブグループを消してしまったら一番最初に見つけたグループと衛星の組み合わせを設定する
  const activeSatelliteGroupId = appGroups.find(
    (group) => group.groupId === setSettingModel.mainDisplay.activeSatelliteGroupId
  );
  if (!activeSatelliteGroupId) {
    const headGroup = appGroups.find((group) => group.satellites.length > 0);
    if (headGroup) {
      setSettingModel.mainDisplay.activeSatelliteGroupId = headGroup.groupId;
      setSettingModel.mainDisplay.activeSatelliteId = headGroup.satellites[0].satelliteId;
    } else {
      setSettingModel.mainDisplay.activeSatelliteGroupId = -1;
      setSettingModel.mainDisplay.activeSatelliteId = -1;
    }
  }

  // 設定
  setSettingModel.satelliteGroupsForSatSetting = JSON.parse(JSON.stringify(toRaw(satelliteGroupsLocal.value)));

  // 保存
  ApiAppConfig.storeAppSatSettingConfig(setSettingModel);

  // 親に通知(ダイアログクローズ)
  emits("onOk", JSON.parse(JSON.stringify(toRaw(satelliteGroupsLocal.value))));
}

/**
 * ダイアログを閉じるボタンで閉じる
 */
async function onCancel() {
  // 親に通知(ダイアログクローズ)
  emits("onCancel");
}
</script>
<style lang="scss" scoped>
@import "./GroupSatellite.scss";
</style>
