<template>
  <!-- 左側 -->
  <v-row>
    <v-col cols="6">
      <div>
        <!-- 周波数設定インターバル -->
        <div class="d-flex">
          <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G41_AUTO_INTERVAL) }}</label>
          <div class="form_select ml-2">
            <v-select
              v-model="form.autoTrackingIntervalSec"
              :items="autoTrackingIntervalSecOptions"
              hide-details
              variant="outlined"
              density="compact"
              class="selectbox"
            />
          </div>
        </div>
        <!-- 自動追尾準備・終了時間 -->
        <div class="d-flex">
          <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G41_AUTOTRACK_TIME) }}</label>
          <div class="form_select ml-2">
            <v-select
              v-model="form.autoTrackingStartEndTime"
              :items="autoTrackingStartEndTimeOptions"
              hide-details
              variant="outlined"
              density="compact"
              class="selectbox"
            />
          </div>
        </div>
      </div>
    </v-col>

    <!-- 右側（ダミー） -->
    <v-col cols="6" />
  </v-row>
</template>

<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TransceiverBegaviorForm from "./TransceiverBegaviorForm";

// 親との送受信
const form = defineModel<TransceiverBegaviorForm>("form", { required: true });

// データ関係
const autoTrackingIntervalSecOptions = ["0.1", "0.5", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((item) => {
  return { title: `${item} sec`, value: item };
});
const autoTrackingStartEndTimeOptions = Array.from({ length: 15 }, (_, i) => String(i + 1)).map((item) => {
  return { title: `${item} min`, value: item };
});
</script>

<style lang="scss" scoped>
@import "./TransceiverBegavior.scss";
</style>
