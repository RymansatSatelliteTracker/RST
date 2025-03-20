<template>
  <v-select
    v-model="selectedValue"
    :items="rotatorMakers"
    hide-details
    variant="outlined"
    density="compact"
    class="selectbox"
  />
</template>

<script setup lang="ts">
import useRotatorMakers from "./useRotatorMakers";

const selectedValue = defineModel<string>("selectedValue", { required: true });
const needEmpty = defineModel<boolean>("needEmpty", { required: true });

// Select用リスト
const { rotatorMakers } = useRotatorMakers(needEmpty.value);
</script>

<style lang="scss" scoped></style>
