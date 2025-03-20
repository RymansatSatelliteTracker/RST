import I18nMsgs from "@/common/I18nMsgs";
import ZodUtil from "@/common/util/ZodUtil";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import RotatorSettingForm from "@/renderer/components/organisms/setting/RotatorSetting/RotatorSettingForm";
import * as zod from "zod";

/**
 * ローテーター設定画面の入力チェックフック
 */
export function useRotatorSettingValidate() {
  // 入力チェック共通フック
  const { validateAll, errors } = useValidate(valiSchemaRotatorSetting);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: RotatorSettingForm) {
    return await validateAll(form);
  }

  return { validateForm, errors };
}

/**
 * ローテーター設定の入力チェックZodスキーマ定義
 */
export const valiSchemaRotatorSetting = zod.object({
  ipAddress: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_IPADDRESS);
    return ZodUtil.ipAddress(message);
  }),

  ipPort: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "65535");
    return ZodUtil.num(message, 0, 65535);
  }),

  rangeAzMin: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, `${azRange.min}`, "0");
    return ZodUtil.numRequire(message, azRange.min, 0);
  }),

  rangeAzMax: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", `${azRange.max}`);
    return ZodUtil.numRequire(message, 0, azRange.max);
  }),

  basePositionDegree: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "360");
    return ZodUtil.num(message, 0, 360);
  }),

  testAz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, `${azRange.min}`, `${azRange.max}`);
    return ZodUtil.num(message, azRange.min, azRange.max);
  }),

  testEl: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, `${elRange.min}`, `${elRange.max}`);
    return ZodUtil.num(message, elRange.min, elRange.max);
  }),

  startAgoMinute: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "60");
    return ZodUtil.num(message, 0, 60);
  }),
});

/**
 * ローテーターの角度範囲
 */
export interface RotatorRage {
  min: number;
  max: number;
}
// AZ、ELの角度範囲
export const azRange: RotatorRage = { min: -90, max: 450 };
export const elRange: RotatorRage = { min: -90, max: 180 };
