<template>
  <PageTemplate>
    <router-view />
  </PageTemplate>
</template>

<script setup lang="ts">
import router from "@/renderer/router/router";

// ローテーター シミュレータ画面を初期表示
router.push("/dev/rotator-sim");
</script>

<style module lang="scss"></style>
