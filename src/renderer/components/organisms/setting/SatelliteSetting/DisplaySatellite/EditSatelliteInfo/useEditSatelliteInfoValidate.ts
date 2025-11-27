import I18nMsgs from "@/common/I18nMsgs";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import EditSatelliteInfoForm from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/EditSatelliteInfo/EditSatelliteInfoForm";
import * as zod from "zod";

// 最大周波数
const MAX_FREQ = 9999999999;
// 最小周波数
const MIN_FREQ = 0;
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
      (!form.uplink2Hz && form.uplink2Mode) ||
      (form.uplink3Hz && !form.uplink3Mode) ||
      (!form.uplink3Hz && form.uplink3Mode)
    ) {
      result = false;
      errors.value["uplink"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NOT_ENTERED_UPLINK);
    }
    // ダウンリンク周波数の周波数かモードの片方が未入力の場合はエラー
    if (
      (form.downlink1Hz && !form.downlink1Mode) ||
      (!form.downlink1Hz && form.downlink1Mode) ||
      (form.downlink2Hz && !form.downlink2Mode) ||
      (!form.downlink2Hz && form.downlink2Mode) ||
      (form.downlink3Hz && !form.downlink3Mode) ||
      (!form.downlink3Hz && form.downlink3Mode)
    ) {
      result = false;
      errors.value["downlink"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NOT_ENTERED_DOWNLINK);
    }
    // ビーコン周波数の周波数かモードの片方が未入力の場合はエラー
    if (
      (form.beaconHz && !form.beaconMode) ||
      (!form.beaconHz && form.beaconMode) ||
      (form.beaconHz && !form.beaconMode) ||
      (!form.beaconHz && form.beaconMode) ||
      (form.beaconHz && !form.beaconMode) ||
      (!form.beaconHz && form.beaconMode)
    ) {
      result = false;
      errors.value["beacon"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NOT_ENTERED_BEACON);
    }
    // サテライトモード時に選択されている周波数が未入力の場合はエラー
    // 周波数だけが未入力でモードが入っている時はこの前でエラーとなるため、ここでは周波数が入っているかのみチェックする
    if (form.enableSatelliteMode) {
      // autoModeFreqTypeが1|2|3となっている前提の処理
      const uplinks = [form.uplink1Hz, form.uplink2Hz, form.uplink3Hz];
      const downlinks = [form.downlink1Hz, form.downlink2Hz, form.downlink3Hz];
      if (!uplinks[form.autoModeUplinkFreq - 1] || !downlinks[form.autoModeDownlinkFreq - 1]) {
        result = false;
        errors.value["satelliteMode"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_SATELLITEMODE_REQUIRE_UPDOWN);
      }
    }

    return result;
  }

  return { validateForm, errors };
}

const frequencyHzSchema = zod.lazy(() => {
  const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, String(MIN_FREQ), String(MAX_FREQ));
  return zod.union([
    // 正の実数か空白
    zod.coerce.number().refine((val) => val >= MIN_FREQ && val <= MAX_FREQ, { message: message }),
    zod.null(),
    // 入力をクリアすると空文字となるためこれを許容する
    zod.literal(""),
  ]);
});
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
  uplink1Hz: frequencyHzSchema,
  uplink2Hz: frequencyHzSchema,
  uplink3Hz: frequencyHzSchema,

  downlink1Hz: frequencyHzSchema,
  downlink2Hz: frequencyHzSchema,
  downlink3Hz: frequencyHzSchema,

  beaconHz: frequencyHzSchema,

  toneHz: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, String(MIN_FREQ), String(MAX_FREQ));
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
});
