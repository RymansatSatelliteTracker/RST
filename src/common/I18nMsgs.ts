import { I18nMsgItem } from "@/common/types/types";

export default class I18nMsgs {
  // 汎用系エラーメッセージ
  public static readonly CHK_ERR_NUM: I18nMsgItem = {
    en: "Please enter a {0}-digit number",
    ja: "{0}桁の数字で入力してください",
  };
  public static readonly CHK_ERR_NUM_MIN_MAX: I18nMsgItem = {
    en: "Please enter a number between {0} and {1}",
    ja: "{0}～{1}の数字で入力してください",
  };
  public static readonly CHK_ERR_NUM_POSITIVE: I18nMsgItem = {
    en: "Please enter a number greater than 0",
    ja: "0より大きい数字を入力してください",
  };
  public static readonly CHK_ERR_POSITIVE_INT: I18nMsgItem = {
    en: "Please enter a positive integer",
    ja: "0より大きい整数を入力してください",
  };
  public static readonly CHK_ERR_NUM_DECIMAL: I18nMsgItem = {
    en: "Please enter a maximum of {0} decimal places",
    ja: "最大{0}桁の小数で入力してください",
  };
  public static readonly CHK_ERR_IPADDRESS: I18nMsgItem = {
    en: "Please enter an IPv4 address",
    ja: "IPアドレスv4形式で入力してください",
  };
  public static readonly CHK_ERR_URL: I18nMsgItem = {
    en: "Please enter the URL in the correct format",
    ja: "URLを適切な形式で入力してください",
  };
  public static readonly CHK_ERR_STRING_MIN: I18nMsgItem = {
    en: "Please enter a string of at least {0} characters",
    ja: "{0}文字以上の文字列で入力してください",
  };
  public static readonly CHK_ERR_STRING_ALPHANUMSYMB: I18nMsgItem = {
    en: "Please enter half-width alphanumeric characters and symbols. The following symbols can be used: &*/ '-+_()[].",
    ja: "半角英数字記号で入力してください。使用できる記号は＆*/ '-+_()[]です。",
  };
  public static readonly CHK_ERR_NOT_ENTERED_UPLINK: I18nMsgItem = {
    en: "Either the uplink frequency or the mode has not been entered",
    ja: "アップリンク周波数の周波数かモードいずれかが未入力です",
  };
  public static readonly CHK_ERR_NOT_ENTERED_DOWNLINK: I18nMsgItem = {
    en: "Either the downlink frequency or mode has not been entered.",
    ja: "ダウンリンク周波数の周波数かモードいずれかが未入力です",
  };
  public static readonly CHK_ERR_NOT_ENTERED_BEACON: I18nMsgItem = {
    en: "Either the beacon frequency or mode has not been entered.",
    ja: "ビーコン周波数の周波数かモードいずれかが未入力です",
  };
  public static readonly CHK_ERR_SATELLITEMODE_REQUIRE_UPDOWN: I18nMsgItem = {
    en: "When Satellite Mode is enabled, uplink and downlink settings are required.",
    ja: "サテライトモードが有効の場合、アップリンクとダウンリンクの設定は必須です",
  };

  public static readonly CHK_ERR_DUPLICATE_MOVE: I18nMsgItem = {
    en: "Duplicate data cannot be moved",
    ja: "重複したデータは移動できません",
  };
  public static readonly CHK_ERR_MAX_SATNUM: I18nMsgItem = {
    en: "The maximum number of satellites that can be registered in one group is {0}. Please reduce the number of satellites or register in a different group.",
    ja: "1つのグループに登録できる最大衛星数は{0}件です。衛星数を減らすか別のグループに登録してください。",
  };
  public static readonly CHK_ERR_GRID_LOCATOR_FORMAT: I18nMsgItem = {
    en: "Please enter in Grid Locator format",
    ja: "グリッドロケーターの形式で入力してください",
  };
  public static readonly CHK_ERR_NOT_ENTERED_LAT: I18nMsgItem = { en: "Latitude not entered", ja: "緯度が未入力です" };
  public static readonly CHK_ERR_NOT_ENTERED_LON: I18nMsgItem = { en: "Longitude not entered", ja: "経度が未入力です" };
  public static readonly CHK_ERR_NOT_ENTERED_HEIGHT: I18nMsgItem = { en: "Height not entered", ja: "⾼さが未入力です" };
  public static readonly CHK_ERR_DATE: I18nMsgItem = {
    en: "The date you entered is invalid",
    ja: "入力した日付が不正です",
  };
  public static readonly CHK_ERR_DATE_FORMAT: I18nMsgItem = {
    en: "Please enter the date in the format YYYY/MM/DD hh:mm",
    ja: "日付はYYYY/MM/DD hh:mmの形式で入力してください",
  };
  public static readonly CHK_ERR_DATE_RANGE: I18nMsgItem = {
    en: "Please enter a date between the current time and 2056/12/31 23:59:59",
    ja: "日付は現在時刻〜2056/12/31 23:59:59の範囲で入力してください",
  };
  public static readonly CHK_ERR_EITHER_TLE_ORBIT: I18nMsgItem = {
    en: "Enter either TLE or Orbital 6 Elements",
    ja: "TLEか軌道6要素のどちらかを入力してください",
  };
  public static readonly CHK_ERR_BOTH_TLE_ORBIT: I18nMsgItem = {
    en: "If both TLE and orbital 6 elements are entered, TLE will be given priority. Is this OK?",
    ja: "TLEと軌道6要素が両方入力されている場合TLEを優先します。よろしいですか？",
  };
  public static readonly CHK_ERR_EXPIRED_TLE: I18nMsgItem = {
    en: "The TLE epoch is out of date and may not provide accurate orbit estimation. Is this OK?",
    ja: "epochが古いため正確な軌道推定ができない可能性があります。よろしいですか？",
  };
  public static readonly CHK_ERR_ALL_ORBIT: I18nMsgItem = {
    en: "Please enter all 6 Orbital Elements",
    ja: "軌道6要素は全て入力してください",
  };
  public static readonly CHK_ERR_TLE: I18nMsgItem = { en: "TLE format is invalid", ja: "TLEのフォーマットが不正です" };
  public static readonly CHK_ERR_GET_TLE: I18nMsgItem = {
    en: "Cannot retrieve TLE from the specified URL ({0})",
    ja: "指定のURLからTLEを取得できません ({0})",
  };
  public static readonly CHK_ERR_TLE_2LINE: I18nMsgItem = {
    en: "Please enter TLE on two lines",
    ja: "TLEは2行で入力してください",
  };
  public static readonly CHK_ERR_NO_URL: I18nMsgItem = {
    en: "Please set at least one URL",
    ja: "URLは1つ以上設定してください",
  };
  public static readonly ERR_NO_OVERLAP_PASS: I18nMsgItem = {
    en: "No overlapping pass found.",
    ja: "重複パスが見つかりません。",
  };
  public static readonly CHK_ERR_NO_BEACON_FREQ: I18nMsgItem = {
    en: "Beacon frequency is not set.",
    ja: "ビーコン周波数が設定されていません。",
  };
  public static readonly CHK_ERR_NO_UPLINK_FREQ: I18nMsgItem = {
    en: "Uplink frequency is not set.",
    ja: "アップリンク周波数が設定されていません。",
  };
  public static readonly CHK_ERR_NO_DOWNLINK_FREQ: I18nMsgItem = {
    en: "Downlink frequency is not set.",
    ja: "ダウンリンク周波数が設定されていません。",
  };
  public static readonly CHK_ERR_NO_FREQ: I18nMsgItem = {
    en: "Uplink and Downlink frequencies are not set.",
    ja: "アップリンク周波数とダウンリンク周波数が設定されていません。",
  };

  // AppConfig系エラーメッセージ
  public static readonly CHK_ERR_APPCONFIG_NOT_EXISTS_FILE: I18nMsgItem = {
    en: "The application configuration file does not exist",
    ja: "アプリケーション設定ファイルが存在しません",
  };
  public static readonly CHK_ERR_APPCONFIG_NOT_JSON_FORMAT: I18nMsgItem = {
    en: "The application configuration file is not in JSON format",
    ja: "アプリケーション設定ファイルがJSON形式以外で記載されています",
  };
  public static readonly CHK_ERR_APPCONFIG_INVALID_ITEM: I18nMsgItem = {
    en: "The item value in the application configuration file is invalid",
    ja: "アプリケーション設定ファイルの項目値が不正です",
  };
  public static readonly ERR_APPCONFIG_UPDATE_FOR_LOCKED: I18nMsgItem = {
    en: "Failed to update the application configuration file. The file is locked.",
    ja: "アプリケーション設定ファイルの更新に失敗しました。ファイルがロックされています。",
  };
  public static readonly ERR_SERIAL_CONNECT_ABORT: I18nMsgItem = {
    en: "Serial connection failed",
    ja: "シリアル接続に失敗しました",
  };
  public static readonly ERR_SERIAL_CONNECT_SUCCESS: I18nMsgItem = {
    en: "Serial connection successful",
    ja: "シリアル接続に成功しました",
  };
  public static readonly ERR_GEO_LOCATION_NOT_FOUND: I18nMsgItem = {
    en: "Failed to fetch GeoLocation.",
    ja: "GeoLocationの取得に失敗しました。",
  };
  public static readonly ERR_NO_MAKER_SELECT: I18nMsgItem = {
    en: "Please select a Maker",
    ja: "メーカーを選択してください",
  };
  public static readonly ERR_FAIL_TO_UPDATE_TLE_URL: I18nMsgItem = {
    en: "Failed to update data based on the specified TLE URL",
    ja: "指定したTLEのURLに基づいたデータ更新に失敗しました",
  };
  public static readonly ERR_REFRESH_DEFAULT_SATELLITE: I18nMsgItem = {
    en: "Failed to refresh the Application configuration file",
    ja: "衛星設定のリフレッシュに失敗しました",
  };
  public static readonly ERR_UPDATE_DEFAULT_SATELLITE: I18nMsgItem = {
    en: "Failed to update the Application configuration file",
    ja: "衛星設定の更新に失敗しました",
  };
  // Frequency.json系エラーメッセージ
  public static readonly CHK_ERR_FREQUENCY_INVALID_ITEM: I18nMsgItem = {
    en: "The item value in the satellite frequency setting file is invalid",
    ja: "衛星周波数設定ファイルの項目値が不正です",
  };

  // システム系
  public static readonly SYSTEM_UNEXPECTED_ERROR: I18nMsgItem = {
    en: "An unexpected error has occurred",
    ja: "予期しないエラーが発生しました",
  };
  public static readonly SYSTEM_YET_TRANSCEIVER_CONFIG: I18nMsgItem = {
    en: "There are some items not set in the radio settings. Please set them in the radio menu.",
    ja: "無線機設定に未設定項目があります。無線機メニューで設定を行ってください。",
  };
  public static readonly SYSTEM_YET_ROTATOR_CONFIG: I18nMsgItem = {
    en: "Rotator is not set. Please set it in the rotator menu.",
    ja: "ローテータが未設定です。ローテータメニューで設定を行ってください。",
  };
  public static readonly SYSTEM_ROTATOR_SERIAL_RECV_TIMEOUT: I18nMsgItem = {
    en: "There is no response from the Rotator. Please check the connection destination in the Rotator settings.",
    ja: "ローテータから応答がありません。ローテータ設定の接続先を確認してください。",
  };
  public static readonly SYSTEM_TRANSCEIVER_SERIAL_RECV_TIMEOUT: I18nMsgItem = {
    en: "There is no response from the radio. Please check the connection destination in the radio settings.",
    ja: "無線機から応答がありません。無線機設定の接続先を確認してください。",
  };
  public static readonly SYSTEM_UPDATE_TLE_SUCCESS: I18nMsgItem = {
    en: "TLE update completed",
    ja: "TLEの更新が完了しました",
  };

  // シリアル接続系
  public static readonly SERIAL_NOT_CONNECTED: I18nMsgItem = { en: "Serial not connected", ja: "シリアルが未接続です" };
  public static readonly SERIAL_NOT_CONNECTED_ROTATOR: I18nMsgItem = {
    en: "Serial not connected",
    ja: "ローテータのシリアルが未接続です",
  };
  public static readonly SERIAL_NOT_CONNECTED_TRANSCEIVER: I18nMsgItem = {
    en: "Serial not connected",
    ja: "無線機のシリアルが未接続です",
  };
  public static readonly SERIAL_CONNECTION_FAILED: I18nMsgItem = {
    en: "Serial connection failed",
    ja: "シリアル接続に失敗しました",
  };
  public static readonly SERIAL_CONNECTION_SUCCESS: I18nMsgItem = {
    en: "Serial connection successful",
    ja: "シリアル接続に成功しました。",
  };

  // 画面項目系／共通系
  public static readonly GCOM_SATELLITE: I18nMsgItem = { en: "Satellite", ja: "衛星" };
  public static readonly GCOM_RADIO: I18nMsgItem = { en: "Radio", ja: "無線機" };
  public static readonly GCOM_ROTATOR: I18nMsgItem = { en: "Rotator", ja: "ローテータ" };
  public static readonly GCOM_GROUND_STATION: I18nMsgItem = { en: "Ground Station", ja: "地上局" };
  public static readonly GCOM_ACTION_OK: I18nMsgItem = { en: "OK", ja: "OK" };
  public static readonly GCOM_ACTION_CANCEL: I18nMsgItem = { en: "Cancel", ja: "キャンセル" };
  public static readonly GCOM_ACTION_UPDATE: I18nMsgItem = { en: "Update", ja: "更新" };
  public static readonly GCOM_RESET: I18nMsgItem = { en: "Reset", ja: "リセット" };
  public static readonly GCOM_SEARCH: I18nMsgItem = { en: "Search", ja: "検索" };
  public static readonly GCOM_ADD: I18nMsgItem = { en: "Add", ja: "追加" };
  public static readonly GCOM_CONFIRM: I18nMsgItem = { en: "Confirm", ja: "確認" };
  public static readonly GCOM_AZ: I18nMsgItem = { en: "Az", ja: "Az" };
  public static readonly GCOM_EL: I18nMsgItem = { en: "El", ja: "El" };
  public static readonly GCOM_LON: I18nMsgItem = { en: "Lon", ja: "Lon" };
  public static readonly GCOM_LAT: I18nMsgItem = { en: "Lat", ja: "Lat" };
  public static readonly GCOM_AOS: I18nMsgItem = { en: "AOS", ja: "AOS" };
  public static readonly GCOM_MAXEL: I18nMsgItem = { en: "Max El", ja: "Max El" };
  public static readonly GCOM_LOS: I18nMsgItem = { en: "LOS", ja: "LOS" };
  public static readonly GCOM_Duration: I18nMsgItem = { en: "Duration", ja: "Duration" };
  public static readonly GCOM_MINIMUM_DEGREE: I18nMsgItem = { en: "deg. minimum", ja: "°以上" };
  public static readonly GCOM_TLE: I18nMsgItem = { en: "TLE", ja: "TLE" };
  public static readonly GCOM_OR: I18nMsgItem = { en: "or", ja: "or" };
  public static readonly GCOM_NA: I18nMsgItem = { en: "―", ja: "―" };
  public static readonly GCOM_ERROR: I18nMsgItem = { en: "Error", ja: "エラー" };
  public static readonly GCOM_ENABLED: I18nMsgItem = { en: "Enabled", ja: "有効" };
  // 画面項目系／メニュー
  public static readonly GCOM_MENU_ABOUT_RSP: I18nMsgItem = { en: "About RST", ja: "RSTについて" };
  public static readonly GCOM_MENU_QUIT: I18nMsgItem = { en: "Quit", ja: "終了" };
  public static readonly GCOM_MENU_FILE: I18nMsgItem = { en: "File", ja: "ファイル" };
  public static readonly GCOM_MENU_IMPORT_CONFIG: I18nMsgItem = { en: "Import Config", ja: "設定インポート" };
  public static readonly GCOM_MENU_EXPORT_CONFIG: I18nMsgItem = { en: "Export Config", ja: "設定エクスポート" };
  public static readonly GCOM_MENU_UPDATE_TLE: I18nMsgItem = { en: "Update TLE", ja: "TLE更新" };
  public static readonly GCOM_MENU_EDIT: I18nMsgItem = { en: "Edit", ja: "編集" };
  public static readonly GCOM_MENU_SETTING: I18nMsgItem = { en: "Setting", ja: "設定" };
  public static readonly GCOM_MENU_LANG: I18nMsgItem = { en: "Lang", ja: "言語設定" };
  public static readonly GCOM_MENU_LANG_JA: I18nMsgItem = { en: "Japanese", ja: "日本語" };
  public static readonly GCOM_MENU_LANG_EN: I18nMsgItem = { en: "English", ja: "English" };
  public static readonly GCOM_MENU_HELP: I18nMsgItem = { en: "Help", ja: "ヘルプ" };
  public static readonly GCOM_MENU_VERSION: I18nMsgItem = { en: "Version", ja: "バージョン" };
  // 画面項目系／無線機
  public static readonly G2_FIXED_SAT: I18nMsgItem = { en: "Fixed Sat", ja: "衛星固定" };
  public static readonly G2_FIXED_RX: I18nMsgItem = { en: "Fixed RX", ja: "受信固定" };
  public static readonly G2_FIXED_TX: I18nMsgItem = { en: "Fixed TX", ja: "送信固定" };
  // 画面項目系／無線機設定画面
  public static readonly G41_TAB_CONNECTION: I18nMsgItem = { en: "Device", ja: "機種設定" };
  public static readonly G41_TAB_BEHIVIOR: I18nMsgItem = { en: "Behivior", ja: "動作設定" };
  public static readonly G41_MAKER: I18nMsgItem = { en: "Maker", ja: "メーカー" };
  public static readonly G41_DEVICE: I18nMsgItem = { en: "Device", ja: "機種" };
  public static readonly G41_SERIAL_PORT: I18nMsgItem = { en: "Serial Port", ja: "シリアルポート" };
  public static readonly G41_BORATE: I18nMsgItem = { en: "Baud Rate", ja: "ボーレート" };
  public static readonly G41_CIVADDRESS: I18nMsgItem = { en: "CI-V Address", ja: "CI-Vアドレス" };
  public static readonly G41_TEST_CONNECT: I18nMsgItem = { en: "Test Connect", ja: "接続テスト" };
  public static readonly G41_IPADDRESS: I18nMsgItem = { en: "IP Address", ja: "IPアドレス" };
  public static readonly G41_IPADDRESS_PORT: I18nMsgItem = { en: "Port", ja: "Port" };
  public static readonly G41_AUTO_INTERVAL: I18nMsgItem = { en: "Freq Control Interval", ja: "周波数設定インターバル" };
  public static readonly G41_AUTOTRACK_TIME: I18nMsgItem = {
    en: "Auto-Tracking Start/End Time",
    ja: "自動追尾準備・終了時間",
  };
  // 画面項目系／ローテータ設定画面
  public static readonly G51_TAB_CONNECTION: I18nMsgItem = { en: "Device", ja: "機種設定" };
  public static readonly G51_TAB_BEHIVIOR: I18nMsgItem = { en: "Behivior", ja: "動作設定" };
  public static readonly G51_MAKER: I18nMsgItem = { en: "Maker", ja: "メーカー" };
  public static readonly G51_DEVICE: I18nMsgItem = { en: "Device", ja: "機種" };
  public static readonly G51_SERIAL_PORT: I18nMsgItem = { en: "Serial Port", ja: "シリアルポート" };
  public static readonly G51_BORATE: I18nMsgItem = { en: "Baud Rate", ja: "ボーレート" };
  public static readonly G51_TEST_CONNECT: I18nMsgItem = { en: "Test Connect", ja: "接続テスト" };
  public static readonly G51_TEST_MODE: I18nMsgItem = { en: "Test Mode", ja: "テストモード" };
  public static readonly G51_IPADDRESS: I18nMsgItem = { en: "IP Address", ja: "IPアドレス" };
  public static readonly G51_IPADDRESS_PORT: I18nMsgItem = { en: "Port", ja: "Port" };
  public static readonly G51_AZ_KADO_HANI: I18nMsgItem = { en: "Az Range", ja: "方位可動範囲" };
  public static readonly G51_EL_KADO_HANI: I18nMsgItem = { en: "El Range", ja: "仰角可動範囲" };
  public static readonly G51_KADO_HANI_MIN: I18nMsgItem = { en: "Min", ja: "最小" };
  public static readonly G51_KADO_HANI_MAX: I18nMsgItem = { en: "Max", ja: "最大" };
  public static readonly G51_BASE_POSITION_DEGREE: I18nMsgItem = { en: "Base Position", ja: "起点" };
  public static readonly G51_BASE_POSITION_DEGREE_GUIDE: I18nMsgItem = { en: "North is 0°", ja: "北を0°とする" };
  public static readonly G51_MOVE_MODE: I18nMsgItem = { en: "Mode", ja: "モード" };
  public static readonly G51_MOVE_MODE_NORMAL: I18nMsgItem = { en: "Normal", ja: "ノーマルモード" };
  public static readonly G51_MOVE_MODE_FLIP: I18nMsgItem = { en: "Flip", ja: "フリップモード" };
  public static readonly G51_START_AGO_MINUTE: I18nMsgItem = {
    en: "Auto tracking start/end time",
    ja: "自動追尾準備・終了時間",
  };
  public static readonly G51_START_AGO_MINUTE_SUFIX: I18nMsgItem = { en: "minutes", ja: "分" };
  public static readonly G51_NEED_SELECT_MAKER: I18nMsgItem = {
    en: "need select maker",
    ja: "メーカーを選択してください",
  };
  public static readonly G51_PARK_POS: I18nMsgItem = { en: "Park position", ja: "パークポジション" };
  // 画面項目系／衛星設定画面
  public static readonly G31_DISPLAY_SATELLITE: I18nMsgItem = { en: "Display Satellite", ja: "表示衛星" };
  public static readonly G32_TLE_LOAD: I18nMsgItem = { en: "TLE Load", ja: "TLE読み込み" };
  public static readonly G33_OTHER_SETTING: I18nMsgItem = { en: "Others", ja: "その他設定" };
  // 画面項目系／衛星設定画面 表示衛星
  public static readonly G31_SATELLITE_GROUP: I18nMsgItem = { en: "Satellite Group", ja: "衛星グループ" };
  public static readonly G31_GROUP: I18nMsgItem = { en: "Group", ja: "グループ" };
  // 画面項目系／衛星設定画面　衛星情報編集
  public static readonly G31_INTERNATIONAL_NAME: I18nMsgItem = { en: "International Name", ja: "国際呼称" };
  public static readonly G31_NORADID: I18nMsgItem = { en: "NORAD ID", ja: "NORAD ID" };
  public static readonly G31_SATELLITE_NAME: I18nMsgItem = { en: "Satellite Name", ja: "衛星名" };
  public static readonly G31_UPLINK: I18nMsgItem = { en: "Uplink Freq.", ja: "アップリンク周波数" };
  public static readonly G31_DOWNLINK: I18nMsgItem = { en: "Downlink Freq.", ja: "ダウンリンク周波数" };
  public static readonly G31_TONE: I18nMsgItem = { en: "Tone Freq.", ja: "トーン周波数" };
  public static readonly G31_OUTLINE: I18nMsgItem = { en: "Outline", ja: "概要" };
  public static readonly G31_MANUAL_SET: I18nMsgItem = { en: "Manual", ja: "マニュアル設定" };
  public static readonly G31_BEACON: I18nMsgItem = { en: "Beacon Freq.", ja: "ビーコン周波数" };
  public static readonly G31_NORMAL: I18nMsgItem = { en: "Normal", ja: "ノーマル" };
  public static readonly G31_REVERSE: I18nMsgItem = { en: "Reverse", ja: "リバース" };

  // 画面項目系／衛星設定画面 衛星登録
  public static readonly G31_REGIST_SATELLITE: I18nMsgItem = { en: "Satellite Registration", ja: "衛星登録" };
  public static readonly G31_ORBITAL_ELEMENTS: I18nMsgItem = { en: "Orbital Elements", ja: "軌道6要素" };
  public static readonly G31_EPOCH: I18nMsgItem = { en: "Epoch(UTC)", ja: "Epoch(UTC)" };
  public static readonly G31_SEMI_MAJAR_AXIS: I18nMsgItem = { en: "Semi-major Axis", ja: "Semi-major Axis" };
  public static readonly G31_INCLINATION: I18nMsgItem = { en: "Inclination", ja: "Inclination" };
  public static readonly G31_RAAN: I18nMsgItem = { en: "R.A.A.N", ja: "R.A.A.N" };
  public static readonly G31_ECCENTRICITY: I18nMsgItem = { en: "Eccentricity", ja: "Eccentricity" };
  public static readonly G31_ARG_OF_PERIGEE: I18nMsgItem = { en: "Argument Of Perigee", ja: "Argument Of Perigee" };
  public static readonly G31_MEAN_ANOMALY: I18nMsgItem = { en: "Mean Anomaly", ja: "Mean Anomaly" };
  // 画面項目系／衛星設定画面 衛星登録 TLEメッセージ用
  public static readonly G31_LINE_NUMBER: I18nMsgItem = { en: "Line Number", ja: "行数" };
  public static readonly G31_SATELLITE_NUMBER: I18nMsgItem = { en: "Satellite Number", ja: "衛星番号" };
  public static readonly G31_CLASSIFICATION: I18nMsgItem = { en: "Classification", ja: "分類" };
  public static readonly G31_INTERNATIONAL_DESIGNATOR: I18nMsgItem = {
    en: "International Designator",
    ja: "国際識別子",
  };
  public static readonly G31_EPOCH_YEAR: I18nMsgItem = { en: "Epoch Year", ja: "エポック年" };
  public static readonly G31_EPOCH_DAY: I18nMsgItem = { en: "Epoch Day", ja: "エポック日" };
  public static readonly G31_NDOT: I18nMsgItem = { en: "First Derivative of Mean Motion", ja: "平均運動の1次微分" };
  public static readonly G31_NDDOT: I18nMsgItem = { en: "Second Derivative of Mean Motion", ja: "平均運動の2次微分" };
  public static readonly G31_B_STAR: I18nMsgItem = { en: "B* Drag Term", ja: "B*抗力項" };
  public static readonly G31_ELEMENT_NUMBER: I18nMsgItem = { en: "Element Set Number", ja: "要素セット番号" };
  public static readonly G31_MEAN_MOTION: I18nMsgItem = { en: "Mean Motion", ja: "平均運動" };
  public static readonly G31_REVOLUTION: I18nMsgItem = { en: "Revolution Number at Epoch", ja: "エポック時の周回数" };
  public static readonly G31_CHECKSUM: I18nMsgItem = { en: "Checksum", ja: "チェックサム" };
  public static readonly G31_EPHEMERIS_TYPE: I18nMsgItem = { en: "Ephemeris Type", ja: "エフェメリスタイプ" };
  public static readonly G31_SATELLITE_MODE: I18nMsgItem = { en: "Satellite Mode", ja: "サテライトモード" };
  // 画面項目系／衛星設定画面 その他設定
  public static readonly G33_MIN_ELEVATION: I18nMsgItem = { en: "Min. Elevation", ja: "最小仰角" };
  // 画面項目系／地上局画面
  public static readonly G61_GROUND_STATION_SETTING: I18nMsgItem = { en: "Ground Station Setting", ja: "地上局設定" };
  public static readonly G61_GROUND_STATION1: I18nMsgItem = { en: "Ground Station1", ja: "地上局1" };
  public static readonly G61_GROUND_STATION2: I18nMsgItem = { en: "Ground Station2", ja: "地上局2" };
  public static readonly G61_GROUND_STATION_LAT: I18nMsgItem = { en: "Lat(°)", ja: "緯度(°)" };
  public static readonly G61_GROUND_STATION_LON: I18nMsgItem = { en: "Lon(°)", ja: "経度(°)" };
  public static readonly G61_GROUND_STATION_HEIGHT: I18nMsgItem = { en: "Height(m)", ja: "高さ(m)" };
  public static readonly G61_GRID_LOCATER: I18nMsgItem = { en: "Grid Locater", ja: "グリッドロケーター" };
  public static readonly G61_GEO_LOCATION: I18nMsgItem = { en: "Geo Location", ja: "GeoLocation" };
  public static readonly G61_GEO_LOCATION_GET: I18nMsgItem = { en: "Get", ja: "取得" };
  public static readonly G61_GROUND_STATION2_ENABLED: I18nMsgItem = { en: "Enabled", ja: "有効" };
}
