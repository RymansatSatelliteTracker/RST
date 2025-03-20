<template>
  <div class="container text-center">
    <div>
      Az: <span class="text-h4">{{ az.toFixed(1) }}</span>
    </div>

    <div class="mt-5">
      El: <span class="text-h4">{{ el.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { ApiResponse } from "@/common/types/types";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import { onMounted, onUnmounted, ref } from "vue";

const az = ref(0);
const el = ref(0);

onMounted(() => {
  ApiAntennaTracking.onChangeAntennaPosition(onChangeAntennaPosition);
});

onUnmounted(() => {});

function onChangeAntennaPosition(res: ApiResponse<AntennaPositionModel>) {
  const pos = res.data;
  if (!pos) return;

  az.value = pos.azimuth;
  el.value = pos.elevation;
}
</script>

<style lang="scss" scoped>
@import "@/renderer/components/styles/global.scss";
</style>
