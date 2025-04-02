<template>
  <v-row>
    <!-- 左側 -->
    <v-col cols="7">
      <v-row>
        <v-col cols="12">
          <!-- メーカー -->
          <div class="d-flex">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G51_MAKER) }}</label>
            <div class="form_select">
              <RotatorMakerSelect
                v-model:selectedValue="form.makerId"
                v-model:rotatorId="form.rotatorId"
                :needEmpty="true"
              />
            </div>
          </div>

          <!-- 機種 -->
          <div class="d-flex mt-2">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G51_DEVICE) }}</label>
            <div class="form_select">
              <RotatorDeviceSelect
                v-model:selectedValue="form.rotatorId"
                v-model:makerId="form.makerId"
                :needEmpty="false"
              />
            </div>
          </div>

          <!-- シリアルポート -->
          <div class="d-flex mt-2">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G51_SERIAL_PORT) }}</label>
            <div class="form_select">
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
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G51_BORATE) }}</label>
            <div class="form_select">
              <BorateSelect v-model:selectedValue="form.borate" :needEmpty="true" />
            </div>
          </div>

          <!-- 接続テスト -->
          <div class="d-flex mt-2">
            <label class="label form_label"></label>
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
              <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.GCOM_AZ) }}</label>
              <label class="label w-100per text-right pr-4"
                >{{ CommonUtil.numFormat(antennaPosition.azimuth, 1) }}°</label
              >
            </div>
          </v-col>

          <!-- 現在のEl -->
          <v-col cols="6">
            <div class="d-flex mt-2">
              <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.GCOM_EL) }}</label>
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
                :valiSchema="valiSchemaRotatorConn"
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
                :valiSchema="valiSchemaRotatorConn"
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
            <label class="label form_label g_invalid_item_label">{{ I18nUtil.getMsg(I18nMsgs.G51_IPADDRESS) }}</label>
            <TextField
              v-model="form.ipAddress"
              maxlength="15"
              :valiSchema="valiSchemaRotatorConn"
              valiSchemaFieldPath="ipAddress"
              v-model:error-text="errors.ipAddress"
              disabled
            />
          </div>

          <!-- ポート -->
          <div class="d-flex mt-2">
            <label class="label form_label g_invalid_item_label">{{
              I18nUtil.getMsg(I18nMsgs.G51_IPADDRESS_PORT)
            }}</label>
            <TextField
              v-model="form.ipPort"
              maxlength="5"
              :valiSchema="valiSchemaRotatorConn"
              valiSchemaFieldPath="ipPort"
              v-model:error-text="errors.ipPort"
              disabled
            />
          </div>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import BorateSelect from "@/renderer/components/molecules/BorateSelect/BorateSelect.vue";
import RotatorDeviceSelect from "@/renderer/components/molecules/RotatorDeviceSelect/RotatorDeviceSelect.vue";
import RotatorMakerSelect from "@/renderer/components/molecules/RotatorMakerSelect/RotatorMakerSelect.vue";
import SerialPortSelect from "@/renderer/components/molecules/SerialPortSelect/SerialPortSelect.vue";
import { mdiArrowDownBold, mdiArrowLeftBold, mdiArrowRightBold, mdiArrowUpBold } from "@mdi/js";
import { ref } from "vue";
import { RotatorConnForm } from "../RotatorSettingForm";
import { useRotatorConnValidate, valiSchemaRotatorConn } from "./useRotatorConnValidate";
import useRotatorCtrl from "./useRotatorCtrl";
import useRotatorMonitor from "./useRotatorMonitor";
import useRotatorTestConnect from "./useRotatorTestConnect";

// 親との送受信
const form = defineModel<RotatorConnForm>("form", { required: true });

// 「更新」クリック時に更新ボタン側のメソッドをコールするためのref
const serialPortSelectRef = ref();
const antennaPosition = ref<AntennaPositionModel>({ azimuth: 0, elevation: 0 });

// 制御系データ
const loadingTestBtn = ref(false);
const isSerialOpen = ref(false);

// 入力チェック関係
const { validateForm, errors } = useRotatorConnValidate();

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

// 親に解放するメソッド
defineExpose({
  validateAll,
  startNewConnect,
});

/**
 * 更新クリック
 */
function onRefreshSerialPort() {
  serialPortSelectRef.value.refreshSerialPort();
}

/**
 * 入力チェック
 */
async function validateAll(): Promise<boolean> {
  return await validateForm(form.value);
}
</script>

<style lang="scss" scoped>
@import "./RotatorConn.scss";
</style>
