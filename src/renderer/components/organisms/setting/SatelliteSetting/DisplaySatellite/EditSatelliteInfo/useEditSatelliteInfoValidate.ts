import I18nMsgs from "@/common/I18nMsgs";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import EditSatelliteInfoForm from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfoForm";
import * as zod from "zod";

/**
 * 衛星情報編集画面の入力チェックフック
 */
export function useEditSatelliteInfoValidate() {
  // 入力チェック共通フック
  const { validateAll, errors } = useValidate(valiSchemaEditSatelliteInfo);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: EditSatelliteInfoForm) {
    let result = await validateAll(form);
    // 単項目にエラーがある場合相関チェックせずに結果を返す
    if (!result) return result;

    // 単項目にエラーがなければ相関チェックをする
    // 相関チェック
    // アップリンク周波数の周波数かモードの片方が未入力の場合はエラー
    if (
      (form.uplink1Hz && !form.uplink1Mode) ||
      (!form.uplink1Hz && form.uplink1Mode) ||
      (form.uplink2Hz && !form.uplink2Mode) ||
      (!form.uplink2Hz && form.uplink2Mode)
    ) {
      result = false;
      errors.value["uplink"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NOT_ENTERED_UPLINK);
    }
    // ダウンリンク周波数の周波数かモードの片方が未入力の場合はエラー
    if (
      (form.downlink1Hz && !form.downlink1Mode) ||
      (!form.downlink1Hz && form.downlink1Mode) ||
      (form.downlink2Hz && !form.downlink2Mode) ||
      (!form.downlink2Hz && form.downlink2Mode)
    ) {
      result = false;
      errors.value["downlink"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NOT_ENTERED_DOWNLINK);
    }

    return result;
  }

  return { validateForm, errors };
}

/**
 * 衛星情報編集設定の入力チェックZodスキーマ定義
 */
export const valiSchemaEditSatelliteInfo = zod.object({
  editSatelliteName: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_STRING_MIN, "1");
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_STRING_ALPHANUMSYMB);
    return (
      zod.coerce
        .string({ message: message1 })
        .min(1, { message: message1 })
        // アルファベット、数字、記号(＆*/ '-+_()[])
        .regex(/^[A-Za-z0-9&*/ '()+_\[\]-]*$/, { message: message2 })
    );
  }),
  uplink1Hz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_POSITIVE);
    return (
      zod
        // 正の実数か空白
        .union([
          zod.coerce.number().refine((val) => Number.isInteger(val) && val > 0, {
            message,
          }),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  uplink2Hz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_POSITIVE);
    return (
      zod
        // 正の実数か空白
        .union([
          zod.coerce.number().refine((val) => Number.isInteger(val) && val > 0, {
            message,
          }),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  downlink1Hz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_POSITIVE);
    return (
      zod
        // 正の実数か空白
        .union([
          zod.coerce.number().refine((val) => Number.isInteger(val) && val > 0, {
            message,
          }),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  downlink2Hz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_POSITIVE);
    return (
      zod
        // 正の実数か空白
        .union([
          zod.coerce.number().refine((val) => Number.isInteger(val) && val > 0, {
            message,
          }),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  toneHz: zod.lazy(() => {
    const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_POSITIVE);
    return (
      zod
        // 正の実数か空白
        .union([
          zod.coerce.number().refine((val) => Number.isInteger(val) && val > 0, {
            message,
          }),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),
});
