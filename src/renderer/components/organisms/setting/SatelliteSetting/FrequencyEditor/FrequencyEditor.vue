<template>
  <v-dialog v-model="isShow" max-width="500">
    <v-card color="grey-darken-4" class="pa-4 dialog-height">
      <v-card-title>Frequency JSON Editor</v-card-title>
      <v-divider class="mb-4" />
      <v-card-text class="bg-grey-darken-4 custom-border pa-8 h-75">
        <frequency-editor-list v-model:satellites="frequencyModel.frequency.satellites"></frequency-editor-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" @click="isShow = false">設定</v-btn>
        <v-btn variant="outlined" @click="isShow = false">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { FrequencyModel } from "@/common/model/FrequencyModel";
import { createDefaultSatellite } from "@/common/util/DefaultSatelliteUtil";
import FrequencyEditorList from "@/renderer/components/organisms/setting/SatelliteSetting/FrequencyEditor/FrequencyEditorList/FrequencyEditorList.vue";
import { onMounted, ref } from "vue";

const isShow = defineModel<boolean>("isShow", {
  default: false,
});

const frequencyModel = ref<FrequencyModel>(new FrequencyModel());

onMounted(() => {
  // テスト用のダミーデータ
  frequencyModel.value.frequency.satellites.push(createDefaultSatellite(1, "TEST_SAT1", "12345"));
  frequencyModel.value.frequency.satellites.push(createDefaultSatellite(2, "TEST_SAT2", "12346"));
});
</script>
