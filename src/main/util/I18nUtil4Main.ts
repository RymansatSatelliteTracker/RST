import { I18nMsgItem } from "@/common/types/types";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import AppMainLogger from "@/main/util/AppMainLogger";

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
    const msg = (msgItem as any)[appConfig.lang] as string;

    if (!msg) {
      AppMainLogger.error(`MessageId not found: ja ${msgItem}`);
      return "";
    }

    // メッセージ内の {} で囲まれた部分を置換する
    return msg.replace(/{(\d+)}/g, (_, index) => args[index] || "");
  }
}
