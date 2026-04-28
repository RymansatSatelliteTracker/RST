import { AppConfigSatellite } from "@/common/model/AppConfigModel";
import { createDefaultSatellite } from "@/common/util/DefaultSatelliteUtil";
import SatelliteInfoEditorDialogForm from "@/renderer/components/molecules/SatelliteInfoEditorDialog/SatelliteInfoEditorDialogForm";
import useSatelliteInfoEditorDialog from "@/renderer/components/molecules/SatelliteInfoEditorDialog/useSatelliteInfoEditorDialog";

describe("useSatelliteInfoEditorDialog", () => {
  it("デフォルト衛星定義からフォームへ変換できる", () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    const defaultSatellite = createDefaultSatellite(123, "AO-73", "39444");
    const { transformDefSatToForm } = useSatelliteInfoEditorDialog();

    // 実行
    transformDefSatToForm(form, defaultSatellite);

    // 検証
    expect(form.satelliteId).toBe(123);
    expect(form.editSatelliteName).toBe("AO-73");
    expect(form.noradId).toBe("39444");
  });

  it("フォームからアプリケーション設定へ変換できる", () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    form.satelliteId = 456;
    form.editSatelliteName = "XW-2A";
    form.noradId = "40903";
    const target = new AppConfigSatellite();
    const { transformFormToAppConfig } = useSatelliteInfoEditorDialog();

    // 実行
    transformFormToAppConfig(target, form);

    // 検証
    expect(target.satelliteId).toBe(456);
    expect(target.userRegisteredSatelliteName).toBe("XW-2A");
    expect(target.noradId).toBe("40903");
  });

  it("repo frequency用変換でsatelliteIdを変更しない", () => {
    // 準備
    const form = new SatelliteInfoEditorDialogForm();
    form.editSatelliteName = "FO-29";
    form.noradId = "24278";
    const target = createDefaultSatellite(99, "OLD", "00001");
    const { transformFormToRepoFrequencySatellite } = useSatelliteInfoEditorDialog();

    // 実行
    transformFormToRepoFrequencySatellite(target, form);

    // 検証
    expect(target.satelliteId).toBe(99);
    expect(target.satelliteName).toBe("FO-29");
    expect(target.noradId).toBe("24278");
  });
});
