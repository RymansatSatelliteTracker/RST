<template>
  <div class="container">
    <div class="menu_area">
      <Menu />
    </div>

    <!-- 左側 -->
    <div class="main_left">
      <!-- ヘッダ部 -->
      <div class="header_area">
        <span class="main_left_sat_area d-flex">
          <!-- 衛星グループリスト -->
          <SatelliteGroupSelectBox />
          <!-- 衛星リスト -->
          <SatelliteSelectBox />
        </span>

        <!-- AOS/LOS時刻 -->
        <Aos v-if="tleStrings.length > 0" class="main_left_aos" :currentDate="currentDate" />

        <!-- 時刻 -->
        <NowTime class="main_left_nowtime" :currentDate="currentDate" />
      </div>

      <!-- 地図 -->
      <Map class="main_left_map" :currentDate="currentDate" />

      <!-- レーダ -->
      <div class="main_left_radar">
        <Radar :currentDate="currentDate" />
      </div>
    </div>

    <!-- 右側 -->
    <div class="main_right">
      <TransceiverCtrl @date-update="currentDate = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Aos from "@/renderer/components/organisms/Aos/Aos.vue";
import Map from "@/renderer/components/organisms/Map/Map.vue";
import Menu from "@/renderer/components/organisms/Menu/Menu.vue";
import NowTime from "@/renderer/components/organisms/NowTime/NowTime.vue";
import Radar from "@/renderer/components/organisms/Radar/Radar.vue";
import TransceiverCtrl from "@/renderer/components/organisms/TransceiverCtrl/TransceiverCtrl.vue";
import { onMounted, ref } from "vue";
import SatelliteGroupSelectBox from "../../organisms/SatelliteGroupSelectBox/SatelliteGroupSelectBox.vue";
import SatelliteSelectBox from "../../organisms/SatelliteSelectBox/SatelliteSelectBox.vue";
import useHome from "./useHome";

// データ
// 各種計算に必要な日時を作成する
const currentDate = ref(new Date());

// フック
// 人工衛星のTLE文字列配列を取得する
const { init, tleStrings } = useHome();

onMounted(async () => {
  await init();
});
</script>

<style lang="scss" scoped>
@import "./Home.scss";
</style>
