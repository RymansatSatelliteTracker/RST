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

/**
 * データを使ってデフォルト衛星情報を初期化する関数
 * @param defaultSatellites デフォルト衛星情報の配列
 * @returns
 */
export function initializeDefaultSatellites(defaultSatellites: any[]) {
  return defaultSatellites.map((sat: DefaultSatelliteType) => {
    return normalizeData(sat, createDefaultSatellite(-1, "", ""));
  });
}

/**
 * 再帰的にキーが存在する場合に値を設定する関数
 * @param source 入力データ
 * @param template テンプレートオブジェクト
 * @returns テンプレートに基づいて正規化されたオブジェクト
 */
export function normalizeData(source: any, template: any): any {
  if (typeof template !== "object" || template === null) {
    // テンプレートがオブジェクトでない場合はそのまま返す
    return source ?? template;
  }

  const result: any = {};
  for (const key in template) {
    if (template.hasOwnProperty(key)) {
      result[key] = normalizeData(source?.[key], template[key]);
    }
  }
  return result;
}
