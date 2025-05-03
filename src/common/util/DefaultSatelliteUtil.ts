import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";

/**
 * デフォルト衛星情報を作成する関数
 * @param satelliteId 衛星ID
 * @param satelliteName 衛星名
 * @param noradId NORAD ID
 * @returns DefaultSatelliteType
 */
export function createDefaultSatellite(
  satelliteId: number,
  satelliteName: string,
  noradId: string
): DefaultSatelliteType {
  return {
    satelliteId,
    satelliteName,
    noradId,
    uplink1: { uplinkHz: null, uplinkMode: "" },
    uplink2: { uplinkHz: null, uplinkMode: "" },
    downlink1: { downlinkHz: null, downlinkMode: "" },
    downlink2: { downlinkHz: null, downlinkMode: "" },
    toneHz: null,
    outline: "",
  };
}
