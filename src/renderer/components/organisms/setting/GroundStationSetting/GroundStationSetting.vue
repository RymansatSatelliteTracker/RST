<template>
  <v-dialog v-model="isShow" max-width="900" @keydown.esc="isShow = false">
    <v-card color="grey-darken-4" class="pa-4 dialog-height">
      <v-tabs>
        <v-tab value="one" class="custom-border px-16 font-weight-bold">{{
          I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION_SETTING)
        }}</v-tab>
      </v-tabs>

      <v-card-text class="bg-grey-darken-4 custom-border pa-8 h-75">
        <v-container>
          <div class="mb-8">
            <div class="mb-5 font-weight-bold">{{ I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION1) }}</div>
            <v-row class="ml-5">
              <v-col cols="5">
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="lon" class="label form__label">{{
                        I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION_LON)
                      }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStationSetting.lon"
                        maxlength="10"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="lon"
                      />
                    </div>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="lat" class="label form__label">{{
                        I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION_LAT)
                      }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStationSetting.lat"
                        maxlength="10"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="lat"
                      />
                    </div>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="height" class="label form__label">{{
                        I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION_HEIGHT)
                      }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStationSetting.height"
                        maxlength="5"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="height"
                      />
                    </div>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="7">
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="grid_locater" class="px-2">{{ I18nUtil.getMsg(I18nMsgs.G61_GRID_LOCATER) }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStationSetting.gridLocator"
                        maxlength="6"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="gridLocator"
                      />
                      <v-btn
                        variant="outlined"
                        size="small"
                        :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_UPDATE)"
                        class="ml-2"
                        @click="clickGroundStationGridLocator"
                      ></v-btn>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="grid_locater" class="px-2">{{ I18nUtil.getMsg(I18nMsgs.G61_GEO_LOCATION) }}</label>
                      <v-btn
                        variant="outlined"
                        size="small"
                        :text="I18nUtil.getMsg(I18nMsgs.G61_GEO_LOCATION_GET)"
                        class="ml-2"
                        @click="clickGroundStationGeoLocation"
                      ></v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>

          <div>
            <div class="mb-5">
              <div class="font-weight-bold d-inline">{{ I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION2) }}</div>
              <div class="ml-10 d-inline">
                <input
                  class="form__checkbox"
                  type="checkbox"
                  name="local_station2_enabled"
                  id="local_station2_enabled"
                  v-model="groundStationSettingForm.groundStation2Setting.enable"
                />
                <label class="ml-3" for="local_station2_enabled">{{
                  I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION2_ENABLED)
                }}</label>
              </div>
            </div>
            <v-row class="ml-5">
              <v-col cols="5">
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="lon" class="label form__label">{{
                        I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION_LON)
                      }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStation2Setting.lon"
                        maxlength="10"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="lon"
                      />
                    </div>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="lat" class="label form__label">{{
                        I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION_LAT)
                      }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStation2Setting.lat"
                        maxlength="10"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="lat"
                      />
                    </div>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="height" class="label form__label">{{
                        I18nUtil.getMsg(I18nMsgs.G61_GROUND_STATION_HEIGHT)
                      }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStation2Setting.height"
                        maxlength="5"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="height"
                      />
                    </div>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="7">
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="grid_locater" class="px-2">{{ I18nUtil.getMsg(I18nMsgs.G61_GRID_LOCATER) }}</label>
                      <TextField
                        v-model="groundStationSettingForm.groundStation2Setting.gridLocator"
                        maxlength="6"
                        :valiSchema="validSchemaGroundStationSettingForm"
                        valiSchemaFieldPath="gridLocator"
                      />
                      <v-btn
                        variant="outlined"
                        size="small"
                        :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_UPDATE)"
                        class="ml-2"
                        @click="clickGroundStation2GridLocator"
                      ></v-btn>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="d-flex justify-space-between">
                      <label for="grid_locater" class="px-2">{{ I18nUtil.getMsg(I18nMsgs.G61_GEO_LOCATION) }}</label>
                      <v-btn
                        variant="outlined"
                        size="small"
                        :text="I18nUtil.getMsg(I18nMsgs.G61_GEO_LOCATION_GET)"
                        class="ml-2"
                        @click="clickGroundStation2GeoLocation"
                      ></v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>
        </v-container>
      </v-card-text>

      <v-card-actions class="mt-4">
        <v-btn
          variant="outlined"
          size="large"
          :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK)"
          class="mr-5"
          @click="onOk"
        ></v-btn>
        <v-btn
          variant="outlined"
          size="large"
          :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)"
          @click="cancelClick"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ApiGeoLocation from "@/renderer/api/ApiGeoLocation";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import emitter from "@/renderer/util/EventBus";
import { ref, watch } from "vue";
import GroundStationSettingForm from "./GroundStationSettingForm";
import useAppConfig from "./useAppConfig";
import {
  useGroundStationSettingValidate,
  validSchemaGroundStationSettingForm,
} from "./useGroundStationSettingValidate";
import useGridLocator from "./userGridLocator";

const { getAppConfig, storeAppConfig } = useAppConfig();
const { fromGridLocator } = useGridLocator();

// ダイアログの表示可否
const isShow = defineModel("isShow");
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// フォーム
const groundStationSettingForm = ref<GroundStationSettingForm>(new GroundStationSettingForm());

// 入力チェック関係
const { validateForm, errors } = useGroundStationSettingValidate();

// 親画面からの表示指示を監視し、表示時はデータを再取得する
watch(isShow, async (newValue) => {
  if (!newValue) {
    return;
  }

  reloadConfig();
});

/**
 * 現在の地上局設定を取得し、画面に反映する
 */
async function reloadConfig() {
  // フォーム初期化
  initForm();

  // データの取得
  const groundStationConfig = await getAppConfig();

  groundStationSettingForm.value.groundStationSetting.height = groundStationConfig.groundStation.height.toString();
  groundStationSettingForm.value.groundStationSetting.lat = groundStationConfig.groundStation.lat.toString();
  groundStationSettingForm.value.groundStationSetting.lon = groundStationConfig.groundStation.lon.toString();

  groundStationSettingForm.value.groundStation2Setting.enable = groundStationConfig.groundStation2.enable;
  groundStationSettingForm.value.groundStation2Setting.height = groundStationConfig.groundStation2.height.toString();
  groundStationSettingForm.value.groundStation2Setting.lat = groundStationConfig.groundStation2.lat.toString();
  groundStationSettingForm.value.groundStation2Setting.lon = groundStationConfig.groundStation2.lon.toString();
}

/**
 * Form初期化
 */
function initForm() {
  groundStationSettingForm.value.groundStationSetting.lon = "";
  groundStationSettingForm.value.groundStationSetting.lat = "";
  groundStationSettingForm.value.groundStationSetting.height = "";
  groundStationSettingForm.value.groundStationSetting.gridLocator = "";

  groundStationSettingForm.value.groundStation2Setting.enable = false;
  groundStationSettingForm.value.groundStation2Setting.lon = "";
  groundStationSettingForm.value.groundStation2Setting.lat = "";
  groundStationSettingForm.value.groundStation2Setting.height = "";
  groundStationSettingForm.value.groundStation2Setting.gridLocator = "";
}

/**
 * OKクリック
 */
async function onOk() {
  const result = await validateForm(groundStationSettingForm.value);
  if (!result) {
    return;
  }

  // 画面入力値をアプリ設定に反映
  const groundStationConfig = await getAppConfig();
  groundStationConfig.groundStation.height = Number(groundStationSettingForm.value.groundStationSetting.height);
  groundStationConfig.groundStation.lat = Number(groundStationSettingForm.value.groundStationSetting.lat);
  groundStationConfig.groundStation.lon = Number(groundStationSettingForm.value.groundStationSetting.lon);

  groundStationConfig.groundStation2.enable = groundStationSettingForm.value.groundStation2Setting.enable;
  groundStationConfig.groundStation2.height = Number(groundStationSettingForm.value.groundStation2Setting.height);
  groundStationConfig.groundStation2.lat = Number(groundStationSettingForm.value.groundStation2Setting.lat);
  groundStationConfig.groundStation2.lon = Number(groundStationSettingForm.value.groundStation2Setting.lon);

  // 保存
  await storeAppConfig(groundStationConfig);

  // 設定を更新したことを通知
  await ApiActiveSat.refreshAppConfig();

  // 親へ通知
  emits("onOk");
}

/**
 * キャンセルクリック
 */
async function cancelClick() {
  // 親へ通知
  emits("onCancel");
}

/**
 * グリッドロケーター取得クリック
 */
function clickGroundStationGridLocator(): void {
  // グリッドロケーターから緯度・経度を取得
  const { lat, lon } = fromGridLocator(groundStationSettingForm.value.groundStationSetting.gridLocator);

  // 緯度・経度を更新
  groundStationSettingForm.value.groundStationSetting.lat = lat.toString();
  groundStationSettingForm.value.groundStationSetting.lon = lon.toString();
}

/**
 * グリッドロケーター取得クリック
 */
function clickGroundStation2GridLocator(): void {
  // グリッドロケーターから緯度・経度を取得
  const { lat, lon } = fromGridLocator(groundStationSettingForm.value.groundStation2Setting.gridLocator);

  // 緯度・経度を更新
  groundStationSettingForm.value.groundStation2Setting.lat = lat.toString();
  groundStationSettingForm.value.groundStation2Setting.lon = lon.toString();
}

/**
 * GeoLocation取得ボタンクリック
 */
async function clickGroundStationGeoLocation(): Promise<void> {
  try {
    // GeoLocation取得
    const data = await ApiGeoLocation.getGeoLocation();
    if (data) {
      // 緯度・経度を更新
      groundStationSettingForm.value.groundStationSetting.lat = data.latitude.toString();
      groundStationSettingForm.value.groundStationSetting.lon = data.longitude.toString();
    }
  } catch (error) {
    emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.ERR_GEO_LOCATION_NOT_FOUND));
  }
}

/**
 * GeoLocation取得ボタンクリック
 */
async function clickGroundStation2GeoLocation(): Promise<void> {
  try {
    // GeoLocation取得
    const data = await ApiGeoLocation.getGeoLocation();
    if (data) {
      // 緯度・経度を更新
      groundStationSettingForm.value.groundStation2Setting.lat = data.latitude.toString();
      groundStationSettingForm.value.groundStation2Setting.lon = data.longitude.toString();
    }
  } catch (error) {
    emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.ERR_GEO_LOCATION_NOT_FOUND));
  }
}
</script>

<style lang="scss" scoped>
@import "./GroundStationSetting.scss";
</style>
