<template>
  <v-dialog v-model="isShow" max-width="1000" @keydown.esc="isShow = false">
    <v-sheet color="grey-darken-4" outlined width="100%" height="100%" class="text-center pa-3">
      <v-sheet color="grey-darken-4" outlined width="300" height="100%" class="title__sheet--border text-center pa-1">{{
        I18nUtil.getMsg(I18nMsgs.GCOM_RADIO)
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
                    <TransceiverMakerSelect
                      v-model:selectedValue="form.makerId"
                      v-model:transceiverId="form.transceiverId"
                      :needEmpty="true"
                    />
                  </div>
                </div>

                <!-- 機種 -->
                <div class="d-flex mt-2">
                  <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G51_DEVICE) }}</label>
                  <div class="form__select">
                    <TransceiverDeviceSelect
                      v-model:selectedValue="form.transceiverId"
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

                <!-- CI-Vアドレス(icom無線機のみ必須) -->
                <div class="d-flex mt-2">
                  <label class="label form__label">{{ I18nUtil.getMsg(I18nMsgs.G51_CIVADDRESS) }}</label>
                  <div class="form__select">
                    <TextField
                      :disabled="form.makerId !== Constant.Transceiver.MakerId.ICOM"
                      v-model="form.civAddress"
                      maxlength="2"
                      :needEmpty="true"
                    />
                  </div>
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
                    :valiSchema="valiSchemaTransceiverSetting"
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
                    :valiSchema="valiSchemaTransceiverSetting"
                    valiSchemaFieldPath="ipPort"
                    v-model:error-text="errors.ipPort"
                    disabled
                  />
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
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiSirial from "@/renderer/api/ApiSirial";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import BorateSelect from "@/renderer/components/molecules/BorateSelect/BorateSelect.vue";
import SerialPortSelect from "@/renderer/components/molecules/SerialPortSelect/SerialPortSelect.vue";
import TransceiverDeviceSelect from "@/renderer/components/molecules/TransceiverDeviceSelect/TransceiverDeviceSelect.vue";
import TransceiverMakerSelect from "@/renderer/components/molecules/TransceiverMakerSelect/TransceiverMakerSelect.vue";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { ref, watch } from "vue";
import TransceiverSettingForm from "./TransceiverSettingForm";
import useTransceiverCtrl from "./useTransceiverCtrl";
import { useTransceiverSettingValidate, valiSchemaTransceiverSetting } from "./useTransceiverSettingValidate";
import useTransceiverTestConnect from "./useTransceiverTestConnect";

// ダイアログの表示可否
const isShow = defineModel("isShow");
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// フォーム
const form = ref<TransceiverSettingForm>(new TransceiverSettingForm());

// 「更新」クリック時に更新ボタン側のメソッドをコールするためのref
const serialPortSelectRef = ref();

// 制御系データ
const loadingTestBtn = ref(false);
const isSerialOpen = ref(false);

// フック
const { startNewConnect } = useTransceiverCtrl(form);
const { connTest, validTest } = useTransceiverTestConnect(form, isSerialOpen, loadingTestBtn, startNewConnect);
const autoStore = useStoreAutoState();

// 入力チェック関係
const { validateForm, errors } = useTransceiverSettingValidate();

// 親画面からの表示指示を監視し、表示時はデータを再取得する
watch(isShow, async (newValue) => {
  if (!newValue) {
    return;
  }

  // 無線機のAutoをOffにする
  autoStore.tranceiverAuto = false;

  // 接続中のシリアルは切断する
  await ApiSirial.close();

  // テストモード関係も一旦無効化
  loadingTestBtn.value = false;
  isSerialOpen.value = false;

  reloadConfig();
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
 * 現在のアプリ設定を取得し、画面に反映する
 */
async function reloadConfig() {
  // ローテーターの監視を終了する
  ApiTransceiver.stopCtrl();

  // データの取得
  const transceiverConfig = await ApiAppConfig.getAppConfig();

  form.value.port = transceiverConfig.transceiver.port;
  if (transceiverConfig.transceiver.makerId === Constant.Transceiver.MakerId.ICOM) {
    // ICOMの場合はCI-Vアドレスを取得する
    form.value.civAddress = transceiverConfig.transceiver.civAddress;
  } else {
    form.value.civAddress = "";
  }
  form.value.borate = transceiverConfig.transceiver.baudrateBps;
  form.value.transceiverId = transceiverConfig.transceiver.transceiverId;
  form.value.makerId = transceiverConfig.transceiver.makerId;
  form.value.ipAddress = transceiverConfig.transceiver.ipAddress;
  form.value.ipPort = transceiverConfig.transceiver.ipPort.toString();
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
  const transceiverConfig = await ApiAppConfig.getAppConfig();
  transceiverConfig.transceiver.port = form.value.port;
  if (form.value.makerId === Constant.Transceiver.MakerId.ICOM) {
    // ICOMの場合はCI-Vアドレスを設定する
    transceiverConfig.transceiver.civAddress = form.value.civAddress;
  } else {
    transceiverConfig.transceiver.civAddress = "";
  }
  transceiverConfig.transceiver.baudrateBps = form.value.borate;
  transceiverConfig.transceiver.makerId = form.value.makerId;
  transceiverConfig.transceiver.transceiverId = form.value.transceiverId;
  transceiverConfig.transceiver.ipAddress = form.value.ipAddress;
  transceiverConfig.transceiver.ipPort = form.value.ipPort;

  // 保存
  await ApiAppConfig.storeAppConfig(transceiverConfig);

  // シリアル接続、無線機の状態監視開始
  // memo: OKクリック時に待たさせるのを避けるためawaitは敢えて付けてない。
  startNewConnect();

  // 親へ通知
  emits("onOk");
}

/**
 * キャンセルクリック
 */
async function cancelClick() {
  // シリアル接続、無線機の状態監視開始
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
@import "./TransceiverSetting.scss";
</style>
