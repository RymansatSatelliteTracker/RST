<template>
  <v-select
    v-model="selectedSatGroupId"
    :items="items"
    item-disabled="disabled"
    density="compact"
    variant="outlined"
    hide-details
    class="sat_group_select"
    @update:modelValue="updateIndex"
  />
</template>

<script setup lang="ts">
import { SelectOption } from "@/renderer/types/vue-types";
import { ref } from "vue";
import useSatelliteGroupSelectBox from "./useSatelliteGroupSelectBox";

// データ
const items = ref<SelectOption[]>([]);

// フック
const { selectedSatGroupId, updateAppConfig } = useSatelliteGroupSelectBox(items);

/**
 * indexを親コンポーネントに連携す
 * @param {number} satGrpupId 選択された衛星ID
 */
async function updateIndex(satGrpupId: number) {
  // アクティブ衛星グループをAppConifgに保存
  await updateAppConfig(String(satGrpupId));
}
</script>

<style lang="scss" scoped>
@import "./SatelliteGroupSelectBox.scss";
</style>
