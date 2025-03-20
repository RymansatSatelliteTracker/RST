<template>
  <v-select
    v-model="selectedValue"
    :items="options"
    hide-details
    variant="outlined"
    density="compact"
    class="selectbox"
  />
</template>

<script setup lang="ts">
import { SelectOption } from "@/renderer/types/vue-types";

// 選択可能なボーレート
const BORATES = ["1200", "2400", "4800", "9600", "19200", "38400", "57600", "115200"];

const selectedValue = defineModel<string>("selectedValue", { required: true });
const needEmpty = defineModel<boolean>("needEmpty", { required: true });

// Select用のリストの作成
const options: SelectOption[] = [];
BORATES.forEach((item) => {
  options.push({ title: `${item} bps`, value: item });
});

// 先頭にブランクを追加
if (needEmpty.value) {
  options.unshift({ title: "", value: "" });
}
</script>

<style lang="scss" scoped></style>
