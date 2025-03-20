<!-- モード選択 -->
<template>
  <v-select
    v-model="opeMode"
    :items="opeModeRange"
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

const OpeMode = Constant.SatSetting.OpeMode;
const opeModeRange = ref(Object.values(OpeMode));
opeModeRange.value.unshift("");
const opeMode = defineModel("opeMode");
</script>

<style lang="scss" scoped></style>
