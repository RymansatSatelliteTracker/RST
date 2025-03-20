import Constant from "@/common/Constant";
import emitter from "@/renderer/util/EventBus";

/**
 * 確認ダイアログを表示する
 * @param msg
 * @returns {Promise<boolean>} true: OK, false: Cancel
 */
export async function showConfirm(msg: string): Promise<boolean> {
  const result = await new Promise<boolean>((resolve) => {
    emitter.emit(Constant.GlobalEvent.NOTICE_CONFIRM, {
      message: msg,
      resolve,
    });
  });
  return result;
}
