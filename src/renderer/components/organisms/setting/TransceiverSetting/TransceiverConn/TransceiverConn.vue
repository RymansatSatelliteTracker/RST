<template>
  <v-row>
    <!-- 左側 -->
    <v-col cols="7">
      <v-row>
        <v-col cols="12">
          <!-- メーカー -->
          <div class="d-flex">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G41_MAKER) }}</label>
            <div class="form_select">
              <TransceiverMakerSelect
                v-model:selected-value="form.makerId"
                v-model:transceiver-id="form.transceiverId"
                :need-empty="true"
              />
            </div>
          </div>

          <!-- 機種 -->
          <div class="d-flex mt-2">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G41_DEVICE) }}</label>
            <div class="form_select">
              <TransceiverDeviceSelect
                v-model:selected-value="form.transceiverId"
                v-model:maker-id="form.makerId"
                :need-empty="false"
              />
            </div>
          </div>

          <!-- シリアルポート -->
          <div class="d-flex mt-2">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G41_SERIAL_PORT) }}</label>
            <div class="form_select">
              <SerialPortSelect ref="serialPortSelectRef" v-model:selected-value="form.port" :need-empty="true" />
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

          <!-- CI-Vアドレス(icom無線機のみ必須) -->
          <div class="d-flex mt-2">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G41_CIVADDRESS) }}</label>
            <div class="form_select">
              <TextField
                v-model="form.civAddress"
                :disabled="form.makerId !== Constant.Transceiver.MakerId.ICOM"
                maxlength="2"
                :need-empty="true"
              />
            </div>
          </div>

          <!-- ボーレート -->
          <div class="d-flex mt-2">
            <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G41_BORATE) }}</label>
            <div class="form_select">
              <BorateSelect v-model:selected-value="form.borate" :need-empty="true" />
            </div>
          </div>

          <!-- 接続テスト -->
          <div class="d-flex mt-2">
            <label class="label form_label"></label>
            <v-btn
              variant="outlined"
              size="small"
              :text="I18nUtil.getMsg(I18nMsgs.G41_TEST_CONNECT)"
              :loading="loadingTestBtn"
              class="mr-0"
              :disabled="!validTest"
              @click="connTest"
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
            <label class="label form_label g_invalid_item_label">{{ I18nUtil.getMsg(I18nMsgs.G41_IPADDRESS) }}</label>
            <TextField
              v-model="form.ipAddress"
              v-model:error-text="errors.ipAddress"
              maxlength="15"
              :vali-schema="valiSchemaTransceiverSetting"
              vali-schema-field-path="ipAddress"
              disabled
            />
          </div>

          <!-- ポート -->
          <div class="d-flex mt-2">
            <label class="label form_label g_invalid_item_label">{{
              I18nUtil.getMsg(I18nMsgs.G41_IPADDRESS_PORT)
            }}</label>
            <TextField
              v-model="form.ipPort"
              v-model:error-text="errors.ipPort"
              maxlength="5"
              :vali-schema="valiSchemaTransceiverSetting"
              vali-schema-field-path="ipPort"
              disabled
            />
          </div>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import BorateSelect from "@/renderer/components/molecules/BorateSelect/BorateSelect.vue";
import SerialPortSelect from "@/renderer/components/molecules/SerialPortSelect/SerialPortSelect.vue";
import TransceiverDeviceSelect from "@/renderer/components/molecules/TransceiverDeviceSelect/TransceiverDeviceSelect.vue";
import TransceiverMakerSelect from "@/renderer/components/molecules/TransceiverMakerSelect/TransceiverMakerSelect.vue";
import { ref, watch } from "vue";
import type TransceiverConnForm from "./TransceiverConnForm.js";
import { useTransceiverConnValidate, valiSchemaTransceiverSetting } from "./useTransceiverConnValidate.js";
import useTransceiverCtrl from "./useTransceiverCtrl.js";
import useTransceiverTestConnect from "./useTransceiverTestConnect.js";

// 親との送受信
const form = defineModel<TransceiverConnForm>("form", { required: true });

// ダイアログの表示可否
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// 「更新」クリック時に更新ボタン側のメソッドをコールするためのref
const serialPortSelectRef = ref();

// 入力チェック関係
const { validateForm, errors } = useTransceiverConnValidate();

// 制御系データ
const loadingTestBtn = ref(false);
const isSerialOpen = ref(false);

// フック
const { startNewConnect } = useTransceiverCtrl(form);
const { connTest, validTest } = useTransceiverTestConnect(form, isSerialOpen, loadingTestBtn, startNewConnect);

// 親に解放するメソッド
defineExpose({
  validateAll,
  startNewConnect,
});

// メーカーID、機種IDが変更された場合、CI-Vアドレスを設定する
watch(
  [() => form.value.makerId, () => form.value.transceiverId],
  async ([newMakerId, newTransceiverId], [oldMakerId, oldTransceiverId]) => {
    if (newMakerId !== Constant.Transceiver.MakerId.ICOM) {
      // ICOM無線機以外の場合はCI-Vアドレスの入力項目を初期化して中断する
      form.value.civAddress = "";
      return;
    }

    if (CommonUtil.isEmpty(oldMakerId) && CommonUtil.isEmpty(oldTransceiverId)) {
      // 初期表示時はAppConfigに保存されたCI-Vアドレスを反映するため中断する
      return;
    }

    // CI-Vアドレスの入力項目を初期化する
    form.value.civAddress = "";
    // 無線機定義を取得する
    const config = await ApiAppConfig.getTransceiverConfig();
    const maker = config.transceivers.find((m) => m.makerId === newMakerId);
    if (maker) {
      const device = maker.devices.find((d) => d.transceiverId === newTransceiverId);
      if (device) {
        // 無線機のCI-Vアドレスを設定する
        form.value.civAddress = device.civAddress;
      }
    }
  }
);

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
@use "./TransceiverConn" as *;
</style>
