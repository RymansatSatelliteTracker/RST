<!-- モード選択 -->
<template>
  <v-select
    v-model="dopplerShiftMode"
    :items="dopplerShiftModeRange"
    no-data-text=""
    density="compact"
    variant="outlined"
    hide-details
    class="selectbox"
  ></v-select>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant.js";
import { ref } from "vue";
import createDopplerShiftLabelMapping from "./useDopplerShiftModeSelect.js";

const DopplerShiftMode = Constant.Transceiver.DopplerShiftMode;
// 和名のマッピング
const dopplerShiftModeLabel = createDopplerShiftLabelMapping();
// items配列を生成
const dopplerShiftModeRange = ref(
  Object.values(DopplerShiftMode).map((mode: string) => ({
    value: mode,
    title: dopplerShiftModeLabel[mode],
  }))
);
const dopplerShiftMode = defineModel<string>("dopplerShiftMode", {
  default: Constant.Transceiver.DopplerShiftMode.FIXED_SAT,
});
</script>

<style lang="scss" scoped></style>
