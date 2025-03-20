<template>
  <div class="datetime-picker">
    <Button styleType="primary-transparent" :disabled="autoStore.isAutoMode()" class="now__btn" @click="setNow"
      >Now</Button
    >
    <div class="controls">
      <div class="control">
        <label>Week</label>
        <div class="adjusters">
          <div class="adjuster10" @wheel.passive="adjustDate($event, 'weeks', 10)">
            {{ deltaFormattedWeek10 }}
          </div>
          <div class="adjuster1" @wheel.passive="adjustDate($event, 'weeks', 1)">
            {{ deltaFormattedWeek1 }}
          </div>
        </div>
      </div>
      <span class="separator">:</span>
      <div class="control">
        <label>Day</label>
        <div class="adjusters">
          <div class="adjuster10" @wheel.passive="adjustDate($event, 'days', 10)">
            {{ deltaFormattedDate10 }}
          </div>
          <div class="adjuster1" @wheel.passive="adjustDate($event, 'days', 1)">
            {{ deltaFormattedDate1 }}
          </div>
        </div>
      </div>
      <span class="separator">:</span>
      <div class="control">
        <label>Hour</label>
        <div class="adjusters">
          <div class="adjuster10" @wheel.passive="adjustDate($event, 'hours', 10)">
            {{ deltaFormattedHours10 }}
          </div>
          <div class="adjuster1" @wheel.passive="adjustDate($event, 'hours', 1)">
            {{ deltaFormattedHours1 }}
          </div>
        </div>
      </div>
      <span class="separator">:</span>
      <div class="control">
        <label>Minute</label>
        <div class="adjusters">
          <div class="adjuster10" @wheel.passive="adjustDate($event, 'minutes', 10)">
            {{ deltaFormattedMinutes10 }}
          </div>
          <div class="adjuster1" @wheel.passive="adjustDate($event, 'minutes', 1)">
            {{ deltaFormattedMinutes1 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/renderer/components/atoms/Button/Button.vue";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { watch } from "vue";
import useDateTimePicker from "./useDateTimePicker";

// フック
const {
  adjustDate,
  setNow,
  deltaFormattedWeek10,
  deltaFormattedWeek1,
  deltaFormattedDate10,
  deltaFormattedDate1,
  deltaFormattedHours10,
  deltaFormattedHours1,
  deltaFormattedMinutes10,
  deltaFormattedMinutes1,
  targetDate,
} = useDateTimePicker();
const autoStore = useStoreAutoState();

// イベント
const emits = defineEmits(["date-change"]);

watch(targetDate, (newDate) => {
  emits("date-change", newDate);

  // // 基準時刻を設定
  // ActiveSatServiceHub.getInstance().setBaseDate(newDate);
});
</script>

<style lang="scss" scoped>
@import "./DateTimePicker.scss";
</style>
