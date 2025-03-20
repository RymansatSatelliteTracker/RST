<template>
  <PageTemplate>
    <router-view />
    <AppSnackBar />
    <ConfirmDialog />
  </PageTemplate>
</template>

<script setup lang="ts">
import ConfirmDialog from "./components/atoms/ConfirmDialog/ConfirmDialog.vue";
import AppSnackBar from "./components/molecules/AppSnackBar/AppSnackBar.vue";
import router from "./router/router";

// メインページを表示
// Memo: これがないとexe化した場合にページが表示されない
router.push("/");
</script>

<style module lang="scss"></style>
