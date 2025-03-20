<template>
  <!-- 通常の軌道 -->
  <l-polyline
    ref="refPolylineNormal"
    :key="activeSatNoradId"
    :lat-lngs="orbitLineListRaw"
    :options="{ color: colorCode, weight: 1.5 }"
    :interactive="false"
    dashArray="null"
  ></l-polyline>

  <!-- 低高度の軌道（点線） -->
  <l-polyline
    ref="refPolylineDash"
    :key="activeSatNoradId"
    :lat-lngs="orbitDashLineListRaw"
    :options="{ color: colorCode, weight: 1.5 }"
    :interactive="false"
    dashArray="3 5"
  ></l-polyline>
</template>

<script setup lang="ts">
import CanvasUtil from "@/renderer/util/CanvasUtil";
import { LPolyline } from "@vue-leaflet/vue-leaflet";
import { computed, ref, watch } from "vue";
import useOrbitLineList from "./useOrbitLineList";

// propsを取得する
const props = defineProps({
  currentDate: { type: Date, required: true },
  zoomLevel: { type: Number, required: true },
});

// データ
const currentDate = ref<Date>(props.currentDate);
const colorCode = ref<string>(CanvasUtil.getSatelliteColorCode(0)); // 軌道の色の初期値は0で初期化しておく

// 制御系
const refPolylineNormal = ref<typeof LPolyline>();
const refPolylineDash = ref<typeof LPolyline>();
const zoomLevel = computed(() => props.zoomLevel);

watch(
  () => props.currentDate,
  (newDate) => {
    currentDate.value = newDate;
  }
);

// 人工衛星の軌道を取得する
const { orbitLineList, orbitDashLineList, activeSatNoradId } = useOrbitLineList(
  currentDate,
  colorCode,
  refPolylineNormal,
  refPolylineDash,
  zoomLevel
);

// 軌道リストの[number, number][][] を any にキャストする
// memo: l-polylineのlat-lngsの型は、LatLngExpression[] であるが、
//       orbitLineListは座標リストが複数格納されている[number, number][][]のため、l-polylineのlat-lngsにそのままでは渡せない。
//       以下で、anyにキャストしてしてl-polylineのlat-lngsに設定する。
//       また、l-polylineのlat-lngsは座標のリスト（１次元配列）であるが、複数の座標リストを渡すことになるが、問題なく動作する。
const orbitLineListRaw = ref<any>(orbitLineList);
const orbitDashLineListRaw = ref<any>(orbitDashLineList);
</script>
