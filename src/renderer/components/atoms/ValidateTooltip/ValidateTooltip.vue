<template>
  <v-tooltip
    v-if="!CommonUtil.isEmpty(props.target)"
    :model-value="!CommonUtil.isEmpty(props.target)"
    :text="props.target"
    location="bottom start"
    activator="parent"
    content-class="tooltip"
  />
</template>

<script setup lang="ts">
import CommonUtil from "@/common/CommonUtil";

const props = defineProps({
  target: {
    type: String,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
@import "./ValidateTooltip.scss";
</style>
