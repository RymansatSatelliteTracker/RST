import { ref } from "vue";
import type * as zod from "zod";

/**
 * 入力チェックを行うフック
 * @param valiSchema Zodスキーマ
 */
export const useValidate = (valiSchema: zod.AnyZodObject | null) => {
  // エラーメッセージ
  const errors = ref<Record<string, string>>({});

  /**
   * 単体項目の入力チェックを行う
   * @param fieldPath チェック対象のZodスキーマのキー名
   * @param value チェック対象の値
   */
  function validateAt(fieldPath: string, value: unknown): Promise<string> {
    // スキーマが未設定の場合はチェックしない
    if (!valiSchema) {
      return Promise.resolve("");
    }

    // チェック用のオブジェクトを作成
    const checkObj = { [fieldPath]: value };

    // チェック対象のZodスキーマを取得
    const valiItemSchema = valiSchema.pick({ [fieldPath]: true });

    // チェック実行
    const result = valiItemSchema.safeParse(checkObj);
    if (!result.success) {
      return Promise.resolve(result.error.issues[0].message);
    }

    // 正常時は空文字を返却
    return Promise.resolve("");
  }

  /**
   * 全項目の入力チェックを行う
   */
  function validateAll(form: unknown): Promise<boolean> {
    // スキーマが未設定の場合はチェックしない
    if (!valiSchema) {
      return Promise.resolve(true);
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
    return Promise.resolve(result.success);
  }

  return { validateAt, validateAll, errors };
};
