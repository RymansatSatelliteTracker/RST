<template>
  <v-dialog v-model="isShow" persistent max-width="600">
    <v-card theme="dark" outlined width="100%" height="100%" class="pa-3">
      <v-card-title class="headline" style="user-select: none">{{ title }}</v-card-title>
      <v-divider class="mb-4"></v-divider>
      <v-card-text>
        <v-row>
          <v-col cols="10">
            <v-btn
              variant="outlined"
              size="small"
              class="mr-0"
              :color="manualEditFlg ? 'success' : 'grey'"
              :readonly="true"
            >
              {{ I18nUtil.getMsg(I18nMsgs.G31_MANUAL_SET) }}
            </v-btn>
          </v-col>

          <v-col cols="2" v-if="showReset">
            <v-btn variant="outlined" size="small" class="mr-0" @click="emits('reset')">
              {{ I18nUtil.getMsg(I18nMsgs.GCOM_RESET) }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <!-- 国際呼称 -->
          <v-col cols="2">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_INTERNATIONAL_NAME) }}</label>
          </v-col>
          <v-col cols="5">
            <label class="label form__label">{{ form.refSatelliteName }}</label>
          </v-col>
          <!-- NORAD ID -->
          <v-col cols="3">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_NORADID) }}</label>
          </v-col>
          <v-col cols="2">
            <TextField
              v-if="props.editableNoradId"
              v-model="form.noradId"
              maxlength="5"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="noradId"
              v-model:error-text="errors.noradId"
            />
            <label v-else class="label form__label">{{ form.noradId }}</label>
          </v-col>
        </v-row>
        <v-row>
          <!-- 衛星名 -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_SATELLITE_NAME) }}</label>
          </v-col>
          <v-col cols="4">
            <TextField
              v-model="form.editSatelliteName"
              maxlength="24"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="editSatelliteName"
              v-model:error-text="errors.editSatelliteName"
            />
          </v-col>
        </v-row>
        <v-row>
          <!-- アップリンク周波数 -->
          <!-- アップリンク周波数1 -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_UPLINK) }}</label>
          </v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.uplink1Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="uplink1Hz"
              v-model:error-text="errors.uplink1Hz"
              :padEndDigit="9"
              maxlength="10"
            />
          </v-col>
          <v-col cols="3"><OpeModeSelect v-model="form.uplink1Mode" /></v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeUplinkFreq" hide-details density="compact">
              <v-radio :value="1"></v-radio>
            </v-radio-group>
          </v-col>
          <!-- アップリンク周波数2 -->
          <v-col cols="4"></v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.uplink2Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="uplink2Hz"
              v-model:error-text="errors.uplink2Hz"
              :disabled="!(form.uplink1Hz && form.uplink1Mode)"
              :padEndDigit="9"
              maxlength="10"
            />
          </v-col>
          <v-col cols="3">
            <OpeModeSelect v-model="form.uplink2Mode" :disabled="!(form.uplink1Hz && form.uplink1Mode)" />
          </v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeUplinkFreq" hide-details density="compact">
              <v-radio :value="2" :disabled="!(form.uplink1Hz && form.uplink1Mode)"></v-radio>
            </v-radio-group>
          </v-col>
          <!-- アップリンク周波数3 -->
          <v-col cols="4"></v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.uplink3Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="uplink3Hz"
              v-model:error-text="errors.uplink3Hz"
              :disabled="!(form.uplink2Hz && form.uplink2Mode)"
              :padEndDigit="9"
              maxlength="10"
            />
          </v-col>
          <v-col cols="3">
            <OpeModeSelect v-model="form.uplink3Mode" :disabled="!(form.uplink2Hz && form.uplink2Mode)" />
          </v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeUplinkFreq" hide-details density="compact">
              <v-radio :value="3" :disabled="!(form.uplink2Hz && form.uplink2Mode)"></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row>
          <!-- トーン周波数 -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_TONE) }}</label>
          </v-col>
          <v-col cols="4">
            <ToneFrequencySelect v-model="form.toneHz" />
          </v-col>
        </v-row>
        <v-row>
          <!-- ダウンリンク周波数 -->
          <!-- ダウンリンク周波数1 -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_DOWNLINK) }}</label>
          </v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.downlink1Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="downlink1Hz"
              v-model:error-text="errors.downlink1Hz"
              :padEndDigit="9"
              maxlength="10"
            />
          </v-col>
          <v-col cols="3"><OpeModeSelect v-model="form.downlink1Mode" /></v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeDownlinkFreq" hide-details density="compact">
              <v-radio :value="1"></v-radio>
            </v-radio-group>
          </v-col>
          <!-- ダウンリンク周波数2 -->
          <v-col cols="4"></v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.downlink2Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="downlink2Hz"
              v-model:error-text="errors.downlink2Hz"
              :disabled="!(form.downlink1Hz && form.downlink1Mode)"
              :padEndDigit="9"
              maxlength="10"
            />
          </v-col>
          <v-col cols="3">
            <OpeModeSelect v-model="form.downlink2Mode" :disabled="!(form.downlink1Hz && form.downlink1Mode)" />
          </v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeDownlinkFreq" hide-details density="compact">
              <v-radio :value="2" :disabled="!(form.downlink2Hz && form.downlink2Mode)"></v-radio>
            </v-radio-group>
          </v-col>
          <!-- ダウンリンク周波数3 -->
          <v-col cols="4"></v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.downlink3Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="downlink3Hz"
              v-model:error-text="errors.downlink3Hz"
              :disabled="!(form.downlink2Hz && form.downlink2Mode)"
              :padEndDigit="9"
              maxlength="10"
            />
          </v-col>
          <v-col cols="3">
            <OpeModeSelect v-model="form.downlink3Mode" :disabled="!(form.downlink2Hz && form.downlink2Mode)" />
          </v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeDownlinkFreq" hide-details density="compact">
              <v-radio :value="3" :disabled="!(form.downlink3Hz && form.downlink3Mode)"></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row>
          <!-- ビーコン周波数 -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_BEACON) }}</label>
          </v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.beaconHz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="beaconHz"
              v-model:error-text="errors.beaconHz"
              :padEndDigit="9"
              maxlength="10"
            />
          </v-col>
          <v-col cols="3"><OpeModeSelect v-model="form.beaconMode" /></v-col>
          <v-col col="1"></v-col>
        </v-row>
        <v-row>
          <!-- サテライトモード -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_SATELLITE_MODE) }}</label>
          </v-col>
          <v-col cols="2">
            <v-checkbox-btn
              v-model="form.enableSatelliteMode"
              hide-details
              density="compact"
              :label="I18nUtil.getMsg(I18nMsgs.GCOM_ENABLED)"
            ></v-checkbox-btn>
          </v-col>
          <v-col cols="6">
            <v-radio-group row v-model="form.satelliteMode" hide-details density="compact">
              <v-radio
                :value="Constant.Transceiver.TrackingMode.NORMAL"
                :disabled="!form.enableSatelliteMode"
                class="radio"
                :label="I18nUtil.getMsg(I18nMsgs.G31_NORMAL)"
              ></v-radio>
              <v-radio
                :value="Constant.Transceiver.TrackingMode.REVERSE"
                :disabled="!form.enableSatelliteMode"
                class="radio"
                :label="I18nUtil.getMsg(I18nMsgs.G31_REVERSE)"
              ></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
        <v-row>
          <!-- 概要 -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_OUTLINE) }}</label>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-textarea
              v-model="form.outline"
              hide-details
              variant="outlined"
              no-resize
              rows="2"
              class="textarea"
              maxlength="1024"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="emits('ok')" variant="outlined" size="large">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK)
        }}</v-btn>
        <v-btn @click="emits('cancel')" variant="outlined" size="large" class="ml-5">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import DigitTextField from "@/renderer/components/atoms/DigitTextField/DigitTextField.vue";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import OpeModeSelect from "@/renderer/components/molecules/OpeModeSelect/OpeModeSelect.vue";
import ToneFrequencySelect from "@/renderer/components/molecules/ToneFrequencySelect/ToneFrequencySelect.vue";
import { computed } from "vue";
import EditSatelliteInfoForm from "./EditSatelliteInfoForm";
import { getValiSchemaEditSatelliteInfo } from "./useEditSatelliteInfoValidate";

const props = defineProps({
  editableNoradId: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// ダイアログ表示用
const isShow = defineModel<boolean>("isShow", { default: false });
// フォーム
const form = defineModel<EditSatelliteInfoForm>("form", { default: new EditSatelliteInfoForm() });
// 入力エラー
const errors = defineModel<Record<string, string | undefined>>("errors", { default: {} });
// タイトル表示用
const title = defineModel<string>("title", { default: "" });
// 画面を使って設定をしたかどうか
const manualEditFlg = defineModel<boolean>("manualEditFlg", { default: false });
// Resetボタンの表示制御
const showReset = defineModel<boolean>("showReset", { default: true });

const valiSchemaEditSatelliteInfo = computed(() => getValiSchemaEditSatelliteInfo(props.editableNoradId));

// 親に通知用のイベント
const emits = defineEmits<{ (e: "ok"): void; (e: "cancel"): void; (e: "reset"): void }>();
</script>

<style lang="scss" scoped>
@import "./SatelliteInfoEditorDialog.scss";
</style>
