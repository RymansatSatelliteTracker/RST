<!-- その他設定タブ -->
<template>
  <v-form>
    <v-sheet theme="dark" outlined width="100%" height="100%" class="pa-3">
      <v-row>
        <!-- 1列目 -->
        <v-col cols="6">
          <!-- 最小仰角 -->
          <v-row>
            <v-col col="12">
              <div class="d-flex">
                <label class="label form__label" for="elevation">{{
                  I18nUtil.getMsg(I18nMsgs.G33_MIN_ELEVATION)
                }}</label>
                <div class="form__select">
                  <SatelliteChoiceMinElSelect
                    v-model="satelliteSetting.satelliteChoiceMinEl"
                  ></SatelliteChoiceMinElSelect>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-sheet>
  </v-form>
</template>
<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import SatelliteChoiceMinElSelect from "@/renderer/components/molecules/SatelliteChoiceMinElSelect/SatelliteChoiceMinElSelect.vue";

import { AppConfigSatelliteSetting } from "@/common/model/AppConfigModel";

const satelliteSetting = defineModel<AppConfigSatelliteSetting>("satelliteSetting", {
  default: AppConfigSatelliteSetting,
});
</script>
<style lang="scss" scoped>
@import "./OtherSettingTab.scss";
</style>
