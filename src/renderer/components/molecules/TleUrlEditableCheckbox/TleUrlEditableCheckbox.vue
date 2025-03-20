<!-- TLEのURL用のラベル変更可能なチェックボックス -->
<template>
  <v-row>
    <v-col cols="1">
      <v-checkbox-btn v-model="enable" hide-details density="compact"></v-checkbox-btn>
    </v-col>
    <v-col cols="11">
      <TextField v-model="url" :valiSchema="validSchema" valiSchemaFieldPath="url" v-model:errorText="errorsTleUrl" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import TextField from "@/renderer/components/atoms/TextField/TextField.vue";

const enable = defineModel<boolean>("enable");
const url = defineModel<string>("url");
const validSchema: any = defineModel("validSchema");
const errorsTleUrl = defineModel<string>("errorsTleUrl");
</script>
<style lang="scss" scoped></style>
