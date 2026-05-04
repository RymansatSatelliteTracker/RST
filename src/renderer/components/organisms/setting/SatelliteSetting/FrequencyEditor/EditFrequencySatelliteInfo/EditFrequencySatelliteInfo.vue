<template>
  <SatelliteInfoEditorDialog
    v-model:isShow="isShow"
    v-model:form="form"
    v-model:errors="errors"
    v-model:title="satellite.satelliteName"
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
import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";
import SatelliteInfoEditorDialogForm from "@/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialogForm";
import SatelliteInfoEditorDialog from "@/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialog.vue";
import useSatelliteInfoEditorDialog from "@/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialog";
import { useSatelliteInfoEditorDialogValidate } from "@/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialogValidate";
import emitter from "@/renderer/util/EventBus";
import { ref, toRaw, watch } from "vue";

// ダイアログ表示用
const isShow = defineModel<boolean>("isShow", { default: false });
// 親からもらう編集中の衛星
const satellite = defineModel<DefaultSatelliteType>("satellite", { required: true });
// 親に通知用のイベント
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// フォーム
const form = ref<SatelliteInfoEditorDialogForm>(new SatelliteInfoEditorDialogForm());
// 画面を使って設定をしたかどうか
const manualEditFlg = ref<boolean>(false);
// NORAD ID編集可否
const editableNoradId = ref<boolean>(true);
// ダイアログを開いた時点のフォーム値（Reset用）
const originalForm = ref<SatelliteInfoEditorDialogForm | null>(null);
// マウント時やリセット時にwatchしないためのフラグ
let isWatched = true;

// 入力チェック関係
const { validateForm, errors } = useSatelliteInfoEditorDialogValidate(editableNoradId.value);
// ファイルから取得した値と画面フォームで構造を変換する関数
const { transformDefSatToForm, transformFormToRepoFrequencySatellite } = useSatelliteInfoEditorDialog();

watch(
  isShow,
  (show) => {
    if (!show) return;

    // 画面に設定する
    transformDefSatToForm(form.value, satellite.value);
    form.value.refSatelliteName = satellite.value.satelliteName;
    // ダイアログを開いた時点のフォーム値を保持する
    originalForm.value = structuredClone(toRaw(form.value));
    manualEditFlg.value = false;
    isWatched = false;
  },
  { immediate: true }
);

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
 * 入力内容をチェックし、編集中の衛星へ反映する
 */
async function onOk() {
  const result = await validateForm(form.value);
  if (!result) {
    const messages = Object.values(errors.value).filter((item) => item);
    if (messages.length > 0) emitter.emit(Constant.GlobalEvent.NOTICE_ERR, messages[0]);
    return;
  }

  transformFormToRepoFrequencySatellite(satellite.value, form.value);
  emits("onOk");
}

/**
 * ダイアログを閉じるボタンで閉じる
 */
async function onCancel() {
  emits("onCancel");
}

/**
 * リセットボタン押下時の処理
 * ダイアログを開いた時点の値に戻す
 */
async function onReset() {
  if (!originalForm.value) return;
  form.value = structuredClone(toRaw(originalForm.value));
  manualEditFlg.value = false;
  isWatched = false;
}
</script>
