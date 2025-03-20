<template>
  <icon-marker
    :iconUrl="moonImg"
    :latlng="moonLocation"
    :iconSize="18"
    :options="{
      interactive: false,
    }"
  ></icon-marker>
  <icon-marker
    :iconUrl="moonAgeMaskImgs[moonAgeIdx]"
    :latlng="moonLocation"
    :iconSize="18"
    :options="{
      interactive: false,
    }"
  ></icon-marker>
</template>

<script setup lang="ts">
import moonImg from "@/renderer/assets/moon.png";
import moonAge0Img from "@/renderer/assets/moonAge/moonAge0.png";
import moonAge1Img from "@/renderer/assets/moonAge/moonAge1.png";
import moonAge10Img from "@/renderer/assets/moonAge/moonAge10.png";
import moonAge11Img from "@/renderer/assets/moonAge/moonAge11.png";
import moonAge12Img from "@/renderer/assets/moonAge/moonAge12.png";
import moonAge13Img from "@/renderer/assets/moonAge/moonAge13.png";
import moonAge14Img from "@/renderer/assets/moonAge/moonAge14.png";
import moonAge15Img from "@/renderer/assets/moonAge/moonAge15.png";
import moonAge16Img from "@/renderer/assets/moonAge/moonAge16.png";
import moonAge17Img from "@/renderer/assets/moonAge/moonAge17.png";
import moonAge18Img from "@/renderer/assets/moonAge/moonAge18.png";
import moonAge19Img from "@/renderer/assets/moonAge/moonAge19.png";
import moonAge2Img from "@/renderer/assets/moonAge/moonAge2.png";
import moonAge20Img from "@/renderer/assets/moonAge/moonAge20.png";
import moonAge21Img from "@/renderer/assets/moonAge/moonAge21.png";
import moonAge22Img from "@/renderer/assets/moonAge/moonAge22.png";
import moonAge23Img from "@/renderer/assets/moonAge/moonAge23.png";
import moonAge24Img from "@/renderer/assets/moonAge/moonAge24.png";
import moonAge25Img from "@/renderer/assets/moonAge/moonAge25.png";
import moonAge26Img from "@/renderer/assets/moonAge/moonAge26.png";
import moonAge27Img from "@/renderer/assets/moonAge/moonAge27.png";
import moonAge28Img from "@/renderer/assets/moonAge/moonAge28.png";
import moonAge29Img from "@/renderer/assets/moonAge/moonAge29.png";
import moonAge3Img from "@/renderer/assets/moonAge/moonAge3.png";
import moonAge4Img from "@/renderer/assets/moonAge/moonAge4.png";
import moonAge5Img from "@/renderer/assets/moonAge/moonAge5.png";
import moonAge6Img from "@/renderer/assets/moonAge/moonAge6.png";
import moonAge7Img from "@/renderer/assets/moonAge/moonAge7.png";
import moonAge8Img from "@/renderer/assets/moonAge/moonAge8.png";
import moonAge9Img from "@/renderer/assets/moonAge/moonAge9.png";
import IconMarker from "@/renderer/components/atoms/IconMarker/IconMarker.vue";
import { computed, ref, watch } from "vue";
import useMoon from "./useMoon";

// 月齢のマスク画像リスト
const moonAgeMaskImgs = ref<string[]>([
  moonAge0Img,
  moonAge1Img,
  moonAge2Img,
  moonAge3Img,
  moonAge4Img,
  moonAge5Img,
  moonAge6Img,
  moonAge7Img,
  moonAge8Img,
  moonAge9Img,
  moonAge10Img,
  moonAge11Img,
  moonAge12Img,
  moonAge13Img,
  moonAge14Img,
  moonAge15Img,
  moonAge16Img,
  moonAge17Img,
  moonAge18Img,
  moonAge19Img,
  moonAge20Img,
  moonAge21Img,
  moonAge22Img,
  moonAge23Img,
  moonAge24Img,
  moonAge25Img,
  moonAge26Img,
  moonAge27Img,
  moonAge28Img,
  moonAge29Img,
]);

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

// 月の緯度/経度、月齢を取得する
const { moonLocation, moonAge } = useMoon(currentDate, offsetLongitude);

// 月齢に基づいてアイコンリストのインデックスを算出する
const moonAgeIdx = computed(() => {
  return Math.round(moonAge.value) % 30;
});
</script>
