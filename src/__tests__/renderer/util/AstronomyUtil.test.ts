import { GROUND_STATION } from "@/__tests__/renderer/service/GroundStationService.test";
import AstronomyUtil from "@/renderer/util/AstronomyUtil";

/**
 * [正常系]
 * J2000.0元期からの経過日数を計算できる
 */
describe("[正常系]J2000.0元期からの経過日数を計算できる", () => {
  it("J2000.0元期からの経過日数を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const days = AstronomyUtil.getDaysSinceJ2000(date);
    // then 結果
    expect(days).toBeCloseTo(9251.5, 0); // 国立天文台による計算結果
  });
});

/**
 * [正常系]
 * J2000.0元期からの経過ユリウス年を計算できる
 */
describe("[正常系]J2000.0元期からの経過ユリウス年を計算できる", () => {
  it("J2000.0元期からの経過ユリウス年を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const years = AstronomyUtil.getJulianYearsElapsed(date);
    // then 結果
    expect(years).toBeCloseTo(25.32922656, 3); // 国立天文台による計算結果
  });
});

/**
 * [正常系]
 * 指定日時の0h UTにおけるグリニッジ恒星時を計算できる
 */
describe("[正常系]指定日時の0h UTにおけるグリニッジ恒星時を計算できる", () => {
  it("UTC時刻で0h UTにおけるグリニッジ恒星時を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const gst = AstronomyUtil.getGstAt0hUT(date);
    // then 結果
    expect(gst).toBeCloseTo(14.61166667, 3); // 国立天文台による計算結果
  });

  it("JST時刻で0h UTにおけるグリニッジ恒星時を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T12:00:00+09:00");
    // when 実行
    const gst = AstronomyUtil.getGstAt0hUT(date);
    // then 結果
    expect(gst).toBeCloseTo(14.61166667, 3); // 国立天文台による計算結果
  });
});

/**
 * [正常系]
 * 指定日時におけるグリニッジ恒星時を計算できる
 */
describe("[正常系]指定日時におけるグリニッジ恒星時を計算できる", () => {
  it("UTC時刻でグリニッジ恒星時を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const gst = AstronomyUtil.getGst(date);
    // then 結果
    expect(gst).toBeCloseTo(14.61166667, 3); // 国立天文台による計算結果
  });

  it("JST時刻でグリニッジ恒星時を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T12:00:00+09:00");
    // when 実行
    const gst = AstronomyUtil.getGst(date);
    // then 結果
    expect(gst).toBeCloseTo(17.62, 3); // 国立天文台による計算結果
  });
});

/**
 * [正常系]
 * 指定日時の0h UTにおけるユリウス通日を計算できる
 */
describe("[正常系]指定日時の0h UTにおけるユリウス通日を計算できる", () => {
  it("0h UTにおけるユリウス通日を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const julianDate = AstronomyUtil.getJulianDateAt0hUT(date);
    // then 結果
    expect(julianDate).toBeCloseTo(2460796.5, 1); // 国立天文台による計算結果
  });
});

/**
 * [正常系]
 * 指定日時におけるユリウス通日を計算できる
 */
describe("[正常系]指定日時におけるユリウス通日を計算できる", () => {
  it("ユリウス通日を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const julianDate = AstronomyUtil.getJulianDate(date);
    // then 結果
    expect(julianDate).toBeCloseTo(2460796.5, 1); // 国立天文台による計算結果
  });
});

/**
 * [正常系]
 * ユリウス通日からDateオブジェクトに変換できる
 */
describe("[正常系]ユリウス通日からDateオブジェクトに変換できる", () => {
  it("ユリウス通日からDateオブジェクトに変換できる", () => {
    // given 前提条件
    const julianDate = 2460796.5;
    // when 実行
    const date = AstronomyUtil.convertJulianToDate(julianDate);
    // then 結果
    expect(date.toISOString()).toBe("2025-05-01T00:00:00.000Z");
  });
});

/**
 * [正常系]
 * 赤経から南中している地球上の経度を計算できる
 */
describe("[正常系]赤経から南中している地球上の経度を計算できる", () => {
  it("赤経から南中している地球上の経度を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const longitude = AstronomyUtil.calculateLongitudeInDegree(date, 180);
    // then 結果
    expect(longitude).toBeCloseTo(320.82275099045717, 2);
  });
});

/**
 * [正常系]
 * 太陽の黄緯/黄経を計算できる
 */
describe("[正常系]太陽の黄緯/黄経を計算できる", () => {
  it("太陽の黄緯/黄経を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const coords = AstronomyUtil.calculateSunEclipticLongitudeInRadian(date);
    // then 結果
    expect(coords.longitude).toBeCloseTo(0.713473, 2);
    expect(coords.latitude).toBe(0);
  });
});

/**
 * [正常系]
 * 観測地点での天体の出没緯度を計算できる
 */
describe("[正常系]観測地点での天体の出没緯度を計算できる", () => {
  it("観測地点での天体の出没緯度を計算できる", () => {
    // given 前提条件
    const gmst = 12;
    const equatorialCoords = { rightAscension: 180, declination: 45 };
    // when 実行
    const latitude = AstronomyUtil.calculateLatitude(gmst, GROUND_STATION.longitudeDeg, equatorialCoords);
    // then 結果
    expect(latitude).toBeCloseTo(-0.4362279044734128, 2);
  });
});

/**
 * [正常系]
 * 黄道座標から赤道座標へ変換できる
 */
describe("[正常系]黄道座標から赤道座標へ変換できる", () => {
  it("黄道座標から赤道座標へ変換できる", () => {
    // given 前提条件
    const eclipticCoords = { latitude: 0, longitude: Math.PI / 2 };
    // when 実行
    const equatorialCoords = AstronomyUtil.translateEclipticToEquatorialInRadian(eclipticCoords);
    // then 結果
    expect(equatorialCoords.declination).toBeCloseTo(0.40903696920030286, 1);
    expect(equatorialCoords.rightAscension).toBeCloseTo(Math.PI / 2, 1);
  });
});

/**
 * [正常系]
 * 指定した日時、緯度/経度から日の出と日の入り時刻を計算できる
 */
describe("[正常系]指定した日時、緯度/経度から日の出と日の入り時刻を計算できる", () => {
  it("緯度/経度から日の出と日の入り時刻を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const { sunrise, sunset } = AstronomyUtil.calculateSunriseSunset(
      date,
      GROUND_STATION.latitudeDeg,
      GROUND_STATION.longitudeDeg
    );
    // then 結果
    expect(sunrise).toBeInstanceOf(Date);
    expect(sunset).toBeInstanceOf(Date);
  });
});

/**
 * [正常系]
 * 月の黄緯を計算できる
 */
describe("[正常系]月の黄緯を計算できる", () => {
  it("月の黄緯を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const latitude = AstronomyUtil.calculateMoonEclipticLatitudeInRadian(date);
    // then 結果
    expect(latitude).toBeCloseTo(0.089, 2);
  });
});

/**
 * [正常系]
 * 月の黄経を計算できる
 */
describe("[正常系]月の黄経を計算できる", () => {
  it("月の黄経を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const longitude = AstronomyUtil.calculateMoonEclipticLongitudeInRadian(date);
    // then 結果
    expect(longitude).toBeCloseTo(1.49, 1);
  });
});

/**
 * [正常系]
 * 朔からの経過日数(月齢)を計算できる
 */
describe("[正常系]朔からの経過日数(月齢)を計算できる", () => {
  it("朔からの経過日数(月齢)を計算できる", () => {
    // given 前提条件
    const date = new Date("2025-05-01T00:00:00Z");
    // when 実行
    const moonAge = AstronomyUtil.calculateMoonAge(date);
    // then 結果
    expect(moonAge).toBeCloseTo(3.66, 1);
  });
});
