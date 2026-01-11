<!-- トーン周波数SelectBox -->
<template>
  <v-select
    v-model="toneFrequency"
    :items="items"
    item-title="title"
    item-value="value"
    no-data-text=""
    density="compact"
    variant="outlined"
    hide-details
    suffix="Hz"
    class="selectbox"
  ></v-select>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import { ref } from "vue";

// 指定なしを選択可能にする
// 単純にToneFrequencyを表示すると60.0のような場合に小数点以下が表示されない
// タイトルも生成してあげる
// 配列を一度だけ生成してキャッシュ
const items = ref([
  { title: "", value: null },
  ...Constant.Transceiver.ToneFrequency.map((freq) => ({
    title: freq.toFixed(1),
    value: freq,
  })),
]);
const toneFrequency = defineModel<number | null>("toneFrequency");
</script>

<style lang="scss" scoped></style>
