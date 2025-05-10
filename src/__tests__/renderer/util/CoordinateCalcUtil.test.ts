import { GROUND_STATION } from "@/__tests__/renderer/service/GroundStationService.test";
import Constant from "@/common/Constant";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";

/**
 * [正常系]
 * ラジアンを度に変換できる
 */
describe("[正常系]ラジアンを度に変換できる", () => {
  it("πラジアンを渡すと180度を返す", () => {
    // given 前提条件
    // when 実行
    const degree = CoordinateCalcUtil.radianToDegree(Math.PI);
    // then 結果
    expect(degree).toBeCloseTo(180);
  });

  it("0ラジアンを渡すと0度を返す", () => {
    // given 前提条件
    // when 実行
    const degree = CoordinateCalcUtil.radianToDegree(0);
    // then 結果
    expect(degree).toBeCloseTo(0);
  });

  it("負のラジアンを渡すと負の度を返す", () => {
    // given 前提条件
    // when 実行
    const degree = CoordinateCalcUtil.radianToDegree(-Math.PI);
    // then 結果
    expect(degree).toBeCloseTo(-180);
  });
});

/**
 * [正常系]
 * 度をラジアンに変換できる
 */
describe("[正常系]度をラジアンに変換できる", () => {
  it("180度を渡すとπラジアンを返す", () => {
    // given 前提条件
    // when 実行
    const radian = CoordinateCalcUtil.degreeToRadian(180);
    // then 結果
    expect(radian).toBeCloseTo(Math.PI);
  });

  it("0度を渡すと0ラジアンを返す", () => {
    // given 前提条件
    // when 実行
    const radian = CoordinateCalcUtil.degreeToRadian(0);
    // then 結果
    expect(radian).toBeCloseTo(0);
  });

  it("負の度を渡すと負のラジアンを返す", () => {
    // given 前提条件
    // when 実行
    const radian = CoordinateCalcUtil.degreeToRadian(-180);
    // then 結果
    expect(radian).toBeCloseTo(-Math.PI);
  });
});

/**
 * [正常系]
 * 角度を正規化できる（ラジアン）
 */
describe("[正常系]角度を正規化できる（ラジアン）", () => {
  it("2πを渡すと0を返す", () => {
    // given 前提条件
    // when 実行
    const radian = CoordinateCalcUtil.normalizeRadian(2 * Math.PI);
    // then 結果
    expect(radian).toBeCloseTo(0);
  });

  it("負のラジアンを渡すと正規化された値を返す", () => {
    // given 前提条件
    // when 実行
    const radian = CoordinateCalcUtil.normalizeRadian(-Math.PI);
    // then 結果
    expect(radian).toBeCloseTo(Math.PI);
  });
});

/**
 * [正常系]
 * 角度を正規化できる（度）
 */
describe("[正常系]角度を正規化できる（度）", () => {
  it("360度を渡すと0度を返す", () => {
    // given 前提条件
    // when 実行
    const degree = CoordinateCalcUtil.normalizeAngle(360);
    // then 結果
    expect(degree).toBe(0);
  });

  it("負の角度を渡すと正規化された値を返す", () => {
    // given 前提条件
    // when 実行
    const degree = CoordinateCalcUtil.normalizeAngle(-90);
    // then 結果
    expect(degree).toBe(270);
  });
});

/**
 * [正常系]
 * 指定した角度を閾値にして角度を正規化できる
 */
describe("[正常系]指定した角度を閾値にして角度を正規化できる", () => {
  it("370度と閾値10度を渡すと10度を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.normalizeAngleWithOffset(370, 10);
    // then 結果
    expect(result).toBe(10);
  });

  it("負の角度-350度と閾値10度を渡すと10度を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.normalizeAngleWithOffset(-350, 10);
    // then 結果
    expect(result).toBe(10);
  });

  it("角度0度と閾値0度を渡すと0度を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.normalizeAngleWithOffset(0, 0);
    // then 結果
    expect(result).toBe(0);
  });

  it("角度360度と閾値180度を渡すと360度を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.normalizeAngleWithOffset(360, 180);
    // then 結果
    expect(result).toBe(360);
  });

  it("負の角度-180度と閾値180度を渡すと180度を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.normalizeAngleWithOffset(-180, 180);
    // then 結果
    expect(result).toBe(180);
  });

  it("角度が閾値より小さい場合に正しく処理する", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.normalizeAngleWithOffset(170, 180);
    // then 結果
    expect(result).toBe(530);
  });

  it("負の角度が閾値より小さい場合に正しく処理する", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.normalizeAngleWithOffset(-190, 180);
    // then 結果
    expect(result).toBe(530);
  });
});

/**
 * [正常系]
 * 3次元ベクトルのノルムを計算できる
 */
describe("[正常系]3次元ベクトルのノルムを計算できる", () => {
  it("ベクトル(3, 4, 0)のノルムを計算できる", () => {
    // given 前提条件
    // when 実行
    const norm = CoordinateCalcUtil.getVectorNorm({ x: 3, y: 4, z: 0 });
    // then 結果
    expect(norm).toBe(5);
  });

  it("ベクトル(0, 0, 0)のノルムを計算できる", () => {
    // given 前提条件
    // when 実行
    const norm = CoordinateCalcUtil.getVectorNorm({ x: 0, y: 0, z: 0 });
    // then 結果
    expect(norm).toBe(0);
  });

  it("負の成分を含むベクトル(-3, -4, 0)のノルムを計算できる", () => {
    // given 前提条件
    // when 実行
    const norm = CoordinateCalcUtil.getVectorNorm({ x: -3, y: -4, z: 0 });
    // then 結果
    expect(norm).toBe(5);
  });
});

/**
 * [正常系]
 * kmとmの変換ができる
 */
describe("[正常系]kmとmの変換ができる", () => {
  it("1kmをmに変換できる", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.kmToM(1);
    // then 結果
    expect(result).toBe(1000);
  });

  it("1000mをkmに変換できる", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.mToKm(1000);
    // then 結果
    expect(result).toBe(1);
  });
});

/**
 * [正常系]
 * 緯度/経度から地心直交座標を計算できる
 */
describe("[正常系]緯度/経度から地心直交座標を計算できる", () => {
  it("緯度/経度から地心直交座標を計算できる", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.geodeticInDegreeToEcef(
      GROUND_STATION.latitudeDeg,
      GROUND_STATION.longitudeDeg,
      GROUND_STATION.AltitudeM
    );
    // then 結果
    expect(result).toEqual({ x: -3964.4677846099403, y: 3700.456284971225, z: -3341.4353685195606 });
  });
});

/**
 * [正常系]
 * 緯度/経度(ラジアン)から地心直交座標を計算できる
 */
describe("[正常系]緯度/経度(ラジアン)から地心直交座標を計算できる", () => {
  it("緯度/経度(ラジアン)から地心直交座標を計算できる", () => {
    // given 前提条件
    const latitudeRad = Math.PI / 4; // 45度
    const longitudeRad = Math.PI / 2; // 90度
    const altitudeKm = 0;

    // when 実行
    const result = CoordinateCalcUtil.geodeticInRadianToEcef(latitudeRad, longitudeRad, altitudeKm);

    // then 結果
    expect(result).toEqual({
      x: 3619.279503709231,
      y: 4487.348534948017,
      z: -2703.5974983038163,
    });
  });
});

/**
 * [正常系]
 * 任意の緯度での地球半径を取得する
 */
describe("[正常系]任意の緯度での地球半径を取得する", () => {
  it("緯度から地球半径を取得できる", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.getEarthRadiusInDegree(0);
    // then 結果
    expect(result).toBeCloseTo(Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM);
  });
});

/**
 * [正常系]
 * 3次元極座標(度)から3次元直交座標に変換できる
 */
describe("[正常系]3次元極座標(度)から3次元直交座標に変換できる", () => {
  it("極座標({latitude: 0, longitude: 0, radius: 1})を渡すと直交座標({x: 1, y: 0, z: 0})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translatePolarInDegreeToCartesian({ latitude: 0, longitude: 0, radius: 1 });
    // then 結果
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
  });

  it("極座標({latitude: 90, longitude: 0, radius: 1})を渡すと直交座標({x: 0, y: 1, z: 0})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translatePolarInDegreeToCartesian({ latitude: 90, longitude: 0, radius: 1 });
    // then 結果
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
    expect(result.z).toBeCloseTo(0);
  });

  it("極座標({latitude: 0, longitude: 90, radius: 1})を渡すと直交座標({x: 0, y: 0, z: -1})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translatePolarInDegreeToCartesian({ latitude: 0, longitude: 90, radius: 1 });
    // then 結果
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(-1);
  });
});

/**
 * [正常系]
 * 3次元極座標(ラジアン)から3次元直交座標に変換できる
 */
describe("[正常系]3次元極座標(ラジアン)から3次元直交座標に変換できる", () => {
  it("極座標({latitude: 0, longitude: 0, radius: 1})を渡すと直交座標({x: 1, y: 0, z: 0})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translatePolarInRadianToCartesian({ latitude: 0, longitude: 0, radius: 1 });
    // then 結果
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
  });

  it("極座標({latitude: Math.PI / 2, longitude: 0, radius: 1})を渡すと直交座標({x: 0, y: 1, z: 0})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translatePolarInRadianToCartesian({
      latitude: Math.PI / 2,
      longitude: 0,
      radius: 1,
    });
    // then 結果
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
    expect(result.z).toBeCloseTo(0);
  });

  it("極座標({latitude: 0, longitude: Math.PI / 2, radius: 1})を渡すと直交座標({x: 0, y: 0, z: -1})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translatePolarInRadianToCartesian({
      latitude: 0,
      longitude: Math.PI / 2,
      radius: 1,
    });
    // then 結果
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(-1);
  });
});

/**
 * [正常系]
 * 3次元直交座標から3次元極座標(度)に変換できる
 */
describe("[正常系]3次元直交座標から3次元極座標(度)に変換できる", () => {
  it("直交座標({x: -1, y: 0, z: 0})を渡すと極座標({latitude: 0, longitude: 180, radius: 1})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translateCartesianToPolarInDegree({ x: -1, y: 0, z: 0 });
    // then 結果
    expect(result).toEqual({ latitude: 0, longitude: 180, radius: 1 });
  });

  it("直交座標({x: 0, y: 1, z: 0})を渡すと極座標({latitude: 90, longitude: 0, radius: 1})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translateCartesianToPolarInDegree({ x: 0, y: 1, z: 0 });
    // then 結果
    expect(result).toEqual({ latitude: 90, longitude: 0, radius: 1 });
  });

  it("直交座標({x: 0, y: 0, z: 1})を渡すと極座標({latitude: 0, longitude: -90, radius: 1})を返す", () => {
    // given 前提条件
    // when 実行
    const result = CoordinateCalcUtil.translateCartesianToPolarInDegree({ x: 0, y: 0, z: 1 });
    // then 結果
    expect(result).toEqual({ latitude: 0, longitude: -90, radius: 1 });
  });
});
