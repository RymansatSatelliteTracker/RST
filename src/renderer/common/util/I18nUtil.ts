import { I18nMsgItem } from "@/common/types/types";
import { useStoreDispLang } from "@/renderer/store/useStoreDispLang";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";

/**
 * 多元言語対応のメッセージ取得ユーティリティ
 */
export default class I18nUtil {
  /**
   * 指定のメッセージIDのメッセージを取得する
   */
  public static getMsg(msgItem: I18nMsgItem | null, ...args: string[]): string {
    if (!msgItem) {
      return "";
    }

    // 表示言語のストア
    const dispLangStore = useStoreDispLang();

    // ストアで保持している表示言語を元にして、メッセージを取得する
    const msg = (msgItem as any)[dispLangStore.getLang()] as string;
    if (!msg) {
      AppRendererLogger.error(`message not found: ${dispLangStore.getLang()} ${JSON.stringify(msgItem)}`);
      return "";
    }

    // メッセージ内の {} で囲まれた部分を置換する
    return msg.replace(/{(\d+)}/g, (_, index) => args[index] || "");
  }
}
