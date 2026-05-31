<template>
  <div>
    <l-map
      ref="map"
      v-model:zoom="zoom"
      :crs="L.CRS.EPSG4326"
      :use-global-leaflet="true"
      :center="groundStation"
      :options="{
        attributionControl: false,
        zoomControl: false,
        maxZoom: 6,
        minZoom: 1,
        dragging: true,
        worldCopyJump: false,
        maxBoundsViscosity: 1.0,
      }"
      :max-bounds="currentMaxBounds"
      @ready="onMapReady"
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
        v-if="tilePath"
        :url="`${tilePath}/{z}/{x}/{y}.jpg`"
        layer-type="base"
        :opacity="0.7"
        :tile-size="512"
        :tms="true"
      />

      <!-- 太陽の位置を描画 -->
      <sun-location :current-date="currentDate" :offset-longitude="offsetLongitude"></sun-location>
      <!-- 薄明曲線を描画 -->
      <twilight-curve :current-date="currentDate" :offset-longitude="offsetLongitude"></twilight-curve>

      <!-- 月の位置を描画 -->
      <moon :current-date="currentDate" :offset-longitude="offsetLongitude"></moon>

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
      <visibility-range :current-date="currentDate" :offset-longitude="offsetLongitude" />
      <!-- 人工衛星の軌道を描画 -->
      <orbit-line :current-date="currentDate" :zoom-level="zoom" />
      <!-- 人工衛星の位置を描画 -->
      <satellite-location :current-date="currentDate" :offset-longitude="offsetLongitude" />
    </l-map>
  </div>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant.js";
import CircleMarker from "@/renderer/components/atoms/CircleMarker/CircleMarker.vue";
import Moon from "@/renderer/components/organisms/Moon/Moon.vue";
import OrbitLine from "@/renderer/components/organisms/OrbitLine/OrbitLine.vue";
import SatelliteLocation from "@/renderer/components/organisms/Satellite/SatelliteLocation/SatelliteLocation.vue";
import VisibilityRange from "@/renderer/components/organisms/Satellite/VisibilityRange/VisibilityRange.vue";
import SunLocation from "@/renderer/components/organisms/Sun/SunLocation/SunLocation.vue";
import TwilightCurve from "@/renderer/components/organisms/Sun/TwilightCurve/TwilightCurve.vue";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { computed, ref, shallowRef, watch } from "vue";
import useMap from "./useMap.js";

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
// Mapインスタンス
const leafletMap = shallowRef<L.Map | null>(null);

// フック
// 人工衛星のAOSリストを取得する
const { groundStation, groundStation2, offsetLongitude, isGroundStation2Enable, tilePath } = useMap();

/**
 * 地図範囲外へのドラッグを制限する
 */
const currentMaxBounds = computed<L.LatLngBounds>(() => {
  return L.latLngBounds(
    L.latLng(
      groundStation.value[0] - (Constant.Display.LATITUDE_DRAG_RANGE_DEGREES + 90.0),
      groundStation.value[1] - (Constant.Display.LONGITUDE_DRAG_RANGE_DEGREES + 180.0)
    ),
    L.latLng(
      groundStation.value[0] + (Constant.Display.LATITUDE_DRAG_RANGE_DEGREES + 90.0),
      groundStation.value[1] + (Constant.Display.LONGITUDE_DRAG_RANGE_DEGREES + 180.0)
    )
  );
});

/**
 * Mapのreadyイベント
 * @param readyMap Mapインスタンス
 */
function onMapReady(readyMap?: L.Map) {
  if (!readyMap) {
    return;
  }

  // Mapインスタンスを更新する
  leafletMap.value = readyMap;
  // maxBoundsを更新する
  syncMapBounds();
  // 地図サイズを再計算する
  setTimeout(() => {
    leafletMap.value?.invalidateSize();
  }, 0);
}

/**
 * MapのmaxBoundsを地上局1(自局)位置に合わせて更新する
 */
function syncMapBounds() {
  if (!leafletMap.value) {
    return;
  }

  leafletMap.value.setMaxBounds(currentMaxBounds.value);
}

// propsの変更を監視して最新データを反映する
watch(
  () => props.currentDate,
  (newDate) => {
    currentDate.value = newDate;
  }
);
// 地上局1(自局)位置の変更を監視してドラッグ可能範囲を再設定する
watch(
  () => groundStation.value,
  () => {
    syncMapBounds();
  },
  { deep: true }
);
</script>

<style module lang="scss">
@use "@/renderer/components/styles/variables" as *;
</style>
