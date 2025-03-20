<!-- 確認ダイアログ-->
<template>
  <v-dialog v-model="isShow" persistent max-width="600">
    <v-card theme="dark" outlined width="100%" height="100%" class="pa-3">
      <v-card-title class="headline">{{ I18nUtil.getMsg(I18nMsgs.GCOM_CONFIRM) }}</v-card-title>
      <v-divider class="mb-4"></v-divider>
      <v-card-text>
        {{ message }}
      </v-card-text>
      <v-card-actions>
        <v-btn @click="handleConfirm(true)" variant="outlined" size="large">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK)
        }}</v-btn>
        <v-btn @click="handleConfirm(false)" variant="outlined" size="large" class="ml-5">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import emitter from "@/renderer/util/EventBus";
import { onMounted, ref } from "vue";

// ダイアログ表示用
const isShow = ref(false);
// メッセージ
const message = ref("");
// ダイアログ表示用のコールバック
let resolveCallback: ((result: boolean) => void) | null = null;

onMounted(() => {
  // Confirmメッセージのイベント受信時
  emitter.on(Constant.GlobalEvent.NOTICE_CONFIRM, ({ message: msg, resolve }) => {
    // メッセージ設定
    message.value = msg;
    // ダイアログ表示
    isShow.value = true;
    // コールバック設定
    resolveCallback = resolve;
  });
});

// 親に通知用のイベント
//const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();
const emits = defineEmits(["onConfirmOk", "onConfirmCancel", "update:isConfirmShow"]);

/**
 * ダイアログでボタンを押下したときの処理
 */
async function handleConfirm(result: boolean) {
  isShow.value = false;
  if (resolveCallback) {
    resolveCallback(result);
    resolveCallback = null; // メモリリーク防止
  }
}
</script>
<style lang="scss" scoped></style>
