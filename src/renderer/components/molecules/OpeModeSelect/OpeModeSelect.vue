<!-- モード選択 -->
<template>
  <v-select
    v-model="opeMode"
    :items="opeModeRange"
    item-title="title"
    item-value="value"
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

const OpeMode = Constant.Transceiver.OpeMode;
// DVは画面上は選択できない
// UNSETは画面上空白とする
const opeModeRange = ref(
  Object.values(OpeMode)
    .filter((mode) => mode !== Constant.Transceiver.OpeMode.DV)
    .map((mode) => ({
      value: mode,
      title: mode === Constant.Transceiver.OpeMode.UNSET ? "" : mode,
    }))
);
const opeMode = defineModel("opeMode");
</script>

<style lang="scss" scoped></style>
