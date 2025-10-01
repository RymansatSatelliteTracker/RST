<template>
  <div class="freq_box">
    <span
      v-for="(digit, index) in mHzDigits"
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
      v-for="(digit, index) in kHzDigits"
      :key="index + mHzDigits.length"
      @wheel.passive="(event) => handleWheel(event, index + mHzDigits.length)"
      @contextmenu.prevent="() => handleRightClick(index + mHzDigits.length)"
      @click="handleClick(index + mHzDigits.length)"
      @mouseover="hoverIndex = index + mHzDigits.length"
      @mouseleave="hoverIndex = null"
      :class="{ hovered: hoverIndex === index + mHzDigits.length, grayed: isGrayed(index + mHzDigits.length) }"
    >
      {{ digit }}
    </span>
    <span class="decimal_point">.</span>
    <span
      v-for="(digit, index) in hzDigits"
      :key="index + mHzDigits.length + kHzDigits.length"
      @wheel.passive="(event) => handleWheel(event, index + mHzDigits.length + kHzDigits.length)"
      @contextmenu.prevent="() => handleRightClick(index + mHzDigits.length + kHzDigits.length)"
      @click="handleClick(index + mHzDigits.length + kHzDigits.length)"
      @mouseover="hoverIndex = index + mHzDigits.length + kHzDigits.length"
      @mouseleave="hoverIndex = null"
      :class="{
        hovered: hoverIndex === index + mHzDigits.length + kHzDigits.length,
        grayed: isGrayed(index + mHzDigits.length + kHzDigits.length),
      }"
    >
      {{ digit }}
    </span>

    <span class="freq_unit">Hz</span>
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
const { mHzDigits, kHzDigits, hzDigits, hoverIndex, onWheel, onRightClick, onClick, isGrayed } =
  useFrequencySelect(frequency);

// ホイールイベントの処理
function handleWheel(event: WheelEvent, index: number) {
  const newValue = onWheel(event, index);
  if (newValue !== null) {
    // 数値化
    const numNewValue = TransceiverUtil.parseNumber(newValue);
    const numFreq = TransceiverUtil.parseNumber(frequency.value);
    // 差分を保持
    diffFrequency.value = TransceiverUtil.subtractFrequencies(numFreq, numNewValue);
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
@import "./FrequencySelect.scss";
</style>
