import type { I18nMsgItem } from "@/common/types/types.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

/**
 * 多元言語対応のメッセージ取得ユーティリティ
 */
export default class I18nUtil4Main {
  /**
   * 指定のメッセージIDのメッセージを取得する
   */
  public static getMsg(msgItem: I18nMsgItem | null, ...args: string[]): string {
    if (!msgItem) {
      return "";
    }

    // アプリ設定の表示言語を取得し、その言語のメッセージを取得する
    const appConfig = AppConfigUtil.getConfig();
    const msg = msgItem[appConfig.lang];

    if (!msg) {
      AppMainLogger.error(`MessageId not found: ja ${JSON.stringify(msgItem)}`);
      return "";
    }

    // メッセージ内の {} で囲まれた部分を置換する
    return msg.replace(/{(\d+)}/g, (_: string, index: string) => args[Number(index)] || "");
  }
}
