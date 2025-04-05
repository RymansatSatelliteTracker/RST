import I18nMsgs from "@/common/I18nMsgs";
import ValidatorResultModel from "@/main/common/model/ValidatorResultModel";
import * as zod from "zod";

/**
 * AppConfigModelのバリテータ
 */
export default class AppConfigValidator {
  /**
   * 検証する
   * @returns == 0: エラーなしの場合
   *          > 0: エラー有りの場合は、ValidatorResultのリストを返す
   */
  public exec(data: any): ValidatorResultModel[] {
    const result = schemaAppConfig.safeParse(data);

    // エラー有りの場合は、ValidatorResultのリストを返す
    if (!result.success) {
      return this.toValidatorResults(result.error.issues);
    }

    return [];
  }

  /**
   * ZodのZodIssueリストをValidatorResultのリストに変換する
   */
  private toValidatorResults(zodIssues: zod.ZodIssue[]): ValidatorResultModel[] {
    const results: ValidatorResultModel[] = [];
    zodIssues.forEach((issue) => {
      // 入れ子があるのでエラー項目名を"/"で連結
      const errItemName = issue.path.join("/");
      const result = new ValidatorResultModel(errItemName, I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM);
      results.push(result);
    });

    return results;
  }
}

/**
 * zodスキーマ定義 AppConfigTleUrl
 */
const schemaTleUrl = zod.object({
  url: zod.string(),
  enable: zod.boolean(),
});

/**
 * zodスキーマ定義 AppConfigTle
 */
const schemaTle = zod.object({
  lastRetrievedDate: zod.number(),
  urls: zod.array(schemaTleUrl),
});

/**
 * zodスキーマ定義 Uplink
 */
const schemaUplink = zod.object({
  // アップリンク周波数（hz）
  uplinkHz: zod.number().nullable(),
  // アップリンクモード
  uplinkMode: zod.string(),
});

/**
 * zodスキーマ定義 Downlink
 */
const schemaDownlink = zod.object({
  // ダウンリンク周波数（hz）
  downlinkHz: zod.number().nullable(),
  // ダウンリンクモード
  downlinkMode: zod.string(),
});

/**
 * zodスキーマ定義 AppConfigSatellite
 */
const schemaSatellite = zod.object({
  // 衛星ID
  satelliteId: zod.number(),
  // ユーザ登録衛星フラグ
  userRegistered: zod.boolean(),
  //ユーザ登録衛星名
  userRegisteredSatelliteName: zod.string(),
  // ユーザ登録衛星TLE
  userRegisteredTle: zod.string(),
  // 対象衛星NORAD ID
  noradId: zod.string(),
  // 自動モード時アップリンク設定
  autoModeUplinkFreq: zod.number(),
  // 対象衛星アップリンク設定1
  uplink1: schemaUplink,
  // 対象衛星アップリンク設定2
  uplink2: schemaUplink,
  // 自動モード時ダウンリンク設定
  autoModeDownlinkFreq: zod.number(),
  // 対象衛星ダウンリンク設定1
  downlink1: schemaDownlink,
  // 対象衛星ダウンリンク設定2
  downlink2: schemaDownlink,
  // 対象衛星トーン周波数（Mhz）
  toneHz: zod.number().nullable(),
  // 対象衛星概要
  outline: zod.string(),
});

/**
 * zodスキーマ定義 AppConfigSatelliteGroup
 */
const schemaSatelliteGroup = zod.object({
  groupId: zod.number(),
  groupName: zod.string(),
  satelliteIds: zod.array(zod.number()),
});

/**
 * zodスキーマ定義 AppConfigSatelliteSetting
 */
const schemaSatelliteSetting = zod.object({
  // 衛星パス抽出最小仰角
  satelliteChoiceMinEl: zod.number(),
});

/**
 * zodスキーマ定義 AppConfigTransceiver
 */
const schemaTransceiver = zod.object({
  port: zod.string(),
  civAddress: zod.string(),
  makerId: zod.string(),
  transceiverId: zod.string(),
  baudrateBps: zod.string(),
  ipAddress: zod.string(),
  ipPort: zod.string(),
  autoTrackingIntervalSec: zod.string(),
  txFrequency: zod.string(),
  rxFrequency: zod.string(),
});

/**
 * zodスキーマ定義 AppConfigRotator
 */
const schemaRotator = zod.object({
  port: zod.string(),
  makerId: zod.string(),
  rotatorId: zod.string(),
  baudrateBps: zod.string(),
  ipAddress: zod.string(),
  ipPort: zod.string(),
  basePositionDegree: zod.number(),
  rangeAzMin: zod.number(),
  rangeAzMax: zod.number(),
  moveMode: zod.string(),
  startAgoMinute: zod.number(),
  parkPosAz: zod.number(),
  parkPosEl: zod.number(),
});

/**
 * zodスキーマ定義 AppConfigGroundStation
 */
const schemaGroundStation = zod.object({
  height: zod.number(),
  lat: zod.number(),
  lon: zod.number(),
});

/**
 * zodスキーマ定義 AppConfigGroundStation2
 */
const schemaGroundStation2 = zod.object({
  enable: zod.boolean(),
  height: zod.number(),
  lat: zod.number(),
  lon: zod.number(),
});

/**
 * zodスキーマ定義 AppConfigMainDisplay
 */
const schemaMainDisplay = zod.object({
  activeSatelliteGroupId: zod.number(),
  activeSatelliteId: zod.number(),
});

/**
 * zodスキーマ定義 AppConfigModel
 */
const schemaParam = zod.object({
  appVersion: zod.string(),
  lang: zod.string(),
  tle: schemaTle,
  satellites: zod.array(schemaSatellite),
  satelliteGroups: zod.array(schemaSatelliteGroup),
  satelliteSetting: schemaSatelliteSetting,
  transceiver: schemaTransceiver,
  rotator: schemaRotator,
  groundStation: schemaGroundStation,
  groundStation2: schemaGroundStation2,
  mainDisplay: schemaMainDisplay,
});

/**
 * zodスキーマ定義 AppConfigのparam部
 */
const schemaAppConfig = zod.object({
  param: schemaParam,
});
