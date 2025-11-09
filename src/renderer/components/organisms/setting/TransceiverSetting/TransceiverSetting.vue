<template>
  <v-dialog v-model="isShow" max-width="1000" @keydown.esc="isShow = false">
    <v-card color="grey-darken-4" class="pa-4 dialog_box">
      {{ I18nUtil.getMsg(I18nMsgs.GCOM_RADIO) }}

      <!-- タブ -->
      <v-tabs v-model="tab" @update:modelValue="onTabChange">
        <v-tab value="device" class="g_solid_border px-16 font-weight-bold"
          >{{ I18nUtil.getMsg(I18nMsgs.G41_TAB_CONNECTION) }}
        </v-tab>
        <v-tab value="behivior" class="g_solid_border px-16 font-weight-bold"
          >{{ I18nUtil.getMsg(I18nMsgs.G41_TAB_BEHIVIOR) }}
        </v-tab>
      </v-tabs>

      <!-- タブ内容 -->
      <v-card-text class="bg-grey-darken-4 g_solid_border">
        <!-- 機種設定 -->
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="device" transition="none" reverse-transition="none">
            <TransceiverConn ref="refTravsceiverConn" v-model:form="form" />
          </v-tabs-window-item>
        </v-tabs-window>

        <!-- 動作設定 -->
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="behivior" transition="none" reverse-transition="none">
            <TransceiverBegavior v-model:form="form" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="outlined" size="large" :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK)" @click="onOk"></v-btn>
        <v-btn
          variant="outlined"
          size="large"
          :text="I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)"
          class="ml-5"
          @click="cancelClick"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiSirial from "@/renderer/api/ApiSirial";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { ref, watch } from "vue";
import TransceiverBegavior from "./TransceiverBegavior/TransceiverBegavior.vue";
import TransceiverConn from "./TransceiverConn/TransceiverConn.vue";
import TransceiverSettingForm from "./TransceiverSettingForm";

// イベント関係
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// フォーム
const form = ref<TransceiverSettingForm>(new TransceiverSettingForm());

// 制御系データ
// ダイアログの表示可否
const isShow = defineModel("isShow");
const loadingTestBtn = ref(false);
const isSerialOpen = ref(false);
const refTravsceiverConn = ref();
// v-tabsの現在のタブ
const tab = ref("device");
// アプリ側で管理する現在のタブ
// memo: 入力エラー時にタブを戻すために、アプリ側で管理する必要がある
const currentTab = ref("device");

// フック
const autoStore = useStoreAutoState();

// 親画面からの表示指示を監視し、表示時はデータを再取得する
watch(isShow, async (newValue) => {
  if (!newValue) {
    return;
  }

  // 無線機のAutoをOffにする
  // memo: AutoがOnの場合は、シリアルを繋ぎに行ってしまうため、設定画面を表示する際はOffにする必要がある
  autoStore.tranceiverAuto = false;

  // 接続中のシリアルは切断する
  await ApiSirial.close();

  // テストモード関係も一旦無効化
  loadingTestBtn.value = false;
  isSerialOpen.value = false;

  // 「機種設定」タブで初期表示する
  tab.value = "device";
  currentTab.value = "device";

  reloadConfig();
});

/**
 * 現在のアプリ設定を取得し、画面に反映する
 */
async function reloadConfig() {
  // ローテーターの監視を終了する
  ApiTransceiver.stopCtrl();

  // データの取得
  const transceiverConfig = await ApiAppConfig.getAppConfig();

  form.value.port = transceiverConfig.transceiver.port;
  form.value.civAddress = "";
  // ICOMの場合はCI-Vアドレスを設定する
  if (transceiverConfig.transceiver.makerId === Constant.Transceiver.MakerId.ICOM) {
    form.value.civAddress = transceiverConfig.transceiver.civAddress;
  }
  form.value.borate = transceiverConfig.transceiver.baudrateBps;
  form.value.transceiverId = transceiverConfig.transceiver.transceiverId;
  form.value.makerId = transceiverConfig.transceiver.makerId;
  form.value.ipAddress = transceiverConfig.transceiver.ipAddress;
  form.value.ipPort = transceiverConfig.transceiver.ipPort.toString();
  form.value.autoTrackingIntervalSec = transceiverConfig.transceiver.autoTrackingIntervalSec;
  form.value.autoTrackingStartEndTime = transceiverConfig.transceiver.autoTrackingStartEndTime;
}

/**
 * OKクリック
 */
async function onOk() {
  // 子コンポーネントを含めた入力チェックを行う
  const result = await validateTabContents();
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
  transceiverConfig.transceiver.autoTrackingIntervalSec = form.value.autoTrackingIntervalSec;
  transceiverConfig.transceiver.autoTrackingStartEndTime = form.value.autoTrackingStartEndTime;

  // 保存
  await ApiAppConfig.storeAppConfig(transceiverConfig);

  // シリアル接続、無線機の状態監視開始
  // memo: OKクリック時に待たさせるのを避けるためawaitは敢えて付けてない。
  refTravsceiverConn.value.startNewConnect();

  // 親へ通知
  emits("onOk");
}

/**
 * キャンセルクリック
 */
async function cancelClick() {
  // シリアル接続、無線機の状態監視開始
  // memo: キャンセルクリック時に待たさせるのを避けるためawaitは敢えて付けてない。
  refTravsceiverConn.value.startNewConnect();

  // 親へ通知
  emits("onCancel");
}

/**
 * タブの選択変更時
 */
async function onTabChange() {
  // エラー時はタブの選択状態を戻す（留まる）
  const result = await validateTabContents();
  if (!result) {
    tab.value = currentTab.value;
    return;
  }

  // 現在のタブを保持
  currentTab.value = tab.value;
}

/**
 * 現在のタブ配下の入力チェックを行う
 */
async function validateTabContents(): Promise<boolean> {
  // 現在のタブが「機器設定」の場合
  if (currentTab.value === "device") {
    return await refTravsceiverConn.value.validateAll();
  }
  // 現在のタブが「動作設定」の場合は入力チェックなし（現状はSelectBoxのみのため）

  return true;
}
</script>

<style lang="scss" scoped>
@import "./TransceiverSetting.scss";
</style>
