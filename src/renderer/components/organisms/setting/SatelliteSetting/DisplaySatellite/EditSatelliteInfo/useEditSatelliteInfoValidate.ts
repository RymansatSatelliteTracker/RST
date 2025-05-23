import I18nMsgs from "@/common/I18nMsgs";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import EditSatelliteInfoForm from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfoForm";
import * as zod from "zod";

// 最大周波数
const MAX_FREQ = 9999.999;
// 最小周波数
const MIN_FREQ = 0.001;
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
      (form.uplink1Mhz && !form.uplink1Mode) ||
      (!form.uplink1Mhz && form.uplink1Mode) ||
      (form.uplink2Mhz && !form.uplink2Mode) ||
      (!form.uplink2Mhz && form.uplink2Mode)
    ) {
      result = false;
      errors.value["uplink"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NOT_ENTERED_UPLINK);
    }
    // ダウンリンク周波数の周波数かモードの片方が未入力の場合はエラー
    if (
      (form.downlink1Mhz && !form.downlink1Mode) ||
      (!form.downlink1Mhz && form.downlink1Mode) ||
      (form.downlink2Mhz && !form.downlink2Mode) ||
      (!form.downlink2Mhz && form.downlink2Mode)
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
  uplink1Mhz: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, String(MIN_FREQ), String(MAX_FREQ));
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "3");
    return (
      zod
        // 小数点第1位までの正の実数か空白
        .union([
          zod.coerce
            .string()
            .refine(
              (value) => {
                // 小数点第3位までかを確認（小数第4位以降はNG）
                const decimalPart = value.split(".")[1];
                if (decimalPart && decimalPart.length > 3) return false;

                return true;
              },
              {
                message: message2,
              }
            )
            .refine(
              (val) => {
                // 正の数値かを確認
                const numVal = parseFloat(val);
                return !isNaN(numVal) && numVal >= MIN_FREQ && numVal <= MAX_FREQ;
              },
              {
                message: message1,
              }
            ),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  uplink2Mhz: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, String(MIN_FREQ), String(MAX_FREQ));
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "3");
    return (
      zod
        // 小数点第1位までの正の実数か空白
        .union([
          zod.coerce
            .string()
            .refine(
              (value) => {
                // 小数点第3位までかを確認（小数第4位以降はNG）
                const decimalPart = value.split(".")[1];
                if (decimalPart && decimalPart.length > 3) return false;

                return true;
              },
              {
                message: message2,
              }
            )
            .refine(
              (val) => {
                // 正の数値かを確認
                const numVal = parseFloat(val);
                return !isNaN(numVal) && numVal >= MIN_FREQ && numVal <= MAX_FREQ;
              },
              {
                message: message1,
              }
            ),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  downlink1Mhz: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, String(MIN_FREQ), String(MAX_FREQ));
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "3");
    return (
      zod
        // 小数点第1位までの正の実数か空白
        .union([
          zod.coerce
            .string()
            .refine(
              (value) => {
                // 小数点第3位までかを確認（小数第4位以降はNG）
                const decimalPart = value.split(".")[1];
                if (decimalPart && decimalPart.length > 3) return false;

                return true;
              },
              {
                message: message2,
              }
            )
            .refine(
              (val) => {
                // 正の数値かを確認
                const numVal = parseFloat(val);
                return !isNaN(numVal) && numVal >= MIN_FREQ && numVal <= MAX_FREQ;
              },
              {
                message: message1,
              }
            ),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  downlink2Mhz: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, String(MIN_FREQ), String(MAX_FREQ));
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "3");
    return (
      zod
        // 小数点第1位までの正の実数か空白
        .union([
          zod.coerce
            .string()
            .refine(
              (value) => {
                // 小数点第3位までかを確認（小数第4位以降はNG）
                const decimalPart = value.split(".")[1];
                if (decimalPart && decimalPart.length > 3) return false;

                return true;
              },
              {
                message: message2,
              }
            )
            .refine(
              (val) => {
                // 正の数値かを確認
                const numVal = parseFloat(val);
                return !isNaN(numVal) && numVal >= MIN_FREQ && numVal <= MAX_FREQ;
              },
              {
                message: message1,
              }
            ),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),

  toneHz: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_POSITIVE);
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "1");
    return (
      zod
        // 小数点第1位までの正の実数か空白
        .union([
          zod.coerce
            .string()
            .refine(
              (value) => {
                // 小数点第1位までかを確認（小数第2位以降はNG）
                const decimalPart = value.split(".")[1];
                if (decimalPart && decimalPart.length > 1) return false;

                return true;
              },
              {
                message: message2,
              }
            )
            .refine(
              (val) => {
                // 正の数値かを確認
                const numVal = parseFloat(val);
                return !isNaN(numVal) && numVal > 0;
              },
              {
                message: message1,
              }
            ),
          zod.null(),
          // 入力をクリアすると空文字となるためこれを許容する
          zod.literal(""),
        ])
    );
  }),
});
