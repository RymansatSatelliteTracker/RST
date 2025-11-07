<!-- AOS/LOSまでのカウントダウン表示 -->
<template>
  <BoxLabel v-if="overlapPassCountdown" class="aos">{{ CanvasUtil.formatNullValue(overlapPassCountdown) }}</BoxLabel>
  <BoxLabel v-else class="aos">{{ CanvasUtil.formatNullValue(passCountdown) }}</BoxLabel>
</template>

<script setup lang="ts">
import BoxLabel from "@/renderer/components/molecules/BoxLabel/BoxLabel.vue";
import CanvasUtil from "@/renderer/util/CanvasUtil";
import { ref, watch } from "vue";
import useAos from "./useAos";
import useOverlapAos from "./useOverlapAos";

// propsを取得する
const props = defineProps({
  currentDate: {
    type: Date,
    required: true,
  },
});

// propsの変更を監視して最新データを反映する
const currentDate = ref(props.currentDate);

watch(
  () => props.currentDate,
  (newDate) => {
    currentDate.value = newDate;
  }
);

// フック
// 人工衛星の直近のAOS/LOSまでの時間を取得する
const { passCountdown } = useAos(currentDate);
// 2か所の地上局から観測できる人工衛星の直近の重複するAOS/LOSまでの時間を取得する
const { overlapPassCountdown } = useOverlapAos(currentDate);
</script>

<style lang="scss" scoped>
@import "./Aos.scss";
</style>
