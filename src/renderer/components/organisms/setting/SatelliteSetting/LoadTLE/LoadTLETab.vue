<!-- TLE読み込みタブ -->
<template>
  <v-sheet color="grey-darken-4" outlined width="100%" height="100%" class="pa-3">
    <v-row no-gutters>
      <v-col cols="11">
        <v-list bg-color="grey-darken-4" max-height="400px">
          <v-list-item v-for="(item, index) in items" :key="index" :class="{ 'selected-item': selectedItem === index }">
            <TleUrlEditableCheckbox
              v-model:enable="item.enable"
              v-model:url="item.url"
              @click="selectItem(index)"
              v-model:validSchema="validSchemaLoadTLETab"
              v-model:errorsTleUrl="errorsList[index]"
            ></TleUrlEditableCheckbox>
          </v-list-item>
        </v-list>
      </v-col>
      <v-col cols="1">
        <v-btn @click="addItem" variant="plain">
          <v-icon size="30" :icon="mdiPlusCircle"></v-icon>
        </v-btn>
        <v-btn @click="removeSelectedItem" :disabled="selectedItem === null" variant="plain">
          <v-icon size="30" :icon="mdiDelete"></v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-sheet>
</template>
<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTleUrl } from "@/common/model/AppConfigModel";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TleUrlEditableCheckbox from "@/renderer/components/molecules/TleUrlEditableCheckbox/TleUrlEditableCheckbox.vue";
import {
  getUrlofInvalidContents,
  isUpdated,
} from "@/renderer/components/organisms/setting/SatelliteSetting/LoadTLE/useLoadTLE";
import "@mdi/font/css/materialdesignicons.css";
import { mdiDelete, mdiPlusCircle } from "@mdi/js";
import { onMounted, ref } from "vue";
import { useLoadTLETabValidate, validSchemaLoadTLETab } from "./useLoadTLETabValidate";

// リストに表示するデータ
const items = defineModel<AppConfigTleUrl[]>("tleUrls", { default: [] });

// 選択されたアイテムのインデックス
const selectedItem = ref(null);

// 画面表示時の初期設定値
const initialItems: AppConfigTleUrl[] = [];

// 入力チェック関係
const { validateForm, errors } = useLoadTLETabValidate();

// TLEURLがリストなのでエラーメッセージ用のオブジェクトを新たに定義する
const errorsList = ref<{ [key: number]: string }>({});

onMounted(() => {
  // 画面表示時に設定が1件もない場合は一つ追加する
  if (items.value.length < 1) {
    addItem();
  }
  items.value.forEach((item) => {
    initialItems.push({ ...item });
  });
});

/**
 * 全フォームのバリデーションチェックを実行する
 * 親からOKボタン押下時に呼び出される
 * @return string OK:すべてのチェックが成功/一つ目のメッセージ:チェックが一つ以上失敗
 */
async function onOk(): Promise<string> {
  // URLの設定がない
  if (items.value.length === 0) return I18nUtil.getMsg(I18nMsgs.CHK_ERR_NO_URL);

  // バリデーションチェック
  for await (const item of items.value) {
    const result = await validateForm(item);
    if (!result) {
      // validateFormではerrorsの方に設定されるのでこちらからメッセージを取る
      const messages = Object.values(errors.value).filter((item) => item);
      // エラーなら必ず1件以上メッセージがある
      return messages[0];
    }
  }
  // 指定されたURLが有効か確認する
  if (isTLEUpdated()) {
    // 全てOKならOK、異常があればエラーメッセージを返す
    const message = await checkTleUrlAccessibility();
    return message;
  }
  return "OK";
}

/**
 * リストにアイテムを追加する
 */
function addItem() {
  items.value.push({ enable: false, url: "https://" });
}

/**
 * 選択されたアイテムを削除する
 */
function removeSelectedItem() {
  if (selectedItem.value !== null) {
    items.value.splice(selectedItem.value, 1);
    selectedItem.value = null; // 削除後に選択をクリア
  }
}

/**
 * 指定されたアイテムを選択する
 * @param index リスト内のインデックス
 */
function selectItem(index: any) {
  selectedItem.value = index;
}

/**
 * TLEのURLが更新されているか確認する
 * @return boolean true:更新されている/false:更新されていない
 */
function isTLEUpdated(): boolean {
  return isUpdated(initialItems, items.value);
}

/**
 * TLEのURLが正しいか確認する
 * @return string OK:すべてのチェックが成功/一つ目のメッセージ:チェックが一つ以上失敗
 */
async function checkTleUrlAccessibility(): Promise<string> {
  const invalidUrls = await getUrlofInvalidContents(initialItems, items.value);
  if (invalidUrls.length > 0) {
    // エラーメッセージを表示する
    return I18nUtil.getMsg(I18nMsgs.CHK_ERR_GET_TLE, invalidUrls[0].url);
  }
  return "OK";
}

// 外部に公開する
defineExpose({ onOk, isTLEUpdated });
</script>
<style lang="scss" scoped>
@import "./LoadTLETab.scss";
</style>
