<template>
  <v-dialog v-model="isShow" max-width="640">
    <v-card theme="dark" class="pa-3">
      <v-card-title>Frequency JSON Editor</v-card-title>
      <v-divider class="mb-4" />
      <v-card-text>開発用の周波数JSON編集画面です。現在は表示確認用の仮画面です。</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" @click="isShow = false">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const isShow = defineModel<boolean>("isShow", {
  default: false,
});
</script>
