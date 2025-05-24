/**
 * APIレスポンス
 */
export class ApiResponse<T> {
  public status = true;
  public message: I18nMsgItem | null = null;
  public data: T | null = null;

  constructor(status: boolean = true, message: I18nMsgItem | null = null, data: any = null) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

/**
 * ローテーターのコマンドタイプ
 */
export type RotatorCmdType = "rsp_usb_antennaio_v1.0" | "simulator";

/**
 * ローテータを動かす方向
 */
export type RotatorMoveType = "AZ" | "EL";

/**
 * 汎用Map
 */
export type StringMap<T> = { [key: string]: T };

/**
 * 多言語対応種別
 */
export type I18nMsgItem = {
  ja: string;
  en: string;
};

/**
 * 言語種別
 */
export type LangType = "ja" | "en";
