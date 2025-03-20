import Constant from "@/common/Constant";
import EnvUtil from "@/common/util/EnvUtil";
import { BrowserWindow } from "electron";
import Store from "electron-store";

// ウィンドウの位置とサイズを表す型を定義
export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
};

// 起動時のデフォルトウィンドウサイズ
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;

// 開発環境の場合は、初期表示でDevToolsを表示するため、横幅を多めにする
const windowWidth = EnvUtil.isDev() ? WINDOW_WIDTH + 400 : WINDOW_WIDTH;

// electron-storeのインスタンスを作成
const store = new Store({ name: Constant.Config.CONFIG_WINDOW });

// 設定ファイルのルートキー
const JSON_ROOT = "windowBounds";

/**
 * ウィンドウの位置とサイズ関係のユーティリティクラス
 */
export default class AppWindowUtil {
  /**
   * ウィンドウの位置とサイズを保存する
   * @param window
   */
  public static saveWindowBounds(window: BrowserWindow) {
    if (window) {
      const bounds = window.getBounds();
      store.set(JSON_ROOT, {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: window.isMaximized(),
      });
    }
  }

  /**
   * ウィンドウの位置とサイズを取得する
   */
  public static getWindowBounds(): WindowBounds {
    // ストアから取得
    const bounds = store.get(JSON_ROOT) as WindowBounds;

    return this.checkWindowBounds(bounds);
  }

  /*
   * ストアから取得したウィンドウのサイズをチェックする
   * 初期値より小さい項目は初期値に変更する。
   */
  static checkWindowBounds(bounds: WindowBounds): WindowBounds {
    // ストアから取得できなかった場合初期値を返す
    if (!bounds) {
      return {
        x: 0,
        y: 0,
        width: windowWidth,
        height: WINDOW_HEIGHT,
        isMaximized: false,
      };
    }

    if (bounds.height < WINDOW_HEIGHT) {
      bounds.height = WINDOW_HEIGHT;
    }

    if (bounds.width < windowWidth) {
      bounds.width = windowWidth;
    }

    return bounds;
  }
}
