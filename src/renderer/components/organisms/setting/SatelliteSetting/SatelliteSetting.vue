<template>
  <div>
    <v-dialog max-width="900" v-model="isShow" persistent>
      <v-card color="grey-darken-4" class="pa-4 dialog-height">
        <!-- タブ設定 -->
        <v-tabs v-model="tab">
          <v-tab value="displaySatellite" class="custom-border px-16 font-weight-bold">{{
            I18nUtil.getMsg(I18nMsgs.G31_DISPLAY_SATELLITE)
          }}</v-tab>
          <v-tab value="loadTLE" class="custom-border px-16 font-weight-bold">{{
            I18nUtil.getMsg(I18nMsgs.G32_TLE_LOAD)
          }}</v-tab>
          <v-tab value="otherSetting" class="custom-border px-16 font-weight-bold">{{
            I18nUtil.getMsg(I18nMsgs.G33_OTHER_SETTING)
          }}</v-tab>
        </v-tabs>

        <!-- タブ内容 -->
        <v-card-text class="bg-grey-darken-4 custom-border pa-8 h-75">
          <v-tabs-window v-model="tab">
            <!-- 表示衛星 -->
            <v-tabs-window-item value="displaySatellite">
              <DisplaySatelliteTab
                v-show="apiConfigData.satelliteGroupsForSatSetting"
                v-model:satelliteGroups="apiConfigData.satelliteGroupsForSatSetting"
              />
            </v-tabs-window-item>

            <!-- TLE読み込み -->
            <v-tabs-window-item value="loadTLE">
              <LoadTLETab
                ref="loadTLETabRef"
                v-show="apiConfigData.tle.urls"
                v-model:tleUrls="apiConfigData.tle.urls"
              />
            </v-tabs-window-item>

            <!-- その他設定 -->
            <v-tabs-window-item value="otherSetting">
              <OtherSettingTab
                v-show="apiConfigData.satelliteSetting"
                v-model:satelliteSetting="apiConfigData.satelliteSetting"
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <v-card-actions>
          <v-btn @click="onOk" variant="outlined" size="large">{{ I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK) }}</v-btn>
          <v-btn @click="onCancel" variant="outlined" size="large" class="ml-5">{{
            I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import DisplaySatelliteTab from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/DisplaySatelliteTab.vue";
import LoadTLETab from "@/renderer/components/organisms/setting/SatelliteSetting/LoadTLE/LoadTLETab.vue";
import OtherSettingTab from "@/renderer/components/organisms/setting/SatelliteSetting/OtherSetting/OtherSettingTab.vue";
import emitter from "@/renderer/util/EventBus";

import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import ApiActiveSat from "@/renderer/api/ApiActiveSat";
import ApiConfig from "@/renderer/api/ApiAppConfig";
import ApiDefaultSatellite from "@/renderer/api/ApiDefaultSatellite";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
import { nextTick, onMounted, ref, toRaw } from "vue";

// タブの状態を管理するref
const tab = ref(null);
// アプリケーション設定を管理するref
const apiConfigData = ref<AppConfigSatSettingModel>(new AppConfigSatSettingModel());
// バリデーションチェック用のformのref
const loadTLETabRef = ref();

// ダイアログの表示可否
const isShow = defineModel("isShow");
const emits = defineEmits<{ (e: "onOk"): void; (e: "onCancel"): void }>();

onMounted(() => {
  // 表示時に設定ファイルを読み込む
  getAppConfig();
});

/**
 * ダイアログをOKボタンで閉じる
 */
async function onOk() {
  await nextTick();
  // 画面を開かないとロードしないので判定する
  // 画面を開かない場合は編集もできないのでチェックしない
  if (loadTLETabRef.value) {
    const result = await loadTLETabRef.value.onOk();
    if (result !== "OK") {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, result);
      return;
    }
  }

  // TLEのURLが更新されているか確認
  // 保存の前にやらないとURLの情報が同期してしまう
  const isTLEUpdated = loadTLETabRef.value.isTLEUpdated();

  // 保存
  await saveAppConfig();

  // 衛星パス抽出最小仰角を更新する
  await ActiveSatServiceHub.getInstance().updateSatChoiceMinEl(
    apiConfigData.value.satelliteSetting.satelliteChoiceMinEl
  );

  // TLEが更新されていたらデフォルト衛星情報を作り直す
  // 保存の後にやらないと設定ファイルのURLが変更されないのでTLEが更新されない
  if (isTLEUpdated) {
    const ret = await ApiDefaultSatellite.reCreateDefaultSatellite();
    if (!ret) {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.ERR_FAIL_TO_UPDATE_TLE_URL));
      return;
    }
  }

  // 親へ通知
  emits("onOk");
}

/**
 * ダイアログを閉じるボタンで閉じる
 */
function onCancel() {
  // 親に通知(ダイアログクローズ)
  emits("onCancel");
}

/**
 * アプリケーション設定取得
 */
async function getAppConfig() {
  try {
    const response = await ApiConfig.getAppConfigSatSetting();
    apiConfigData.value = response;
  } catch (error) {
    AppRendererLogger.error("設定ファイルの読み込みに失敗しました", error);
  }
}

/**
 * アプリケーション設定登録
 */
async function saveAppConfig() {
  // 次のgetAppConfigすると値が変わってしまうのでdeepcopyする
  const outputData: AppConfigSatSettingModel = JSON.parse(JSON.stringify(toRaw(apiConfigData.value)));
  // satellites配下が変わることがあるので最新のアプリケーション設定を取得
  const appConfig = await ApiConfig.getAppConfigSatSetting();
  // 表示衛星画面用
  appConfig.satelliteGroupsForSatSetting = outputData.satelliteGroupsForSatSetting;
  // TLE読み込み画面用
  appConfig.tle.urls = outputData.tle.urls;
  // その他設定用
  appConfig.satelliteSetting = outputData.satelliteSetting;

  ApiConfig.storeAppSatSettingConfig(appConfig);

  // 衛星設定を更新したことを通知
  await ApiActiveSat.refreshAppConfig();
}
</script>
<style lang="scss" scoped>
@import "./SatelliteSetting.scss";
</style>
