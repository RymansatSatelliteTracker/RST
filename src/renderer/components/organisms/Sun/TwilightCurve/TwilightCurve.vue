<template>
  <l-geo-json
    :geojson="twilightCurve"
    :options="{
      color: Constant.Astronomy.NIGHT_COLOR,
      weight: 0,
      fill: true,
      fillColor: Constant.Astronomy.NIGHT_COLOR,
      fillOpacity: 0.55,
      interactive: false,
      pane: 'mapPane',
    }"
  ></l-geo-json>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import { LGeoJson } from "@vue-leaflet/vue-leaflet";
import { ref, watch } from "vue";
import useTwilightCurve from "./useTwilightCurve";

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

// 薄明曲線を取得する
const { twilightCurve } = useTwilightCurve(currentDate, offsetLongitude);
</script>
