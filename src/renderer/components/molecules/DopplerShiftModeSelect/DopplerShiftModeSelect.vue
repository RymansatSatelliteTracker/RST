<!-- モード選択 -->
<template>
  <v-select
    v-model="dopplerShiftMode"
    :items="DopplerShiftModeRange"
    no-data-text=""
    density="compact"
    variant="outlined"
    hide-details
    class="selectbox"
  ></v-select>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import { ref } from "vue";
import createDopplerShiftLabelMapping from "./useDopplerShiftModeSelect";

const DopplerShiftMode = Constant.DopplerShiftMode;
// 和名のマッピング
const DopplerShiftModeLabel = createDopplerShiftLabelMapping();
// items配列を生成
const DopplerShiftModeRange = ref(
  Object.values(DopplerShiftMode).map((mode) => ({ value: mode, title: DopplerShiftModeLabel[mode] }))
);
const dopplerShiftMode = defineModel("dopplerShiftMode", { default: Constant.DopplerShiftMode.FIXED_SAT });
</script>

<style lang="scss" scoped></style>
