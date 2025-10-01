import Constant from "@/common/Constant";
import { EclipticCoords, EquatorialCoords } from "@/renderer/types/astronomy-type";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";

/**
 * 天文計算関係のユーティリティ
 * @class AstronomyUtil
 */
class AstronomyUtil {
  /**
   * J2000.0元期からの経過日数を取得する
   * @param {Date} date 計算日時
   * @returns {number} J2000.0元期からの経過日数[単位:日]
   */
  public static getDaysSinceJ2000 = (date: Date): number => {
    // 経過日数を計算する
    return (date.getTime() - Constant.Astronomy.J2000_EPOCH.getTime()) / Constant.Time.MILLISECONDS_IN_DAY;
  };

  /**
   * J2000.0元期からの経過ユリウス年を取得する
   * @param {Date} date 計算日時
   * @returns {number} 経過ユリウス年[単位:年]
   */
  public static getJulianYearsElapsed = (date: Date): number => {
    return this.getDaysSinceJ2000(date) / Constant.Astronomy.JULIAN_YEAR;
  };

  /**
   * 指定日時の0h UTにおけるグリニッジ恒星時(GST)を計算する
   * @param {Date} date 計算日時
   * @returns {number} グリニッジ恒星時(GST)[単位:時間]
   */
  public static getGstAt0hUT = (date: Date): number => {
    // ユリウス通日(0h UT)を計算する
    const julianTime = this.getJulianDateAt0hUT(date);
    // J2000.0元期(2000年1月1日12時UT)からの経過ユリウス年を計算する
    const T = (julianTime - Constant.Astronomy.J2000_JULIAN_DATE) / 36525.0;

    // グリニッジ恒星時(GST 0h UT)を計算する
    const gst = 6.697374558 + 2400.051336 * T + 0.000025862 * T * T;
    // 0～24時の範囲に正規化する
    return ((gst % 24) + 24) % 24;
  };

  /**
   * 計算日時におけるグリニッジ恒星時(GST)を計算する
   * @param {Date} date 計算日時
   * @returns {number} グリニッジ恒星時(GST)[単位:時間]
   */
  public static getGst = (date: Date): number => {
    // ユリウス通日を計算する
    const julianTime = this.getJulianDate(date);
    // J2000.0元期(2000年1月1日12時UT)からの経過ユリウス時間を計算する
    return (18.697374558 + 24.06570982441908 * (julianTime - Constant.Astronomy.J2000_JULIAN_DATE)) % 24;
  };

  /**
   * 指定日時の0h UTにおけるユリウス通日を計算する
   * @param {Date} date 計算日時
   * @returns {number} ユリウス通日[単位:日]
   */
  public static getJulianDateAt0hUT = (date: Date): number => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // 月が0から始まるので+1する
    const day = date.getUTCDate();

    // 1月と2月を前年の13月、14月とする
    const y = month <= 2 ? year - 1 : year;
    const m = month <= 2 ? month + 12 : month;
    // ユリウス通日計算のための項を計算する
    const a = Math.floor(y / 100.0);
    const b = 2 - a + Math.floor(a / 4.0);

    // ユリウス通日を計算する
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  };

  /**
   * 指定日時におけるユリウス通日を計算する
   * @param {Date} date 計算日時
   * @returns {number} ユリウス通日[単位:日]
   */
  public static getJulianDate = (date: Date): number => {
    return date.getTime() / Constant.Time.MILLISECONDS_IN_DAY + Constant.Astronomy.J1970_JULIAN_DATE - 0.5;
  };

  /**
   * ユリウス通日からDateオブジェクトに変換する
   * @param {number} julianTime ユリウス通日
   * @returns {Date} Dateオブジェクト
   */
  public static convertJulianToDate = (julianTime: number): Date => {
    return new Date((julianTime + 0.5 - Constant.Astronomy.J1970_JULIAN_DATE) * Constant.Time.MILLISECONDS_IN_DAY);
  };

  /**
   * 天体の赤経から南中している地球上の経度を計算する
   * @param {Date} date 計算日時
   * @param {number} raDeg 赤経[単位:度]
   * @param {number} [offset=0.0] 経度のオフセット値[単位:度]
   * @returns {number} 南中している地球上の経度[単位:度]
   */
  public static calculateLongitudeInDegree(date: Date, raDeg: number, offset: number = 0.0): number {
    // UT時間を計算する
    const utInHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    // GSTを計算する
    const currentGST = (this.getGstAt0hUT(date) + utInHours * 1.002737909) % 24;

    // 天体の赤経から南中している地球上の経度を計算する
    const longitude = raDeg - currentGST * 15;
    // 経度を正規化する
    return CoordinateCalcUtil.normalizeAngleWithOffset(longitude, offset);
  }

  /**
   * 太陽の黄緯/黄経を計算する
   * @param {Date} date 計算日時
   * @returns {EclipticCoords} 太陽の黄緯/黄経[単位:ラジアン]
   */
  public static calculateSunEclipticLongitudeInRadian = (date: Date): EclipticCoords => {
    // 現在日時のユリウス通日を計算する
    const daysSinceJ2000 = this.getDaysSinceJ2000(date);
    // 太陽の平均黄経を計算する
    const meanLongitude = (280.46 + 0.9856474 * daysSinceJ2000) % 360;
    // 太陽の平均近点角を計算する
    const meanAnomaly = CoordinateCalcUtil.degreeToRadian((357.528 + 0.9856003 * daysSinceJ2000) % 360);

    // 太陽の黄緯/黄経[単位:ラジアン]
    return {
      latitude: 0,
      longitude: CoordinateCalcUtil.degreeToRadian(
        meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)
      ),
    };
  };

  /**
   * 観測地点での天体の出没緯度を計算する
   * @param {number} gmst グリニッジ恒星時[単位:時間]
   * @param {number} longitudeDeg 観測地点の経度[単位:度]
   * @param {EquatorialCoords} equatorialCoords 天体の赤緯/赤経[単位:度]
   * @returns {number} 出没緯度[単位:ラジアン]
   */
  public static calculateLatitude = (
    gmst: number,
    longitudeDeg: number,
    equatorialCoords: EquatorialCoords
  ): number => {
    // 時角を計算する
    const hourAngle = CoordinateCalcUtil.degreeToRadian(gmst * 15) + longitudeDeg - equatorialCoords.rightAscension;
    // 天体の出没緯度を計算する
    return Math.atan(-Math.cos(hourAngle) / Math.tan(equatorialCoords.declination));
  };

  /**
   * 黄道座標から赤道座標へ変換する
   * @param {EclipticCoords} eclipticCoords 黄道座標(黄緯/黄経)[単位:ラジアン]
   * @returns {EquatorialCoords} 赤道座標(赤緯/赤経)[単位:ラジアン]
   */
  public static translateEclipticToEquatorialInRadian = (eclipticCoords: EclipticCoords): EquatorialCoords => {
    // 黄道傾斜角を計算する
    const obliquity = CoordinateCalcUtil.degreeToRadian(Constant.Astronomy.ECLIPTIC_INCLINATION_DEG);
    const sinEpsilon = Math.sin(obliquity);
    const cosEpsilon = Math.cos(obliquity);
    // 黄緯
    const beta = eclipticCoords.latitude;
    const sinBeta = Math.sin(beta);
    const cosBeta = Math.cos(beta);
    // 黄経
    const lambda = eclipticCoords.longitude;
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);

    const u = cosBeta * cosLambda;
    const v = -sinBeta * sinEpsilon + cosBeta * sinLambda * cosEpsilon;
    const w = sinBeta * cosEpsilon + cosBeta * sinLambda * sinEpsilon;

    // 赤緯
    const declination = Math.atan2(w, Math.sqrt(u * u + v * v));
    // 赤経
    const rightAscension = Math.atan2(v, u);

    return {
      declination: declination,
      rightAscension: CoordinateCalcUtil.normalizeRadian(rightAscension),
    };
  };

  /**
   * 日の出/日の入りのユリウス日を計算する
   * @param {number} altitudeRad 高度[単位:ラジアン]
   * @param {number} longitudeRad 経度[単位:ラジアン]
   * @param {number} latitudeRad 緯度[単位:ラジアン]
   * @param {number} declinationRad 赤緯[単位:ラジアン]
   * @param {number} days 日数
   * @param {number} meanAnomalyRad 太陽の平均近点角[単位:ラジアン]
   * @param {number} eclipticLongitudeRad 黄経[単位:ラジアン]
   * @returns {number} ユリウス日[単位:日]
   */
  public static calculateSunriseSunsetJulianDate = (
    altitudeRad: number,
    longitudeRad: number,
    latitudeRad: number,
    declinationRad: number,
    days: number,
    meanAnomalyRad: number,
    eclipticLongitudeRad: number
  ): number => {
    const w = Math.acos(
      (Math.sin(altitudeRad) - Math.sin(latitudeRad) * Math.sin(declinationRad)) /
        (Math.cos(latitudeRad) * Math.cos(declinationRad))
    );
    const a = 0.0009 + (w + longitudeRad) / (2 * Math.PI) + days;
    return (
      Constant.Astronomy.J2000_JULIAN_DATE +
      a +
      0.0053 * Math.sin(meanAnomalyRad) -
      0.0069 * Math.sin(2 * eclipticLongitudeRad)
    );
  };

  /**
   * 指定した日時、緯度/経度から日の出と日の入り時刻を計算する
   * @param {Date} date 計算日時
   * @param {number} latitudeDeg 緯度[単位:度]
   * @param {number} longitudeDeg 経度[単位:度]
   * @returns {Object} 日の出と日の入りの時刻
   */
  public static calculateSunriseSunset = (
    date: Date,
    latitudeDeg: number,
    longitudeDeg: number
  ): { sunrise: Date; sunset: Date } => {
    // 経度をラジアンに変換する
    const lwRad = CoordinateCalcUtil.degreeToRadian(-longitudeDeg);
    // 緯度をラジアンに変換する
    const phiRad = CoordinateCalcUtil.degreeToRadian(latitudeDeg);

    // 太陽の黄緯/黄経を計算する
    const sunEcliptic = this.calculateSunEclipticLongitudeInRadian(date);
    // 太陽の黄緯/黄経を赤道座標に変換する
    const equatorialCoords = this.translateEclipticToEquatorialInRadian(sunEcliptic);
    // 日の出/日の入りの計算に必要な日数を計算する
    const n = Math.round(this.getDaysSinceJ2000(date) - 0.0009 - lwRad / (2 * Math.PI));
    // 日の出/日の入りの計算に必要な補正値を含む日数を計算する
    const ds = 0.0009 + (0 + lwRad) / (2 * Math.PI) + n;
    // 太陽の平均近点角を計算する
    const meanAnomalyRad = CoordinateCalcUtil.degreeToRadian(357.5291 + 0.98560028 * ds);
    // 太陽の南中時刻を計算する
    const SolarNoon =
      Constant.Astronomy.J2000_JULIAN_DATE +
      ds +
      0.0053 * Math.sin(meanAnomalyRad) -
      0.0069 * Math.sin(2 * sunEcliptic.longitude);

    // 日の出の時刻を計算する
    const sunrise = this.convertJulianToDate(
      SolarNoon -
        (this.calculateSunriseSunsetJulianDate(
          CoordinateCalcUtil.degreeToRadian(-0.833),
          lwRad,
          phiRad,
          equatorialCoords.declination,
          n,
          meanAnomalyRad,
          sunEcliptic.longitude
        ) -
          SolarNoon)
    );
    // 日の入りの時刻を計算する
    const sunset = this.convertJulianToDate(
      this.calculateSunriseSunsetJulianDate(
        CoordinateCalcUtil.degreeToRadian(-0.833),
        lwRad,
        phiRad,
        equatorialCoords.declination,
        n,
        meanAnomalyRad,
        sunEcliptic.longitude
      )
    );

    return { sunrise, sunset };
  };

  /**
   * 月の黄緯を計算する
   * @param {Date} date 計算日時
   * @returns {number} 月の黄緯[単位:ラジアン]
   */
  public static calculateMoonEclipticLatitudeInRadian = (date: Date): number => {
    // 経過ユリウス年を取得する
    const julianTime = this.getJulianYearsElapsed(date);

    // 月の黄緯の補正項を計算する
    const latCorr = CoordinateCalcUtil.degreeToRadian(
      0.0267 * Math.sin(4.10065107756068 + 0.337564130628223 * julianTime) +
        0.0043 * Math.sin(5.62170552067374 + 0.337895743186102 * julianTime) +
        0.004 * Math.sin(2.08566845613322 + 0.0232128790515246 * julianTime) +
        0.002 * Math.sin(0.959931088596881 + 0.337546677335703 * julianTime) +
        0.0005 * Math.sin(5.35816080362259 + 0.3385938748869 * julianTime)
    );
    // 月の黄緯を計算する
    const lunarLatitude = CoordinateCalcUtil.normalizeAngle(
      5.1282 * Math.sin(1.62792095321267 + 84.3346620128749 * julianTime + latCorr) +
        0.2806 * Math.sin(3.98345221828926 + 167.62157495051 * julianTime) +
        0.2777 * Math.sin(2.41398234172588 + 1.04774907524023 * julianTime) +
        0.1732 * Math.sin(2.48582009373796 + 71.0928803939205 * julianTime) +
        0.0554 * Math.sin(3.3861132817942 + 156.475294972694 * julianTime) +
        0.0463 * Math.sin(3.01156562431622 + 12.1940395250312 * julianTime) +
        0.0326 * Math.sin(5.74143510736055 + 239.762197438353 * julianTime) +
        0.0172 * Math.sin(0.0555014702134197 + 250.908480906827 * julianTime) +
        0.0093 * Math.sin(4.84154334503227 + 154.37978285958 * julianTime) +
        0.0088 * Math.sin(3.08399678827398 + 82.239216222272 * julianTime) +
        0.0082 * Math.sin(2.52898208613978 + 64.809834713081 * julianTime) +
        0.0043 * Math.sin(5.36863277913456 + 95.481029257153 * julianTime) +
        0.0042 * Math.sin(1.81339709282211 + 323.049099904012 * julianTime) +
        0.0034 * Math.sin(5.58330827712986 + 77.3758562615898 * julianTime) +
        0.0025 * Math.sin(3.42957198016886 + 150.19221438527 * julianTime) +
        0.0022 * Math.sin(5.78402114110921 + 233.479151757514 * julianTime) +
        0.0021 * Math.sin(2.96880505764235 + 18.4771026591632 * julianTime) +
        0.0019 * Math.sin(4.02647458435092 + 161.338585120206 * julianTime) +
        0.0018 * Math.sin(4.2463860701022 + 143.233586657568 * julianTime) +
        0.0018 * Math.sin(4.72635161440064 + 90.6176692964708 * julianTime) +
        0.0017 * Math.sin(1.74183859349034 + 253.003975566649 * julianTime) +
        0.0016 * Math.sin(2.3684117949563 + 7.33073192422658 * julianTime) +
        0.0015 * Math.sin(3.68439005096003 + 162.048410526992 * julianTime) +
        0.0015 * Math.sin(0.799360797413403 + 173.904606668715 * julianTime) +
        0.0014 * Math.sin(3.82576172037157 + 5.23528962428219 * julianTime) +
        0.0013 * Math.sin(1.67202542341057 + 78.051647747962 * julianTime) +
        0.0013 * Math.sin(2.71224165759919 + 6.62090651744049 * julianTime) +
        0.0012 * Math.sin(0.670206432765822 + 83.9971118448807 * julianTime) +
        0.0012 * Math.sin(2.5865779514556 + 84.6722051995521 * julianTime) +
        0.0011 * Math.sin(2.41379035550816 + 334.195470638949 * julianTime) +
        0.001 * Math.sin(0.314159265358979 + 226.520349496887 * julianTime) +
        0.0008 * Math.sin(1.22173047639603 + 311.902554636151 * julianTime) +
        0.0008 * Math.sin(5.68977336150151 + 169.717561793181 * julianTime) +
        0.0007 * Math.sin(5.13126800086333 + 228.615442730981 * julianTime) +
        0.0006 * Math.sin(3.9095375244673 + 97.576122491247 * julianTime) +
        0.0006 * Math.sin(0.907571211037051 + 237.666720231824 * julianTime) +
        0.0005 * Math.sin(4.88692190558412 + 148.096423019475 * julianTime) +
        0.0005 * Math.sin(4.17133691226645 + 73.1886368531302 * julianTime) +
        0.0004 * Math.sin(5.42797397370236 + 165.52528092989 * julianTime) +
        0.0004 * Math.sin(4.1538836197465 + 406.335339144556 * julianTime) +
        0.0004 * Math.sin(1.41371669411541 + 178.767093964771 * julianTime) +
        0.0004 * Math.sin(0.226892802759263 + 162.758934065479 * julianTime) +
        0.0004 * Math.sin(2.56563400043166 + 246.046045970649 * julianTime) +
        0.0003 * Math.sin(3.57792496658838 + 395.18966654132 * julianTime) +
        0.0003 * Math.sin(1.86750229963393 + 316.766787261459 * julianTime) +
        0.0003 * Math.sin(2.54818070791172 + 58.5261258071259 * julianTime) +
        0.0003 * Math.sin(4.08407044966673 + 336.290040274267 * julianTime)
    );
    return CoordinateCalcUtil.degreeToRadian(lunarLatitude);
  };

  /**
   * 月の黄経を計算する
   * @param {Date} date 計算日時
   * @returns {number} 月の黄経[単位:ラジアン]
   */
  public static calculateMoonEclipticLongitudeInRadian = (date: Date): number => {
    // 経過ユリウス年を取得する
    const julianTime = this.getJulianYearsElapsed(date);

    // 月の黄経の補正項を計算する
    const lonCorr = CoordinateCalcUtil.degreeToRadian(
      0.004 * Math.sin(2.08566845613322 + 0.0232128790515246 * julianTime) +
        0.002 * Math.sin(0.959931088596881 + 0.337546677335703 * julianTime) +
        0.0006 * Math.sin(1.23918376891597 + 0.00349065850398866 * julianTime) +
        0.0006 * Math.sin(0.942477796076938 + 0.336848545634906 * julianTime)
    );
    // 月の黄経を計算する
    const lunarLongitude = CoordinateCalcUtil.normalizeAngle(
      218.3161 +
        4812.67881 * julianTime +
        6.2887 * Math.sin(2.35551381178407 + 83.2869129376347 * julianTime + lonCorr) +
        1.274 * Math.sin(1.75820978187405 + 72.1406294691607 * julianTime) +
        0.6583 * Math.sin(4.11374104695063 + 155.427542406795 * julianTime) +
        0.2136 * Math.sin(4.71109743673821 + 166.573827620599 * julianTime) +
        0.1856 * Math.sin(3.09839575460293 + 6.28301950090065 * julianTime) +
        0.1143 * Math.sin(0.114249252835549 + 168.66932402575 * julianTime) +
        0.0588 * Math.sin(3.73884432362225 + 11.146283468474 * julianTime) +
        0.0572 * Math.sin(1.80135432098335 + 65.8576082229308 * julianTime) +
        0.0533 * Math.sin(0.186052098262596 + 238.714458835089 * julianTime) +
        0.0459 * Math.sin(4.15702521240009 + 149.144528141882 * julianTime) +
        0.041 * Math.sin(2.39860599101581 + 77.0038916914048 * julianTime) +
        0.0348 * Math.sin(2.05669599055012 + 77.7137694580684 * julianTime) +
        0.0305 * Math.sin(5.45397937955708 + 89.5699306932061 * julianTime) +
        0.0153 * Math.sin(2.28358879330938 + 13.2417781282959 * julianTime) +
        0.0125 * Math.sin(2.46981542449718 + 251.956236963384 * julianTime) +
        0.011 * Math.sin(4.04200801469367 + 85.3824145787736 * julianTime) +
        0.0107 * Math.sin(5.87198573540972 + 227.568175366615 * julianTime) +
        0.01 * Math.sin(0.783478301220255 + 249.860742303563 * julianTime) +
        0.0085 * Math.sin(3.51683844276857 + 144.28130780754 * julianTime) +
        0.0079 * Math.sin(4.85550597904822 + 78.423577411562 * julianTime) +
        0.0068 * Math.sin(0.928515162060983 + 161.710514783806 * julianTime) +
        0.0052 * Math.sin(3.44178928493282 + 5.57318536746829 * julianTime) +
        0.005 * Math.sin(5.15570261039125 + 83.9967627790303 * julianTime) +
        0.0048 * Math.sin(4.10152374218667 + 0.337546677335703 * julianTime) +
        0.004 * Math.sin(0.230383461263251 + 232.431430607542 * julianTime) +
        0.004 * Math.sin(2.54119939090374 + 322.00137875404 * julianTime) +
        0.004 * Math.sin(2.08566845613322 + 0.0232128790515246 * julianTime) +
        0.0039 * Math.sin(1.94255145746969 + 310.855008019104 * julianTime) +
        0.0037 * Math.sin(6.0929444187122 + 94.4331335742556 * julianTime) +
        0.0027 * Math.sin(4.75602221168455 + 160.290863970234 * julianTime) +
        0.0026 * Math.sin(1.87099295813792 + 240.80988368174 * julianTime) +
        0.0024 * Math.sin(3.69835268497598 + 17.429381509191 * julianTime) +
        0.0024 * Math.sin(4.41219234904167 + 161.00068937702 * julianTime) +
        0.0022 * Math.sin(4.19926218029836 + 142.861482461043 * julianTime) +
        0.0021 * Math.sin(1.52716309549504 + 172.856885518743 * julianTime) +
        0.0021 * Math.sin(3.05607152024207 + 12.5660215485088 * julianTime) +
        0.0021 * Math.sin(1.84306769010601 + 59.5745450887988 * julianTime) +
        0.002 * Math.sin(0.959931088596881 + 0.337546677335703 * julianTime) +
        0.0018 * Math.sin(0.0715584993317675 + 70.0451243373632 * julianTime) +
        0.0016 * Math.sin(4.22718744833027 + 324.096821053985 * julianTime) +
        0.0012 * Math.sin(5.91666616426078 + 221.28523440553 * julianTime) +
        0.0011 * Math.sin(4.82583538176432 + 335.243191788921 * julianTime) +
        0.0009 * Math.sin(3.80481776934764 + 149.853969576233 * julianTime) +
        0.0008 * Math.sin(3.28121899374934 + 244.9971030902 * julianTime) +
        0.0008 * Math.sin(3.56047167406843 + 137.997947967436 * julianTime) +
        0.0007 * Math.sin(2.44346095279206 + 70.7207412908102 * julianTime) +
        0.0007 * Math.sin(4.79965544298441 + 84.7060645870408 * julianTime) +
        0.0007 * Math.sin(3.76991118430775 + 4.8624872960562 * julianTime) +
        0.0006 * Math.sin(2.23402144255274 + 19.5249983420606 * julianTime) +
        0.0005 * Math.sin(4.31096325242599 + 394.142468990123 * julianTime) +
        0.0005 * Math.sin(3.15904594610974 + 333.148447620678 * julianTime) +
        0.0005 * Math.sin(1.98967534727354 + 304.572171777774 * julianTime) +
        0.0005 * Math.sin(5.79449311662117 + 88.8599482067873 * julianTime) +
        0.0004 * Math.sin(5.46288055874225 + 6.95862772770139 * julianTime) +
        0.0004 * Math.sin(4.85201532054424 + 2.09614043164519 * julianTime) +
        0.0004 * Math.sin(1.23918376891597 + 167.284572815901 * julianTime) +
        0.0004 * Math.sin(0.349065850398866 + 12.5663706143592 * julianTime) +
        0.0003 * Math.sin(1.44862327915529 + 66.5668576710637 * julianTime) +
        0.0003 * Math.sin(1.15191730631626 + 60.9940213694458 * julianTime) +
        0.0003 * Math.sin(2.56563400043166 + 315.71784438101 * julianTime) +
        0.0003 * Math.sin(5.42797397370236 + 95.8534825195286 * julianTime) +
        0.0003 * Math.sin(2.80998009571087 + 0.710349005561692 * julianTime) +
        0.0003 * Math.sin(4.88692190558412 + 405.288141593359 * julianTime)
    );
    return CoordinateCalcUtil.degreeToRadian(lunarLongitude);
  };

  /**
   * 朔からの経過日数(月齢)を計算する
   * @param {Date} date 計算日時
   * @returns {number} 朔からの経過日数(月齢)[単位:日]
   */
  public static calculateMoonAge = (date: Date): number => {
    // 月の黄経を計算する
    const moonEclipticLongitude = this.calculateMoonEclipticLongitudeInRadian(date);
    // 太陽の黄経を計算する
    const sunEcliptic = this.calculateSunEclipticLongitudeInRadian(date);
    // 朔からの経過日数(月齢)を計算する
    return CoordinateCalcUtil.normalizeRadian(moonEclipticLongitude - sunEcliptic.longitude) / 0.2127695985;
  };
}

export default AstronomyUtil;
