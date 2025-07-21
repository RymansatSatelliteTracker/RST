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
import Constant from "@/common/Constant";
import { ref } from "vue";
import createDopplerShiftLabelMapping from "./useDopplerShiftModeSelect";

const DopplerShiftMode = Constant.Transceiver.DopplerShiftMode;
// 和名のマッピング
const dopplerShiftModeLabel = createDopplerShiftLabelMapping();
// items配列を生成
const dopplerShiftModeRange = ref(
  Object.values(DopplerShiftMode).map((mode) => ({ value: mode, title: dopplerShiftModeLabel[mode] }))
);
const dopplerShiftMode = defineModel("dopplerShiftMode", { default: Constant.Transceiver.DopplerShiftMode.FIXED_SAT });
</script>

<style lang="scss" scoped></style>

