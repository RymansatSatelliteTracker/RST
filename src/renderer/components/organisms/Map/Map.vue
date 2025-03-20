<template>
  <div>
    <l-map
      ref="map"
      v-model:zoom="zoom"
      :use-global-leaflet="true"
      :center="groundStation"
      :options="{ attributionControl: false, zoomControl: false, maxZoom: 8.4, dragging: true }"
    >
      <!-- <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"></l-tile-layer> -->
      <!-- <l-tile-layer
        url="http://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/WMTS/tile/1.0.0/World_Topo_Map/default/default028mm/{z}/{y}/{x}.png"
        layer-type="base"
        style="default"
        tilematrixSet="default028mm"
      ></l-tile-layer> -->

      <!-- 地図 -->
      <l-tile-layer
        url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"
        layer-type="base"
        :opacity="0.7"
      />

      <!-- 太陽の位置を描画 -->
      <sun-location :currentDate="currentDate" :offsetLongitude="offsetLongitude"></sun-location>
      <!-- 薄明曲線を描画 -->
      <twilight-curve :currentDate="currentDate" :offsetLongitude="offsetLongitude"></twilight-curve>

      <!-- 月の位置を描画 -->
      <moon :currentDate="currentDate" :offsetLongitude="offsetLongitude"></moon>

      <!-- 地上局のマーカーを描画 -->
      <circle-marker
        :position="groundStation"
        :radius="Constant.Display.GROUNDSTATION_MARKER_RADIUS"
        :fill="false"
        :color="Constant.Display.GROUNDSTATION1_MARKER_COLOR"
        :interactive="false"
      />
      <circle-marker
        v-if="isGroundStation2Enable"
        :position="groundStation2"
        :radius="Constant.Display.GROUNDSTATION_MARKER_RADIUS"
        :fill="false"
        :color="Constant.Display.GROUNDSTATION2_MARKER_COLOR"
        :interactive="false"
      />

      <!-- 人工衛星の可視範囲を描画 -->
      <visibility-range :currentDate="currentDate" :offsetLongitude="offsetLongitude" />
      <!-- 人工衛星の軌道を描画 -->
      <orbit-line :currentDate="currentDate" :zoom-level="zoom" />
      <!-- 人工衛星の位置を描画 -->
      <satellite-location :currentDate="currentDate" :offsetLongitude="offsetLongitude" />
    </l-map>
  </div>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import CircleMarker from "@/renderer/components/atoms/CircleMarker/CircleMarker.vue";
import Moon from "@/renderer/components/organisms/Moon/Moon.vue";
import OrbitLine from "@/renderer/components/organisms/OrbitLine/OrbitLine.vue";
import SatelliteLocation from "@/renderer/components/organisms/Satellite/SatelliteLocation/SatelliteLocation.vue";
import VisibilityRange from "@/renderer/components/organisms/Satellite/VisibilityRange/VisibilityRange.vue";
import SunLocation from "@/renderer/components/organisms/Sun/SunLocation/SunLocation.vue";
import TwilightCurve from "@/renderer/components/organisms/Sun/TwilightCurve/TwilightCurve.vue";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { ref, watch } from "vue";
import useMap from "./useMap";

// propsを取得する
const props = defineProps({
  currentDate: {
    type: Date,
    required: true,
  },
});

// 現状固定値
const zoom = ref(2);
// データ
const currentDate = ref<Date>(props.currentDate);

// propsの変更を監視して最新データを反映する
watch(
  () => props.currentDate,
  (newDate) => {
    currentDate.value = newDate;
  }
);

// フック
// 人工衛星のAOSリストを取得する
const { groundStation, groundStation2, offsetLongitude, isGroundStation2Enable } = useMap();
</script>

<style module lang="scss">
@import "@/renderer/components/styles/variables.scss";
</style>
