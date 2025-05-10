// TLE文字列
export type TleStrings = {
  satelliteName: string;
  tleLine1: string;
  tleLine2: string;
};

/**
 * 人工衛星の軌道要素
 * - `semiMajorAxisKm`: 軌道長半径[単位:km]
 * - `eccentricity`: 離心率
 * - `inclinationDeg`: 軌道傾斜角[単位:度]
 * - `raanDeg`: 昇交点赤経[単位:度]
 * - `argumentOfPerigeeDeg`: 近地点引数[単位:度]
 * - `altitudeKm`: 軌道高度[単位:km]
 * - `meanAnomalyDeg`: 平均近点角[単位:度]
 * - `meanMotion`: 平均運動[単位:rev/分]
 * - `orbitalPeriodMin`: 軌道周期[単位:分]
 * - `speedKmSec`: 軌道速度[単位:km/s]
 */
export interface MeanElements {
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  raanDeg: number;
  argumentOfPerigeeDeg: number;
  altitudeKm: number;
  meanAnomalyDeg: number;
  meanMotion: number;
  orbitalPeriodMin: number;
  speedKmSec: number;
}

// 人工衛星の位置(緯度/経度/高度)
export type TargetPolarLocation = {
  latitude: number;
  longitude: number;
  height: number;
  radius?: number;
};

// 人工衛星の軌道キャッシュ
export type OrbitLineCache = {
  time: number;
  isReEntry: boolean;
  targetPolarLocation: TargetPolarLocation;
};

// 人工衛星の軌道
export type OrbitLines = {
  latlng: [number, number][];
  isReEntry: boolean;
};

// 人工衛星の位置（Deg）
export type SatAzEl = {
  az: number;
  el: number;
};

// ローテータの位置（Deg）
export type RotatorAzEl = {
  az: number;
  el: number;
};
