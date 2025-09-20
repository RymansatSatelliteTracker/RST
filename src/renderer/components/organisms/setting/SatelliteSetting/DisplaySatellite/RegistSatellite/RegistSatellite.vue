<!-- 衛星登録 -->
<template>
  <v-dialog v-model="isShow" persistent max-width="700">
    <v-card theme="dark" outlined width="100%" height="100%" class="pa-3">
      <v-card-title class="headline" style="user-select: none">{{
        I18nUtil.getMsg(I18nMsgs.G31_REGIST_SATELLITE)
      }}</v-card-title>
      <v-divider class="mb-4"></v-divider>
      <v-card-text>
        <v-row>
          <!-- 衛星名 -->
          <v-col cols="3">
            <label class="label form__label" style="user-select: none">{{
              I18nUtil.getMsg(I18nMsgs.G31_SATELLITE_NAME)
            }}</label>
          </v-col>
          <v-col cols="3">
            <TextField
              v-model="form.satelliteName"
              maxlength="24"
              :valiSchema="valiSchemaRegistSatellite"
              valiSchemaFieldPath="satelliteName"
              v-model:error-text="errors.satelliteName"
            />
          </v-col>
        </v-row>
        <div class="mt-5">
          <!-- TLE -->
          <div class="text-left" style="user-select: none">{{ I18nUtil.getMsg(I18nMsgs.GCOM_TLE) }}</div>
          <v-row>
            <v-col cols="12">
              <TextArea
                v-model="form.tle"
                maxlength="1024"
                :valiSchema="valiSchemaRegistSatellite"
                valiSchemaFieldPath="tle"
                v-model:error-text="errors.tle"
              ></TextArea>
            </v-col>
          </v-row>
        </div>
        <div class="mt-5">
          <div class="text-left" style="user-select: none">{{ I18nUtil.getMsg(I18nMsgs.GCOM_OR) }}</div>
        </div>
        <div class="mt-5">
          <!-- 軌道6要素 -->
          <div class="text-left" style="user-select: none">{{ I18nUtil.getMsg(I18nMsgs.G31_ORBITAL_ELEMENTS) }}</div>
          <div class="pa-3 div-element">
            <v-row>
              <!-- Epoch -->
              <v-col cols="3">
                <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_EPOCH) }}</label>
              </v-col>
              <v-col cols="4">
                <TextField
                  v-model="form.epochUtcDate"
                  maxlength="16"
                  label="YYYY/MM/DD hh:mm"
                  :valiSchema="valiSchemaRegistSatellite"
                  valiSchemaFieldPath="epochUtcDate"
                  v-model:error-text="errors.epochUtcDate"
                />
              </v-col>
            </v-row>
            <v-row>
              <!-- Semi-major Axis -->
              <v-col cols="3">
                <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_SEMI_MAJAR_AXIS) }}</label>
              </v-col>
              <v-col cols="3">
                <TextField
                  v-model="form.semiMajorAxisKm"
                  maxlength="11"
                  :valiSchema="valiSchemaRegistSatellite"
                  valiSchemaFieldPath="semiMajorAxisKm"
                  v-model:error-text="errors.semiMajorAxisKm"
                />
              </v-col>
              <!-- R.A.A.N -->
              <v-col cols="3">
                <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_RAAN) }}</label>
              </v-col>
              <v-col cols="3">
                <TextField
                  v-model="form.raanDeg"
                  maxlength="8"
                  :valiSchema="valiSchemaRegistSatellite"
                  valiSchemaFieldPath="raanDeg"
                  v-model:error-text="errors.raanDeg"
                />
              </v-col>
            </v-row>
            <v-row>
              <!-- Eccentricity -->
              <v-col cols="3">
                <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_ECCENTRICITY) }}</label>
              </v-col>
              <v-col cols="3">
                <TextField
                  v-model="form.eccentricity"
                  maxlength="9"
                  :valiSchema="valiSchemaRegistSatellite"
                  valiSchemaFieldPath="eccentricity"
                  v-model:error-text="errors.eccentricity"
                />
              </v-col>
              <!-- Argument of Perigee -->
              <v-col cols="3">
                <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_ARG_OF_PERIGEE) }}</label>
              </v-col>
              <v-col cols="3">
                <TextField
                  v-model="form.argumentOfPerigeeDeg"
                  maxlength="8"
                  :valiSchema="valiSchemaRegistSatellite"
                  valiSchemaFieldPath="argumentOfPerigeeDeg"
                  v-model:error-text="errors.argumentOfPerigeeDeg"
                />
              </v-col>
            </v-row>
            <v-row>
              <!-- Inclination -->
              <v-col cols="3">
                <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_INCLINATION) }}</label>
              </v-col>
              <v-col cols="3">
                <TextField
                  v-model="form.inclinationDeg"
                  maxlength="8"
                  :valiSchema="valiSchemaRegistSatellite"
                  valiSchemaFieldPath="inclinationDeg"
                  v-model:error-text="errors.inclinationDeg"
                />
              </v-col>
              <!-- Mean Anomaly -->
              <v-col cols="3">
                <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G31_MEAN_ANOMALY) }}</label>
              </v-col>
              <v-col cols="3">
                <TextField
                  v-model="form.meanAnomalyDeg"
                  maxlength="8"
                  :valiSchema="valiSchemaRegistSatellite"
                  valiSchemaFieldPath="meanAnomalyDeg"
                  v-model:error-text="errors.meanAnomalyDeg"
                />
              </v-col>
            </v-row>
          </div>
        </div>
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
import { SatelliteIdentiferType } from "@/common/types/satelliteSettingTypes";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiAppConfigSatellite from "@/renderer/api/ApiAppConfigSatellite";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextArea from "@/renderer/components/atoms/TextArea/TextArea.vue";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import emitter from "@/renderer/util/EventBus";
import { showConfirm } from "@/renderer/util/MessageDialog";
import { onMounted, ref } from "vue";
import RegistSatelliteForm from "./RegistSatelliteForm";
import { setAppConfig, setForm } from "./useRegistSatelliteUtils";
import { useRegistSatelliteValidate, valiSchemaRegistSatellite } from "./useRegistSatelliteValidate";

// ダイアログ表示用
const isShow = defineModel<boolean>("isShow", {
  default: false,
});
// 親画面で選択した衛星
const selectedSatelliteItem = defineModel<SatelliteIdentiferType>("selectedSatelliteItem", {
  default: { satelliteId: -1, satelliteName: "" },
});
// 衛星追加用の親のグループ
const selectedGroupId = defineModel<number>("selectedGroupId", {
  default: Constant.SatSetting.DEFAULT_SATELLITE_GROUP_ID,
});
// 衛星追加用の親の衛星リスト
const selectedSatellites = defineModel<SatelliteIdentiferType[]>("selectedSatellites", { default: [] });
// 親に通知用のイベント
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// フォーム
const form = ref<RegistSatelliteForm>(new RegistSatelliteForm());
// 入力チェック関係
const { validateForm, errors } = useRegistSatelliteValidate();

onMounted(async function () {
  // 画面表示時に衛星が選択されていた場合、ユーザ登録されている情報を画面に反映する
  if (selectedSatelliteItem.value.satelliteId > -1) {
    // ユーザ登録されている情報を探す
    const registedSatellite = await ApiAppConfigSatellite.getUserRegisteredAppConfigSatellite(
      selectedSatelliteItem.value.satelliteId,
      selectedGroupId.value
    );
    // 画面反映
    setForm(form.value, registedSatellite);
  }
});

/**
 * Okボタン押下
 */
async function onOk() {
  const result = await validateForm(form.value);
  // エラーがあれば通知を出して終了
  if (!result) {
    const messages = Object.values(errors.value).filter((item) => item);
    if (messages.length > 0) emitter.emit(Constant.GlobalEvent.NOTICE_ERR, messages[0]);

    return;
  }
  // TLEと軌道6要素が両方入力されている場合は確認
  if (errors.value["both"]) {
    const isOk = await showConfirm(I18nUtil.getMsg(I18nMsgs.CHK_ERR_BOTH_TLE_ORBIT));

    // キャンセルが押下されたら終了
    if (!isOk) return;
  }
  // TLEが有効期限切れの場合は確認
  if (errors.value["tleEpoch"]) {
    const isOk = await showConfirm(I18nUtil.getMsg(I18nMsgs.CHK_ERR_EXPIRED_TLE));

    // キャンセルが押下されたら終了
    if (!isOk) return;
  }

  // 取得
  const appConfig = await ApiAppConfig.getAppConfig();
  // 画面情報を反映
  const isNewItem = await setAppConfig(appConfig, form.value, selectedGroupId.value);

  if (isNewItem) {
    // 追加した場合はリストの一番後ろが追加した衛星
    const apiSat = appConfig.satellites.at(-1);
    // ここでないなんてことないのだけどエラーが出るので存在確認しておく
    if (apiSat) {
      // 登録した衛星が消えないようにグループに登録しておく
      const group = appConfig.satelliteGroups.find((gp) => gp.groupId === selectedGroupId.value);
      group?.satelliteIds.push(apiSat.satelliteId);
      // 親のリストに追加
      selectedSatellites.value.push({
        satelliteId: apiSat.satelliteId,
        satelliteName: apiSat.userRegisteredSatelliteName,
        userRegistered: true,
      });
    }
  } else {
    // 衛星名を親画面に反映する
    selectedSatelliteItem.value.satelliteName = form.value.satelliteName;
  }

  // 保存
  await ApiAppConfig.storeAppConfig(appConfig);

  emits("onOk");
}
/**
 * キャンセルボタン押下
 */
async function onCancel() {
  emits("onCancel");
}
</script>
<style lang="scss" scoped>
@import "./RegistSatellite.scss";
</style>
