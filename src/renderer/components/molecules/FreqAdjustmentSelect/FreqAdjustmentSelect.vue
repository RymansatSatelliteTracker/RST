<template>
  <div class="freq_box">
    <span class="freq_sign">{{ sign === 1 ? "+" : "-" }}</span>
    <span
      v-for="(digit, index) in kHzDigits"
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
      v-for="(digit, index) in hzDigits"
      :key="index + kHzDigits.length"
      @wheel.passive="(event) => handleWheel(event, index + kHzDigits.length)"
      @contextmenu.prevent="() => handleRightClick(index + kHzDigits.length)"
      @click="handleClick(index + kHzDigits.length)"
      @mouseover="hoverIndex = index + kHzDigits.length"
      @mouseleave="hoverIndex = null"
      :class="{ hovered: hoverIndex === index + kHzDigits.length, grayed: isGrayed(index + kHzDigits.length) }"
    >
      {{ digit }}
    </span>
    <span class="freq_unit">Hz</span>
  </div>
</template>

<script setup lang="ts">
import useFrequencySelect from "./useFreqAdjustmentSelect";

// frequencyを取得する
const frequency = defineModel<string>("frequency", { required: true });

// フック
const { sign, kHzDigits, hzDigits, hoverIndex, onWheel, onRightClick, onClick, isGrayed } =
  useFrequencySelect(frequency);

// ホイールイベントの処理
function handleWheel(event: WheelEvent, index: number) {
  const newValue = onWheel(event, index);
  if (newValue !== null) {
    // 周波数更新
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
@import "./FreqAdjustmentSelect.scss";
</style>
