<template>
  <l-circle-marker
    :lat-lng="cmOptions.position"
    :radius="cmOptions.markerOptions.radius"
    :fill="cmOptions.markerOptions.fill"
    :fillOpacity="cmOptions.markerOptions.fillOpacity"
    :fillColor="cmOptions.markerOptions.fillColor"
    :color="cmOptions.markerOptions.color"
    :weight="cmOptions.markerOptions.weight"
    :interactive="cmOptions.markerOptions.interactive"
    :pane="cmOptions.markerOptions.pane"
  ></l-circle-marker>
</template>

<script setup lang="ts">
import { LCircleMarker } from "@vue-leaflet/vue-leaflet";
import { useCircleMarker } from "./useCircleMarker";

type Props = {
  // プロパティの指定
  position: number[];
  radius: number;
  fill: boolean;
  fillColor?: string;
  color: string;
  weight?: number;
  interactive: boolean;
  pane?: string;
};
const props = defineProps<Props>();

const { cmOptions } = useCircleMarker(props);
</script>
