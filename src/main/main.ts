// mainプロセスでのimportでaliasを適用するために以下の module-alias を使用
import "module-alias/register";
// このコメント行は、 module-alias を先頭のままとするためのものです。（import整形で順序を変更させない）
import Constant from "@/common/Constant";
import { MessageModel } from "@/common/model/MessageModel";
import EnvUtil from "@/common/util/EnvUtil";
import { initializeIpcEvents, releaseIpcEvents } from "@/main/initializeIpcEvent";
import { makeElectronMenu } from "@/main/menu";
import RotatorService from "@/main/service/RotatorService";
import SerialTrialService from "@/main/service/SerialTrialService";
import StartupService from "@/main/service/StartupService";
import TransceiverService from "@/main/service/TransceiverSerivice";
import AppMainLogger from "@/main/util/AppMainLogger";
import AppWindowUtil from "@/main/util/AppWindowUtil";
import { app, BrowserWindow, Menu } from "electron";
import electronReload from "electron-reload";
import * as path from "path";

// Logger初期化
AppMainLogger.init();

// メインウィンドウ
let mainWindow: BrowserWindow;

(async () => {
  // active化を待つ
  await app.whenReady();

  // IPCイベントハンドラの登録（メインプロセス側のAPIのハンドラを登録）
  initializeIpcEvents();

  // アプリ関係の初期化処理
  const serive = new StartupService();
  // アプリ初期化時にTLE取得に失敗する場合があるためtry-catchで囲む
  let errorMessage: string | undefined;
  try {
    await serive.initApp();
  } catch (e) {
    AppMainLogger.error("StartupService init error", e instanceof Error ? e.stack ?? e.message : String(e));
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  // メニュー設定
  // memo: makeElectronMenu()内でapp_configを参照しているため、
  //       serive.initApp()コール後に実行する必要がある
  const appMenu = makeElectronMenu();
  Menu.setApplicationMenu(appMenu);

  // ウィンドウ生成
  mainWindow = createWindow();
  // for mac
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });

  // コンテキストメニューの設定
  mainWindow.webContents.on("context-menu", (e, params) => {
    const menuTemplate = buildMenuTemplate(params);
    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    contextMenu.popup();
  });

  // アプリ初期化時に例外が発生した場合は、mainWindowが読み込み終わってからエラーメッセージを表示する
  mainWindow.webContents.on("did-finish-load", () => {
    if (errorMessage) {
      fireIpcEvent("onNoticeMessage", new MessageModel(Constant.GlobalEvent.NOTICE_ERR, errorMessage));
    }
  });
})();

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  // IPCイベントハンドラの開放
  releaseIpcEvents();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 捕捉されない例外
process.on("uncaughtException", (err) => {
  // ログ出力し、アプリは処理を続行
  AppMainLogger.error(err);
});
process.on("unhandledRejection", (reason) => {
  // ログ出力し、アプリは処理を続行
  AppMainLogger.error(reason);
});

if (EnvUtil.isDev()) {
  // レンダラのデバッグポート（launch.jsonで設定したポート）
  app.commandLine.appendSwitch("remote-debugging-port", "9223");
}

/**
 * ウィンドウを生成する
 */
function createWindow() {
  // 前回終了時のウィンドウ位置とサイズを取得
  const bounds = AppWindowUtil.getWindowBounds();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // 起動時のウィンドウサイズ
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    // ウィンドウ左上のアイコン（Windows）
    icon: path.join(app.getAppPath(), "public", "assets", "rst.ico"),
    webPreferences: {
      // レンダラープロセスでNode.jsの機能を利用させない
      nodeIntegration: false,
      // メインプロセスとレンダラープロセスのJavaScriptコンテキストを分離
      contextIsolation: true,
      // 一旦、サンドボックスは無効にしておく（preloadでapiHandler.tsをインポートしたいので）
      sandbox: false,
      preload: path.join(__dirname, "./preload.js"),
    },
  });

  // ウインドウの最大化状態を反映する
  if (bounds.isMaximized) {
    mainWindow.maximize();
  }

  // 開発環境の場合
  if (EnvUtil.isDev()) {
    // メインプロセス側のホットリロード設定
    // memo: メイン側のソース保存時に再起動させたくない場合は、ここをコメントアウトしてください
    // enableHotReload();

    // ウィンドウ内のコンテンツの設定（レンダラプロセスのURLを指定）
    mainWindow.loadURL("http://localhost:5173");

    // DevTool表示
    // memo: 以下を行うと"Request Autofill.enable failed"が表示されるが、
    //       開発時のみであることと、実害なしのようなのでエラーは無視して良い
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../index.html"));
  }

  // アプリ終了時
  mainWindow.on("close", async (event) => {
    // アプリ終了処理
    await onAppClose();
  });

  return mainWindow;
}

/**
 * アプリ終了処理
 */
async function onAppClose() {
  // ウィンドウの位置とサイズを保存
  AppWindowUtil.saveWindowBounds(mainWindow);

  // 無線機周波数を保存
  fireIpcEvent("onSaveTransceiverFrequency");

  // 無線機のサテライトモードをOFFにする
  await TransceiverService.getInstance().setSatelliteMode(false);
  // Todo: 無線機のスプリットモードをOFFにする
  // 無線機のシリアルポートをクローズ
  await TransceiverService.getInstance().stop();

  // ローテータのシリアルポートをクローズ
  await RotatorService.getInstance().stop();

  // テスト用シリアルポートをクローズ
  await new SerialTrialService().close();
}

/**
 * メインプロセスのホットリロードを有効化する
 */
function enableHotReload() {
  const electronPath = path.resolve(
    __dirname,
    "../../../node_modules/electron/dist/electron" + (process.platform === "win32" ? ".exe" : "")
  );
  electronReload(__dirname, {
    electron: electronPath,
    forceHardReset: true,
  });
}

/**
 * コンテキストメニューの内容を生成する
 * @param params
 * @returns
 */
function buildMenuTemplate(params: Electron.ContextMenuParams): Electron.MenuItemConstructorOptions[] {
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Cut",
      role: "cut",
      click: () => {
        mainWindow.webContents.cut();
      },
    },
    {
      label: "Copy",
      role: "copy",
      click: () => {
        mainWindow.webContents.copy();
      },
    },
    {
      label: "Paste",
      role: "paste",
      click: () => {
        mainWindow.webContents.paste();
      },
    },
  ];
  return menuTemplate;
}

/**
 * IPCイベントを発火させる
 * @param channel メインプロセス内のイベント伝播用のチャネル名
 */
export function fireIpcEvent(channel: string, ...args: any): void {
  mainWindow.webContents.send(channel, args);
}

/**
 * メインウィンドウのBrowserWindowを返す
 * @returns
 */
export function getMainWindow(): BrowserWindow {
  return mainWindow;
}
