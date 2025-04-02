import { ref } from "vue";
import * as zod from "zod";

/**
 * 入力チェックを行うフック
 * @param valiSchema Zodスキーマ
 */
export const useValidate = (valiSchema: any) => {
  // エラーメッセージ
  const errors = ref<Record<string, string>>({});

  /**
   * 単体項目の入力チェックを行う
   * @param fieldPath チェック対象のZodスキーマのキー名
   * @param value チェック対象の値
   */
  async function validateAt(fieldPath: string, value: any): Promise<string> {
    // スキーマが未設定の場合はチェックしない
    if (!valiSchema) {
      return "";
    }

    // チェック用のオブジェクトを作成
    const checkObj = { [fieldPath]: value };

    // チェック対象のZodスキーマを取得
    const valiItemSchema = valiSchema.pick({ [fieldPath]: true });

    // チェック実行
    const result = valiItemSchema.safeParse(checkObj);
    if (!result.success) {
      return result.error.issues[0].message;
    }

    // 正常時は空文字を返却
    return "";
  }

  /**
   * 全項目の入力チェックを行う
   */
  async function validateAll(form: any) {
    // スキーマが未設定の場合はチェックしない
    if (!valiSchema) {
      return true;
    }

    // すべてのエラーメッセージをクリア
    Object.keys(errors.value).forEach((key) => {
      errors.value[key] = "";
    });

    const result = valiSchema.safeParse(form);
    if (!result.success) {
      result.error.issues.forEach((issue: zod.ZodIssue) => {
        // 入れ子があるのでエラー項目名を"/"で連結
        const errItemName = issue.path.join("/");
        errors.value[errItemName] = issue.message;

        // 入力エラー内容をコンソールに出力
        console.warn(errItemName, issue.message);
      });
    }

    // エラーの有無を返却
    return result.success;
  }

  return { validateAt, validateAll, errors };
};
