import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { MessageModel } from "@/common/model/MessageModel";
import { LangType } from "@/common/types/types";
import EnvUtil from "@/common/util/EnvUtil";
import { fireIpcEvent, getMainWindow } from "@/main/main";
import AppConfigExportSerivce from "@/main/service/AppConfigExportSerivce";
import AppConfigImportSerivce from "@/main/service/AppConfigImportSerivce";
import DefaultSatelliteService from "@/main/service/DefaultSatelliteService";
import I18nService from "@/main/service/I18nService";
import I18nUtil4Main from "@/main/util/I18nUtil4Main";
import { app, BaseWindow, BrowserWindow, Menu, MenuItem, shell } from "electron";
import { MenuItemConstructorOptions } from "electron/main";

// Mac用の定義
interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

/**
 * TLE更新クリック
 */
async function onUpdateTleClick() {
  const defsat = new DefaultSatelliteService();
  const isSuccess = await defsat.reCreateDefaultSatellite();

  const message: MessageModel = isSuccess
    ? new MessageModel(Constant.GlobalEvent.NOTICE_INFO, I18nUtil4Main.getMsg(I18nMsgs.SYSTEM_UPDATE_TLE_SUCCESS))
    : new MessageModel(Constant.GlobalEvent.NOTICE_ERR, I18nUtil4Main.getMsg(I18nMsgs.ERR_FAIL_TO_UPDATE_TLE_URL));

  fireIpcEvent("onNoticeMessage", message);
}
/**
 * 表示言語クリック
 */
function onLangClick(lang: LangType) {
  // 指定の表示言語をアプリ設定に設定
  const service = new I18nService();
  service.changeLang(lang);

  // 現在の定義でメニューを再設定
  Menu.setApplicationMenu(makeElectronMenu());

  // Rendererプロセスに通知
  getMainWindow().webContents.send("onDispLangChange", lang);
}

// Aboutパネル
app.setAboutPanelOptions({
  applicationName: "RST (Rymansat Satellite Tracker)",
  applicationVersion: `Version ${Constant.appVersion}`,
  copyright: "© Rymansat Project",
});

/**
 * メニューを作成する
 */
export function makeElectronMenu(): Electron.Menu {
  // テンプレート定義
  const template: Array<MenuItemConstructorOptions | DarwinMenuItemConstructorOptions | MenuItem> = [];

  // Mac
  if (EnvUtil.isMac()) {
    // About
    template.push({
      label: app.name,
      submenu: [
        // RSTについて
        { role: "about", label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_ABOUT_RSP) },
        // 終了
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_QUIT),
          click() {
            app.quit();
          },
        },
      ],
    });

    // ファイル
    template.push({
      label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_FILE),
      submenu: [
        // 設定インポート
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_IMPORT_CONFIG),
          click: () => new AppConfigImportSerivce().importAppConfig(),
        },
        // 設定エクスポート
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_EXPORT_CONFIG),
          click: () => new AppConfigExportSerivce().exportAppConfig(),
        },

        { type: "separator" },
        // TLE更新
        { label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_UPDATE_TLE), click: () => onUpdateTleClick() },
      ],
    });

    // 編集
    template.push({
      label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_EDIT),
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
      ],
    });
  }
  // Mac以外
  else {
    template.push({
      // ファイル
      label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_FILE),
      submenu: [
        // 設定インポート
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_IMPORT_CONFIG),
          click: () => new AppConfigImportSerivce().importAppConfig(),
        },
        // 設定エクスポート
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_EXPORT_CONFIG),
          click: () => new AppConfigExportSerivce().exportAppConfig(),
        },

        { type: "separator" },
        // TLE更新
        { label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_UPDATE_TLE), click: () => onUpdateTleClick() },
        // 終了
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_QUIT),
          click() {
            app.quit();
          },
        },
      ],
    });
  }

  template.push({
    // 設定
    label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_SETTING),
    submenu: [
      {
        // 表示言語
        label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_LANG),
        submenu: [
          { label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_LANG_JA), click: () => onLangClick("ja") },
          { label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_LANG_EN), click: () => onLangClick("en") },
        ],
      },
    ],
  });

  // Macの場合、ヘルプはヘルプ専用のメニュー
  if (EnvUtil.isMac()) {
    template.push({
      // ヘルプ
      label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_HELP),
      submenu: [
        // ヘルプ
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_HELP),
          click: () => {
            // ヘルプはブラウザで開く
            shell.openExternal(Constant.Manual.HELP_URL);
          },
        },
      ],
    });
  }
  // Mac以外
  else {
    template.push({
      // ヘルプ
      label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_HELP),
      submenu: [
        // ヘルプ
        {
          label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_HELP),
          click: () => {
            // ヘルプはブラウザで開く
            shell.openExternal(Constant.Manual.HELP_URL);
          },
        },
        // バージョン
        { role: "about", label: I18nUtil4Main.getMsg(I18nMsgs.GCOM_MENU_VERSION) },
      ],
    });
  }

  // 開発環境の場合は、「Develop」メニューを表示
  if (EnvUtil.isDev()) {
    template.push({
      label: "Develop",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click(_: MenuItem, window: BaseWindow | undefined) {
            if (window && "reload" in window) {
              (window as BrowserWindow).reload();
            }
          },
        },
        { role: "toggleDevTools", label: "DevTools" },
      ],
    });
  }

  return Menu.buildFromTemplate(template);
}
