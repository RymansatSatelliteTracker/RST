import { app } from "electron";

/**
 * E2Eテスト用に、アプリのユーザデータディレクトリを切り替える
 * MEMO: 環境変数 RST_E2E_USER_DATA_DIR が指定された場合のみ切り替える（通常の起動では何もしない）。
 *       設定ファイル（electron-store）やログは、モジュールの読み込み時にユーザデータディレクトリを決めるため、
 *       main.ts の最初の import として読み込み、他のモジュールより先に実行する必要がある。
 *       また、ユーザデータディレクトリが分かれることで、起動中のRSTがあっても二重起動の判定に当たらない。
 */
const e2eUserDataDir = process.env.RST_E2E_USER_DATA_DIR;
if (e2eUserDataDir) {
  app.setPath("userData", e2eUserDataDir);
}
