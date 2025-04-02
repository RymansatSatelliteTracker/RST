<template>
  <!-- 左側 -->
  <v-row>
    <v-col cols="6">
      <!-- 方位可動範囲 -->
      <div>
        <div class="d-flex">
          <label class="label form_label g_invalid_item_label">{{ I18nUtil.getMsg(I18nMsgs.G51_AZ_KADO_HANI) }}</label>
        </div>
        <div class="d-flex">
          <!-- 最小 -->
          <label class="label form_label_az_min pl-3 g_invalid_item_label"
            >{{ I18nUtil.getMsg(I18nMsgs.G51_AZ_KADO_HANI_MIN) }}(°)</label
          >
          <div class="d-flex">
            <TextField
              v-model="form.rangeAzMin"
              suffix="°"
              class="right"
              maxlength="3"
              :valiSchema="valiSchemaRotatorBehavior"
              valiSchemaFieldPath="rangeAzMin"
              v-model:error-text="errors.rangeAzMin"
              disabled
            />

            <!-- 最大 -->
            <label class="label form_label_az_max text-right pr-2 g_invalid_item_label"
              >{{ I18nUtil.getMsg(I18nMsgs.G51_AZ_KADO_HANI_MAX) }}(°)</label
            >
            <TextField
              v-model="form.rangeAzMax"
              suffix="°"
              class="right"
              maxlength="3"
              :valiSchema="valiSchemaRotatorBehavior"
              valiSchemaFieldPath="rangeAzMax"
              v-model:error-text="errors.rangeAzMax"
              disabled
            />
          </div>
        </div>

        <!-- 起点(°) -->
        <div class="d-flex mt-2">
          <label class="label form_label pl-3 g_invalid_item_label"
            >{{ I18nUtil.getMsg(I18nMsgs.G51_BASE_POSITION_DEGREE) }}(°)</label
          >
          <TextField
            v-model="form.basePositionDegree"
            suffix="°"
            class="right"
            maxlength="3"
            :valiSchema="valiSchemaRotatorBehavior"
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
          <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G51_MOVE_MODE) }}</label>
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

        <!-- 自動追尾準備・終了時間 -->
        <div class="d-flex mt-2">
          <label class="label form_label">{{ I18nUtil.getMsg(I18nMsgs.G51_START_AGO_MINUTE) }}</label>
          <TextField
            v-model="form.startAgoMinute"
            :suffix="I18nUtil.getMsg(I18nMsgs.G51_START_AGO_MINUTE_SUFIX)"
            class="right"
            maxlength="2"
            :valiSchema="valiSchemaRotatorBehavior"
            valiSchemaFieldPath="startAgoMinute"
            v-model:error-text="errors.startAgoMinute"
          />
        </div>
      </div>
    </v-col>

    <!-- 右側（ダミー） -->
    <v-col cols="6" />
  </v-row>
</template>

<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";
import { RotatorSettingForm } from "../RotatorSettingForm";
import { useRotatorBehaviorValidate, valiSchemaRotatorBehavior } from "./useRotatorBehaviorValidate";

// 親との送受信
const form = defineModel<RotatorSettingForm>("form", { required: true });

// 入力チェック関係
const { validateForm, errors } = useRotatorBehaviorValidate();

// 親に解放するメソッド
defineExpose({
  validateAll,
});

/**
 * 入力チェック
 */
async function validateAll() {
  return await validateForm(form.value);
}
</script>

<style lang="scss" scoped>
@import "./RotatorBehavior.scss";
</style>
