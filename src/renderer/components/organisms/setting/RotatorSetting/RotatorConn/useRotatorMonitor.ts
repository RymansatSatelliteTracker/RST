import type { AntennaPositionModel } from "@/common/model/AntennaPositionModel.js";
import type { ApiResponse } from "@/common/types/types.js";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking.js";
import type { Ref } from "vue";
import { onMounted } from "vue";

/**
 * ローテーター監視関係のフック
 */
export default function useRotatorMonitor(position: Ref<AntennaPositionModel>) {
  onMounted(() => {
    // アンテナの位置変化を取得し、positionを更新する
    ApiAntennaTracking.onChangeAntennaPosition((res: ApiResponse<AntennaPositionModel>) => {
      if (!res.status) return;
      const pos = res.data;
      if (!pos) return;

      position.value = {
        azimuth: pos.azimuth,
        elevation: pos.elevation,
      };
    });
  });
}
