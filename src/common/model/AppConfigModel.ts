import Constant from "@/common/Constant";

/**
 * アプリケーション設定モデル
 */
export class AppConfigModel {
  // アプリバージョン
  public appVersion = "0.0.3";

  // 表示言語
  public lang = "ja";

  // TLE設定
  public tle: AppConfigTle = new AppConfigTle();

  // 対象衛星リスト
  public satellites: AppConfigSatellite[] = [];

  // 衛星グループリスト
  public satelliteGroups: AppConfigSatelliteGroup[] = [];

  // 衛星情報
  public satelliteSetting = new AppConfigSatelliteSetting();

  // 無線機設定
  public transceiver = new AppConfigTransceiver();

  // ローテータ設定
  public rotator = new AppConfigRotator();

  // 地上局設定
  public groundStation = new AppConfigGroundStation();

  // 地上局2設定
  public groundStation2 = new AppConfigGroundStation2();

  // メイン画面表示設定
  public mainDisplay = new AppConfigMainDisplay();
}

/**
 * TLE設定
 */
export class AppConfigTle {
  // TLE最終取得日時（UnixTime）
  public lastRetrievedDate = 0;
  // TLE URLリスト
  public urls: AppConfigTleUrl[] = [];
}

/**
 * TLE URLリスト
 */
export class AppConfigTleUrl {
  // TLE URL
  public url = "";
  // 有効TLE URL
  public enable = false;
}

/**
 * 対象衛星
 */
export class AppConfigSatellite {
  // 衛星ID
  public satelliteId: number = -1;
  // ユーザ登録衛星フラグ
  public userRegistered = false;
  //ユーザ登録衛星名
  public userRegisteredSatelliteName = "";
  // ユーザ登録衛星TLE
  public userRegisteredTle = "";
  // 対象衛星NORAD ID
  public noradId: string = "";
  // 自動設定時に使用するアップリンク設定
  public autoModeUplinkFreq: number = 1;
  // 対象衛星アップリンク設定1
  public uplink1 = new Uplink();
  // 対象衛星アップリンク設定2
  public uplink2 = new Uplink();
  // 自動設定時に使用するダウンリンク設定
  public autoModeDownlinkFreq: number = 1;
  // 対象衛星ダウンリンク設定1
  public downlink1 = new Downlink();
  // 対象衛星ダウンリンク設定2
  public downlink2 = new Downlink();
  // トーン周波数
  public toneHz: number | null = null;
  // 対象衛星概要
  public outline = "";
}

/**
 * アップリンク設定タイプ
 */
export class Uplink {
  // アップリンク周波数(Hz)
  public uplinkHz: number | null = null;
  // アップリンクモード
  public uplinkMode = "";
}

/**
 * ダウンリンク設定タイプ
 */
export class Downlink {
  // ダウンリンク周波数(Hz)
  public downlinkHz: number | null = null;
  // ダウンリンクモード
  public downlinkMode = "";
}

/**
 * 衛星グループ
 */
export class AppConfigSatelliteGroup {
  // 衛星グループID
  public groupId = -1;
  // 衛星グループ名
  public groupName = "";
  // 衛星グループ衛星IDリスト
  public satelliteIds: number[] = [];
}

/**
 * 衛星設定
 */
export class AppConfigSatelliteSetting {
  // 衛星パス抽出最小仰角
  public satelliteChoiceMinEl = 0;
}

/**
 * 無線機設定
 */
export class AppConfigTransceiver {
  // 無線機シリアルポート
  public port = "";
  // 無線機のCI-Vアドレス(icom無線機のみ必須)
  public civAddress = "";
  // 無線機のメーカーID
  public makerId = "";
  // 無線機ID
  public transceiverId = "";
  // 無線機ボーレート（bps）
  public baudrateBps = "";
  // 無線機IPアドレス
  public ipAddress = "";
  // 無線機IPアドレスポート
  public ipPort = "";
  // 自動周波数制御インターバル（秒）
  public autoTrackingIntervalSec = "1";
  // 無線機の送信周波数
  public txFrequency = "2430.000.000";
  // 無線機の受信周波数
  public rxFrequency = "0480.000.000";
}

/**
 * ローテータ設定
 */
export class AppConfigRotator {
  // ローテータシリアルポート
  public port = "";
  // ローテーターのメーカーID
  public makerId = "";
  // ローテータID
  public rotatorId = "";
  // ローテータボーレート（bps）
  public baudrateBps = "";
  // ローテーターIPアドレス
  public ipAddress = "";
  // ローテーターIPアドレスポート
  public ipPort = "";
  // 起点角度
  public basePositionDegree = 0;
  // ローテーター最小方位
  public rangeAzMin = 0;
  // ローテーター最大方位
  public rangeAzMax = 360;
  // ローテーター最小仰角
  public rangeElMin = 0;
  // ローテーター最大仰角
  public rangeElMax = 180;
  // 動作モード
  public moveMode = Constant.Config.Rotator.MOVE_MODE_NORMAL;
  // 自動追尾開始分
  public startAgoMinute = 0;
  // パーク方位
  public parkPosAz = 0;
  // パーク仰角
  public parkPosEl = 0;
}

/**
 * 地上局設定
 */
export class AppConfigGroundStation {
  // 地上局標高
  public height = -1;
  // 地上局緯度
  public lat = -1;
  // 地上局経度
  public lon = -1;
}

/**
 * 地上局2設定
 */
export class AppConfigGroundStation2 {
  // 地上局2有効フラグ
  public enable = false;
  // 地上局標高
  public height = -1;
  // 地上局緯度
  public lat = -1;
  // 地上局経度
  public lon = -1;
}

/**
 * メインの画面表示設定
 */
export class AppConfigMainDisplay {
  // 表示する衛星のグループ
  public activeSatelliteGroupId = -1;
  // フォーカスする衛星のID
  public activeSatelliteId = -1;
}
