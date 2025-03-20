<template>
  <v-select
    v-if="items.length > 0"
    v-model="selectedSatId"
    :items="items"
    density="compact"
    variant="outlined"
    hide-details
    class="sat_select"
    @update:modelValue="updateIndex"
  ></v-select>
</template>

<script setup lang="ts">
import { SelectOption } from "@/renderer/types/vue-types";
import { ref } from "vue";
import useSatelliteSelectBox from "./useSatelliteSelectBox";

// データ
const items = ref<SelectOption[]>([]);

// フック
const { selectedSatId, updateAppConfig } = useSatelliteSelectBox(items);

/**
 * indexを親コンポーネントに連携する
 * @param {string} satId 選択された衛星ID
 */
async function updateIndex(satId: string) {
  // アクティブ衛星をAppConifgに保存
  await updateAppConfig(satId);
}
</script>

<style lang="scss" scoped>
@import "./SatelliteSelectBox.scss";
</style>
