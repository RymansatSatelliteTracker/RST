import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { ApiResponse } from "@/common/types/types";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import { onMounted, Ref } from "vue";

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
