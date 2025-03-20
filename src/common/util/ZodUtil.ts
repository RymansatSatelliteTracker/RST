import * as zod from "zod";

/**
 * Zodでのチェック内容を共通化するためのユーティリティクラス
 */
export default class ZodUtil {
  /**
   * 数値系、必須項目
   * @param message エラー時メッセージ
   * @param min 最小値
   * @param max 最大値
   */
  public static numRequire(message: string, min: number, max: number): zod.ZodEffects<zod.ZodNumber, number, unknown> {
    // zod.numberは空文字を0に変換してしまうため、preprocessにて空文字の場合はundefinedに変換し
    // その後、数値チェックを行う
    return zod.preprocess(
      (val) => {
        if (val === "") {
          return undefined;
        }
        if (typeof val === "string" && !isNaN(Number(val))) {
          return Number(val);
        }
        return val;
      },
      zod.number({ message }).min(min, { message }).max(max, { message })
    );
  }

  /**
   * 数値系
   * @param message エラー時メッセージ
   * @param min 最小値
   * @param max 最大値
   */
  public static num(message: string, min: number, max: number): zod.ZodNumber {
    return zod.coerce.number({ message }).min(min, { message }).max(max, { message });
  }

  /**
   * IPアドレス
   */
  public static ipAddress(message: string): zod.ZodUnion<[zod.ZodString, zod.ZodLiteral<"">]> {
    return zod.string().ip({ version: "v4", message }).or(zod.literal(""));
  }
}
