<template>
  <div class="container">
    <!-- Autoモードボタン -->
    <Button
      styleType="primary-transparent"
      :loading="loadingAutoBtn"
      :class="{ auto_btn_on: autoStore.tranceiverAuto, auto_btn_off: !autoStore.tranceiverAuto }"
      @click="autoBtnClick"
      >Auto</Button
    >
    <!-- ドップラーシフトモード-->
    <DopplerShiftModeSelect class="doppler_shift_mode_select" />

    <!-- 無線機・周波数 -->
    <fieldset class="fieldset_area">
      <legend class="item_group_legend">Frequency</legend>
      <div class="freq_area">
        <div>
          Tx<FrequencySelect class="freq_box" v-model:frequency="txFrequency" v-model:diffFrequency="diffTxFrequency"
            ><span class="freq_unit">Hz</span></FrequencySelect
          >
        </div>
      </div>
      <div class="freq_area">
        <div v-if="isSatelliteMode">
          Rx<FrequencySelect class="freq_box" v-model:frequency="rxFrequency" v-model:diffFrequency="diffRxFrequency"
            ><span class="freq_unit">Hz</span></FrequencySelect
          >
        </div>
        <div v-else>
          Rx<FrequencySelect class="freq_box" v-model:frequency="txFrequency" v-model:diffFrequency="diffRxFrequency"
            ><span class="freq_unit">Hz</span></FrequencySelect
          >
        </div>
      </div>
      <div class="beacon_btn_right">
        <Button class="beacon_btn" styleType="primary-transparent">Beacon</Button>
      </div>
    </fieldset>

    <!-- 無線機・モード -->
    <fieldset class="fieldset_area">
      <legend class="item_group_legend">Mode</legend>
      Tx<OpeModeSelect v-model="txOpeMode" />
      <br class="br_no_select" />
      Rx<OpeModeSelect v-model="rxOpeMode" />
      <br class="br_no_select" />

      <Button
        styleType="primary-transparent"
        :class="
          txOpeMode === Constant.Transceiver.OpeMode.USB || txOpeMode === Constant.Transceiver.OpeMode.LSB
            ? 'mode_btn_on'
            : 'mode_btn_off'
        "
        @click="
          modeBtnClick(
            txOpeMode === Constant.Transceiver.OpeMode.USB
              ? Constant.Transceiver.OpeMode.LSB
              : Constant.Transceiver.OpeMode.USB,
            true
          )
        "
        >{{ isTxUsbMode ? "USB" : "LSB"
        }}<span
          :class="
            txOpeMode === Constant.Transceiver.OpeMode.USB || txOpeMode === Constant.Transceiver.OpeMode.LSB
              ? 'grayed_out_on'
              : 'grayed_out_off'
          "
          >{{ isTxUsbMode ? "LSB" : "USB" }}</span
        >
      </Button>
      <Button
        styleType="primary-transparent"
        :class="txOpeMode === Constant.Transceiver.OpeMode.CW ? 'mode_btn_on' : 'mode_btn_off'"
        @click="modeBtnClick(Constant.Transceiver.OpeMode.CW, true)"
        >CW</Button
      >
      <br class="br_no_select" />
      <Button
        styleType="primary-transparent"
        :class="
          txOpeMode === Constant.Transceiver.OpeMode.AM || txOpeMode === Constant.Transceiver.OpeMode.FM
            ? 'mode_btn_on'
            : 'mode_btn_off'
        "
        @click="
          modeBtnClick(
            txOpeMode === Constant.Transceiver.OpeMode.FM
              ? Constant.Transceiver.OpeMode.AM
              : Constant.Transceiver.OpeMode.FM,
            true
          )
        "
      >
        {{ isTxAmMode ? "AM" : "FM"
        }}<span
          :class="
            txOpeMode === Constant.Transceiver.OpeMode.AM || txOpeMode === Constant.Transceiver.OpeMode.FM
              ? 'grayed_out_on'
              : 'grayed_out_off'
          "
          >{{ isTxAmMode ? "FM" : "AM" }}</span
        >
      </Button>
      <Button
        styleType="primary-transparent"
        :class="txOpeMode === Constant.Transceiver.OpeMode.DV ? 'mode_btn_on' : 'mode_btn_off'"
        @click="modeBtnClick(Constant.Transceiver.OpeMode.DV, true)"
        >DV</Button
      >
      <br class="br_no_select" />
      <Button
        styleType="primary-transparent"
        :class="isSatelliteMode === true ? 'sat_btn_on' : 'sat_btn_off'"
        @click="satBtnClick()"
        >Satellite</Button
      >
      <br class="br_no_select" />
      <Button
        styleType="primary-transparent"
        :disabled="!isSatelliteMode"
        :class="isSatTrackingModeNormal === true ? 'mode_btn_on' : 'mode_btn_off'"
        @click="satTrackingModeBtnClick(true)"
        >Normal</Button
      >
      <Button
        styleType="primary-transparent"
        :disabled="!isSatelliteMode"
        :class="isSatTrackingModeNormal === false ? 'mode_btn_on' : 'mode_btn_off'"
        @click="satTrackingModeBtnClick(false)"
        >Reverse</Button
      >
    </fieldset>

    <!-- AOSリスト -->
    <fieldset class="fieldset_area">
      <legend v-if="isGroundStation2Enable" class="item_2ground_mode">AOS List (2 Ground mode)</legend>

      <legend v-else class="item_group_legend">AOS List</legend>
      <table class="aos_table">
        <thead class="aos_header">
          <tr>
            <th>AOS</th>
            <th>MAXEL</th>
            <th>LOS</th>
            <th>Duration</th>
          </tr>
        </thead>

        <!-- 複数地上局の場合のAOSリスト -->
        <tbody v-if="isGroundStation2Enable" class="aos_body">
          <tr v-if="overlapPassList === null || overlapPassList.length === 0">
            <td colspan="4">{{ I18nUtil.getMsg(I18nMsgs.ERR_NO_OVERLAP_PASS) }}</td>
          </tr>
          <tr v-else v-for="item in overlapPassList" :key="item.maxEl?.date.getTime()">
            <td>
              {{ DateUtil.formatDateTime(item.aos?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ CanvasUtil.formatAngle(item.maxEl?.lookAngles.elevation) }}</td>
            <td>
              {{ DateUtil.formatDateTime(item.los?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ DateUtil.formatMsToHHMMSS(item.durationMs) }}</td>
          </tr>
        </tbody>

        <!-- 単一地上局の場合のAOSリスト -->
        <tbody v-else class="aos_body">
          <tr v-if="orbitalPassList === null || orbitalPassList.length === 0">
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
          </tr>
          <tr v-else v-for="item in orbitalPassList" :key="item.maxEl?.date.getTime()">
            <td>
              {{ DateUtil.formatDateTime(item.aos?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ CanvasUtil.formatAngle(item.maxEl?.lookAngles.elevation) }}</td>
            <td>
              {{ DateUtil.formatDateTime(item.los?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ DateUtil.formatMsToHHMMSS(item.durationMs) }}</td>
          </tr>
        </tbody>
      </table>
    </fieldset>

    <!-- 日時設定 -->
    <fieldset class="fieldset_area">
      <legend class="item_group_legend">Date Time</legend>
      <DateTimePicker @date-change="onDateChange" />
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import Button from "@/renderer/components/atoms/Button/Button.vue";
import DopplerShiftModeSelect from "@/renderer/components/molecules/DopplerShiftModeSelect/DopplerShiftModeSelect.vue";
import FrequencySelect from "@/renderer/components/molecules/FrequencySelect/FrequencySelect.vue";
import OpeModeSelect from "@/renderer/components/molecules/OpeModeSelect/OpeModeSelect.vue";
import DateTimePicker from "@/renderer/components/organisms/DateTimePicker/DateTimePicker.vue";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import CanvasUtil from "@/renderer/util/CanvasUtil";
import DateUtil from "@/renderer/util/DateUtil";
import { ref } from "vue";
import useOrbitalPassList from "./useOrbitalPassList";
import useOverlapPassList from "./useOverlapPassList";
import useTransceiverCtrl from "./useTransceiverCtrl";

// DateTimePickerからの設定日時を受け取る
const currentDate = ref<Date>(new Date());
// イベント
const emit = defineEmits(["date-update"]);
// Autoモードボタンのローディングフラグ
const loadingAutoBtn = ref<boolean>(false);

// フック
// 人工衛星のAOSリストを取得する
const { orbitalPassList } = useOrbitalPassList(currentDate);
// 重複する地上局から観測できるAOSリストを取得する
const { overlapPassList, isGroundStation2Enable } = useOverlapPassList(currentDate);
// 無線機周波数を取得する
const {
  startAutoMode,
  stopAutoMode,
  txFrequency,
  rxFrequency,
  diffTxFrequency,
  diffRxFrequency,
  txOpeMode,
  rxOpeMode,
  isTxUsbMode,
  isTxAmMode,
  isRxUsbMode,
  isRxAmMode,
  isSatelliteMode,
  isSatTrackingModeNormal,
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
    // Autoモード終了
    await stopAutoMode();
    autoStore.tranceiverAuto = false;
  }

  loadingAutoBtn.value = false;
}

/**
 * Modeボタンクリック
 */
async function modeBtnClick(btnmode: string, isTx: boolean) {
  if (isTx) {
    // TxのUSB/LSBモードの切り替え
    if (
      (txOpeMode.value === Constant.Transceiver.OpeMode.USB && btnmode === Constant.Transceiver.OpeMode.LSB) ||
      (txOpeMode.value === Constant.Transceiver.OpeMode.LSB && btnmode === Constant.Transceiver.OpeMode.USB)
    ) {
      isTxUsbMode.value = !isTxUsbMode.value;
    }
    if (btnmode === Constant.Transceiver.OpeMode.USB || btnmode === Constant.Transceiver.OpeMode.LSB) {
      if (!isTxUsbMode.value) {
        btnmode = Constant.Transceiver.OpeMode.LSB;
      }
    }

    // TxのAM/FMモードの切り替え
    if (
      (txOpeMode.value === Constant.Transceiver.OpeMode.AM && btnmode === Constant.Transceiver.OpeMode.FM) ||
      (txOpeMode.value === Constant.Transceiver.OpeMode.FM && btnmode === Constant.Transceiver.OpeMode.AM)
    ) {
      isTxAmMode.value = !isTxAmMode.value;
    }
    if (btnmode === Constant.Transceiver.OpeMode.AM || btnmode === Constant.Transceiver.OpeMode.FM) {
      if (!isTxAmMode.value) {
        btnmode = Constant.Transceiver.OpeMode.FM;
      }
    }
    txOpeMode.value = btnmode;
  } else {
    // RxのUSB/LSBモードの切り替え
    if (
      (rxOpeMode.value === Constant.Transceiver.OpeMode.USB && btnmode === Constant.Transceiver.OpeMode.LSB) ||
      (rxOpeMode.value === Constant.Transceiver.OpeMode.LSB && btnmode === Constant.Transceiver.OpeMode.USB)
    ) {
      isRxUsbMode.value = !isRxUsbMode.value;
    }
    if (btnmode === Constant.Transceiver.OpeMode.USB || btnmode === Constant.Transceiver.OpeMode.LSB) {
      if (!isRxUsbMode.value) {
        btnmode = Constant.Transceiver.OpeMode.LSB;
      }
    }

    // RxのAM/FMモードの切り替え
    if (
      (rxOpeMode.value === Constant.Transceiver.OpeMode.AM && btnmode === Constant.Transceiver.OpeMode.FM) ||
      (rxOpeMode.value === Constant.Transceiver.OpeMode.FM && btnmode === Constant.Transceiver.OpeMode.AM)
    ) {
      isRxAmMode.value = !isRxAmMode.value;
    }
    if (btnmode === Constant.Transceiver.OpeMode.AM || btnmode === Constant.Transceiver.OpeMode.FM) {
      if (!isRxAmMode.value) {
        btnmode = Constant.Transceiver.OpeMode.FM;
      }
    }
    rxOpeMode.value = btnmode;
  }
}

/**
 * Satelliteボタンクリック
 */
async function satBtnClick() {
  isSatelliteMode.value = !isSatelliteMode.value;
}

/**
 * SatTrackingModeボタンクリック
 */
async function satTrackingModeBtnClick(isNormal: boolean) {
  isSatTrackingModeNormal.value = isNormal;
}
</script>

<style lang="scss" scoped>
@import "./TransceiverCtrl.scss";
</style>
