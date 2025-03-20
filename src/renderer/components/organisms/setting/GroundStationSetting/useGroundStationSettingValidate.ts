import I18nMsgs from "@/common/I18nMsgs";
import { useValidate } from "@/renderer/common/hook/useValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import GroundStationSettingForm from "@/renderer/components/organisms/setting/GroundStationSetting/GroundStationSettingForm";
import * as zod from "zod";

/**
 * 地上局設定の入力チェックフック
 */
export function useGroundStationSettingValidate() {
  const { validateAll, errors } = useValidate(validSchemaGroundStationSettingForm);

  /**
   * Form全体の入力チェックの実行
   */
  async function validateForm(form: GroundStationSettingForm) {
    return await validateAll(form);
  }

  return { validateForm, errors };
}

const heightSchema = zod.lazy(() => {
  const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "-1000", "10000");
  return zod.coerce.number({ message }).min(-1000, { message }).max(10000, { message }).optional();
});

const lonSchema = zod.lazy(() => {
  const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "-180", "180");
  return zod.coerce.number({ message }).min(-180, { message }).max(180, { message }).optional();
});

const latSchema = zod.lazy(() => {
  const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM_MIN_MAX, "-90", "90");
  return zod.coerce.number({ message }).min(-90, { message }).max(90, { message }).optional();
});

const gridLocatorSchema = zod.lazy(() => {
  const message = I18nUtil.getMsg(I18nMsgs.CHK_ERR_GRID_LOCATOR_FORMAT);
  return zod
    .string({ message })
    .refine((value) => value === undefined || value === "" || /^[A-Ra-r]{2}\d{2}[A-Xa-x]{2}$/.test(value), {
      message,
    })
    .optional();
});

// 地上局設定の入力チェックZodスキーマ定義
export const validSchemaGroundStationSettingForm = zod.object({
  // フィールド単体で確認するためのスキーマ
  // ZodUnion型ではpickが使用できないため用意している
  height: heightSchema,
  lon: lonSchema,
  lat: latSchema,
  gridLocator: gridLocatorSchema,
  // 地上局1のスキーマ
  groundStationSetting: zod.object({
    height: heightSchema,
    lon: lonSchema,
    lat: latSchema,
    gridLocator: gridLocatorSchema,
  }),
  // 地上局2のスキーマ
  groundStation2Setting: zod.object({
    height: heightSchema,
    lon: lonSchema,
    lat: latSchema,
    gridLocator: gridLocatorSchema,
  }),
});
