<template>
  <div>
    <!-- ヘッダ部 -->
    <!-- <Header class="header" /> -->

    <!-- コンテンツ部 -->
    <div class="body">
      <slot />
    </div>

    <!-- フッタ部 -->
    <Footer class="footer" />
  </div>
</template>

<script setup lang="ts">
import Footer from "@/renderer/components/organisms/Footer/Footer.vue";
</script>

<style lang="scss" scoped>
@import "@/renderer/components/styles/variables.scss";

.header {
  height: $header_height;
}

.body {
  // -20px は微調整値
  height: calc(100vh - $header_height - $footer_height - 20px);
}

.footer {
  height: $footer_height;
}
</style>
