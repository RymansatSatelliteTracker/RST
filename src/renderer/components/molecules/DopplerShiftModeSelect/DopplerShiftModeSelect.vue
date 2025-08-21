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
  Object.values(DopplerShiftMode).map((mode) => ({
    value: mode,
    title: dopplerShiftModeLabel[mode],
    // TODO: 受信固定、送信固定に対応するまでは衛星固定のみを有効化
    //       対応後は、以下のpropsは削除して良い
    props: { disabled: mode !== DopplerShiftMode.FIXED_SAT },
  }))
);
const dopplerShiftMode = defineModel("dopplerShiftMode", { default: Constant.Transceiver.DopplerShiftMode.FIXED_SAT });
</script>

<style lang="scss" scoped></style>

