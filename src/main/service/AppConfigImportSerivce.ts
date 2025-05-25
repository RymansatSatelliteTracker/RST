import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { MessageModel } from "@/common/model/MessageModel";
import ValidatorResultModel from "@/main/common/model/ValidatorResultModel";
import { fireIpcEvent, getMainWindow } from "@/main/main";
import ActiveSatService from "@/main/service/ActiveSatService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import FileUtil from "@/main/util/FileUtil";
import I18nUtil4Main from "@/main/util/I18nUtil4Main";
import AppConfigValidator from "@/main/validator/AppConfigValidator";
import { dialog } from "electron";

/**
 * 設定ファイルのインポートサービス
 */
export default class AppConfigImportSerivce {
  /**
   * 設定ファイルのインポートを行う
   */
  public importAppConfig() {
    // ユーザにファイルを選択させる
    const newConfigPaths = this.askNewConfigPath();

    // キャンセルがクリックされた場合は、undefinedが返る。その場合は処理終了
    if (!newConfigPaths) {
      return;
    }

    // ファイルは１つだけ指定されている
    const newConfigPath = newConfigPaths[0];

    // 入力チェック
    const results = this.validateAppConfig(newConfigPath);
    if (results.length !== 0) {
      // エラーが発生した項目名を２行目に表示する
      const msg = I18nUtil4Main.getMsg(results[0].errMsgItem) + "\n" + results[0].errItemName;
      fireIpcEvent("onNoticeMessage", new MessageModel(Constant.GlobalEvent.NOTICE_ERR, msg));
      return;
    }

    // 入力チェック後のデータを読み込み
    // memo: 入力チェック内で一度読んでるので読み直したくない。
    //      （JSONパースで落ちる可能性があるのと、処理配置的にこうしている）
    const text = FileUtil.readText(newConfigPath);
    const appConfig = JSON.parse(text);

    // ユーザ指定の設定ファイルをアプリの設定ファイルクラスに割り当てる
    const newConfig = AppConfigUtil.migrationConfig(appConfig["param"]);

    // 保存する
    AppConfigUtil.storeConfig(newConfig);

    // 変更したことを通知
    ActiveSatService.getInstance().refresh();
  }

  /**
   * ユーザが指定した設定ファイルの入力チェックを行う
   */
  private validateAppConfig(newConfigPath: string): ValidatorResultModel[] {
    // ファイルが存在するか
    if (!FileUtil.exists(newConfigPath)) {
      return [new ValidatorResultModel("file", I18nMsgs.CHK_ERR_APPCONFIG_INVALID_ITEM)];
    }

    // ファイル読み込み
    const text = FileUtil.readText(newConfigPath);

    // JSONがパースできるか
    let appConfig;
    try {
      appConfig = JSON.parse(text);
    } catch (err: any) {
      return [new ValidatorResultModel("file", I18nMsgs.CHK_ERR_APPCONFIG_NOT_JSON_FORMAT)];
    }

    // 項目チェック
    const validater = new AppConfigValidator();
    return validater.exec(appConfig);
  }

  /**
   * ファイル選択ダイアログを表示し、インポートする設定ファイルのパスを取得する
   */
  private askNewConfigPath(): string[] | undefined {
    // モーダルにするため、メインウィンドウが必要
    const mainWindow = getMainWindow();

    // ファイル選択ダイアログを表示し、パスを取得する
    // memo: ダイアログにて、存在しないパスを入力された場合は、存在しない旨のメッセージがElectronによって表示される
    const newConfigPath = dialog.showOpenDialogSync(mainWindow, {
      title: "インポートする設定ファイルを選択", // TODO: 多言語化
      properties: [
        "openFile",
        // 開いているアイテムを最近開いたドキュメントリストに追加しない（Windows）
        "dontAddToRecent",
      ],
      filters: [{ name: "設定ファイル", extensions: ["json"] }], // TODO: 多言語化
    });

    return newConfigPath;
  }

  /**
   * エラーメッセージをダイアログで表示する
   */
  private showMsgBox(text: string) {
    // モーダルにするため、メインウィンドウが必要
    const mainWindow = getMainWindow();

    dialog.showMessageBoxSync(mainWindow, {
      type: "error",
      title: "エラー", // TODO: 多言語化
      message: text,
    });
  }
}
