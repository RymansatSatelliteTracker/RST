<!-- 衛星パス抽出最小仰角 -->
<template>
  <v-select
    v-model="satelliteChoiceMinEl"
    :items="minElevationRange"
    density="compact"
    variant="outlined"
    hide-details
    :suffix="I18nUtil.getMsg(I18nMsgs.GCOM_MINIMUM_DEGREE)"
    class="selectbox"
  ></v-select>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { ref, watch } from "vue";

// 選択範囲は0~85
const minElevationRange = ref(Array.from({ length: Constant.SatSetting.ELEVATION_RANGE_LENGTH }, (_, i) => i));
const satelliteChoiceMinEl = defineModel("satelliteChoiceMinEl");

// 衛星パス抽出最小仰角を更新する
watch(satelliteChoiceMinEl, async (newMinEl) => {
  await ActiveSatServiceHub.getInstance().updateSatChoiceMinEl(newMinEl as number);
});
</script>

<style lang="scss" scoped>
@import "./SatelliteChoiceMinElSelect.scss";
</style>
