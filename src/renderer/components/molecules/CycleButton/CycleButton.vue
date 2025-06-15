<!-- モード選択 -->
<template>
  <Button styleType="primary-transparent" :class="btnClass" @click="btnClick(mode)">
    {{ mainText }}<span :class="subTextClass">{{ subText }}</span>
  </Button>
</template>

<script setup lang="ts">
import Button from "@/renderer/components/atoms/Button/Button.vue";
import { ref, watch } from "vue";

const mode = defineModel("mode", { required: true, default: "" });
const modeRange = defineModel<string[]>("modeRange", { default: ["", ""], required: true });
const emit = defineEmits(["update:mode"]);

const mainText = ref<string>("");
const subText = ref<string>("");
const btnClass = ref<string>("btn_off");
const subTextClass = ref<string>("grayed_out_off");

function getNextMode(currentMode: string): string {
  const currentIndex = modeRange.value.indexOf(currentMode);
  const nextIndex = currentIndex + 1;
  return nextIndex < modeRange.value.length ? modeRange.value[nextIndex] : "";
}

watch(
  mode,
  () => {
    switch (mode.value) {
      case modeRange.value[0]:
        mainText.value = modeRange.value[0];
        subText.value = modeRange.value[1];
        btnClass.value = "btn_on";
        subTextClass.value = "grayed_out_on";
        break;
      case modeRange.value[1]:
        mainText.value = modeRange.value[1];
        subText.value = modeRange.value[0];
        btnClass.value = "btn_on";
        subTextClass.value = "grayed_out_on";
        break;
      default:
        mainText.value = modeRange.value[0];
        subText.value = modeRange.value[1];
        btnClass.value = "btn_off";
        subTextClass.value = "grayed_out_off";
        return;
    }
    emit("update:mode", mode.value);
  },
  { immediate: true }
);
/**
 * ボタンクリック
 */
async function btnClick(btnmode: string) {
  // 次のモードを取得する
  mode.value = getNextMode(btnmode);
}
</script>

<style lang="scss" scoped>
@import "./CycleButton.scss";
</style>
