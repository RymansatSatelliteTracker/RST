/**
 * メイン用のメッセージダイアログのutil
 */

import I18nMsgs from "@/common/I18nMsgs";
import { getMainWindow } from "@/main/main";
import I18nUtil4Main from "@/main/util/I18nUtil4Main";
import { dialog } from "electron";

/**
 * エラーメッセージをダイアログで表示する
 */
export function showMsgBox(text: string) {
  // モーダルにするため、メインウィンドウが必要
  const mainWindow = getMainWindow();

  dialog.showMessageBoxSync(mainWindow, {
    type: "error",
    title: I18nUtil4Main.getMsg(I18nMsgs.GCOM_ERROR),
    message: text,
  });
}
