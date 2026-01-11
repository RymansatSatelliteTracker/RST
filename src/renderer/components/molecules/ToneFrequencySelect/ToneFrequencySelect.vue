<!-- トーン周波数SelectBox -->
<template>
  <v-select
    v-model="toneFrequency"
    :items="ToneFrequencyRange"
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

// 指定なしを選択可能にする
const ToneFrequencyRange = [null, ...Constant.Transceiver.ToneFrequency];
const toneFrequency = defineModel<number>("toneFrequency");
</script>

<style lang="scss" scoped></style>
