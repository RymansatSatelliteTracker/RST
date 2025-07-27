/**
 * 定数
 */
export default class Constant {
  public static readonly appVersion = "0.1.3";

  /**
   * ロガー関係
   */
  public static readonly Logger = class {
    // ログファイル名
    static readonly LOG_FILENAME = "rst.log";
    // ログファイルサイズ（この設定値を超えた場合にローテーションされる）
    static readonly LOG_SIZE = 10 * 1024 * 1024; // 10MB;
  };

  /**
   * 設定関係
   */
  public static readonly Config = class {
    // 設定ファイル名
    static readonly CONFIG_FILENAME = "app_config";
    // 設定ファイル名／無線機定義
    static readonly CONFIG_TRANSCEIVER_FILENAME = "transceiver.json";
    // 設定ファイル名／ローテーター定義
    static readonly CONFIG_ROTATOR_FILENAME = "rotator.json";
    // 設定ファイル名／デフォルト衛星定義
    static readonly DEFAULT_SATELLITE_FILENAME = "default_satellite.json";
    // 設定ファイル名／衛星周波数設定定義
    static readonly FREQUENCY_FILENAME = "frequency.json";
    // 設定ファイル名／Window設定
    static readonly CONFIG_WINDOW = "app_window";

    // 設定ファイル名／初期データ／無線機定義
    static readonly INIT_CONFIG_TRANSCEIVER_FILE_PATH = "resources/data/init-data/transceiver.json";

    // 設定ファイル名／初期データ／ローテーター定義
    static readonly INIT_CONFIG_ROTATOR_FILE_PATH = "resources/data/init-data/rotator.json";

    // 設定ファイル名／初期データ／デフォルト衛星定義
    static readonly INIT_CONFIG_DEFAULT_SATELLITE_FILE_PATH = "resources/data/init-data/default_satellite.json";

    /**
     * 設定／ローテーター
     */
    public static readonly Rotator = class {
      // 動作モード
      static readonly MOVE_MODE_NORMAL = "normal";
      static readonly MOVE_MODE_FLIP = "flip";
    };
  };

  /**
   * グローバルイベント関係
   * 定義する文字列は一意にすること。
   */
  public static readonly GlobalEvent = class {
    static readonly NOTICE_INFO = "NOTICE_INFO";
    static readonly NOTICE_ERR = "NOTICE_ERR";
    static readonly NOTICE_CONFIRM = "NOTICE_CONFIRM";
  };

  /**
   * TLE関係
   */
  public static readonly Tle = class {
    // TLEファイル名
    static readonly TLE_FILENAME = "tle.json";
    // TLE取得を許可する時間差
    // memo: celestrak.orgに連続アクセスすると403を返すため、以下時間をおいて取得を行う
    static readonly TLE_GET_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6時間
    // TLEの有効期限日数
    static readonly TLE_EXPIRATION_DAYS = 7;
  };

  /**
   * 時間関係
   */
  public static readonly Time = class {
    // 日時のロケール設定
    static readonly DATE_LOCALE = "ja-JP";
    // 1日[単位:分]
    static readonly MINUTES_IN_DAY = 1440.0;
    // 1日[単位:秒]
    static readonly SECONDS_IN_DAY = 86400.0;
    // 1日[単位:ミリ秒]
    static readonly MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000.0;
    // 1分[単位:秒]
    static readonly SECONDS_IN_MINUTE = 60.0;
    // 1分[単位:ミリ秒]
    static readonly MILLISECONDS_IN_MINUTE = 60000.0;
  };

  /**
   * 天文関係
   */
  public static readonly Astronomy = class {
    // ユリウス年[単位:日]
    static readonly JULIAN_YEAR = 365.25;
    // J2000.0元期(2000年1月1日12時UT)
    static readonly J2000_EPOCH = new Date(Date.UTC(2000, 0, 1, 12, 0, 0, 0));
    // J2000.0元期(2000年1月1日12時UT)のユリウス通日
    static readonly J2000_JULIAN_DATE = 2451545.0;
    // Date関数のエポック(1970年1月1日12時UT)に対応するユリウス通日
    static readonly J1970_JULIAN_DATE = 2440588.0;
    // 1恒星日[単位:分]
    static readonly MINUTES_IN_SIDEREAL_DAY = 1436.06818;
    // 1天文単位[単位:km]
    static readonly ASTRONOMICAL_UNIT_KM = 149597870.7;
    // 黄道傾角[単位:度]
    static readonly ECLIPTIC_INCLINATION_DEG = 23.436092;
    // 万有引力定数
    static readonly GRAVITATIONAL_CONSTANT = 6.67428e-11;
    // 光速[単位:m/s]
    static readonly LIGHT_SPEED = 299792458.0;
    // 地球の赤道半径[単位:km]
    static readonly EARTH_EQUATOR_RADIUS_KM = 6378.1366;
    // 地球の極半径[単位:km]
    static readonly EARTH_POLAR_RADIUS_KM = 6356.7523;
    // 地球の離心率^2
    static readonly EARTH_ECCENTRICITY = 0.006694259853221781;
    // 地球の質量
    static readonly EARTH_MASS = 5.9722e24;
    // 薄明曲線の描画ポイントの数
    static readonly TWILIGHT_CURVE_NUM_POINTS = 720;
    // 夜領域の色
    static readonly NIGHT_COLOR = "#000000FF";
  };

  /**
   * 単位関係
   */
  public static readonly Unit = class {
    // 10e6
    static readonly Mega = 1000000;
  };

  /**
   * 表示設定関係
   */
  public static readonly Display = class {
    // 地上局のマーカーの大きさ(半径)
    static readonly GROUNDSTATION_MARKER_RADIUS = 6;
    // 地上局1のマーカー色
    static readonly GROUNDSTATION1_MARKER_COLOR = "#EEEEEE";
    // 地上局2のマーカー色
    static readonly GROUNDSTATION2_MARKER_COLOR = "#FFFF00";
    // 人工衛星のマーカーの大きさ(半径)
    static readonly SATELLITE_MARKER_RADIUS = 5;
    // 人工衛星のマーカーの枠色
    static readonly SATELLITE_MARKER_BORDER_COLOR = "#DDDDDD";
  };

  /**
   * 軌道計算関係
   */
  public static readonly OrbitCalculation = class {
    // 軌道計算で許容できる偏差[%の小数値]
    static readonly DEVIATION_PERCENTAGE = 0.001;
    // 人工衛星が大気圏再突入したとする判定高度[単位:km]
    static readonly REENTRY_ALTITUDE_KM = 80.0;
    // 有効なパスとする最低仰角[単位:度]
    static readonly VALID_MIN_ELEVATION_DEG = 0.0;
    // パスのキャッシュ配列の最大要素数
    static readonly MAX_PASSES_CACHES_SIZE = 1000;
    // 人工衛星の過去軌道を軌道周期の何倍表示するか示す定数
    static readonly PAST_ORBIT_RATIO = 0.1;
    // 人工衛星の未来軌道を軌道周期の何倍表示するか示す定数
    static readonly FUTURE_ORBIT_RATIO = 1.0;
    // 人工衛星の軌道描画ピッチ[単位:分]
    static readonly ORBIT_PITCH_MIN = 0.2;
  };

  /**
   * 可視範囲関係
   */
  public static readonly VisibilityRange = class {
    // 人工衛星の可視範囲の描画ポイントの数
    static readonly NUM_POINTS = 360;
    // 人工衛星の可視範囲の枠色
    static readonly BORDER_COLOR = "#BDBDBDCC";
    // 人工衛星の可視範囲の塗りつぶし色
    static readonly FILL_COLOR = "#BDBDBD90";
  };

  /**
   * 無線機関係
   */
  public static readonly Transceiver = class {
    /**
     * 無線機メーカーID
     */
    public static readonly MakerId = class {
      // ICOM
      static readonly ICOM = "1";
      // YAESU
      static readonly YAESU = "2";
    };

    /**
     * 機種ID
     */
    public static readonly TransceiverId = class {
      // ICOM IC-910
      static readonly ICOM_IC910 = "4";
    };

    /**
     * 無線機運用モード
     */
    public static readonly OpeMode = class {
      // 未設定
      static readonly UNSET = "";
      // LSB
      static readonly LSB = "LSB";
      // USB
      static readonly USB = "USB";
      // AM
      static readonly AM = "AM";
      // CW
      static readonly CW = "CW";
      // FM
      static readonly FM = "FM";
      // DV
      // 画面上は設定できないが、無線機からの受信時に設定される可能性がある
      static readonly DV = "DV";
      // RTTY
      static readonly RTTY = "RTTY";
      // USB-D
      static readonly USB_D = "USB-D";
      // LSB-D
      static readonly LSB_D = "LSB-D";
      // FM-D
      static readonly FM_D = "FM-D";
    };

    /**
     * 無線機運用モード
     */
    public static readonly DopplerShiftMode = class {
      // 衛星固定
      static readonly FIXED_SAT = "FIXED_SAT";
      // 受信固定
      static readonly FIXED_RX = "FIXED_RX";
      // 送信固定
      static readonly FIXED_TX = "FIXED_TX";
    };

    /**
     * 無線機の衛星モード設定
     */
    public static readonly SatelliteMode = class {
      // 未設定
      static readonly UNSET = "";
      // SATELLITEモード
      static readonly SATELLITE = "SATELLITE";
      // SPLITモード
      static readonly SPLIT = "SPLIT";
    };

    /**
     * 無線機の衛星モードのトラッキングモード
     */
    public static readonly TrackingMode = class {
      // 通常モード
      static readonly NORMAL = "NORMAL";
      // 反転モード
      static readonly REVERSE = "REVERSE";
    };

    // ドップラーシフトが有効となるパス前後の追加時間範囲[単位:秒]
    static readonly DOPPLER_SHIFT_RANGE_SEC = 60;
    // 周波数データ(トランシーブ)受信時の待機時間[単位:ミリ秒]
    static readonly TRANSCEIVE_WAIT_MS = 2000;
  };

  /**
   * ローテーター関係
   */
  public static readonly Rotator = class {
    // 自動追尾時の更新間隔（ミリ秒）
    static readonly UPDATE_INTERVAL_MS = 1000;

    /**
     * ローテーターコマンドタイプ
     */
    public static readonly CmdType = class {
      // シミュレータ
      static readonly SIMULATOR = "simulator";
      // rsp Antenna IO
      static readonly RSP_V1_0 = "rsp_usb_antennaio_v1.0";
      // Bluetooth AZ/EL Rotator
      static readonly BT_AZ_EL_ROTATOR = "bt_az_el_rotator";
      // Fox Delta ST-2
      static readonly FOX_DELTA_ST2 = "fox_delta_st2";
    };

    /**
     * ローテータを動かす方向
     */
    public static readonly MoveType = class {
      static readonly AZ = "AZ";
      static readonly EL = "EL";
    };

    public static readonly Setting = class {
      // テストでローテーターを移動させる際の移動量（度）
      static readonly MOVE_TEST_VAL_DEGREE = 1;
      // テストでローテーターを移動させる間隔（ミリ秒）
      static readonly MOVE_TEST_INTERVAL_MS = 250;
    };
  };

  /**
   * 通知スナックバー関係
   */
  public static readonly SnackBar = class {
    // 表示時間（ミリ秒）
    static readonly DISP_TIMEOUT_MS = 5000;
  };

  /**
   * 衛星設定関係
   */
  public static readonly SatSetting = class {
    // 衛星パス抽出最小仰角の選択範囲0~85とするための配列の長さ
    static readonly ELEVATION_RANGE_LENGTH = 86;

    // グループごとの最大衛星数
    static readonly MAX_NUM_OF_SAT_IN_GROUP = 10;

    // 周波数設定ファイルのURL
    static readonly FREQUENCY_URL =
      "https://raw.githubusercontent.com/RymansatSatelliteTracker/RST/refs/heads/main/satellite_data/frequency.json";
  };

  /**
   * マニュアル関係
   */
  public static readonly Manual = class {
    // ヘルプURL
    static readonly HELP_URL =
      "https://github.com/RymansatSatelliteTracker/RST/blob/63e737771bf9d01473fa8a1167ea23cff2e7c2ca/manual/README.md";
  };
}
