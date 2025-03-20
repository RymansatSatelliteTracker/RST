<template>
  <v-select
    v-model="selectedValue"
    :items="transceiverMakers"
    hide-details
    variant="outlined"
    density="compact"
    class="selectbox"
  />
</template>

<script setup lang="ts">
import useTransceiverMakers from "./useTransceiverMakers";

const selectedValue = defineModel<string>("selectedValue", { required: true });
const needEmpty = defineModel<boolean>("needEmpty", { required: true });

// Select用リスト
const { transceiverMakers } = useTransceiverMakers(needEmpty.value);
</script>

<style lang="scss" scoped></style>
