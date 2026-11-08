import Constant from "@/common/Constant.js";
import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import { AppConfigSatellite, AppConfigSatelliteGroup } from "@/common/model/AppConfigModel.js";
import type { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes.js";
import { makeBaseAppConfig, makeTle } from "./e2eTestData";

/**
 * Beacon対応のE2Eテストで使用するテストデータ
 * MEMO: ネットワークから取得する軌道要素・周波数データに依存しないよう、
 *       衛星はユーザ登録衛星（TLEを設定ファイルに持つ）として用意する
 */

/** テスト用の衛星グループID */
export const TEST_GROUP_ID = 1;

/** テスト用の衛星の定義 */
export const TEST_SATS = {
  /** 衛星B：ビーコンあり、サテライトモード有効 */
  beacon: { satelliteId: 9001, noradId: 99901, name: "E2E-BEACON" },
  /** 衛星N：ビーコンなし、サテライトモード有効 */
  noBeacon: { satelliteId: 9002, noradId: 99902, name: "E2E-NOBEACON" },
  /** 衛星S：ビーコンあり、サテライトモード無効 */
  noSatMode: { satelliteId: 9003, noradId: 99903, name: "E2E-NOSATMODE" },
} as const;

/** 衛星Bのビーコン周波数（画面表示形式） */
export const BEACON_FREQ_TEXT = "0435.610.000";

/** 起動時のRx/Tx周波数（画面表示形式） */
export const INITIAL_RX_FREQ_TEXT = "0435.700.000";
export const INITIAL_TX_FREQ_TEXT = "0145.900.000";

/**
 * 無線設定（衛星B/N/S 共通の周波数・運用モード）
 */
const makeFreqSetting = (beaconHz: number | null, enableSatelliteMode: boolean) => ({
  uplink1: { uplinkHz: 145970000, uplinkMode: "LSB" },
  uplink2: { uplinkHz: null, uplinkMode: "" },
  uplink3: { uplinkHz: null, uplinkMode: "" },
  downlink1: { downlinkHz: 435633000, downlinkMode: "USB" },
  downlink2: { downlinkHz: null, downlinkMode: "" },
  downlink3: { downlinkHz: null, downlinkMode: "" },
  beacon: { beaconHz, beaconMode: beaconHz === null ? "" : "CW" },
  enableSatelliteMode,
  satelliteMode: Constant.Transceiver.TrackingMode.NORMAL,
  dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_SAT,
  toneHz: null,
});

/** 衛星ごとの無線設定 */
const FREQ_SETTINGS = {
  [TEST_SATS.beacon.satelliteId]: makeFreqSetting(435610000, true),
  [TEST_SATS.noBeacon.satelliteId]: makeFreqSetting(null, true),
  [TEST_SATS.noSatMode.satelliteId]: makeFreqSetting(435610000, false),
};

/**
 * 既定衛星定義（default_satellite.json）に追加するテスト用の衛星を返す
 * MEMO: アクティブ衛星の無線設定は、既定衛星定義に存在する衛星のみ読み込まれるため、追加が必要
 */
export const makeTestDefaultSatellites = (): DefaultSatelliteType[] => {
  return Object.values(TEST_SATS).map((sat) => ({
    satelliteId: sat.satelliteId,
    satelliteName: sat.name,
    noradId: String(sat.noradId),
    ...FREQ_SETTINGS[sat.satelliteId],
    outline: "",
  }));
};

/**
 * テスト用のアプリケーション設定を返す
 */
export const makeTestAppConfig = (): AppConfigModel => {
  // 軌道要素をネットワークから取得しない、地上局を設定済みの基本形
  const config = makeBaseAppConfig();

  // 衛星（ユーザ登録衛星としてTLEを持たせる）
  config.satellites = Object.values(TEST_SATS).map((sat) => {
    const appSat = new AppConfigSatellite();
    Object.assign(appSat, FREQ_SETTINGS[sat.satelliteId]);
    appSat.satelliteId = sat.satelliteId;
    appSat.groupId = TEST_GROUP_ID;
    appSat.noradId = String(sat.noradId);
    appSat.userRegistered = true;
    appSat.userRegisteredSatelliteName = sat.name;
    appSat.userRegisteredTle = makeTle(sat.noradId);
    return appSat;
  });

  // 衛星グループ
  const group = new AppConfigSatelliteGroup();
  group.groupId = TEST_GROUP_ID;
  group.groupName = "E2E";
  group.satelliteIds = Object.values(TEST_SATS).map((sat) => sat.satelliteId);
  config.satelliteGroups = [group];

  // メイン画面は衛星Bを表示する
  config.mainDisplay.activeSatelliteGroupId = TEST_GROUP_ID;
  config.mainDisplay.activeSatelliteId = TEST_SATS.beacon.satelliteId;

  // 起動時の無線機周波数
  config.transceiver.rxFrequency = INITIAL_RX_FREQ_TEXT;
  config.transceiver.txFrequency = INITIAL_TX_FREQ_TEXT;

  return config;
};
