<template>
  <v-text-field
    v-model="displayValue"
    variant="outlined"
    hide-details
    :error="!CommonUtil.isEmpty(errorText)"
    class="textfield"
    @focus="onFocus()"
    @blur="onBlur(displayValue)"
  >
    <ValidateTooltip :target="errorText" />
  </v-text-field>
</template>

<script setup lang="ts">
import CommonUtil from "@/common/CommonUtil";
import { useValidate } from "@/renderer/common/hook/useValidate";
import ValidateTooltip from "@/renderer/components/atoms/ValidateTooltip/ValidateTooltip.vue";
import { nextTick, onMounted, ref, watch } from "vue";

const model = defineModel<any>();
const errorText = defineModel<string>("errorText", { required: false, default: "" });
// 表示用の文字列（ドット区切り）
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
  padEndDigit: {
    type: Number,
    required: false,
    default: 0,
  },
});

const { validateAt } = useValidate(props.valiSchema);

onMounted(async () => {
  // エラーメッセージをクリア
  errorText.value = "";
});

/**
 * focusイベントのハンドラ
 */
async function onFocus() {
  // フォーカス時はドット区切りを外す
  displayValue.value = model.value ? model.value.toString() : "";
}

/**
 * blurイベントのハンドラ
 */
async function onBlur(val: string) {
  errorText.value = await validateAt(props.valiSchemaFieldPath, val);
  if (errorText.value) return;
  // 数値に変換して model にセットする
  let numVal = parseNumber(val);

  // 指定された桁数に満たない場合、末尾に0を追加する
  if (props.padEndDigit > 0 && numVal !== null) {
    const str = numVal.toString();
    if (str.length <= props.padEndDigit) {
      numVal = parseFloat(str.padEnd(props.padEndDigit, "0"));
    }
  }
  displayValue.value = formatWithDot(numVal);
}
// model → displayValue への変換
// mountだとデータが入っていないので表示時に一回だけ実行
let stop: any;
stop = watch(
  model,
  async (newVal) => {
    if (!newVal) return;
    await nextTick();
    displayValue.value = formatWithDot(newVal);
    stop();
  },
  { immediate: true }
);

// displayValue → model への変換
// modelとの同期はこいつに任せる
watch(displayValue, (newVal) => {
  model.value = parseNumber(newVal);
});

/**
 * 数値 → ドット付き文字列
 * @param value
 */
function formatWithDot(value: number | null): string {
  if (!value) return "";
  // ドイツ式のドット区切りで表示
  return value.toLocaleString("de-DE");
}

/**
 * ドット付き文字列 → 数値（数値でない場合は null にフォールバック）
 * @param value
 */
function parseNumber(value: string): number | null {
  const numeric = value.replace(/\./g, "");
  const parsed = parseFloat(numeric);
  return isNaN(parsed) ? null : parsed;
}
</script>
<style module lang="scss" scoped></style>

