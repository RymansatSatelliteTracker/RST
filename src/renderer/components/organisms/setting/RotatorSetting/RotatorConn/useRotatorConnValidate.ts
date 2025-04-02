import I18nMsgs from "@/common/I18nMsgs";
import ZodUtil from "@/common/util/ZodUtil";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { RotatorConnForm } from "@/renderer/components/organisms/setting/RotatorSetting/RotatorSettingForm";
import { RotatorRage } from "@/renderer/types/rotator-types";
import * as zod from "zod";

/**
 * ローテーター設定画面／機種設定の入力チェックフック
 */
export function useRotatorConnValidate() {
  // 入力チェック共通フック
  const { validateAll, errors } = useValidate(valiSchemaRotatorConn);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: RotatorConnForm) {
    return await validateAll(form);
  }

  return { validateForm, errors };
}

/**
 * 入力チェックZodスキーマ定義
 */
export const valiSchemaRotatorConn = zod.object({
  ipAddress: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_IPADDRESS);
    return ZodUtil.ipAddress(message);
  }),

  ipPort: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "65535");
    return ZodUtil.num(message, 0, 65535);
  }),

  testAz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, `${azTestRange.min}`, `${azTestRange.max}`);
    return ZodUtil.num(message, azTestRange.min, azTestRange.max);
  }),

  testEl: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, `${elTestRange.min}`, `${elTestRange.max}`);
    return ZodUtil.num(message, elTestRange.min, elTestRange.max);
  }),
});

// AZ、ELの角度範囲
export const azTestRange: RotatorRage = { min: -90, max: 450 };
export const elTestRange: RotatorRage = { min: -90, max: 180 };
