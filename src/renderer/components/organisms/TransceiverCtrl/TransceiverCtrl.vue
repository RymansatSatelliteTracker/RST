<template>
  <div class="container">
    <!-- Autoモードボタン -->
    <Button
      style-type="primary-transparent"
      :loading="loadingAutoBtn"
      :class="{ auto_btn_on: autoStore.tranceiverAuto, auto_btn_off: !autoStore.tranceiverAuto }"
      @click="autoBtnClick"
      >Auto</Button
    >

    <!-- 無線機・周波数 -->
    <fieldset class="fieldset_area">
      <legend class="item_group_legend">Frequency</legend>
      <!-- ドップラーシフトモード-->
      <div class="doppler_area">
        <DopplerShiftModeSelect v-model="dopplerShiftMode" class="doppler_shift_mode_select" />
      </div>
      <!-- 周波数 -->
      <div class="freq_area">
        <div>
          <span :class="isRxActive ? 'freq_label_active' : 'freq_label_inactive'">Rx</span>
          <FrequencySelect v-model:frequency="rxFrequency" v-model:diff-frequency="diffRxFrequency" class="freq_box">
            <span class="freq_unit">Hz</span>
          </FrequencySelect>
        </div>
      </div>
      <div class="freq_area_sub">
        <div>
          <FreqAdjustmentSelect v-model:frequency="rxFrequencyAdjustment" class="freq_box_sub"></FreqAdjustmentSelect>
        </div>
      </div>
      <div class="freq_area">
        <div>
          <span :class="isTxActive ? 'freq_label_active' : 'freq_label_inactive'">Tx</span>
          <FrequencySelect v-model:frequency="txFrequency" v-model:diff-frequency="diffTxFrequency" class="freq_box">
            <span class="freq_unit">Hz</span>
          </FrequencySelect>
        </div>
      </div>
      <div class="freq_area_sub">
        <div>
          <FreqAdjustmentSelect v-model:frequency="txFrequencyAdjustment" class="freq_box_sub"></FreqAdjustmentSelect>
        </div>
      </div>

      <!-- ビーコン -->
      <div class="beacon_btn_right">
        <Button
          class="beacon_btn"
          style-type="primary-transparent"
          :class="isBeaconMode ? 'mode_btn_on' : 'mode_btn_off'"
          :disabled="!isBeaconModeAvailable"
          @click="beaconBtnClick()"
          >Beacon</Button
        >
      </div>
    </fieldset>

    <!-- 無線機・モード -->
    <fieldset class="fieldset_area">
      <legend class="item_group_legend">Mode</legend>
      <div class="mode_area">
        <div><span class="mode_label">Rx</span><OpeModeSelect v-model="rxOpeMode" class="mode_select_box" /></div>
      </div>
      <br class="br_no_select" />
      <div class="mode_area">
        <div><span class="mode_label">Tx</span><OpeModeSelect v-model="txOpeMode" class="mode_select_box" /></div>
      </div>
      <br class="br_no_select" />

      <!-- Satelliteモード -->
      <CycleButton
        v-model:mode="satelliteMode"
        class="sat_btn"
        :mode-range="[Constant.Transceiver.SatelliteMode.SATELLITE, Constant.Transceiver.SatelliteMode.SPLIT]"
      ></CycleButton>
      <br class="br_no_select" />
      <Button
        style-type="primary-transparent"
        :disabled="satelliteMode !== Constant.Transceiver.SatelliteMode.SATELLITE"
        :class="isSatTrackingModeNormal === true ? 'mode_btn_on' : 'mode_btn_off'"
        @click="satTrackingModeBtnClick(true)"
        >Normal</Button
      >
      <Button
        style-type="primary-transparent"
        :disabled="satelliteMode !== Constant.Transceiver.SatelliteMode.SATELLITE"
        :class="isSatTrackingModeNormal === false ? 'mode_btn_on' : 'mode_btn_off'"
        @click="satTrackingModeBtnClick(false)"
        >Reverse</Button
      >
    </fieldset>

    <!-- 日時設定 -->
    <fieldset class="fieldset_area">
      <legend class="item_group_legend">Date Time</legend>
      <DateTimePicker @date-change="onDateChange" />
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import Button from "@/renderer/components/atoms/Button/Button.vue";
import CycleButton from "@/renderer/components/molecules/CycleButton/CycleButton.vue";
import DopplerShiftModeSelect from "@/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue";
import FreqAdjustmentSelect from "@/renderer/components/molecules/FreqAdjustmentSelect/FreqAdjustmentSelect.vue";
import FrequencySelect from "@/renderer/components/molecules/FrequencySelect/FrequencySelect.vue";
import OpeModeSelect from "@/renderer/components/molecules/OpeModeSelect/OpeModeSelect.vue";
import DateTimePicker from "@/renderer/components/organisms/DateTimePicker/DateTimePicker.vue";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState.js";
import emitter from "@/renderer/util/EventBus.js";
import { computed, ref, watch } from "vue";
import useTransceiverCtrl from "./useTransceiverCtrl.js";

// DateTimePickerからの設定日時を受け取る
const currentDate = ref<Date>(new Date());
// イベント
const emit = defineEmits(["date-update"]);
// Autoモードボタンのローディングフラグ
const loadingAutoBtn = ref<boolean>(false);

// フック
// 無線機周波数を取得する
const {
  startAutoMode,
  stopAutoMode,
  txFrequency,
  rxFrequency,
  diffTxFrequency,
  diffRxFrequency,
  txFrequencyAdjustment,
  rxFrequencyAdjustment,
  txOpeMode,
  rxOpeMode,
  satelliteMode,
  isSatTrackingModeNormal,
  isBeaconMode,
  isBeaconModeAvailable,
  dopplerShiftMode,
  execTxDopplerShiftCorrection,
  execRxDopplerShiftCorrection,
} = useTransceiverCtrl(currentDate);
// AutoモードのOnOff管理
const autoStore = useStoreAutoState();

/**
 * 基準日時の変更イベントハンドラ
 */
function onDateChange(newDate: Date) {
  currentDate.value = newDate;
  emit("date-update", newDate);
}

/**
 * Autoボタンクリック
 */
async function autoBtnClick() {
  // Auto変更中はクリックを無視する
  if (loadingAutoBtn.value) {
    return;
  }
  loadingAutoBtn.value = true;

  // 現在のAuto状態を反転させて、Autoモードの開始/終了を要求する
  const auto = !autoStore.tranceiverAuto;
  if (auto) {
    // Autoモード開始
    const result = await startAutoMode();
    // 開始の結果をストアに反映（開始できなかった場合はfalseが返ってくる）
    autoStore.tranceiverAuto = result;
  } else {
    // ビーコンモードをOFFにする
    isBeaconMode.value = false;
    // Autoモード終了
    await stopAutoMode();
    autoStore.tranceiverAuto = false;
  }

  loadingAutoBtn.value = false;
}

/**
 * SatTrackingModeボタンクリック
 */
function satTrackingModeBtnClick(isNormal: boolean) {
  isSatTrackingModeNormal.value = isNormal;
}

/**
 * ビーコンボタンクリック
 */
function beaconBtnClick() {
  isBeaconMode.value = !isBeaconMode.value;
  // TODO: ビーコンモードを実装したら削除する
  if (isBeaconMode.value) {
    emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.NOTICE_UNDER_DEVELOPMENT));
  }
}

/**
 * Rxのラベルをアクティブにするかどうか
 */
const isRxActive = computed(() => {
  return execRxDopplerShiftCorrection.value && autoStore.tranceiverAuto;
});

/**
 * Txのラベルをアクティブにするかどうか
 */
const isTxActive = computed(() => {
  return execTxDopplerShiftCorrection.value && autoStore.tranceiverAuto;
});

/**
 * 無線機のAutoモードの状態を監視
 */
watch(
  () => autoStore.tranceiverAuto,
  async (newVal, oldVal) => {
    // AutoOn(true) から AutoOff(false) になった場合
    if (oldVal && !newVal) {
      // ビーコンモードをOFFにする
      isBeaconMode.value = false;
      // Autoモードを停止
      await stopAutoMode();
    }
  }
);
</script>

<style lang="scss" scoped>
@use "./TransceiverCtrl" as *;
</style>
