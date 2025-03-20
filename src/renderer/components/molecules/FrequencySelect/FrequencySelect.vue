<template>
  <div class="freq_box">
    <span
      v-for="(digit, index) in digits"
      :key="index"
      @wheel.passive="(event) => handleWheel(event, index)"
      @contextmenu.prevent="() => handleRightClick(index)"
      @click="handleClick(index)"
      @mouseover="hoverIndex = index"
      @mouseleave="hoverIndex = null"
      :class="{ hovered: hoverIndex === index, grayed: isGrayed(index) }"
    >
      {{ digit }}
    </span>
    <span class="decimal_point">.</span>
    <span
      v-for="(digit, index) in decimalDigits"
      :key="index + digits.length"
      @wheel.passive="(event) => handleWheel(event, index + digits.length)"
      @contextmenu.prevent="() => handleRightClick(index + digits.length)"
      @click="handleClick(index + digits.length)"
      @mouseover="hoverIndex = index + digits.length"
      @mouseleave="hoverIndex = null"
      :class="{ hovered: hoverIndex === index + digits.length, grayed: isGrayed(index + digits.length) }"
    >
      {{ digit }}
    </span>
    <span class="freq_unit">MHz</span>
  </div>
</template>

<script setup lang="ts">
import TransceiverUtil from "@/common/util/TransceiverUtil";
import useFrequencySelect from "./useFrequencySelect";

// frequencyを取得する
const frequency = defineModel<string>("frequency", { required: true });
// 周波数の差分を取得する
const diffFrequency = defineModel<number>("diffFrequency", { required: true });

// フック
const { digits, decimalDigits, hoverIndex, onWheel, onRightClick, onClick, isGrayed } = useFrequencySelect(frequency);

// ホイールイベントの処理
function handleWheel(event: WheelEvent, index: number) {
  const newValue = onWheel(event, index);
  if (newValue !== null) {
    diffFrequency.value = TransceiverUtil.subtractFrequencies(Number(frequency.value), Number(newValue));
    frequency.value = newValue;
  }
}

// 右クリックイベントの処理
function handleRightClick(index: number) {
  const newValue = onRightClick(index);
  if (newValue !== null) {
    frequency.value = newValue;
  }
}

// 左クリックイベントの処理
function handleClick(index: number) {
  const newValue = onClick(index);
  if (newValue !== null) {
    frequency.value = newValue;
  }
}
</script>

<style lang="scss" scoped>
@import "./FrequencySelect.scss";
</style>
