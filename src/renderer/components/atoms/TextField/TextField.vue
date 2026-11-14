<template>
  <v-text-field
    v-model="model"
    variant="outlined"
    hide-details
    :error="!CommonUtil.isEmpty(errorText)"
    class="textfield"
    @blur="onInput(model)"
  >
    <ValidateTooltip :target="errorText" />
  </v-text-field>
</template>

<script setup lang="ts">
import CommonUtil from "@/common/CommonUtil.js";
import { useValidate } from "@/renderer/common/hook/useValidate.js";
import ValidateTooltip from "@/renderer/components/atoms/ValidateTooltip/ValidateTooltip.vue";
import { onMounted } from "vue";
import type { PropType } from "vue";
import type { AnyZodObject } from "zod";

const model = defineModel<string>({ default: "" });
const errorText = defineModel<string>("errorText", { required: false, default: "" });

const props = defineProps({
  valiSchema: {
    type: Object as PropType<AnyZodObject | null>,
    required: false,
    default: null,
  },
  valiSchemaFieldPath: {
    type: String,
    required: false,
    default: "",
  },
});

const { validateAt } = useValidate(props.valiSchema);

onMounted(() => {
  // エラーメッセージをクリア
  errorText.value = "";
});

/**
 * 入力イベントのハンドラ
 */
async function onInput(val: string) {
  errorText.value = await validateAt(props.valiSchemaFieldPath, val);
}
</script>

<style module lang="scss" scoped></style>
