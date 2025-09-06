import TleUtil from "@/main/util/TleUtil";
import SatelliteService from "@/renderer/service/SatelliteService";

class TleDataHelper {
  /**
   * TLE
   */
  public static readonly Tle = class {
    // ISS (ZARYA)
    static readonly ISS = {
      noradId: "25544",
      satelliteName: "ISS (ZARYA)",
      tleLine1: "1 25544U 98067A   24256.46084667  .00027694  00000-0  50912-3 0  9998",
      tleLine2: "2 25544  51.6380 243.0542 0007697 345.2843 100.4574 15.48970942472084",
    };
    // （太陽同期軌道）だいち4号機
    static readonly DAICHI = {
      noradId: "60182",
      satelliteName: "ALOS-4 (DAICHI-4)",
      tleLine1: "1 60182U 24123A   24254.83486561  .00001922  00000-0  26417-3 0  9995",
      tleLine2: "2 60182  97.9211 351.2488 0001529  96.9564 263.1822 14.79474015 10754",
    };
    // （静止軌道）ひまわり8号機（2024年指定向け）
    static readonly HIMAWARI8_20241001 = {
      noradId: "40267",
      satelliteName: "HIMAWARI 8",
      tleLine1: "1 40267U 14060A   24255.96883338 -.00000272  00000-0  00000+0 0  9997",
      tleLine2: "2 40267   0.0097 194.8537 0000918 318.0173 328.0486  1.00272067 36415",
    };
    // （静止軌道）ひまわり8号機（2025年指定向け）
    static readonly HIMAWARI8_20250906 = {
      noradId: "40267",
      satelliteName: "HIMAWARI 8",
      tleLine1: "1 40267U 14060A   25249.19168663 -.00000278  00000-0  00000-0 0  9990",
      tleLine2: "2 40267   0.0382 234.2716 0000984 269.5569  51.3711  1.00273644 39908",
    };
    // （準天頂軌道）みちびき
    static readonly MICHIBIKI = {
      noradId: "42738",
      satelliteName: "QZS-2 (MICHIBIKI-2)",
      tleLine1: "1 42738U 17028A   24255.96369000 -.00000107  00000-0  00000+0 0  9991",
      tleLine2: "2 42738  40.4401 252.5082 0749956 270.3055 316.4564  1.00261710 26673",
    };
    // （常に不可視）静止軌道（GOES 17）
    static readonly GOES = {
      noradId: "43226",
      satelliteName: "GOES 17",
      tleLine1: "1 43226U 18022A   24255.63394866 -.00000087  00000-0  00000-0 0  9999",
      tleLine2: "2 43226   0.0223 337.8465 0002118 223.3801 273.4352  1.00271642 23973",
    };
    // （常に不可視）AEHF-1 (USA 214)
    static readonly AEHF = {
      noradId: "36868",
      satelliteName: "AEHF-1",
      tleLine1: "1 36868U 10039A   24256.15768611  .00000098  00000-0  00000+0 0  9994",
      tleLine2: "2 36868   6.5959  76.2019 0003629  74.3545 269.4022  1.00412228 51988",
    };
    // （モルニア軌道）
    static readonly MOLNIYA = {
      noradId: "25485",
      satelliteName: "MOLNIYA 1-91",
      tleLine1: "1 25485U 98054A   24254.24644724 -.00000099  00000-0  00000+0 0  9998",
      tleLine2: "2 25485  64.1434  22.1317 6821281 289.9350  12.1954  2.36441163197669",
    };
    // （高軌道衛星）TESS
    static readonly HEO = {
      noradId: "43435",
      satelliteName: "TESS",
      tleLine1: "1 43435U 18038A   24262.33225493 -.00001052  00000-0  00000-0 0  9995",
      tleLine2: "2 43435  51.7454  60.8303 4593193 124.3403   0.2501  0.07594463  1386",
    };
    // ISS (ZARYA)の軌道要素
    static readonly ISS_ORBIT = TleUtil.orbitElementsToTLE({
      noradId: "25544",
      satelliteName: "ISS (ZARYA)",
      epochUtcDate: new Date(),
      semiMajorAxisKm: 6797.0,
      inclinationDeg: 51.6,
      raanDeg: 243.0542,
      argumentOfPerigeeDeg: 345.284,
      eccentricity: 0.0007697,
      meanAnomalyDeg: 100.4574,
      bStar: 0.0,
    });
  };

  /**
   * 人工衛星サービス
   */
  public static readonly Satellite = class {
    // ISS (ZARYA)
    static readonly ISS = new SatelliteService(TleDataHelper.Tle.ISS);
    // （太陽同期軌道）だいち4号機
    static readonly DAICHI = new SatelliteService(TleDataHelper.Tle.DAICHI);
    // （静止軌道）ひまわり8号機
    static readonly HIMAWARI8_20241001 = new SatelliteService(TleDataHelper.Tle.HIMAWARI8_20241001);
    // （静止軌道）ひまわり8号機
    static readonly HIMAWARI8_20250906 = new SatelliteService(TleDataHelper.Tle.HIMAWARI8_20250906);
    // （準天頂軌道）みちびき
    static readonly MICHIBIKI = new SatelliteService(TleDataHelper.Tle.MICHIBIKI);
    // （常に不可視）静止軌道（GOES 17）
    static readonly GOES = new SatelliteService(TleDataHelper.Tle.GOES);
    // （常に不可視）AEHF-1 (USA 214)
    static readonly AEHF = new SatelliteService(TleDataHelper.Tle.AEHF);
    // （モルニア軌道）
    static readonly MOLNIYA = new SatelliteService(TleDataHelper.Tle.MOLNIYA);
    // （高軌道衛星）TESS
    static readonly HEO = new SatelliteService(TleDataHelper.Tle.HEO);
    // ISS (ZARYA)の軌道要素
    static readonly ISS_ORBIT = new SatelliteService({
      satelliteName: TleDataHelper.Tle.ISS_ORBIT.satelliteName,
      tleLine1: TleDataHelper.Tle.ISS_ORBIT.tleLine1,
      tleLine2: TleDataHelper.Tle.ISS_ORBIT.tleLine2,
    });
  };

  /**
   * NoradID
   */
  public static readonly NoradId = class {
    // ISS (ZARYA)
    static readonly ISS = TleDataHelper.Satellite.ISS.getNoradId();
    // （太陽同期軌道）だいち4号機
    static readonly DAICHI = TleDataHelper.Satellite.DAICHI.getNoradId();
    // （静止軌道）ひまわり8号機
    static readonly HIMAWARI8_20241001 = TleDataHelper.Satellite.HIMAWARI8_20241001.getNoradId();
    // （準天頂軌道）みちびき
    static readonly MICHIBIKI = TleDataHelper.Satellite.MICHIBIKI.getNoradId();
    // （常に不可視）静止軌道（GOES 17）
    static readonly GOES = TleDataHelper.Satellite.GOES.getNoradId();
    // （常に不可視）AEHF-1 (USA 214)
    static readonly AEHF = TleDataHelper.Satellite.AEHF.getNoradId();
    // （モルニア軌道）
    static readonly MOLNIYA = TleDataHelper.Satellite.MOLNIYA.getNoradId();
    // （高軌道衛星）TESS
    static readonly HEO = TleDataHelper.Satellite.HEO.getNoradId();
    // ISS (ZARYA)の軌道要素
    static readonly ISS_ORBIT = TleDataHelper.Satellite.ISS_ORBIT.getNoradId();
  };
}

export default TleDataHelper;
