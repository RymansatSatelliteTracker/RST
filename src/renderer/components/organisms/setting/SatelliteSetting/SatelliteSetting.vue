<template>
  <div>
    <v-dialog v-model="isShow" max-width="900" persistent>
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
                v-model:satellite-groups="apiConfigData.satelliteGroupsForSatSetting"
              />
            </v-tabs-window-item>

            <!-- TLE読み込み -->
            <v-tabs-window-item value="loadTLE">
              <LoadTLETab
                v-show="apiConfigData.tle.urls"
                ref="loadTLETabRef"
                v-model:tle-urls="apiConfigData.tle.urls"
              />
            </v-tabs-window-item>

            <!-- その他設定 -->
            <v-tabs-window-item value="otherSetting">
              <OtherSettingTab
                v-show="apiConfigData.satelliteSetting"
                v-model:satellite-setting="apiConfigData.satelliteSetting"
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <v-card-actions>
          <v-btn variant="outlined" size="large" @click="onOk">{{ I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_OK) }}</v-btn>
          <v-btn variant="outlined" size="large" class="ml-5" @click="onCancel">{{
            I18nUtil.getMsg(I18nMsgs.GCOM_ACTION_CANCEL)
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import DisplaySatelliteTab from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/DisplaySatelliteTab.vue";
import LoadTLETab from "@/renderer/components/organisms/setting/SatelliteSetting/LoadTLE/LoadTLETab.vue";
import OtherSettingTab from "@/renderer/components/organisms/setting/SatelliteSetting/OtherSetting/OtherSettingTab.vue";
import emitter from "@/renderer/util/EventBus.js";

import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel.js";
import type { ApiResponse } from "@/common/types/types.js";
import ApiActiveSat from "@/renderer/api/ApiActiveSat.js";
import ApiConfig from "@/renderer/api/ApiAppConfig.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import AppRendererLogger from "@/renderer/util/AppRendererLogger.js";
import { nextTick, onMounted, ref, toRaw } from "vue";

// タブの状態を管理するref
const tab = ref(null);
// アプリケーション設定を管理するref
const apiConfigData = ref<AppConfigSatSettingModel>(new AppConfigSatSettingModel());
// バリデーションチェック用のformのref
const loadTLETabRef = ref();

// ダイアログの表示可否
const isShow = defineModel<boolean>("isShow");
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

  // 登録処理を実施
  await regist().then((ret) => {
    // 親に通知(ダイアログクローズ)
    if (ret) emits("onOk");
  });
}

/**
 * アプリケーション設定を登録する
 * @returns {Promise<boolean>} true:登録成功/false:登録失敗
 */
async function regist(): Promise<boolean> {
  // 画面を開かないとロードしないので判定する
  // 画面を開かない場合は編集もできないのでチェックしない
  let isTleUpdated = false;
  if (loadTLETabRef.value) {
    const result = await loadTLETabRef.value.onOk();
    if (result !== "OK") {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, result);
      return false;
    }
    // TLEのURLが更新されているか確認
    // 保存の前にやらないとURLの情報が同期してしまう
    isTleUpdated = loadTLETabRef.value.isTLEUpdated();
  }

  // 更新
  await updateAppConfig(isTleUpdated);

  return true;
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
async function updateAppConfig(isTleUpdated: boolean) {
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

  ApiConfig.storeAppSatSettingConfig(appConfig, isTleUpdated)
    .then(async (res: ApiResponse<void>) => {
      if (!res.status) {
        emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
        return;
      }
      // 衛星設定を更新したことを通知
      await ApiActiveSat.refreshAppConfig();
      // 衛星パス抽出最小仰角を更新する
      await ActiveSatServiceHub.getInstance().updateSatChoiceMinEl(
        apiConfigData.value.satelliteSetting.satelliteChoiceMinEl
      );
    })
    .catch((e) => {
      // 想定外エラーの場合
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, e.message);
    });
}
</script>
<style lang="scss" scoped>
@use "./SatelliteSetting" as *;
</style>
