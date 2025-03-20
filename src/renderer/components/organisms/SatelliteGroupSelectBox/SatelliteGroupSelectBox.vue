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
 * indexを親コンポーネントに連携する
 */
async function updateIndex(satGrpupId: string) {
  // アクティブ衛星グループをAppConifgに保存
  await updateAppConfig(satGrpupId);
}
</script>

<style lang="scss" scoped>
@import "./SatelliteGroupSelectBox.scss";
</style>
