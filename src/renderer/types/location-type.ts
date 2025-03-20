// 3次元直交座標
export type Location3 = {
  x: number;
  y: number;
  z: number;
};

// 3次元極座標
export type PolarLocation = {
  latitude: number;
  longitude: number;
  radius: number;
  height?: number;
};

// 地球上の座標(WGS84回転楕円体)
export type EcefLocation = {
  x: number;
  y: number;
  z: number;
  radius: number;
  height?: number;
};

// 地上局位置
export type GroundStation = {
  enable: boolean;
  latitude: number;
  longitude: number;
  height: number;
};
