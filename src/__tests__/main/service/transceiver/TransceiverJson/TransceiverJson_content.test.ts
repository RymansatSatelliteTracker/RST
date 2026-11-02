import Constant from "@/common/Constant.js";
import type { AppConfigTransceiverModel } from "@/common/model/AppConfigTransceiverModel.js";
import { readFileSync } from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

// 無線機定義ファイル（アプリ起動時に、ユーザー環境へ上書きコピーされる初期データ）
const config = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "../../../../../../resources/data/init-data/transceiver.json"),
    "utf-8"
  )
) as AppConfigTransceiverModel;

const opeModes = Object.values(Constant.Transceiver.OpeMode) as string[];

/**
 * YAESUの機種を返す（機種IDはメーカー内でのみ一意のため、メーカーIDも指定して検索する）
 */
function findYaesu(transceiverId: string) {
  const yaesu = config.transceivers.find((m) => m.makerId === Constant.Transceiver.MakerId.YAESU);
  return yaesu?.devices.find((d) => d.transceiverId === transceiverId);
}

/**
 * 全機種を、メーカーIDと機種IDのペアとともに返す
 */
function allDevices() {
  return config.transceivers.flatMap((maker) =>
    maker.devices.map((device) => ({ makerId: maker.makerId, device, name: `${maker.makerName} ${device.deviceName}` }))
  );
}

describe("無線機定義ファイル（transceiver.json）の内容", () => {
  it("メーカー内で機種IDが重複していないこと", () => {
    for (const maker of config.transceivers) {
      const ids = maker.devices.map((d) => d.transceiverId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("YAESUの機種は、FT-991とFT-897のみであり、未対応のFT-847は含まれないこと", () => {
    const yaesu = config.transceivers.find((m) => m.makerId === Constant.Transceiver.MakerId.YAESU);

    expect(yaesu?.devices.map((d) => [d.transceiverId, d.deviceName])).toEqual([
      [Constant.Transceiver.TransceiverId.YAESU_FT991, "FT-991 / FT-991A"],
      [Constant.Transceiver.TransceiverId.YAESU_FT897, "FT-897 / FT-897D"],
    ]);
  });

  it("YAESUの機種は、CI-Vアドレスが空であること", () => {
    const yaesu = config.transceivers.find((m) => m.makerId === Constant.Transceiver.MakerId.YAESU);

    expect(yaesu?.devices.every((d) => d.civAddress === "")).toBe(true);
  });

  it("ストップビットは、FT-991とFT-897のみ2を指定し、その他（ICOM）は省略すること", () => {
    for (const { makerId, device, name } of allDevices()) {
      const isYaesuCat =
        makerId === Constant.Transceiver.MakerId.YAESU &&
        [Constant.Transceiver.TransceiverId.YAESU_FT991, Constant.Transceiver.TransceiverId.YAESU_FT897].includes(
          device.transceiverId
        );
      expect(device.stopBits, name).toBe(isYaesuCat ? 2 : undefined);
    }
  });

  it("ICOMの機種は、使用できるモード・表示ラベルを省略すること（従来どおりの選択肢）", () => {
    const icom = config.transceivers.find((m) => m.makerId === Constant.Transceiver.MakerId.ICOM);

    expect(icom?.devices.length).toBeGreaterThan(0);
    for (const device of icom?.devices ?? []) {
      expect(device.supportedModes, device.deviceName).toBeUndefined();
      expect(device.modeLabels, device.deviceName).toBeUndefined();
    }
  });

  it("supportedModesとmodeLabelsの値が、RSTの運用モードとして存在し、DVを含まないこと", () => {
    for (const { device, name } of allDevices()) {
      for (const mode of device.supportedModes ?? []) {
        expect(opeModes, `${name} supportedModes:${mode}`).toContain(mode);
        expect(mode, name).not.toBe(Constant.Transceiver.OpeMode.DV);
      }
      for (const mode of Object.keys(device.modeLabels ?? {})) {
        expect(opeModes, `${name} modeLabels:${mode}`).toContain(mode);
      }
    }
  });

  it("modeLabelsのキーが、supportedModesに含まれること", () => {
    for (const { device, name } of allDevices()) {
      if (!device.modeLabels) {
        continue;
      }
      expect(device.supportedModes, name).toBeDefined();
      for (const mode of Object.keys(device.modeLabels)) {
        expect(device.supportedModes, `${name} modeLabels:${mode}`).toContain(mode);
      }
    }
  });

  it("FT-897は、RTTYを使用できるモードに含まず、USB-D/LSB-DをDIG、FM-DをPKTとして表示すること", () => {
    const device = findYaesu(Constant.Transceiver.TransceiverId.YAESU_FT897);

    expect(device?.supportedModes).not.toContain(Constant.Transceiver.OpeMode.RTTY);
    expect(device?.modeLabels).toEqual({
      [Constant.Transceiver.OpeMode.LSB_D]: "LSB-D(DIG)",
      [Constant.Transceiver.OpeMode.USB_D]: "USB-D(DIG)",
      [Constant.Transceiver.OpeMode.FM_D]: "FM-D(PKT)",
    });
  });

  it("FT-991は、RTTYを使用できるモードに含み、USB-D/LSB-D/FM-DをDATA-xxxとして表示すること", () => {
    const device = findYaesu(Constant.Transceiver.TransceiverId.YAESU_FT991);

    expect(device?.supportedModes).toContain(Constant.Transceiver.OpeMode.RTTY);
    expect(device?.modeLabels).toEqual({
      [Constant.Transceiver.OpeMode.LSB_D]: "LSB-D(DATA-LSB)",
      [Constant.Transceiver.OpeMode.USB_D]: "USB-D(DATA-USB)",
      [Constant.Transceiver.OpeMode.FM_D]: "FM-D(DATA-FM)",
    });
  });
});
