<template>
  <div class="container">
    <!-- AOSリスト -->
    <fieldset class="fieldset_area">
      <legend v-if="isGroundStation2Enable" class="item_2ground_mode">AOS List (2 Ground mode)</legend>

      <legend v-else class="item_group_legend">AOS List</legend>
      <table class="aos_table">
        <thead class="aos_header">
          <tr>
            <th>AOS</th>
            <th>MAXEL</th>
            <th>LOS</th>
            <th>Duration</th>
            <th>Altitude</th>
            <th>Visibility</th>
          </tr>
        </thead>

        <!-- 複数地上局の場合のAOSリスト -->
        <tbody v-if="isGroundStation2Enable" class="aos_body">
          <tr v-if="overlapPassList === null || overlapPassList.length === 0">
            <td colspan="4">{{ I18nUtil.getMsg(I18nMsgs.ERR_NO_OVERLAP_PASS) }}</td>
          </tr>
          <tr v-for="item in overlapPassList" v-else :key="item.maxEl?.date.getTime()">
            <td>
              {{ DateUtil.formatDateTime(item.aos?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ CanvasUtil.formatAngle(item.maxEl?.lookAngles.elevation) }}</td>
            <td>
              {{ DateUtil.formatDateTime(item.los?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ DateUtil.formatMsToHHMMSS(item.durationMs) }}</td>
            <td>{{ item.altitude }}</td>
            <td>{{ item.visibility }}</td>
          </tr>
        </tbody>

        <!-- 単一地上局の場合のAOSリスト -->
        <tbody v-else class="aos_body">
          <tr v-if="orbitalPassList === null || orbitalPassList.length === 0">
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
            <td>{{ I18nUtil.getMsg(I18nMsgs.GCOM_NA) }}</td>
          </tr>
          <tr v-for="item in orbitalPassList" v-else :key="item.maxEl?.date.getTime()">
            <td>
              {{ DateUtil.formatDateTime(item.aos?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ CanvasUtil.formatAngle(item.maxEl?.lookAngles.elevation) }}</td>
            <td>
              {{ DateUtil.formatDateTime(item.los?.date, { hour: "2-digit", minute: "2-digit" }) }}
            </td>
            <td>{{ DateUtil.formatMsToHHMMSS(item.durationMs) }}</td>
            <td>{{ item.altitude }}</td>
            <td>{{ item.visibility }}</td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  </div>
</template>
<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import useOrbitalPassList from "@/renderer/components/organisms/AosList/useOrbitalPassList";
import useOverlapPassList from "@/renderer/components/organisms/AosList/useOverlapPassList";
import CanvasUtil from "@/renderer/util/CanvasUtil";
import DateUtil from "@/renderer/util/DateUtil";
import { toRef } from "vue";

const props = defineProps({
  currentDate: {
    type: Date,
    required: true,
  },
});

const currentDate = toRef(props, "currentDate");

// フック
// 人工衛星のAOSリストを取得する
const { orbitalPassList } = useOrbitalPassList(currentDate);
// 重複する地上局から観測できるAOSリストを取得する
const { overlapPassList, isGroundStation2Enable } = useOverlapPassList(currentDate);
</script>

<style lang="scss" scoped>
@use "./AosList" as *;
</style>
