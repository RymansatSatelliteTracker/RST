import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import { getMainWindow } from "@/main/main.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import FileUtil from "@/main/util/FileUtil.js";
import { dialog } from "electron";

/**
 * 設定ファイルのエクスポートサービス
 */
export default class AppConfigExportSerivce {
  /**
   * 設定ファイルのエクスポートを行う
   */
  public exportAppConfig() {
    // ユーザにファイルを選択させる
    const exportPath = this.askExportPath();

    // キャンセルがクリックされた場合は、ブランクが返る。その場合は処理終了
    if (CommonUtil.isEmpty(exportPath)) {
      return;
    }

    // 現在のアプリケーション設定ファイルを指定のパスにコピーする
    FileUtil.copyFile(AppConfigUtil.getConfigPath(), exportPath);
  }

  /**
   * ファイル選択ダイアログを表示し、エクスポート先のパスを取得する
   */
  private askExportPath(): string {
    // モーダルにするため、メインウィンドウが必要
    const mainWindow = getMainWindow();

    // 保存先選択ダイアログを表示し、パスを取得する
    const exportPath = dialog.showSaveDialogSync(mainWindow, {
      title: "エクスポート先を指定",
      defaultPath: `${Constant.Config.CONFIG_FILENAME}.json`,
      properties: [],
    });

    return exportPath;
  }
}
