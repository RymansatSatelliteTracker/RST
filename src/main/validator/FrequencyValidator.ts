import I18nMsgs from "@/common/I18nMsgs";
import ValidatorResultModel from "@/main/common/model/ValidatorResultModel";
import * as zod from "zod";

/**
 * FrequencyModelのバリテータ
 */
export default class FrequencyValidator {
  /**
   * 検証する
   * @returns == 0: エラーなしの場合
   *          > 0: エラー有りの場合は、ValidatorResultのリストを返す
   */
  public exec(data: any): ValidatorResultModel[] {
    const result = schemaFrequencyModel.safeParse(data);

    // エラー有りの場合は、ValidatorResultのリストを返す
    if (!result.success) {
      return this.toValidatorResults(result.error.issues);
    }

    // エラーがなければ相関チェックの結果を返す
    return this.validateCorrelation(data);
  }

  /**
   * 相関チェック
   * - 周波数とモードが片方だけ定義されていないか
   * - 1を定義せずに2だけ定義していないか
   * @param data
   * @returns
   */
  private validateCorrelation(data: any): ValidatorResultModel[] {
    const results: ValidatorResultModel[] = [];
    data.frequency.satellites.forEach((sat: any) => {
      const uplink1IsBothFill = sat.uplink1.uplinkHz && sat.uplink1.uplinkMode;
      const uplink2IsBothFill = sat.uplink2.uplinkHz && sat.uplink2.uplinkMode;
      const downlink1IsBothFill = sat.downlink1.downlinkHz && sat.downlink1.downlinkMode;
      const downlink2IsBothFill = sat.downlink2.downlinkHz && sat.downlink2.downlinkMode;
      const uplink1IsBothEmpty = !sat.uplink1.uplinkHz && !sat.uplink1.uplinkMode;
      const uplink2IsBothEmpty = !sat.uplink2.uplinkHz && !sat.uplink2.uplinkMode;
      const downlink1IsBothEmpty = !sat.downlink1.downlinkHz && !sat.downlink1.downlinkMode;
      const downlink2IsBothEmpty = !sat.downlink2.downlinkHz && !sat.downlink2.downlinkMode;

      // 周波数とモードが片方だけ定義されていないか
      if (!(uplink1IsBothFill || uplink1IsBothEmpty)) {
        const result = new ValidatorResultModel("uplink1", I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
        results.push(result);
      }
      if (!(uplink2IsBothFill || uplink2IsBothEmpty)) {
        const result = new ValidatorResultModel("uplink2", I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
        results.push(result);
      }
      if (!(downlink1IsBothFill || downlink1IsBothEmpty)) {
        const result = new ValidatorResultModel("downlink1", I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
        results.push(result);
      }
      if (!(downlink2IsBothFill || downlink2IsBothEmpty)) {
        const result = new ValidatorResultModel("downlink2", I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
        results.push(result);
      }
      // 1を定義せずに2だけ定義していないか
      if (uplink1IsBothEmpty && uplink2IsBothFill) {
        const result = new ValidatorResultModel("uplink2", I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
        results.push(result);
      }
      if (downlink1IsBothEmpty && downlink2IsBothFill) {
        const result = new ValidatorResultModel("downlink2", I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
        results.push(result);
      }
    });

    return results;
  }
  /**
   * ZodのZodIssueリストをValidatorResultのリストに変換する
   */
  private toValidatorResults(zodIssues: zod.ZodIssue[]): ValidatorResultModel[] {
    const results: ValidatorResultModel[] = [];
    zodIssues.forEach((issue) => {
      // 入れ子があるのでエラー項目名を"/"で連結
      const errItemName = issue.path.join("/");
      const result = new ValidatorResultModel(errItemName, I18nMsgs.CHK_ERR_FREQUENCY_INVALID_ITEM);
      results.push(result);
    });

    return results;
  }
}

/**
 * zodスキーマ定義 Uplink
 */
const schemaUplink = zod.object({
  // アップリンク周波数（Mhz）
  uplinkHz: zod.number().nullable(),
  // アップリンクモード
  uplinkMode: zod.string(),
});

/**
 * zodスキーマ定義 Downlink
 */
const schemaDownlink = zod.object({
  // ダウンリンク周波数（Mhz）
  downlinkHz: zod.number().nullable(),
  // ダウンリンクモード
  downlinkMode: zod.string(),
});

/**
 * zodスキーマ定義 Satellite
 */
const schemaSatellite = zod.object({
  // NORAD ID
  noradId: zod.string(),
  // 衛星名
  satelliteName: zod.string(),
  // 衛星アップリンク設定1
  uplink1: schemaUplink,
  // 衛星アップリンク設定2
  uplink2: schemaUplink,
  // 衛星ダウンリンク設定1
  downlink1: schemaDownlink,
  // 衛星ダウンリンク設定2
  downlink2: schemaDownlink,
  // 衛星トーン周波数（Mhz）
  toneMhz: zod.number().nullable(),
  // 衛星概要
  outline: zod.string(),
});

/**
 * zodスキーマ定義 Frequency
 */
const schemaFrequency = zod.object({
  lastUpdateTime: zod.number(),
  satellites: zod.array(schemaSatellite),
});

/**
 * zodスキーマ定義 Frequencyのfrequency部
 */
const schemaFrequencyModel = zod.object({
  frequency: schemaFrequency,
});
