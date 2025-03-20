import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import RegistSatelliteForm from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/RegistSatelliteForm";
import { getUTCDate } from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/useRegistSatelliteUtils";
import * as zod from "zod";
import { calcDateFomatEpoch, parseTle, Tle, validateParsedTle } from "./useValidateTle";
/**
 * 衛星情報編集画面の入力チェックフック
 */
export function useRegistSatelliteValidate() {
  // 入力チェック共通フック
  const { validateAll, errors } = useValidate(valiSchemaRegistSatellite);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: RegistSatelliteForm) {
    const result = await validateAll(form);
    if (!result) return result;

    // Epochと軌道6要素が全部入力されている
    const countOfEnteredOrbitalElements =
      (form.epochUtcDate ? 1 : 0) +
      (form.semiMajorAxisKm ? 1 : 0) +
      (form.eccentricity ? 1 : 0) +
      (form.inclinationDeg ? 1 : 0) +
      (form.raanDeg ? 1 : 0) +
      (form.argumentOfPerigeeDeg ? 1 : 0) +
      (form.meanAnomalyDeg ? 1 : 0);

    // TLEと軌道6要素どちらも入力されていない
    if (!form.tle && countOfEnteredOrbitalElements === 0) {
      errors.value["either"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_EITHER_TLE_ORBIT);
      return false;
    }

    // 軌道6要素が入力されているが不足している
    if (!form.tle && countOfEnteredOrbitalElements < 7) {
      errors.value["orbit"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_ALL_ORBIT);
      return false;
    }

    // ここまでで軌道6要素かTLEのどちらかが入力されていることが確定している

    // 軌道6要素が入力されている場合のチェック
    if (!form.tle && form.epochUtcDate && !validateOrbitalEpoch(form.epochUtcDate)) {
      errors.value["epochUtcDate"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_DATE_RANGE);
      return false;
    }

    // TLEが入力されている場合のチェック
    if (form.tle && !validateTleEpoch(form.tle)) {
      errors.value["tleEpoch"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_EXPIRED_TLE);
      // 確認とするためfalseにしない
    }

    // TLEと軌道6要素両方入力されている
    if (form.tle && countOfEnteredOrbitalElements === 7) {
      errors.value["both"] = I18nUtil.getMsg(I18nMsgs.CHK_ERR_BOTH_TLE_ORBIT);
      // 確認とするためfalseにしない
    }

    return true;
  }

  return { validateForm, errors };
}
/**
 * 衛星情報編集設定の入力チェックZodスキーマ定義
 */
export const valiSchemaRegistSatellite = zod.object({
  satelliteName: zod.lazy(() => {
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
  tle: zod.lazy(() => {
    return zod.string().superRefine((val, ctx) => {
      // 任意入力
      if (!val) return true;

      // TLEのチェック
      const message = checkTLE(val);
      if (!message) return true;

      // エラーケース
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: message,
      });

      return false;
    });
  }),
  epochUtcDate: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_DATE);
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_DATE_FORMAT);
    // 日付の形式YYYY/MM/DD hh:mmの正規表現
    const dateFormatRegex = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/;

    return zod.union([
      zod
        .string()
        // YYYY/MM/DD hh:mmの形式であること
        .refine((val) => !val || dateFormatRegex.test(val as string), {
          message: message2,
        })
        // 日付として正い(Dateで変換可能)
        .transform((val) => {
          return getUTCDate(val);
        })
        .refine(
          (date) => {
            return toString.call(date) === "[object Date]" && !isNaN(date.getTime());
          },
          {
            message: message1,
          }
        ),
      // 値なしの場合に0扱いとなり値域を外れるためnullを許容を指定
      zod.null(),
      // 入力をクリアすると空文字となるためこれを許容する
      zod.literal(""),
    ]);
  }),
  semiMajorAxisKm: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(
      I18nMsgs.CHK_ERR_NUM_MIN_MAX,
      Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM.toString(),
      "1000000"
    );
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "3");
    return zod.union([
      zod.coerce
        .number({ message: message1 })
        .min(Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM, { message: message1 })
        .max(1000000, { message: message1 })
        .refine((val) => getDecimalPointLength(val) <= 3, { message: message2 }),
      // 値なしの場合に0扱いとなり値域を外れるためnullを許容を指定
      zod.null(),
      // 入力をクリアすると空文字となるためこれを許容する
      zod.literal(""),
    ]);
  }),
  raanDeg: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "360");
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "4");
    return zod.coerce
      .number({ message: message1 })
      .min(0, { message: message1 })
      .max(360, { message: message1 })
      .refine((val) => getDecimalPointLength(val) <= 4, { message: message2 });
  }),
  eccentricity: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "0.9999999");
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "7");
    return zod.coerce
      .number({ message: message1 })
      .min(0, { message: message1 })
      .max(0.9999999, { message: message1 })
      .refine((val) => getDecimalPointLength(val) <= 7, { message: message2 });
  }),
  argumentOfPerigeeDeg: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "360");
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "4");
    return zod.coerce
      .number({ message: message1 })
      .min(0, { message: message1 })
      .max(360, { message: message1 })
      .refine((val) => getDecimalPointLength(val) <= 4, { message: message2 });
  }),
  inclinationDeg: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "180");
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "4");
    return zod.coerce
      .number({ message: message1 })
      .min(0, { message: message1 })
      .max(180, { message: message1 })
      .refine((val) => getDecimalPointLength(val) <= 4, { message: message2 });
  }),
  meanAnomalyDeg: zod.lazy(() => {
    const message1 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "0", "360");
    const message2 = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_DECIMAL, "4");
    return zod.coerce
      .number({ message: message1 })
      .min(0, { message: message1 })
      .max(360, { message: message1 })
      .refine((val) => getDecimalPointLength(val) <= 4, { message: message2 });
  }),
});

const getDecimalPointLength = (number: number): number => {
  const numbers = String(number).split(".");

  return numbers[1] ? numbers[1].length : 0;
};

function checkTLE(tleString: string): string {
  // 2行形式であることを確認
  // 衛星名が重複するので2行であることを強制する
  const lines = tleString.trim().split("\n");
  if (lines.length !== 2) {
    return I18nUtil.getMsg(I18nMsgs.CHK_ERR_TLE_2LINE);
  }

  const tle = parseTle(lines[0], lines[1]);

  let message = validateTLEFormat(tle);
  if (message) return message;

  message = validateTLEValue(tle);

  return message;
}
/**
 * TLEフォーマットチェック
 * @param tleString
 * @returns
 */
function validateTLEFormat(tle: Tle): string {
  const error = validateParsedTle(tle);
  if (!error) return "";

  // エラーメッセージを生成
  // 行数、エラー項目、値を表示
  const toDisplayName: ToDisplayName = new ToDisplayName();
  return `${I18nUtil.getMsg(I18nMsgs.CHK_ERR_TLE)}(line:${error.lineNumber}, \
  item:${toDisplayName[error.error?.name]}, value:${error.error?.value})`;
}

/**
 * TLEの値チェック
 * TLEのフォーマット上防げない不正値をチェックする
 * @param tleString
 * @returns
 */
function validateTLEValue(tle: Tle): string {
  const toDisplayName: ToDisplayName = new ToDisplayName();

  // 画面入力項目のスキーマを取得
  const schema = valiSchemaRegistSatellite.pick({
    raanDeg: true,
    argumentOfPerigeeDeg: true,
    inclinationDeg: true,
    meanAnomalyDeg: true,
    epochUtcDate: true,
  });
  // TLEにしかない項目を追加
  const extendSchema = schema.extend({
    satelliteNumber: zod.string().regex(/^\d{5}$/, I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM, "5")),
    meanMotion: zod.number().positive(I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_POSITIVE)),
  });
  // スキーマチェック
  const result = extendSchema.safeParse({
    raanDeg: tle.line2.raan,
    argumentOfPerigeeDeg: tle.line2.aruOfPerigee,
    inclinationDeg: tle.line2.inclination,
    meanAnomalyDeg: tle.line2.meanAnomaly,
    epochUtcDate: calcDateFomatEpoch(tle.line1.epochYear, tle.line1.epochDays),
    satelliteNumber: tle.line1.satNum,
    meanMotion: tle.line2.meanMotion,
  });

  // エラーがなければ抜ける
  if (result.success) return "";

  // エラーメッセージを生成
  const errorItem = result.error.errors[0];
  const message = errorItem.message;
  const name = errorItem.path[0];
  return `${toDisplayName[name]}: ${message}`;
}

/**
 * 軌道6要素の元期は未来日入力のみ許容する
 * @param epochUtcDate
 * @returns
 */
function validateOrbitalEpoch(epochUtcDate: string): boolean {
  // フォーマットチェック通過後に使うためフォーマットチェックはしない
  // 画面表示用のepochからdateに変換
  const date = getUTCDate(epochUtcDate);
  // 日付は現在時刻からSPG4が対応できる2056/12/31 23:59:59まで
  const minDate = Date.now();
  const maxDate = new Date("2056-12-31T23:59:59Z").getTime();
  return minDate <= date.getTime() && date.getTime() <= maxDate;
}

/**
 * TLEの元期が期限切れかどうかチェック
 * @param tleString
 * @returns
 */
function validateTleEpoch(tleString: string): boolean {
  // フォーマットチェック通過後に使うためフォーマットチェックはしない
  const lines = tleString.trim().split("\n");
  const tle = parseTle(lines[0], lines[1]);
  // 画面表示用のepochに変換
  const epochUtcDate = calcDateFomatEpoch(tle.line1.epochYear, tle.line1.epochDays);
  // 画面表示用のepochからdateに変換
  const date = getUTCDate(epochUtcDate);
  // TLEが期限切れかどうかチェック
  const expireDate = new Date();
  expireDate.setDate(new Date().getDate() - Constant.Tle.TLE_EXPIRATION_DAYS);
  return date > expireDate;
}

/**
 * Tleの変数名をエラー表示するために画面表示名に変換する
 * jsonにするとpiniaのエラーでエラーになるためクラスで定義
 */
class ToDisplayName {
  [key: string]: string;
  constructor() {
    this.lineNumber = I18nUtil.getMsg(I18nMsgs.G31_LINE_NUMBER);
    this.satNum = I18nUtil.getMsg(I18nMsgs.G31_SATELLITE_NUMBER);
    this.classification = I18nUtil.getMsg(I18nMsgs.G31_CLASSIFICATION);
    this.internationalDesinator = I18nUtil.getMsg(I18nMsgs.G31_INTERNATIONAL_DESIGNATOR);
    this.epochYear = I18nUtil.getMsg(I18nMsgs.G31_EPOCH_YEAR);
    this.epochDays = I18nUtil.getMsg(I18nMsgs.G31_EPOCH_DAY);
    this.ndot = I18nUtil.getMsg(I18nMsgs.G31_NDOT);
    this.nddot = I18nUtil.getMsg(I18nMsgs.G31_NDDOT);
    this.bstar = I18nUtil.getMsg(I18nMsgs.G31_B_STAR);
    this.ephemType = I18nUtil.getMsg(I18nMsgs.G31_EPHEMERIS_TYPE);
    this.elementNumber = I18nUtil.getMsg(I18nMsgs.G31_ELEMENT_NUMBER);
    this.checkSum = I18nUtil.getMsg(I18nMsgs.G31_CHECKSUM);
    this.inclination = I18nUtil.getMsg(I18nMsgs.G31_INCLINATION);
    this.raan = I18nUtil.getMsg(I18nMsgs.G31_RAAN);
    this.eccentricity = I18nUtil.getMsg(I18nMsgs.G31_ECCENTRICITY);
    this.aruOfPerigee = I18nUtil.getMsg(I18nMsgs.G31_ARG_OF_PERIGEE);
    this.meanAnomaly = I18nUtil.getMsg(I18nMsgs.G31_MEAN_ANOMALY);
    this.meanMotion = I18nUtil.getMsg(I18nMsgs.G31_MEAN_MOTION);
    this.revolutions = I18nUtil.getMsg(I18nMsgs.G31_REVOLUTION);
    // 軌道六要素のスキーマチェックをTLEに使う用
    this.epochUtcDate = I18nUtil.getMsg(I18nMsgs.G31_EPOCH);
    this.inclinationDeg = I18nUtil.getMsg(I18nMsgs.G31_INCLINATION);
    this.raanDeg = I18nUtil.getMsg(I18nMsgs.G31_RAAN);
    this.argumentOfPerigeeDeg = I18nUtil.getMsg(I18nMsgs.G31_ARG_OF_PERIGEE);
    this.meanAnomalyDeg = I18nUtil.getMsg(I18nMsgs.G31_MEAN_ANOMALY);
  }
}
