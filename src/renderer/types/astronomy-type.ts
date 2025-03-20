// 黄道座標(黄緯/黄経)
export type EclipticCoords = {
  latitude: number;
  longitude: number;
};

// 赤道座標(赤緯/赤経)
export type EquatorialCoords = {
  declination: number;
  rightAscension: number;
};
