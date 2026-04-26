<template>
  <v-dialog v-model="isShow" max-width="500">
    <v-card color="grey-darken-4" class="pa-4 dialog-height">
      <v-card-title>Frequency JSON Editor</v-card-title>
      <v-divider class="mb-4" />
      <v-card-text class="bg-grey-darken-4 custom-border pa-8 h-75">
        <frequency-editor-list v-model:satellites="frequencyModel.frequency.satellites"></frequency-editor-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" size="large" @click="onOk">{{ I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK) }}</v-btn>
        <v-btn variant="outlined" size="large" @click="isShow = false">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import { FrequencyModel } from "@/common/model/FrequencyModel";
import ApiFrequency from "@/renderer/api/ApiFrequency";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import FrequencyEditorList from "@/renderer/components/organisms/setting/SatelliteSetting/FrequencyEditor/FrequencyEditorList/FrequencyEditorList.vue";
import emitter from "@/renderer/util/EventBus";
import { ref, toRaw, watch } from "vue";

// ダイアログ表示用
const isShow = defineModel<boolean>("isShow", {
  default: false,
});

// 周波数設定情報
const frequencyModel = ref<FrequencyModel>(new FrequencyModel());

watch(isShow, async (show) => {
  if (!show) return;

  frequencyModel.value = await ApiFrequency.getRepoFrequency();
});

/**
 * 設定ボタン押下時の処理
 */
async function onOk() {
  const res = await ApiFrequency.storeRepoFrequency(toRaw(frequencyModel.value));
  if (!res.status) {
    if (res.message) emitter.emit("NOTICE_ERR", res.message.ja);
    return;
  }

  isShow.value = false;
}
</script>
<style lang="scss" scoped>
@import "@/renderer/components/styles/global.scss";
</style>
