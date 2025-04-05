import I18nMsgs from "@/common/I18nMsgs";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TransceiverConnForm from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverConn/TransceiverConnForm";
import * as zod from "zod";

/**
 * 無線機設定画面の入力チェックフック
 */
export function useTransceiverConnValidate() {
  // 入力チェック共通フック
  const { validateAll, errors } = useValidate(valiSchemaTransceiverSetting);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: TransceiverConnForm) {
    return await validateAll(form);
  }

  return { validateForm, errors };
}

/**
 * 無線機設定の入力チェックZodスキーマ定義
 */
export const valiSchemaTransceiverSetting = zod.object({
  ipAddress: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_IPADDRESS);
    return zod.string().ip({ version: "v4", message }).or(zod.literal(""));
  }),

  ipPort: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "65535");
    return zod.coerce.number({ message }).min(0, { message }).max(65535, { message });
  }),
});
