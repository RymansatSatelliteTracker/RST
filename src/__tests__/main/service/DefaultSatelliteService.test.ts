import Constant from "@/common/Constant";
import { AppConfigModel } from "@/common/model/AppConfigModel";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import TleService from "@/main/service/TleService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import ElectronUtil from "@/main/util/ElectronUtil";
import FileUtil from "@/main/util/FileUtil";
import fs from "fs";
import * as path from "path";

describe("DefaultSatelliteService", () => {
  const TEST_HOME_DIR = path.resolve(__dirname, "data_DefaultSatelliteService");
  const TEST_WORK_DIR = path.resolve(__dirname, "data_DefaultSatelliteService", "temp");
  const TARGET_FILES = [
    Constant.Config.DEFAULT_SATELLITE_FILENAME,
    Constant.Tle.TLE_FILENAME,
    Constant.Config.FREQUENCY_FILENAME,
    Constant.Config.CONFIG_FILENAME + ".json",
  ];
  /**
   * 対象ファイルを一括コピーする
   * @param srcDir
   * @param destDir
   */
  function copyFiles(srcDir: string, destDir: string) {
    let srcFile = "";
    let destFile = "";
    TARGET_FILES.forEach((targetFile) => {
      srcFile = path.join(srcDir, targetFile);
      destFile = path.join(destDir, targetFile);
      fs.copyFileSync(srcFile, destFile);
    });
  }
  /**
   * 対象ファイルを一括削除する
   */
  function removeFiles() {
    let removeFile = "";
    TARGET_FILES.forEach((targetFile) => {
      removeFile = path.join(TEST_WORK_DIR, targetFile);
      if (fs.existsSync(removeFile)) {
        fs.unlinkSync(removeFile);
      }
    });
  }

  beforeAll(() => {
    // テストの場合ユーザディレクトリが取れなくて落ちるのでモック化
    jest.spyOn(ElectronUtil, "getUserDir").mockImplementation(() => {
      return TEST_WORK_DIR;
    });
    // 設定ファイルが扱えないため
    jest.spyOn(AppConfigUtil, "getConfig").mockImplementation(() => {
      const jsonText = FileUtil.readText(path.join(TEST_WORK_DIR, Constant.Config.CONFIG_FILENAME + ".json"));
      return JSON.parse(jsonText)["param"] as AppConfigModel;
    });
    jest.spyOn(AppConfigUtil, "getConfigDir").mockImplementation(() => {
      return TEST_WORK_DIR;
    });
    // 今回の試験対象外のため
    jest.spyOn(TleService.prototype, "getTleAndSave").mockImplementation(async () => {});
    jest.spyOn(AppConfigUtil, "saveTleLastRetrievedDate").mockImplementation(() => {});
  });

  /**
   * リフレッシュ1:TLEあり=>デフォルト衛星定義は残す
   */
  it("リフレッシュ1:TLEあり=>デフォルト衛星定義は残す", async () => {
    // 準備
    // テスト時に使用するディレクトリにコピー
    copyFiles(path.join(TEST_HOME_DIR, "refresh1"), TEST_WORK_DIR);
    const defSatService = new DefaultSatelliteService();
    // 試験条件確認用の準備
    const beforeDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);

    // 実行
    const isSuccess = (await defSatService.reCreateDefaultSatellite()).status;

    // 検証
    // 試験条件の妥当性検証
    // 試験前はデフォルト衛星定義が存在する
    expect(beforeDefSat?.noradId).toBe("43879");
    // TLEあり
    const tleService = new TleService();
    const afterTle = tleService.getTlesByNoradId("43879");
    expect(afterTle).not.toBe(null);

    // 実行結果の検証
    expect(isSuccess).toBe(true);
    // デフォルト衛星定義は残す
    const afterDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);
    expect(afterDefSat?.noradId).toBe("43879");
  });

  /**
   * リフレッシュ2:TLEなし&&ユーザ設定あり&&ユーザ定義TLEあり=>デフォルト衛星定義は残す
   */
  it("リフレッシュ2:TLEなし&&ユーザ設定あり&&ユーザ定義TLEあり=>デフォルト衛星定義は残す", async () => {
    // 準備
    // テスト時に使用するディレクトリにコピー
    copyFiles(path.join(TEST_HOME_DIR, "refresh2"), TEST_WORK_DIR);
    const defSatService = new DefaultSatelliteService();
    const appConfig = AppConfigUtil.getConfig();
    // 試験条件確認用の準備
    const beforeSatellites = appConfig.satellites.find((sat) => {
      return sat.noradId === "43879";
    });
    const beforeDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);

    // 実行
    const isSuccess = (await defSatService.reCreateDefaultSatellite()).status;

    // 検証
    // 試験条件の妥当性検証
    // 試験前はデフォルト衛星定義が存在する
    expect(beforeDefSat?.noradId).toBe("43879");
    // ユーザ設定あり
    expect(beforeSatellites?.noradId).toBe("43879");
    // ユーザ定義TLEあり
    expect(beforeSatellites?.userRegistered).toBe(true);
    // TLEなし
    const tleService = new TleService();
    const afterTle = tleService.getTlesByNoradId("43879");
    expect(afterTle).toBe(null);

    // 実行結果の検証
    expect(isSuccess).toBe(true);
    // デフォルト衛星定義は残す
    const afterDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);
    expect(afterDefSat?.noradId).toBe("43879");
  });

  /**
   * リフレッシュ3:TLEなし&&ユーザ設定あり&&ユーザ定義TLEなし=>デフォルト衛星定義は残す
   */
  it("リフレッシュ3:TLEなし&&ユーザ設定あり&&ユーザ定義TLEなし=>デフォルト衛星定義は残す", async () => {
    // 準備
    // テスト時に使用するディレクトリにコピー
    copyFiles(path.join(TEST_HOME_DIR, "refresh3"), TEST_WORK_DIR);
    const defSatService = new DefaultSatelliteService();
    const appConfig = AppConfigUtil.getConfig();
    // 試験条件確認用の準備
    const beforeSatellites = appConfig.satellites.find((sat) => {
      return sat.noradId === "43879";
    });
    const beforeDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);

    // 実行
    const isSuccess = (await defSatService.reCreateDefaultSatellite()).status;

    // 検証
    // 試験条件の妥当性検証
    expect(beforeDefSat?.noradId).toBe("43879");
    // ユーザ設定あり
    expect(beforeSatellites?.noradId).toBe("43879");
    // ユーザ定義TLEなし
    expect(beforeSatellites?.userRegistered).toBe(false);
    // TLEなし
    const tleService = new TleService();
    const afterTle = tleService.getTlesByNoradId("43879");
    expect(afterTle).toBe(null);

    // 実行結果の検証
    expect(isSuccess).toBe(true);
    // デフォルト衛星定義は残す
    const afterDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);
    expect(afterDefSat?.noradId).toBe("43879");
  });

  /**
   * リフレッシュ4:TLEなし&&ユーザ設定なし=>デフォルト衛星定義は消す
   */
  it("リフレッシュ4:TLEなし&&ユーザ設定なし=>デフォルト衛星定義は消す", async () => {
    // 準備
    // テスト時に使用するディレクトリにコピー
    copyFiles(path.join(TEST_HOME_DIR, "refresh4"), TEST_WORK_DIR);
    const defSatService = new DefaultSatelliteService();
    const appConfig = AppConfigUtil.getConfig();
    // 試験条件確認用の準備
    const beforeSatelliteGroups = appConfig.satelliteGroups;
    const beforeSatellites = appConfig.satellites;
    const beforeDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);

    // 実行
    const isSuccess = (await defSatService.reCreateDefaultSatellite()).status;

    // 検証
    // 試験条件の妥当性検証
    // ユーザ設定なし
    expect(beforeSatelliteGroups.length).toBe(0);
    expect(beforeSatellites.length).toBe(0);
    expect(beforeDefSat?.noradId).toBe("43879");
    // TLEなし
    const tleService = new TleService();
    const afterTle = tleService.getTlesByNoradId("43879");
    expect(afterTle).toBe(null);

    // 実行結果の検証
    expect(isSuccess).toBe(true);
    // デフォルト衛星定義は消す
    const afterDefSat = await defSatService.getDefaultSatelliteBySatelliteId(100);
    expect(afterDefSat).toBe(null);
  });

  afterEach(() => {
    removeFiles();
  });
});
