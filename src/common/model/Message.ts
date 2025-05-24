/**
 * メッセージ用のモデル
 */
export class Message {
  constructor(
    public readonly type: "NOTICE_INFO" | "NOTICE_ERR" | "NOTICE_CONFIRM",
    public readonly text: string
  ) {}
}
