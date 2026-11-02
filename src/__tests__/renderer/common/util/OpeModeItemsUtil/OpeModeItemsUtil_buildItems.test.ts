import Constant from "@/common/Constant.js";
import { AppConfigTransceiverDevice } from "@/common/model/AppConfigTransceiverModel.js";
import OpeModeItemsUtil from "@/renderer/common/util/OpeModeItemsUtil.js";
import { describe, expect, it } from "vitest";

const OpeMode = Constant.Transceiver.OpeMode;

/**
 * 機種定義を生成する
 */
function device(supportedModes?: string[], modeLabels?: Record<string, string>): AppConfigTransceiverDevice {
  const d = new AppConfigTransceiverDevice();
  d.supportedModes = supportedModes;
  d.modeLabels = modeLabels;
  return d;
}

describe("OpeModeItemsUtil.buildItems", () => {
  // 従来の選択肢（機種に関係なく、DVを除く全ての運用モード）
  const defaultItems = [
    { title: OpeMode.UNSET, value: OpeMode.UNSET },
    { title: OpeMode.LSB, value: OpeMode.LSB },
    { title: OpeMode.USB, value: OpeMode.USB },
    { title: OpeMode.AM, value: OpeMode.AM },
    { title: OpeMode.CW, value: OpeMode.CW },
    { title: OpeMode.FM, value: OpeMode.FM },
    { title: OpeMode.RTTY, value: OpeMode.RTTY },
    { title: OpeMode.USB_D, value: OpeMode.USB_D },
    { title: OpeMode.LSB_D, value: OpeMode.LSB_D },
    { title: OpeMode.FM_D, value: OpeMode.FM_D },
  ];

  it("無線機が未設定（機種定義なし）の場合は、従来どおり、DVを除く全ての運用モードを、そのままの表示で返すこと", () => {
    expect(OpeModeItemsUtil.buildItems(null)).toEqual(defaultItems);
    expect(OpeModeItemsUtil.buildItems(undefined)).toEqual(defaultItems);
  });

  it("supportedModes、modeLabelsがない機種（ICOMなど）の場合は、従来どおりの選択肢を返すこと", () => {
    expect(OpeModeItemsUtil.buildItems(device())).toEqual(defaultItems);
  });

  it("DVは、選択肢に含まれないこと", () => {
    expect(OpeModeItemsUtil.buildItems(null).map((i) => i.value)).not.toContain(OpeMode.DV);
  });

  it("supportedModesがある場合は、未設定（空文字）を先頭に、その運用モードのみを、定義の順に返すこと", () => {
    const items = OpeModeItemsUtil.buildItems(device([OpeMode.USB, OpeMode.LSB, OpeMode.FM]));

    expect(items.map((i) => i.value)).toEqual([OpeMode.UNSET, OpeMode.USB, OpeMode.LSB, OpeMode.FM]);
  });

  it("supportedModesに含まれない運用モード（FT-897のRTTYなど）は、選択肢に含まれないこと", () => {
    const items = OpeModeItemsUtil.buildItems(device([OpeMode.LSB, OpeMode.USB, OpeMode.USB_D]));

    expect(items.map((i) => i.value)).not.toContain(OpeMode.RTTY);
  });

  it("supportedModesにDVが含まれていても、選択肢に含まれないこと", () => {
    const items = OpeModeItemsUtil.buildItems(device([OpeMode.USB, OpeMode.DV]));

    expect(items.map((i) => i.value)).toEqual([OpeMode.UNSET, OpeMode.USB]);
  });

  it("modeLabelsがある場合は、表示（title）をラベルに置き換え、値（value）は運用モード名のままとすること", () => {
    const items = OpeModeItemsUtil.buildItems(
      device([OpeMode.USB, OpeMode.USB_D, OpeMode.FM_D], {
        [OpeMode.USB_D]: "USB-D(DIG)",
        [OpeMode.FM_D]: "FM-D(PKT)",
      })
    );

    expect(items).toEqual([
      { title: OpeMode.UNSET, value: OpeMode.UNSET },
      { title: OpeMode.USB, value: OpeMode.USB },
      { title: "USB-D(DIG)", value: OpeMode.USB_D },
      { title: "FM-D(PKT)", value: OpeMode.FM_D },
    ]);
  });

  it("modeLabelsのみがあり、supportedModesがない場合は、全ての運用モード（DVを除く）の、該当のラベルのみを置き換えること", () => {
    const items = OpeModeItemsUtil.buildItems(device(undefined, { [OpeMode.USB_D]: "USB-D(DIG)" }));

    expect(items.map((i) => i.value)).toEqual(defaultItems.map((i) => i.value));
    expect(items.find((i) => i.value === OpeMode.USB_D)?.title).toBe("USB-D(DIG)");
    expect(items.find((i) => i.value === OpeMode.LSB_D)?.title).toBe(OpeMode.LSB_D);
  });

  it("modeLabelsに、supportedModesにない運用モードのラベルがあっても、選択肢に追加されないこと", () => {
    const items = OpeModeItemsUtil.buildItems(device([OpeMode.USB], { [OpeMode.FM_D]: "FM-D(PKT)" }));

    expect(items.map((i) => i.value)).toEqual([OpeMode.UNSET, OpeMode.USB]);
  });

  it("supportedModesが空の配列の場合は、未設定（空文字）のみを返すこと", () => {
    expect(OpeModeItemsUtil.buildItems(device([])).map((i) => i.value)).toEqual([OpeMode.UNSET]);
  });

  it("未設定（空文字）の選択肢の表示は、空文字であること", () => {
    const items = OpeModeItemsUtil.buildItems(device([OpeMode.USB]));

    expect(items[0]).toEqual({ title: "", value: "" });
  });
});
