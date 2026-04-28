import I18nMsgs from "@/common/I18nMsgs";
import SatelliteInfoEditorDialogForm from "@/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialogForm";
import { useSatelliteInfoEditorDialogValidate } from "@/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialogValidate";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { createPinia, setActivePinia } from "pinia";

describe("useSatelliteInfoEditorDialogValidate", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("NORAD IDが5桁数字なら入力チェックOK", async () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    form.editSatelliteName = "AO-73";
    form.noradId = "25544";
    const { validateForm } = useSatelliteInfoEditorDialogValidate(true);

    // 実行
    const result = await validateForm(form);

    // 検証
    expect(result).toBe(true);
  });

  it("NORAD IDが00000なら入力チェックNG", async () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    form.editSatelliteName = "AO-73";
    form.noradId = "00000";
    const { validateForm, errors } = useSatelliteInfoEditorDialogValidate(true);

    // 実行
    const result = await validateForm(form);

    // 検証
    expect(result).toBe(false);
    expect(errors.value.noradId).toBe(I18nUtil.getMsg(I18nMsgs.CHK_ERR_NUM, "5"));
  });

  it("アップリンク周波数のみ入力した場合は相関チェックNG", async () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    form.editSatelliteName = "AO-73";
    form.uplink1Hz = 145850000;
    const { validateForm, errors } = useSatelliteInfoEditorDialogValidate(false);

    // 実行
    const result = await validateForm(form);

    // 検証
    expect(result).toBe(false);
    expect(errors.value.uplink).toBe(I18nUtil.getMsg(I18nMsgs.CHK_ERR_NOT_ENTERED_UPLINK));
  });

  it("サテライトモード有効時に選択された周波数が未入力ならNG", async () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    form.editSatelliteName = "AO-73";
    form.enableSatelliteMode = true;
    form.autoModeUplinkFreq = 1;
    form.autoModeDownlinkFreq = 1;
    const { validateForm, errors } = useSatelliteInfoEditorDialogValidate(false);

    // 実行
    const result = await validateForm(form);

    // 検証
    expect(result).toBe(false);
    expect(errors.value.satelliteMode).toBe(I18nUtil.getMsg(I18nMsgs.CHK_ERR_SATELLITEMODE_REQUIRE_UPDOWN));
  });

  it("サテライトモード有効時に選択された周波数とモードが揃っていればOK", async () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    form.editSatelliteName = "AO-73";
    form.enableSatelliteMode = true;
    form.autoModeUplinkFreq = 1;
    form.autoModeDownlinkFreq = 1;
    form.uplink1Hz = 145850000;
    form.uplink1Mode = "USB";
    form.downlink1Hz = 435150000;
    form.downlink1Mode = "FM";
    const { validateForm } = useSatelliteInfoEditorDialogValidate(false);

    // 実行
    const result = await validateForm(form);

    // 検証
    expect(result).toBe(true);
  });
});
