<template>
  <l-marker :lat-lng="props.latlng">
    <l-icon :icon-size="imOptions.dynamicSize" :icon-anchor="imOptions.dynamicAnchor" :icon-url="props.iconUrl">
    </l-icon>
  </l-marker>
</template>

<script setup lang="ts">
import { LIcon, LMarker } from "@vue-leaflet/vue-leaflet";
import { useIconMarker } from "./useIconMarker";

type Props = {
  // プロパティの指定
  iconUrl: string;
  latlng: [number, number];
  iconSize: number;
};
const props = defineProps<Props>();

const { imOptions } = useIconMarker(props);
</script>
