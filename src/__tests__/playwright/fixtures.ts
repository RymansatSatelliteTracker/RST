import Constant from "@/common/Constant.js";
import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import type { OmmItem } from "@/common/model/OmmModel.js";
import type { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes.js";
import fs from "fs";
import os from "os";
import path from "path";
import type { ElectronApplication, Page } from "playwright/test";
import { _electron, test as base } from "playwright/test";
import { makeBaseAppConfig } from "./helpers/e2eTestData";

// 設定ファイル（JSON）のルートのキー名（AppConfigUtil と同じ）
const CONFIG_ROOT_KEY = "param";

/**
 * 起動前に用意するテストデータ
 * E2Eテストは常に一時ディレクトリをアプリのユーザデータディレクトリとして起動し、ユーザの実データには触れない
 */
export interface E2ETestData {
  /** アプリケーション設定 */
  appConfig: AppConfigModel;
  /** 既定衛星定義（default_satellite.json）に追加する衛星 */
  defaultSatellites?: DefaultSatelliteType[];
  /** 軌道要素（omm.json）。起動時に、ここに含まれる衛星が既定衛星定義に追加される */
  ommItems?: OmmItem[];
}

/**
 * テストデータを置いた一時ディレクトリを作成する
 * @returns 一時ディレクトリのパス（アプリのユーザデータディレクトリとして使用する）
 */
const createUserDataDir = (testData: E2ETestData): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rst-e2e-"));
  const defaultSatellites = testData.defaultSatellites ?? [];
  const ommItems = testData.ommItems ?? [];

  // アプリケーション設定（electron-store の形式）
  fs.writeFileSync(
    path.join(dir, `${Constant.Config.CONFIG_FILENAME}.json`),
    JSON.stringify({ [CONFIG_ROOT_KEY]: testData.appConfig })
  );

  // 既定衛星定義（初期データにテスト用の衛星を追加する）
  const json = JSON.parse(fs.readFileSync(Constant.Config.INIT_CONFIG_DEFAULT_SATELLITE_FILE_PATH, "utf-8")) as {
    defaultSatellite: {
      defaultSatellites: DefaultSatelliteType[];
      maxSatelliteId: number;
      registeredNoradIds: string[];
    };
  };
  const defSat = json.defaultSatellite;
  defSat.defaultSatellites = [...defSat.defaultSatellites, ...defaultSatellites];
  defSat.registeredNoradIds = [...defSat.registeredNoradIds, ...defaultSatellites.map((sat) => sat.noradId)];
  defSat.maxSatelliteId = Math.max(defSat.maxSatelliteId, ...defaultSatellites.map((sat) => sat.satelliteId));
  fs.writeFileSync(path.join(dir, Constant.Config.DEFAULT_SATELLITE_FILENAME), JSON.stringify(json));

  // 軌道要素（OMM）データ
  // MEMO: テストデータでは軌道要素をネットワークから取得しないため、空の場合も omm.json を作成する。
  //       起動時の既定衛星定義の更新は omm.json の存在を前提に読み込むため、ないと ENOENT のエラー通知が表示される
  const ommItemMap = Object.fromEntries(ommItems.map((item) => [item.noradCatId, item]));
  fs.writeFileSync(path.join(dir, Constant.Omm.OMM_FILENAME), JSON.stringify({ ommItemMap }));

  return dir;
};

// Electronアプリの起動/終了を共通化したfixture
export const test = base.extend<{
  testData: E2ETestData;
  electronApp: ElectronApplication;
  page: Page;
}>({
  // 起動前に用意するテストデータ（test.use で指定する。未指定の場合は衛星なしの基本の設定で起動する）
  testData: [{ appConfig: makeBaseAppConfig() }, { option: true }],
  electronApp: async ({ testData }, use) => {
    // 一時ディレクトリにテストデータを置き、アプリのユーザデータディレクトリとして起動する
    const userDataDir = createUserDataDir(testData);

    // 起動時の環境変数
    // MEMO: ELECTRON_RUN_AS_NODE が設定された環境（VS Code の拡張から起動したシェルなど）では、
    //       Electron が Node.js として動作し、アプリが起動しないため取り除く
    const env = { ...process.env } as Record<string, string>;
    delete env.ELECTRON_RUN_AS_NODE;
    env.RST_E2E_USER_DATA_DIR = userDataDir;

    try {
      const electronApp = await _electron.launch({
        args: ["."],
        env,
      });

      await use(electronApp);

      await electronApp.close();
    } finally {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },
  page: async ({ electronApp }, use) => {
    // Electronアプリのメインウィンドウをテスト対象のpageとして取得
    const page = await electronApp.firstWindow();
    await use(page);
  },
});

export { expect } from "playwright/test";
