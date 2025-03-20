<template>
  <div class="radar_contents">
    <!-- アンテナ -->
    <div class="radar_body">
      <div class="radar_view">
        <!-- Manual/Auto -->
        <div>
          <Button
            styleType="primary-transparent"
            :loading="loadingAutoBtn"
            :class="{
              auto_btn_on: autoStore.rotatorAuto,
              auto_btn_off: !autoStore.rotatorAuto,
            }"
            @click="autoBtnClick"
            >Auto</Button
          >
        </div>

        <div class="radar_canvas" :style="STYLE_CANVAS" @dblclick="radarClick">
          <!-- レーダ -->
          <canvas ref="satRadarCanvasRef" :width="RADAR_RADIUS_PX * 2" :height="RADAR_RADIUS_PX * 2" />

          <!-- アンテナ向き -->
          <!-- ローテータが未接続の場合は表示しない（antennaPos === nullの場合は未接続） -->
          <canvas
            v-if="antennaPos"
            ref="antennaPosCanvasRef"
            :width="RADAR_RADIUS_PX * 2"
            :height="RADAR_RADIUS_PX * 2"
          />

          <!-- 衛星軌道 -->
          <canvas ref="passLineCanvasRef" :width="RADAR_RADIUS_PX * 2" :height="RADAR_RADIUS_PX * 2" />
        </div>

        <!-- 衛星位置 -->
        <!-- memo: ダブルクリックはレーダのダブルクリックとする（レーダの上にいるのでレーダでのダブルクリックイベントが発生しないので） -->
        <div class="sat_pos" :style="satPosStyle" @dblclick="radarClick">
          <div class="sat_pos_point" />
        </div>

        <!-- 東西南北 -->
        <div class="direction_north" :style="STYLE_NORTH">N</div>
        <div class="direction" :style="STYLE_EAST">E</div>
        <div class="direction" :style="STYLE_SOUTH">S</div>
        <div class="direction" :style="STYLE_WEST">W</div>
      </div>
    </div>

    <!-- 方位 -->
    <div class="current_pos_item">
      <div class="current_pos_item_az">Az: {{ antennaPos ? azimuthFormat(antennaPos) : "-" }}</div>
    </div>

    <!-- 仰角 -->
    <div class="current_pos_item">
      <div class="current_pos_item_el">El: {{ antennaPos ? elavationFormat(antennaPos) : "-" }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { ApiResponse } from "@/common/types/types";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import Button from "@/renderer/components/atoms/Button/Button.vue";
import useDrawAntennaPosition from "@/renderer/components/organisms/Radar/useDrawAntennaPosition";
import useDrawRadar from "@/renderer/components/organisms/Radar/useDrawRadar";
import useDrawSat from "@/renderer/components/organisms/Radar/useDrawSat";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { SatAzEl } from "@/renderer/types/satellite-type";
import emitter from "@/renderer/util/EventBus";
import { onMounted, Ref, ref, watch } from "vue";
import useAutoTracking from "./useAutoTracking";
import useCanvasPosToAntennaPos from "./useCanvasPosToAntennaPos";
import useDrawSatPass from "./useDrawSatPass";
import useTracking from "./useTracking";

// レーダの半径（px）
const RADAR_RADIUS_PX = 100;
// レーダの中心（px）
const RADAR_CENTER_PX = { x: RADAR_RADIUS_PX, y: RADAR_RADIUS_PX };
const RADAR_SIZE_PX = RADAR_RADIUS_PX * 2;

// 親からの受信データ
const props = defineProps({
  currentDate: {
    type: Date,
    required: true,
  },
});

// データ
const activeSatPos = ref<SatAzEl | null>(null);
const antennaPos = ref<SatAzEl>();
const currentDate = ref<Date>(props.currentDate);

// 描画系データ
const satRadarCanvasRef = ref<HTMLCanvasElement | null>(null);
const antennaPosCanvasRef = ref<HTMLCanvasElement | null>(null);
const passLineCanvasRef = ref<HTMLCanvasElement | null>(null);
// 東西南北の描画位置
const STYLE_NORTH = `top: -25px; left: ${RADAR_SIZE_PX / 2 - 6}px;`;
const STYLE_EAST = `top: ${RADAR_SIZE_PX / 2 - 8}px; left: ${RADAR_SIZE_PX + 6}px;`;
const STYLE_SOUTH = `top: ${RADAR_SIZE_PX + 2}px; left: ${RADAR_SIZE_PX / 2 - 5}px;`;
const STYLE_WEST = `top: ${RADAR_SIZE_PX / 2 - 8}px; left: -20px;`;
const STYLE_CANVAS = `height: ${RADAR_RADIUS_PX * 2}px; width: ${RADAR_RADIUS_PX * 2}px;`;

// 制御系データ
const loadingAutoBtn = ref(false);

// フック
// 衛星の軌跡、衛星位置関係
const { startTraking } = useTracking(activeSatPos, currentDate);
// 自動追尾関係
const { startAutoTracking, stopAutoTracking } = useAutoTracking(currentDate);
// 衛星位置の描画
const { satPosStyle } = useDrawSat(RADAR_RADIUS_PX, RADAR_CENTER_PX, activeSatPos);
// 軌道予測の線の描画
useDrawSatPass(passLineCanvasRef, RADAR_RADIUS_PX, RADAR_CENTER_PX, currentDate);
// レーダーの描画
useDrawRadar(satRadarCanvasRef, RADAR_RADIUS_PX, RADAR_CENTER_PX);
// アンテナ位置の描画
useDrawAntennaPosition(antennaPosCanvasRef, RADAR_RADIUS_PX, RADAR_CENTER_PX, antennaPos);
// レーダクリック時の座標変換
const { radarClick, destPosition } = useCanvasPosToAntennaPos(satRadarCanvasRef, RADAR_RADIUS_PX);
// AutoのOnOff管理
const autoStore = useStoreAutoState();

onMounted(() => {
  // 衛星位置の描画開始
  startTraking();

  // アンテナの位置変化を取得し、positionを更新する
  ApiAntennaTracking.onChangeAntennaPosition((res: ApiResponse<AntennaPositionModel>) => {
    if (!res.status) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
      return;
    }

    const pos = res.data;
    if (!pos) {
      antennaPos.value = undefined;
      return;
    }

    antennaPos.value = {
      az: pos.azimuth,
      el: pos.elevation,
    };
  });

  // ローテータのデバイスが切断された場合
  ApiAntennaTracking.onRoratorDisconnect(() => {
    // undefinedを設定することで、AZ、ELが"-"で表示される
    antennaPos.value = undefined;
  });
});

// 表示日時の更新を監視
watch([() => props.currentDate], ([newDate]) => {
  currentDate.value = newDate;
});

// レーダクリック時、メイン側へアンテナ位置の移動を指示
watch(destPosition as Ref<AntennaPositionModel>, (newValue: AntennaPositionModel) => {
  if (!newValue) {
    return;
  }

  // Auto中はアンテナ位置の変更は無効
  if (autoStore.rotatorAuto) {
    return;
  }

  // シリアライズ可能なオブジェクトにしてから渡す
  const pos = JSON.parse(JSON.stringify(newValue));
  ApiAntennaTracking.setAntennaPosition(pos);
});

/**
 * Autoボタンクリック
 */
async function autoBtnClick() {
  // Auto変更中はクリックを無視
  if (loadingAutoBtn.value) {
    return;
  }
  loadingAutoBtn.value = true;

  // 現在のAuto状態を反転させて、自動追尾の開始/終了を要求する
  const reqAuto = !autoStore.rotatorAuto;
  if (reqAuto) {
    await startAutoTracking();
  } else {
    stopAutoTracking();
  }

  loadingAutoBtn.value = false;
}

/**
 * 方位を表示書式に変換する
 */
function azimuthFormat(value: SatAzEl | undefined) {
  if (!value) return "-";
  if (value.az < 0 || value.el < 0) return "-";

  // Elevation > 90の場合はアンテナが反転しているので、Azimuth +180[deg]とする
  const azimuth = value.el > 90 ? value.az + 180 : value.az;
  return `${formatPosition(azimuth)}°`;
}

/**
 * 仰角を表示書式に変換する
 */
function elavationFormat(value: SatAzEl | undefined) {
  if (!value) return "-";
  if (value.az < 0 || value.el < 0) return "-";

  // Elevation > 90の場合はアンテナが反転しているので、Elevation - 90[deg]とする
  const elevation = value.el > 90 ? 180 - value.el : value.el;
  return `${formatPosition(elevation)}°`;
}

/**
 * 方位、仰角の表示書式に変換
 */
function formatPosition(value: number) {
  // Memo: 少数第一位まで表示 & '1.0'を'1'にならないようにする
  return (Math.round(value * 10) / 10).toFixed(1);
}
</script>

<style lang="scss" scoped>
@import "./Radar.scss";
</style>
