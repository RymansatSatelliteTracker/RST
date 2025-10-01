<template>
  <v-dialog v-model="isShow" max-width="1000" @keydown.esc="isShow = false">
    <v-card color="grey-darken-4" class="pa-4 dialog_box">
      {{ I18nUtil.getMsg(I18nMsgs.GCOM_ROTATOR) }}

      <!-- タブ -->
      <v-tabs v-model="tab" @update:modelValue="onTabChange">
        <v-tab value="device" class="g_solid_border px-16 font-weight-bold"
          >{{ I18nUtil.getMsg(I18nMsgs.G51_TAB_CONNECTION) }}
        </v-tab>
        <v-tab value="behivior" class="g_solid_border px-16 font-weight-bold"
          >{{ I18nUtil.getMsg(I18nMsgs.G51_TAB_BEHIVIOR) }}
        </v-tab>
      </v-tabs>

      <!-- タブ内容 -->
      <v-card-text class="bg-grey-darken-4 g_solid_border">
        <!-- 機種設定 -->
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="device" transition="none" reverse-transition="none">
            <RotatorConn ref="refRotatorConn" v-model:form="form" />
          </v-tabs-window-item>
        </v-tabs-window>

        <!-- 動作設定 -->
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="behivior" transition="none" reverse-transition="none">
            <RotatorBehavior ref="refRotatorBehavior" v-model:form="form" />
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
import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiSirial from "@/renderer/api/ApiSirial";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { ref, watch } from "vue";
import RotatorBehavior from "./RotatorBehavior/RotatorBehavior.vue";
import RotatorConn from "./RotatorConn/RotatorConn.vue";
import RotatorSettingForm from "./RotatorSettingForm";

// イベント関係
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

// フォーム
const form = ref<RotatorSettingForm>(new RotatorSettingForm());

// 制御系データ
// ダイアログの表示可否
const isShow = defineModel("isShow");
const loadingTestBtn = ref(false);
const isSerialOpen = ref(false);
const refRotatorBehavior = ref();
const refRotatorConn = ref();
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

  // ローテータのAutoをOffにする
  // memo: AutoがOnの場合は、シリアルを繋ぎに行ってしまうため、設定画面を表示する際はOffにする必要がある
  autoStore.rotatorAuto = false;

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
  form.value.rangeElMin = appConfig.rotator.rangeElMin.toString();
  form.value.rangeElMax = appConfig.rotator.rangeElMax.toString();
  form.value.basePositionDegree = CommonUtil.toString(appConfig.rotator.basePositionDegree);
  form.value.moveMode = appConfig.rotator.moveMode;
  form.value.startAgoMinute = CommonUtil.toString(appConfig.rotator.startAgoMinute);
  form.value.parkPosAz = CommonUtil.toString(appConfig.rotator.parkPosAz);
  form.value.parkPosEl = CommonUtil.toString(appConfig.rotator.parkPosEl);

  // テストモードの値はクリアする
  form.value.testAz = "";
  form.value.testEl = "";
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
  rotatorConfig.rotator.rangeElMin = parseInt(form.value.rangeElMin);
  rotatorConfig.rotator.rangeElMax = parseInt(form.value.rangeElMax);
  rotatorConfig.rotator.moveMode = form.value.moveMode;
  rotatorConfig.rotator.startAgoMinute = parseInt(form.value.startAgoMinute);
  rotatorConfig.rotator.parkPosAz = parseInt(form.value.parkPosAz);
  rotatorConfig.rotator.parkPosEl = parseInt(form.value.parkPosEl);

  // 保存
  await ApiAppConfig.storeAppConfig(rotatorConfig);

  // シリアル接続、ローテータ状態の監視開始（機器設定のメソッドをコール）
  // memo: OKクリック時に待たさせるのを避けるためawaitは敢えて付けてない。
  refRotatorConn.value.startNewConnect();

  // 親へ通知
  emits("onOk");
}

/**
 * キャンセルクリック
 */
async function cancelClick() {
  // シリアル接続、ローテータ状態の監視開始（機器設定のメソッドをコール）
  // memo: キャンセルクリック時に待たさせるのを避けるためawaitは敢えて付けてない。
  refRotatorConn.value.startNewConnect();

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
    return await refRotatorConn.value.validateAll();
  }

  // 現在のタブが「動作設定」の場合
  if (currentTab.value === "behivior") {
    return await refRotatorBehavior.value.validateAll();
  }

  return true;
}
</script>

<style lang="scss" scoped>
@import "./RotatorSetting.scss";
</style>
