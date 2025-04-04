// TLE文字列
export type TleStrings = {
  satelliteName: string;
  tleLine1: string;
  tleLine2: string;
};

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
