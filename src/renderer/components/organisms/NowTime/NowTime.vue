<template>
  <BoxLabel class="nowtime">{{
    DateUtil.formatDateTime(currentDate, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }}</BoxLabel>
</template>

<script setup lang="ts">
import BoxLabel from "@/renderer/components/molecules/BoxLabel/BoxLabel.vue";
import DateUtil from "@/renderer/util/DateUtil";
import { ref, watch } from "vue";

// propsを取得する
const props = defineProps({
  currentDate: {
    type: Date,
    required: true,
  },
});

// propsの変更を監視して最新データを反映する
const currentDate = ref<Date>(props.currentDate);
watch([() => props.currentDate], ([newDate]) => {
  currentDate.value = newDate;
});
</script>

<style lang="scss" scoped>
@import "./NowTime.scss";
</style>
