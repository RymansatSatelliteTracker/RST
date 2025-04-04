<template>
  <v-text-field
    v-model="displayValue"
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
import CommonUtil from "@/common/CommonUtil";
import { useValidate } from "@/renderer/common/hook/useValidate";
import ValidateTooltip from "@/renderer/components/atoms/ValidateTooltip/ValidateTooltip.vue";
import { onMounted, ref, watch } from "vue";

const model = defineModel<any>();
const errorText = defineModel<string>("errorText", { required: false, default: "" });
// 表示用の文字列（カンマ区切り）
const displayValue = ref<string>("");

const props = defineProps({
  valiSchema: {
    type: Object, // as () => ZodObject<any>,
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
  formatWithComma();
}
// model → displayValue への変換
watch(
  model,
  (newVal) => {
    displayValue.value = formatNumber(newVal);
  },
  { immediate: true }
);

// displayValue → model への変換
watch(displayValue, (newVal) => {
  model.value = parseNumber(newVal);
});
// 数値 → カンマ付き文字列
function formatNumber(value: number): string {
  if (!value) return "";
  return value.toLocaleString();
}

// カンマ付き文字列 → 数値（数値でない場合は 0 にフォールバック）
function parseNumber(value: string): number | null {
  const numeric = value.replace(/,/g, "");
  const parsed = parseFloat(numeric);
  return isNaN(parsed) ? null : parsed;
}

// カンマ付きで表示
function formatWithComma() {
  displayValue.value = formatNumber(model.value);
}
</script>
<style module lang="scss" scoped></style>
