import mitt from "mitt";

/**
 * イベントの種類
 * emitter.on(xx, ())でイベントハンドラを記載する場合の型を定義する。
 * ここに追加した後、Constant.GlobalEventにも追加する。
 */
export type GlobalEventType = {
  NOTICE_INFO: string;
  NOTICE_ERR: string;
  NOTICE_CONFIRM: ConfirmDialogPayload;
};
// 確認ダイアログペイロード用の型
type ConfirmDialogPayload = {
  message: string;
  resolve: (result: boolean) => void;
};

/**
 * Global Event Bus
 * 利用例）
 * 発火側
 * emitter.emit(Constant.GlobalEvent.NOTICE_INFO, "メッセージ");
 *
 * 受信側
 * emitter.on(Constant.GlobalEvent.NOTICE_INFO, (msg) => {
 *     xxx = msg;
 *   });
 */
const emitter = mitt<GlobalEventType>();
export default emitter;
