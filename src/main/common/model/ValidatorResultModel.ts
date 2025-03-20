import { I18nMsgItem } from "@/common/types/types";

/**
 * バリデート結果
 */
export default class ValidatorResultModel {
  // エラーが発生した項目名
  public errItemName = "";
  // メッセージID
  public errMsgItem: I18nMsgItem = { en: "", ja: "" };

  public constructor(errItemName: string, msgItem: I18nMsgItem) {
    this.errItemName = errItemName;
    this.errMsgItem = msgItem;
  }
}
