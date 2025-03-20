<template>
  <v-select
    v-model="selectedValue"
    :items="transceiverDevices"
    no-data-text=""
    hide-details
    variant="outlined"
    density="compact"
    class="selectbox"
  />
</template>

<script setup lang="ts">
import useTransceiverDevices from "./useTransceiverDevices";

const selectedValue = defineModel<string>("selectedValue", { required: true });
const makerId = defineModel<string>("makerId", { required: true });
const needEmpty = defineModel<boolean>("needEmpty", { required: true });

// Select用リスト
const { transceiverDevices } = useTransceiverDevices(makerId, selectedValue, needEmpty.value);
</script>

<style lang="scss" scoped></style>
