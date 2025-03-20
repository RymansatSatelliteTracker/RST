<template>
  <!-- 選択中のアクティブ衛星 -->
  <l-polygon
    :lat-lngs="visibilityRangeList"
    :options="{
      color: Constant.VisibilityRange.BORDER_COLOR,
      fill: true,
      fillColor: Constant.VisibilityRange.FILL_COLOR,
      weight: 1,
    }"
    :interactive="false"
    dashArray="false"
  ></l-polygon>

  <!-- その他の衛星（点線表示） -->
  <l-polygon
    :lat-lngs="visibilityDashRangeListRaw"
    :options="{
      color: Constant.VisibilityRange.BORDER_COLOR,
      fill: false,
      weight: 1,
    }"
    :interactive="false"
    dashArray="2 3"
  ></l-polygon>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import { LPolygon } from "@vue-leaflet/vue-leaflet";
import { ref, watch } from "vue";
import useVisibilityDashRange from "./useVisibilityDashRange";
import useVisibilityRange from "./useVisibilityRange";

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

// 選択中の人工衛星の可視範囲を取得する
const { visibilityRangeList } = useVisibilityRange(currentDate, offsetLongitude);
// 未選択の人工衛星の可視範囲を取得する
const { visibilityDashRangeList } = useVisibilityDashRange(currentDate, offsetLongitude);

// 軌道リストの[number, number][][] を any にキャストする
// memo: l-polygonのlat-lngsの型は、LatLngExpression[] であるが、
//       visibilityDashRangeListは座標リストが複数格納されている[number, number][][]のため、
//       l-polygonのlat-lngsにそのままでは渡せない。
//       以下で、anyにキャストしてしてl-polygonのlat-lngsに設定する。
//       また、l-polygonのlat-lngsは座標のリスト（１次元配列）であるが、複数の座標リストを渡すことになるが、問題なく動作する。
const visibilityDashRangeListRaw = ref<any>(visibilityDashRangeList);
</script>
