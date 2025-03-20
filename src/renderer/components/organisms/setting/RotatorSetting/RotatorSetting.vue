<template>
  <v-dialog v-model="isShow" max-width="1000" @keydown.esc="isShow = false">
    <v-sheet color="grey-darken-4" outlined width="100%" height="100%" class="text-center pa-3">
      <v-sheet color="grey-darken-4" outlined width="300" height="100%" class="title__sheet--border text-center pa-1">{{
        I18nUtil.getMsg(I18nMsgs.GCOM_ROTATOR)
      }}</v-sheet>
      <v-sheet color="grey-darken-4" outlined width="100%" height="100%" class="title__sheet--border pa-10">
        <v-row>
          <!-- 左側 -->
          <v-col cols="7">
            <v-row>
              <v-col cols="12">
                <!-- メーカー -->
                <div class="d-flex">
                  <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G51_MAKER) }}</label>
                  <div class="form__select">
                    <RotatorMakerSelect
                      v-model:selectedValue="form.makerId"
                      v-model:rotatorId="form.rotatorId"
                      :needEmpty="true"
                    />
                  </div>
                </div>

                <!-- 機種 -->
                <div class="d-flex mt-2">
                  <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G51_DEVICE) }}</label>
                  <div class="form__select">
                    <RotatorDeviceSelect
                      v-model:selectedValue="form.rotatorId"
                      v-model:makerId="form.makerId"
                      :needEmpty="false"
                    />
                  </div>
                </div>

                <!-- シリアルポート -->
                <div class="d-flex mt-2">
                  <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G51_SERIAL_PORT) }}</label>
                  <div class="form__select">
                    <SerialPortSelect ref="serialPortSelectRef" v-model:selectedValue="form.port" :needEmpty="true" />
                  </div>

                  <!-- 更新 -->
                  <v-btn
                    variant="outlined"
                    size="small"
                    :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_UPDATE)"
                    class="ml-2 mr-0"
                    @click="onRefreshSerialPort"
                  ></v-btn>
                </div>

                <!-- ボーレート -->
                <div class="d-flex mt-2">
                  <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G51_BORATE) }}</label>
                  <div class="form__select">
                    <BorateSelect v-model:selectedValue="form.borate" :needEmpty="true" />
                  </div>
                </div>

                <!-- 接続テスト -->
                <div class="d-flex mt-2">
                  <label class="label form__label"></label>
                  <v-btn
                    variant="outlined"
                    size="small"
                    :text="I18nUtil.getMsg(I18nMsgs.G51_TEST_CONNECT)"
                    :loading="loadingTestBtn"
                    class="mr-0"
                    :disabled="!validTest"
                    @click="connTest"
                  ></v-btn>
                </div>
              </v-col>
            </v-row>

            <div class="mt-5">
              <div class="text-left">{{ I18nUtil.getMsg(I18nMsgs.G51_TEST_MODE) }}</div>
              <v-row>
                <!-- 現在のAz -->
                <v-col cols="6">
                  <div class="d-flex mt-2">
                    <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.GCOM_AZ) }}</label>
                    <label class="label w-100per text-right pr-4"
                      >{{ CommonUtil.numFormat(antennaPosition.azimuth, 1) }}°</label
                    >
                  </div>
                </v-col>

                <!-- 現在のEl -->
                <v-col cols="6">
                  <div class="d-flex mt-2">
                    <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.GCOM_EL) }}</label>
                    <label class="label w-100per text-right pr-4"
                      >{{ CommonUtil.numFormat(antennaPosition.elevation, 1) }}°</label
                    >
                  </div>
                </v-col>
              </v-row>

              <v-row class="mt-0">
                <!-- Azの指定 -->
                <v-col cols="6">
                  <div class="d-flex">
                    <TextField
                      v-model="form.testAz"
                      class="right"
                      suffix="°"
                      maxlength="3"
                      :disabled="!isSerialOpen"
                      :valiSchema="valiSchemaRotatorSetting"
                      valiSchemaFieldPath="testAz"
                      v-model:error-text="errors.testAz"
                      @blur="testMovePos"
                    />
                  </div>
                </v-col>

                <!-- Elの指定 -->
                <v-col cols="6">
                  <div class="d-flex">
                    <TextField
                      v-model="form.testEl"
                      class="right"
                      suffix="°"
                      maxlength="3"
                      :disabled="!isSerialOpen"
                      :valiSchema="valiSchemaRotatorSetting"
                      valiSchemaFieldPath="testEl"
                      v-model:error-text="errors.testEl"
                      @blur="testMovePos"
                    />
                  </div>
                </v-col>
              </v-row>
            </div>

            <!-- 矢印で位置移動 -->
            <v-row>
              <v-col cols="12" class="text-center">
                <div>
                  <v-btn
                    variant="outlined"
                    size="small"
                    :disabled="!isSerialOpen"
                    @mousedown="startElUp"
                    @mouseup="stopAntennaMove"
                    ><v-icon :icon="mdiArrowUpBold"></v-icon
                  ></v-btn>
                </div>
                <div class="mt-3">
                  <v-btn
                    variant="outlined"
                    size="small"
                    class=""
                    :disabled="!isSerialOpen"
                    @mousedown="startAzDown"
                    @mouseup="stopAntennaMove"
                    ><v-icon :icon="mdiArrowLeftBold"></v-icon
                  ></v-btn>
                  <v-btn
                    variant="outlined"
                    size="small"
                    class="ml-10"
                    :disabled="!isSerialOpen"
                    @mousedown="startAzUp"
                    @mouseup="stopAntennaMove"
                    ><v-icon :icon="mdiArrowRightBold"></v-icon
                  ></v-btn>
                </div>
                <div class="mt-3">
                  <v-btn
                    variant="outlined"
                    size="small"
                    class=""
                    :disabled="!isSerialOpen"
                    @mousedown="startElDown"
                    @mouseup="stopAntennaMove"
                    ><v-icon :icon="mdiArrowDownBold"></v-icon
                  ></v-btn>
                </div>
              </v-col>
            </v-row>
          </v-col>

          <!-- 右側 -->
          <v-col cols="5">
            <v-row>
              <v-col cols="12">
                <!-- IPアドレス -->
                <div class="d-flex">
                  <label class="label form__label g_invalid_item_label">{{
                    I18nUtil.getMsg(I18nMsgs.G51_IPADDRESS)
                  }}</label>
                  <TextField
                    v-model="form.ipAddress"
                    maxlength="15"
                    :valiSchema="valiSchemaRotatorSetting"
                    valiSchemaFieldPath="ipAddress"
                    v-model:error-text="errors.ipAddress"
                    disabled
                  />
                </div>

                <!-- ポート -->
                <div class="d-flex mt-2">
                  <label class="label form__label g_invalid_item_label">{{
                    I18nUtil.getMsg(I18nMsgs.G51_IPADDRESS_PORT)
                  }}</label>
                  <TextField
                    v-model="form.ipPort"
                    maxlength="5"
                    :valiSchema="valiSchemaRotatorSetting"
                    valiSchemaFieldPath="ipPort"
                    v-model:error-text="errors.ipPort"
                    disabled
                  />
                </div>

                <!-- 方位可動範囲 -->
                <div class="mt-2">
                  <div class="d-flex">
                    <label class="label form__label g_invalid_item_label">{{
                      I18nUtil.getMsg(I18nMsgs.G51_AZ_KADO_HANI)
                    }}</label>
                  </div>
                  <div class="d-flex">
                    <!-- 最小 -->
                    <label class="label form__label_az_min pl-3 g_invalid_item_label"
                      >{{ I18nUtil.getMsg(I18nMsgs.G51_AZ_KADO_HANI_MIN) }}(°)</label
                    >
                    <div class="d-flex">
                      <TextField
                        v-model="form.rangeAzMin"
                        suffix="°"
                        class="right"
                        maxlength="3"
                        :valiSchema="valiSchemaRotatorSetting"
                        valiSchemaFieldPath="rangeAzMin"
                        v-model:error-text="errors.rangeAzMin"
                        disabled
                      />

                      <!-- 最大 -->
                      <label class="label form__label_az_max text-right pr-2 g_invalid_item_label"
                        >{{ I18nUtil.getMsg(I18nMsgs.G51_AZ_KADO_HANI_MAX) }}(°)</label
                      >
                      <TextField
                        v-model="form.rangeAzMax"
                        suffix="°"
                        class="right"
                        maxlength="3"
                        :valiSchema="valiSchemaRotatorSetting"
                        valiSchemaFieldPath="rangeAzMax"
                        v-model:error-text="errors.rangeAzMax"
                        disabled
                      />
                    </div>
                  </div>

                  <!-- 起点(°) -->
                  <div class="d-flex mt-2">
                    <label class="label form__label pl-3 g_invalid_item_label"
                      >{{ I18nUtil.getMsg(I18nMsgs.G51_BASE_POSITION_DEGREE) }}(°)</label
                    >
                    <TextField
                      v-model="form.basePositionDegree"
                      suffix="°"
                      class="right"
                      maxlength="3"
                      :valiSchema="valiSchemaRotatorSetting"
                      valiSchemaFieldPath="basePositionDegree"
                      v-model:error-text="errors.basePositionDegree"
                      disabled
                    />
                  </div>
                  <div class="text-body-2 pl-8 g_invalid_item_label">
                    {{ I18nUtil.getMsg(I18nMsgs.G51_BASE_POSITION_DEGREE_GUIDE) }}
                  </div>

                  <!-- モード -->
                  <div class="d-flex mt-2">
                    <label class="label form__label pl-3">{{ I18nUtil.getMsg(I18nMsgs.G51_MOVE_MODE) }}</label>
                    <v-radio-group v-model="form.moveMode" hide-details>
                      <v-radio
                        :label="I18nUtil.getMsg(I18nMsgs.G51_MOVE_MODE_NORMAL)"
                        value="normal"
                        density="compact"
                        hide-details
                        class="radio"
                      ></v-radio>
                      <v-radio
                        :label="I18nUtil.getMsg(I18nMsgs.G51_MOVE_MODE_FLIP)"
                        value="flip"
                        density="compact"
                        hide-details
                        class="radio mt-0"
                        disabled
                      ></v-radio>
                    </v-radio-group>
                  </div>

                  <!-- 何分前から自動で動かすか？ -->
                  <div class="d-flex mt-2">
                    <label class="label">{{ I18nUtil.getMsg(I18nMsgs.G51_START_AGO_MINUTE) }}</label>
                    <TextField
                      v-model="form.startAgoMinute"
                      :suffix="I18nUtil.getMsg(I18nMsgs.G51_START_AGO_MINUTE_SUFIX)"
                      class="right"
                      maxlength="2"
                      :valiSchema="valiSchemaRotatorSetting"
                      valiSchemaFieldPath="startAgoMinute"
                      v-model:error-text="errors.startAgoMinute"
                    />
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-sheet>

      <div class="text-right mt-3">
        <v-btn variant="outlined" size="large" :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK)" @click="onOk"></v-btn>
        <v-btn
          variant="outlined"
          size="large"
          :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)"
          class="ml-5"
          @click="cancelClick"
        ></v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiSirial from "@/renderer/api/ApiSirial";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import BorateSelect from "@/renderer/components/molecules/BorateSelect/BorateSelect.vue";
import RotatorDeviceSelect from "@/renderer/components/molecules/RotatorDeviceSelect/RotatorDeviceSelect.vue";
import RotatorMakerSelect from "@/renderer/components/molecules/RotatorMakerSelect/RotatorMakerSelect.vue";
import SerialPortSelect from "@/renderer/components/molecules/SerialPortSelect/SerialPortSelect.vue";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { mdiArrowDownBold, mdiArrowLeftBold, mdiArrowRightBold, mdiArrowUpBold } from "@mdi/js";
import { ref, watch } from "vue";
import RotatorSettingForm from "./RotatorSettingForm";
import useRotatorCtrl from "./useRotatorCtrl";
import useRotatorMonitor from "./useRotatorMonitor";
import { useRotatorSettingValidate, valiSchemaRotatorSetting } from "./useRotatorSettingValidate";
import useRotatorTestConnect from "./useRotatorTestConnect";

// ダイアログの表示可否
const isShow = defineModel("isShow");
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// フォーム
const form = ref<RotatorSettingForm>(new RotatorSettingForm());

// 「更新」クリック時に更新ボタン側のメソッドをコールするためのref
const serialPortSelectRef = ref();
const antennaPosition = ref<AntennaPositionModel>({ azimuth: 0, elevation: 0 });

// 制御系データ
const loadingTestBtn = ref(false);
const isSerialOpen = ref(false);

// 入力チェック関係
const { validateForm, errors } = useRotatorSettingValidate();

// フック
const { startNewConnect, startElUp, startElDown, startAzUp, startAzDown, stopAntennaMove, testMovePos } =
  useRotatorCtrl(form, antennaPosition, errors);
useRotatorMonitor(antennaPosition);
const { connTest, validTest } = useRotatorTestConnect(
  form,
  isSerialOpen,
  loadingTestBtn,
  antennaPosition,
  startNewConnect
);
const autoStore = useStoreAutoState();

// 親画面からの表示指示を監視し、表示時はデータを再取得する
watch(isShow, async (newValue) => {
  if (!newValue) {
    return;
  }

  // ローテータのAutoをOffにする
  // memo: AutoがOnの場合は、シリアルを繋ぎに行ってしまうため、設定画面を表示する際はOffにする必要がある
  autoStore.rotatorAuto = false;

  // 接続中のシリアルは切断する
  await ApiSirial.close();

  // テストモード関係も一旦無効化
  loadingTestBtn.value = false;
  isSerialOpen.value = false;

  reloadConfig();
});

/**
 * 現在のアプリ設定を取得し、画面に反映する
 */
async function reloadConfig() {
  // ローテーターの監視を終了する
  ApiAntennaTracking.stopCtrl();

  // データの取得
  const appConfig = await ApiAppConfig.getAppConfig();

  form.value.port = appConfig.rotator.port;
  form.value.borate = appConfig.rotator.baudrateBps;
  form.value.rotatorId = appConfig.rotator.rotatorId;
  form.value.makerId = appConfig.rotator.makerId;
  form.value.ipAddress = appConfig.rotator.ipAddress;
  form.value.ipPort = CommonUtil.toString(appConfig.rotator.ipPort);
  form.value.rangeAzMin = appConfig.rotator.rangeAzMin.toString();
  form.value.rangeAzMax = appConfig.rotator.rangeAzMax.toString();
  form.value.basePositionDegree = CommonUtil.toString(appConfig.rotator.basePositionDegree);
  form.value.moveMode = appConfig.rotator.moveMode;
  form.value.startAgoMinute = CommonUtil.toString(appConfig.rotator.startAgoMinute);

  // テストモードの値はクリアする
  form.value.testAz = "";
  form.value.testEl = "";
}

/**
 * OKクリック
 */
async function onOk() {
  // 入力チェック
  const result = await validateForm(form.value);
  if (!result) {
    return;
  }

  // 画面入力値をアプリ設定に反映
  const rotatorConfig = await ApiAppConfig.getAppConfig();
  rotatorConfig.rotator.port = form.value.port;
  rotatorConfig.rotator.baudrateBps = form.value.borate;
  rotatorConfig.rotator.makerId = form.value.makerId;
  rotatorConfig.rotator.rotatorId = form.value.rotatorId;
  rotatorConfig.rotator.ipAddress = form.value.ipAddress;
  rotatorConfig.rotator.ipPort = form.value.ipPort;
  rotatorConfig.rotator.basePositionDegree = parseInt(form.value.basePositionDegree);
  rotatorConfig.rotator.rangeAzMin = parseInt(form.value.rangeAzMin);
  rotatorConfig.rotator.rangeAzMax = parseInt(form.value.rangeAzMax);
  rotatorConfig.rotator.moveMode = form.value.moveMode;
  rotatorConfig.rotator.startAgoMinute = parseInt(form.value.startAgoMinute);

  // 保存
  await ApiAppConfig.storeAppConfig(rotatorConfig);

  // シリアル接続、ローテータ状態の監視開始
  // memo: OKクリック時に待たさせるのを避けるためawaitは敢えて付けてない。
  startNewConnect();

  // 親へ通知
  emits("onOk");
}

/**
 * キャンセルクリック
 */
async function cancelClick() {
  // シリアル接続、ローテータ状態の監視開始
  // memo: キャンセルクリック時に待たさせるのを避けるためawaitは敢えて付けてない。
  startNewConnect();

  // 親へ通知
  emits("onCancel");
}

/**
 * 更新クリック
 */
function onRefreshSerialPort() {
  serialPortSelectRef.value.refreshSerialPort();
}
</script>

<style lang="scss" scoped>
@import "./RotatorSetting.scss";
</style>
