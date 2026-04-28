<!-- 衛星情報編集 -->
<template>
  <SatelliteInfoEditorDialog
    v-model:isShow="isShow"
    v-model:form="form"
    v-model:errors="errors"
    v-model:title="selectedItem.satelliteName"
    v-model:manualEditFlg="manualEditFlg"
    :editableNoradId="editableNoradId"
    :showReset="true"
    @ok="onOk"
    @cancel="onCancel"
    @reset="onReset"
  />
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { DefaultSatelliteType, SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiAppConfigSatellite from "@/renderer/api/ApiAppConfigSatellite";
import ApiDefaultSatellite from "@/renderer/api/ApiDefaultSatellite";
import EditSatelliteInfoForm from "@/renderer/components/molecules/SatelliteInfoEditorDialog/EditSatelliteInfoForm";
import SatelliteInfoEditorDialog from "@/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialog.vue";
import useEditSatelliteInfo from "@/renderer/components/molecules/SatelliteInfoEditorDialog/useEditSatelliteInfo";
import { useEditSatelliteInfoValidate } from "@/renderer/components/molecules/SatelliteInfoEditorDialog/useEditSatelliteInfoValidate";
import emitter from "@/renderer/util/EventBus";
import { onMounted, ref, watch } from "vue";

// ダイアログ表示用
const isShow = defineModel<boolean>("isShow", {
  default: false,
});
// 親からもらう衛星識別情報
const selectedItem = defineModel<SatelliteIdentiferType>("selectedItem", {
  default: { satelliteId: -1, satelliteName: "", userRegistered: false, noradId: "" },
});
// 衛星追加用の親のグループ
const selectedGroupId = defineModel<number>("selectedGroupId", {
  default: Constant.SatSetting.DEFAULT_SATELLITE_GROUP_ID,
});
// 親に通知用のイベント
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();
// 画面を使って設定をしたかどうか
const manualEditFlg = ref<boolean>(false);
// NORAD ID編集可否
const editableNoradId = ref<boolean>(false);
// マウント時やリセット時にwatchしないためのフラグ
let isWatched = true;

// フォーム
const form = ref<EditSatelliteInfoForm>(new EditSatelliteInfoForm());
// 入力チェック関係
const { validateForm, errors } = useEditSatelliteInfoValidate(editableNoradId.value);
// ファイルから取得した値と画面フォームで構造を変換する関数
const { transformAppConfigToForm, transformDefSatToForm, transformFormToAppConfig } = useEditSatelliteInfo();

onMounted(async function () {
  // 衛星を取得
  const registedSatellite = await ApiAppConfigSatellite.getUserRegisteredAppConfigSatellite(
    selectedItem.value.satelliteId,
    selectedGroupId.value
  );
  // ユーザ登録されているか確認する
  const appConfigSatellite = await ApiAppConfigSatellite.getAppConfigSatellite(
    selectedItem.value.satelliteId,
    selectedGroupId.value
  );

  // 画面に設定する
  transformAppConfigToForm(form.value, registedSatellite);
  form.value.refSatelliteName = selectedItem.value.satelliteName;
  manualEditFlg.value = false;

  if (appConfigSatellite) {
    manualEditFlg.value = true;
  }
  isWatched = false;
});

// 画面入力をしたらマニュアル設定をONにする
// リセットするまでONのまま
watch(
  () => ({ ...form.value }),
  () => {
    if (isWatched) {
      manualEditFlg.value = true;
    } else {
      isWatched = true;
    }
  },
  { deep: true } // ここはdeepじゃないと反応しない
);

/**
 * Okボタン押下時の処理
 * 入力内容をチェックする
 * 入力内容に応じて、ユーザ設定を追加、更新、削除する
 */
async function onOk() {
  const result = await validateForm(form.value);
  if (!result) {
    const messages = Object.values(errors.value).filter((item) => item);
    if (messages.length > 0) emitter.emit(Constant.GlobalEvent.NOTICE_ERR, messages[0]);
    return;
  }

  const appConfig = await ApiAppConfig.getAppConfig();
  const formSatId = form.value.satelliteId;

  const index = appConfig.satellites.findIndex((sat) => {
    return sat.satelliteId === formSatId && sat.groupId === selectedGroupId.value;
  });

  if (index > -1) {
    // アプリケーション設定にあった場合
    // リセットを押してなければ(マニュアル設定がON)更新する
    // リセットを押していたら(マニュアル設定がOFF)削除する
    // 手動登録衛星の場合はsatellitesにTLEの情報とかがあるので更新とする
    const sat: AppConfigSatellite = appConfig.satellites[index];
    if (manualEditFlg.value || sat.userRegistered) {
      transformFormToAppConfig(sat, form.value);
      sat.groupId = selectedGroupId.value;
    } else {
      appConfig.satellites.splice(index, 1);
    }
  } else {
    // アプリケーション設定になければ新規追加
    const sat: AppConfigSatellite = new AppConfigSatellite();
    transformFormToAppConfig(sat, form.value);
    sat.groupId = selectedGroupId.value;
    appConfig.satellites.push(sat);
  }

  // 衛星名を変更したら親のリストに戻す
  selectedItem.value.satelliteName = form.value.editSatelliteName;
  // 保存
  await ApiAppConfig.storeAppConfig(appConfig);
  // 親に通知(ダイアログクローズ)
  emits("onOk");
}

/**
 * ダイアログを閉じるボタンで閉じる
 */
async function onCancel() {
  // 親に通知(ダイアログクローズ)
  emits("onCancel");
}

/**
 * リセットボタン押下時の処理
 * デフォルト衛星情報を設定してマニュアル設定をOFFにする
 */
async function onReset() {
  // デフォルト衛星情報を取得
  const defsat: DefaultSatelliteType = await ApiDefaultSatellite.getDefaultSatelliteBySatelliteId(
    selectedItem.value.satelliteId,
    false
  );
  if (defsat) {
    transformDefSatToForm(form.value, defsat);
  }
  manualEditFlg.value = false;
  isWatched = false;
}
</script>
