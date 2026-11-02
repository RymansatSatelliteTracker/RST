<!-- 無線機運用モードSelectBox -->
<template>
  <v-select
    v-model="opeMode"
    :items="opeModeItems"
    item-title="title"
    item-value="value"
    no-data-text=""
    density="compact"
    variant="outlined"
    hide-details
    class="selectbox"
  >
    <!-- 選択後の表示は、機種ごとのラベル（例：USB-D(DIG)）ではなく、運用モード名（例：USB-D）のみとする（選択欄の幅が狭いため） -->
    <template #selection="{ item }">{{ item.value }}</template>
  </v-select>
</template>

<script setup lang="ts">
import OpeModeItemsUtil from "@/renderer/common/util/OpeModeItemsUtil.js";
import { computed } from "vue";
import useCurrentTransceiverDevice from "./useCurrentTransceiverDevice.js";

// 選択中の無線機の機種に応じて、選択肢（使用できる運用モード、表示ラベル）を切り替える
// memo: DVは画面上は選択できない。無線機が未設定の場合は、全ての運用モード（DVを除く）を選択できる。
const { currentDevice } = useCurrentTransceiverDevice();
const opeModeItems = computed(() => OpeModeItemsUtil.buildItems(currentDevice.value));
const opeMode = defineModel<string>("opeMode");
</script>

<style lang="scss" scoped></style>
