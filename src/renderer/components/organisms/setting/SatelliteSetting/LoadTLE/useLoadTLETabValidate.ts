import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigTleUrl } from "@/common/model/AppConfigModel";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import * as zod from "zod";

/**
 * ローテーター設定画面の入力チェックフック
 */
export function useLoadTLETabValidate() {
  // 入力チェック共通フック
  const { validateAll, errors } = useValidate(validSchemaLoadTLETab);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: AppConfigTleUrl) {
    return await validateAll(form);
  }

  return { validateForm, errors };
}

/**
 * ローテーター設定の入力チェックZodスキーマ定義
 */
export const validSchemaLoadTLETab = zod.object({
  url: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_URL);
    return zod.string().url({ message });
  }),
});
