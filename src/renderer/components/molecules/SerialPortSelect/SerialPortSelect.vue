<template>
  <v-select
    v-model="selectedValue"
    :items="serialPorts"
    hide-details
    variant="outlined"
    density="compact"
    class="selectbox"
  />
</template>

<script setup lang="ts">
import useActiveSerialPorts from "./useActiveSerialPorts";

const selectedValue = defineModel<string>("selectedValue", { required: true });
const needEmpty = defineModel<boolean>("needEmpty", { required: true });

// Select用シリアルポートのリスト
const { serialPorts, getActiveSerialPorts } = useActiveSerialPorts(selectedValue, needEmpty.value);

// 選択肢のリフレッシュ
refreshSerialPort();

/**
 * 選択肢をリフレッシュする
 */
function refreshSerialPort() {
  getActiveSerialPorts();
}

// 外部に公開するもの
defineExpose({
  refreshSerialPort,
});
</script>

<style lang="scss" scoped>
@import "./SerialPortSelect.scss";
</style>
