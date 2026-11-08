import Constant from "@/common/Constant.js";
import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import { AppConfigSatellite, AppConfigSatelliteGroup } from "@/common/model/AppConfigModel.js";
import type { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes.js";
import { makeBaseAppConfig, makeTle } from "./e2eTestData";

/**
 * アクティブ衛星の復元のE2Eテストで使用するテストデータ
 * MEMO: 地図の軌道からどちらの衛星かを判別できるよう、軌道の形が大きく異なる2つの衛星を用意する
 *       ネットワークから取得する軌道要素に依存しないよう、ユーザ登録衛星（TLEを設定ファイルに持つ）とする
 */

/** テスト用の衛星グループID */
export const TEST_GROUP_ID = 1;

/** テスト用の衛星の定義（グループ内の並び順） */
export const TEST_SATS = {
  /** 1つ目：赤道軌道（地図上の軌道は南北にほとんど振れない） */
  equatorial: { satelliteId: 9101, noradId: 99921, name: "E2E-EQUATORIAL", inclination: 0.1 },
  /** 2つ目：極軌道（地図上の軌道は南北に大きく振れる） */
  polar: { satelliteId: 9102, noradId: 99922, name: "E2E-POLAR", inclination: 98.0 },
} as const;

/** 無線設定（軌道表示のテストでは使用しないため、最小限の値とする） */
const FREQ_SETTING = {
  uplink1: { uplinkHz: null, uplinkMode: "" },
  uplink2: { uplinkHz: null, uplinkMode: "" },
  uplink3: { uplinkHz: null, uplinkMode: "" },
  downlink1: { downlinkHz: 435633000, downlinkMode: "FM" },
  downlink2: { downlinkHz: null, downlinkMode: "" },
  downlink3: { downlinkHz: null, downlinkMode: "" },
  beacon: { beaconHz: null, beaconMode: "" },
  enableSatelliteMode: false,
  satelliteMode: Constant.Transceiver.TrackingMode.NORMAL,
  dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_SAT,
  toneHz: null,
};

/**
 * 既定衛星定義（default_satellite.json）に追加するテスト用の衛星を返す
 * MEMO: グループ内の衛星は既定衛星定義に存在するものだけが選択肢に表示されるため、追加が必要
 */
export const makeTestDefaultSatellites = (): DefaultSatelliteType[] => {
  return Object.values(TEST_SATS).map((sat) => ({
    satelliteId: sat.satelliteId,
    satelliteName: sat.name,
    noradId: String(sat.noradId),
    ...FREQ_SETTING,
    outline: "",
  }));
};

/**
 * テスト用のアプリケーション設定を返す
 * @param activeSatelliteId 保存済みのアクティブ衛星（前回終了時のアクティブ衛星）
 */
export const makeTestAppConfig = (activeSatelliteId: number): AppConfigModel => {
  // 軌道要素をネットワークから取得しない、地上局を設定済みの基本形
  const config = makeBaseAppConfig();

  // 衛星（ユーザ登録衛星としてTLEを持たせる）
  config.satellites = Object.values(TEST_SATS).map((sat) => {
    const appSat = new AppConfigSatellite();
    Object.assign(appSat, FREQ_SETTING);
    appSat.satelliteId = sat.satelliteId;
    appSat.groupId = TEST_GROUP_ID;
    appSat.noradId = String(sat.noradId);
    appSat.userRegistered = true;
    appSat.userRegisteredSatelliteName = sat.name;
    appSat.userRegisteredTle = makeTle(sat.noradId, sat.inclination);
    return appSat;
  });

  // 衛星グループ（赤道軌道 → 極軌道 の順）
  const group = new AppConfigSatelliteGroup();
  group.groupId = TEST_GROUP_ID;
  group.groupName = "E2E";
  group.satelliteIds = Object.values(TEST_SATS).map((sat) => sat.satelliteId);
  config.satelliteGroups = [group];

  // 前回終了時のアクティブ衛星
  config.mainDisplay.activeSatelliteGroupId = TEST_GROUP_ID;
  config.mainDisplay.activeSatelliteId = activeSatelliteId;

  return config;
};
