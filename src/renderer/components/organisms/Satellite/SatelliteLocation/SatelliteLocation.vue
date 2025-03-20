<template>
  <template v-for="([satIndex, position], index) in satelliteLocation" :key="satIndex">
    <circle-marker
      v-if="position && position[0] && position[1]"
      :key="satIndex"
      :position="position"
      :radius="Constant.Display.SATELLITE_MARKER_RADIUS"
      :fill="true"
      :fill-color="CanvasUtil.getSatelliteColorCode(index)"
      :color="Constant.Display.SATELLITE_MARKER_BORDER_COLOR"
      :weight="1.0"
      :interactive="true"
      :pane="'markerPane'"
      @click="handleClick(index)"
    ></circle-marker>
  </template>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import CircleMarker from "@/renderer/components/atoms/CircleMarker/CircleMarker.vue";
import CanvasUtil from "@/renderer/util/CanvasUtil";
import { ref, watch } from "vue";
import useSatelliteLocation from "./useSatelliteLocation";

// propsを取得する
const props = defineProps({
  currentDate: {
    type: Date,
    required: true,
  },
  offsetLongitude: {
    type: Number,
    required: true,
  },
});

// propsの変更を監視して最新データを反映する
const currentDate = ref<Date>(props.currentDate);
const offsetLongitude = ref<number>(props.offsetLongitude);
watch([() => props.currentDate, () => props.offsetLongitude], ([newDate, newOffset]) => {
  currentDate.value = newDate;
  offsetLongitude.value = newOffset;
});

// 人工衛星の位置を取得する
const { satelliteLocation, updateAppConfig } = useSatelliteLocation(currentDate, offsetLongitude);

/**
 * indexを親コンポーネントに連携する
 * @param {number} index index
 */
const handleClick = (index: number) => {
  // 選択された衛星をアクティブ衛星として更新する
  updateAppConfig(index);
};
</script>
