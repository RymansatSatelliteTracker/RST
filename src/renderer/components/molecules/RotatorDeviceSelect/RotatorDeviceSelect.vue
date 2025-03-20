<template>
  <v-select
    v-model="selectedValue"
    :items="rotatorDevices"
    no-data-text=""
    hide-details
    variant="outlined"
    density="compact"
    class="selectbox"
  />
</template>

<script setup lang="ts">
import useRotatorDevices from "./useRotatorDevices";

const selectedValue = defineModel<string>("selectedValue", { required: true });
const makerId = defineModel<string>("makerId", { required: true });
const needEmpty = defineModel<boolean>("needEmpty", { required: true });

// Select用リスト
const { rotatorDevices } = useRotatorDevices(makerId, selectedValue, needEmpty.value);
</script>

<style lang="scss" scoped></style>
