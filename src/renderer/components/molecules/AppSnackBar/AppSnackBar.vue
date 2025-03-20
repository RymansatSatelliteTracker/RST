<template>
  <v-snackbar v-model="isShow" :timeout="timeout" :color="color" vertical close-on-content-click>
    <span class="text-pre-wrap" style="user-select: none">{{ text }}</span>

    <template v-slot:actions>
      <v-btn color="white" variant="text" @click="close">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import Constant from "@/common/Constant";
import { ref } from "vue";
import { useAppSnackBar } from "./useAppSnackBar";

const { isShow, close, color, text } = useAppSnackBar();
const timeout = ref(Constant.SnackBar.DISP_TIMEOUT_MS);
</script>

<style lang="scss" scoped></style>
