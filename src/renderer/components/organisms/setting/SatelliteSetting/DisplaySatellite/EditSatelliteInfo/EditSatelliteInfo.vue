<!-- 衛星情報編集 -->
<template>
  <v-dialog v-model="isShow" persistent max-width="600">
    <v-card theme="dark" outlined width="100%" height="100%" class="pa-3">
      <v-card-title class="headline" style="user-select: none">{{ selectedItem.satelliteName }}</v-card-title>
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
              >{{ I18nUtil.getMsg(I18nMsgs.G31_MANUAL_SET) }}</v-btn
            ></v-col
          >

          <v-col cols="2"
            ><v-btn variant="outlined" size="small" class="mr-0" @click="onReset">{{
              I18nUtil.getMsg(I18nMsgs.GCOM_RESET)
            }}</v-btn></v-col
          >
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
            <label class="label form__label">{{ form.noradId }}</label>
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
            />
          </v-col>
          <v-col cols="3"> <OpeModeSelect v-model="form.uplink1Mode" /></v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeUplinkFreq" hide-details density="compact">
              <v-radio value="1"></v-radio></v-radio-group
          ></v-col>
          <v-col cols="4"> </v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.uplink2Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="uplink2Hz"
              v-model:error-text="errors.uplink2Hz"
              :disabled="!(form.uplink1Hz && form.uplink1Mode)"
            />
          </v-col>
          <v-col cols="3">
            <OpeModeSelect v-model="form.uplink2Mode" :disabled="!(form.uplink1Hz && form.uplink1Mode)"
          /></v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeUplinkFreq" hide-details density="compact">
              <v-radio value="2" :disabled="!(form.uplink1Hz && form.uplink1Mode)"></v-radio></v-radio-group
          ></v-col>
        </v-row>
        <v-row>
          <!-- ダウンリンク周波数 -->
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
            />
          </v-col>
          <v-col cols="3"> <OpeModeSelect v-model="form.downlink1Mode" /></v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeDownlinkFreq" hide-details density="compact">
              <v-radio value="1"></v-radio></v-radio-group
          ></v-col>
          <v-col cols="4"> </v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.downlink2Hz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="downlink2Hz"
              v-model:error-text="errors.downlink2Hz"
              :disabled="!(form.downlink1Hz && form.downlink1Mode)"
            />
          </v-col>
          <v-col cols="3">
            <OpeModeSelect v-model="form.downlink2Mode" :disabled="!(form.downlink1Hz && form.downlink1Mode)"
          /></v-col>
          <v-col col="1">
            <v-radio-group v-model="form.autoModeDownlinkFreq" hide-details density="compact">
              <v-radio value="2" :disabled="!(form.downlink1Hz && form.downlink1Mode)"></v-radio></v-radio-group
          ></v-col>
        </v-row>
        <v-row>
          <!-- トーン周波数 -->
          <v-col cols="4">
            <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_TONE) }}</label>
          </v-col>
          <v-col cols="4">
            <DigitTextField
              v-model="form.toneHz"
              suffix="Hz"
              :valiSchema="valiSchemaEditSatelliteInfo"
              valiSchemaFieldPath="toneHz"
              v-model:error-text="errors.toneHz"
            />
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
        <v-btn @click="onOk" variant="outlined" size="large">{{ I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK) }}</v-btn>
        <v-btn @click="onCancel" variant="outlined" size="large" class="ml-5">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { DefaultSatelliteType, SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiAppConfigSatellite from "@/renderer/api/ApiAppConfigSatellite";
import ApiDefaultSatellite from "@/renderer/api/ApiDefaultSatellite";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import DigitTextField from "@/renderer/components/atoms/DigitTextField/DigitTextField.vue";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import OpeModeSelect from "@/renderer/components/molecules/OpeModeSelect/OpeModeSelect.vue";
import emitter from "@/renderer/util/EventBus";
import { onMounted, ref, watch } from "vue";
import EditSatelliteInfoForm from "./EditSatelliteInfoForm";
import useEditSatelliteInfo from "./useEditSatelliteInfo";
import { useEditSatelliteInfoValidate, valiSchemaEditSatelliteInfo } from "./useEditSatelliteInfoValidate";

// ダイアログ表示用
const isShow = defineModel<boolean>("isShow", {
  default: false,
});
// 親からもらう衛星識別情報
const selectedItem = defineModel<SatelliteIdentiferType>("selectedItem", {
  default: {},
});
// 親に通知用のイベント
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();
// 画面を使って設定をしたかどうか
const manualEditFlg = ref<boolean>(false);
// マウント時やリセット時にwatchしないためのフラグ
let isWatched = true;

// フォーム
const form = ref<EditSatelliteInfoForm>(new EditSatelliteInfoForm());

// 入力チェック関係
const { validateForm, errors } = useEditSatelliteInfoValidate();

// ファイルから取得した値と画面フォームで構造を変換する関数
const { transformAppConfigToForm, transformDefSatToForm, transformFormToAppConfig } = useEditSatelliteInfo();

onMounted(async function () {
  // 衛星を取得
  const registedSatellite = await ApiAppConfigSatellite.getUserRegisteredAppConfigSatellite(
    selectedItem.value.satelliteId
  );
  // ユーザ登録されているか確認する
  const appConfigSatellite = await ApiAppConfigSatellite.getAppConfigSatellite(selectedItem.value.satelliteId);

  // 画面に設定する
  transformAppConfigToForm(form.value, registedSatellite);
  form.value.refSatelliteName = selectedItem.value.satelliteName;
  manualEditFlg.value = false;

  if (appConfigSatellite) {
    manualEditFlg.value = true;
  }
  isWatched = false;
});

// 画面入力をしたらマニュアル設定をONにする
// リセットするまでONのまま
watch(
  () => ({ ...form.value }),
  () => {
    if (isWatched) {
      manualEditFlg.value = true;
    } else {
      isWatched = true;
    }
  },
  { deep: true } // ここはdeepじゃないと反応しない
);

/**
 * Okボタン押下時の処理
 * 入力内容をチェックする
 * 入力内容に応じて、ユーザ設定を追加、更新、削除する
 */
async function onOk() {
  // 入力チェック
  const result = await validateForm(form.value);
  if (!result) {
    const messages = Object.values(errors.value).filter((item) => item);
    if (messages.length > 0) emitter.emit(Constant.GlobalEvent.NOTICE_INFO, messages[0]);
    return;
  }

  const appConfig = await ApiAppConfig.getAppConfig();
  const formSatId = form.value.satelliteId;

  const index = appConfig.satellites.findIndex((sat) => {
    return sat.satelliteId === formSatId;
  });

  if (index > -1) {
    // アプリケーション設定にあった場合
    // リセットを押してなければ(マニュアル設定がON)更新する
    // リセットを押していたら(マニュアル設定がOFF)削除する
    if (manualEditFlg.value) {
      const sat: AppConfigSatellite = appConfig.satellites[index];
      transformFormToAppConfig(sat, form.value);
    } else {
      appConfig.satellites.splice(index, 1);
    }
  } else {
    // アプリケーション設定になければ新規追加
    const sat: AppConfigSatellite = new AppConfigSatellite();
    transformFormToAppConfig(sat, form.value);
    appConfig.satellites.push(sat);
  }

  // 衛星名を変更したら親のリストに戻す
  selectedItem.value.satelliteName = form.value.editSatelliteName;

  // 保存
  await ApiAppConfig.storeAppConfig(appConfig);

  // 親に通知(ダイアログクローズ)
  emits("onOk");
}

/**
 * ダイアログを閉じるボタンで閉じる
 */
async function onCancel() {
  // 親に通知(ダイアログクローズ)
  emits("onCancel");
}

/**
 * リセットボタン押下時の処理
 * デフォルト衛星情報を設定してマニュアル設定をOFFにする
 */
async function onReset() {
  // デフォルト衛星情報を取得
  const defsat: DefaultSatelliteType = await ApiDefaultSatellite.getDefaultSatelliteBySatelliteId(
    selectedItem.value.satelliteId
  );
  if (defsat) {
    transformDefSatToForm(form.value, defsat);
  }
  manualEditFlg.value = false;
  isWatched = false;
}
</script>
<style lang="scss" scoped>
@import "./EditSatelliteInfo.scss";
</style>
