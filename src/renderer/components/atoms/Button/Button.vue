<template>
  <v-btn :class="btnClass" v-bind="$attrs">
    <template #loader>
      <v-progress-circular indeterminate size="20" />
      <span><slot /></span>
    </template>
    <span><slot /></span>
  </v-btn>
</template>

<script setup lang="ts">
import { ButtonColorType, useButton } from "./useButton";

type Props = {
  // スタイルの指定
  styleType: ButtonColorType;
};
const props = defineProps<Props>();

const { btnClass } = useButton(props);
</script>

<style module lang="scss" scoped>
@import "./Button.scss";
</style>
