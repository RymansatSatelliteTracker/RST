<template>
  <icon-marker
    :iconUrl="sunIcon"
    :latlng="sunLocation"
    :iconSize="22"
    :options="{
      interactive: false,
    }"
  ></icon-marker>
</template>

<script setup lang="ts">
import sunIcon from "@/renderer/assets/sun.png";
import IconMarker from "@/renderer/components/atoms/IconMarker/IconMarker.vue";
import { ref, watch } from "vue";
import useSunLocation from "./useSunLocation";

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

// 太陽の緯度/経度を取得する
const { sunLocation } = useSunLocation(currentDate, offsetLongitude);
</script>
