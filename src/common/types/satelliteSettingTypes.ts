/**
 * 衛星識別情報(衛星IDと名称)を表すタイプ
 */
export type SatelliteIdentiferType = {
  // 衛星ID(not NORADID)
  satelliteId: number;
  satelliteName: string;
  userRegistered: boolean;
};

/**
 * 人工衛星の軌道要素
 * @param {string} noradId NoradID
 * @param {string} satelliteName 人工衛星の名称
 * @param {Date} epochUtcDate 軌道要素の元期(UTC日時)
 * @param {number} semiMajorAxisKm 軌道長半径[単位:km]
 * @param {number} inclinationDeg 軌道傾斜角[単位:度]
 * @param {number} raanDeg 昇交点赤経[単位:度]
 * @param {number} argumentOfPerigeeDeg 近地点引数[単位:度]
 * @param {number} eccentricity 離心率
 * @param {number} meanAnomalyDeg 平均近点角[単位:度]
 * @param {number} bStar b*抗力項
 */
export type OrbitElement = {
  noradId: string;
  satelliteName: string;
  epochUtcDate: Date;
  semiMajorAxisKm: number;
  inclinationDeg: number;
  raanDeg: number;
  argumentOfPerigeeDeg: number;
  eccentricity: number;
  meanAnomalyDeg: number;
  bStar: number;
};

/**
 * デフォルト衛星情報を表すタイプ
 */
export type DefaultSatelliteType = {
  // 衛星ID
  satelliteId: number;
  // 衛星名
  satelliteName: string;
  // 対象衛星NORAD ID
  noradId: string;
  // 対象衛星アップリンク設定1
  uplink1: UplinkType;
  // 対象衛星アップリンク設定2
  uplink2: UplinkType;
  // 対象衛星アップリンク設定3
  uplink3: UplinkType;
  // 対象衛星ダウンリンク設定1
  downlink1: DownlinkType;
  // 対象衛星ダウンリンク設定2
  downlink2: DownlinkType;
  // 対象衛星ダウンリンク設定3
  downlink3: DownlinkType;
  // 対象衛星ビーコン設定
  beacon: BeaconType;
  // トーン周波数
  toneHz: number | null;
  // 衛星モード有効化フラグ
  enableSatelliteMode: boolean;
  // 衛星モード
  satelliteMode: string;
  // 対象衛星概要
  outline: string;
};

/**
 * アップリンク設定タイプ
 */
export type UplinkType = {
  // アップリンク周波数(Hz)
  uplinkHz: number | null;
  // アップリンクモード
  uplinkMode: string;
};

/**
 * ダウンリンク設定タイプ
 */
export type DownlinkType = {
  // ダウンリンク周波数(Hz)
  downlinkHz: number | null;
  // ダウンリンクモード
  downlinkMode: string;
};

/**
 * ビーコン設定タイプ
 */
export type BeaconType = {
  // ビーコン周波数(Hz)
  beaconHz: number | null;
  // ビーコンモード
  beaconMode: string;
};
/**
 * 自動設定時に使用する周波数選択タイプ
 */
export type autoModeFreqType = 1 | 2 | 3;
