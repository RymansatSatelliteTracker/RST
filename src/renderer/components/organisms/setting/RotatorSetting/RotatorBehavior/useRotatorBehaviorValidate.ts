import I18nMsgs from "@/common/I18nMsgs";
import ZodUtil from "@/common/util/ZodUtil";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { RotatorBehaviorForm } from "@/renderer/components/organisms/setting/RotatorSetting/RotatorSettingForm";
import { RotatorRage } from "@/renderer/types/rotator-types";
import * as zod from "zod";

/**
 * ローテーター設定画面／動作設定の入力チェックフック
 */
export function useRotatorBehaviorValidate() {
  // 入力チェック共通フック
  const { validateAll, errors } = useValidate(valiSchemaRotatorBehavior);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: RotatorBehaviorForm) {
    return await validateAll(form);
  }

  return { validateForm, errors };
}

/**
 * 入力チェックZodスキーマ定義
 */
export const valiSchemaRotatorBehavior = zod.object({
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

  startAgoMinute: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "60");
    return ZodUtil.numRequire(message, 0, 60);
  }),

  parkPosAz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "360");
    return ZodUtil.numRequire(message, 0, 360);
  }),

  parkPosEl: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "180");
    return ZodUtil.numRequire(message, 0, 180);
  }),
});

// AZ、ELの角度範囲
export const azRange: RotatorRage = { min: -90, max: 450 };
export const elRange: RotatorRage = { min: -90, max: 180 };
