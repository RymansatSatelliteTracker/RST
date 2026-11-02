import AppMainLogger from "@/main/util/AppMainLogger.js";

/**
 * 無線機側の操作後に、RSTから無線機への送信を一時停止するためのタイマー
 *
 * 無線機のダイヤルなどで周波数・モードが変更された場合、RSTから周波数などを送信すると、
 * 無線機での操作と混線状態になるため、一定時間、RSTからの送信を一時停止する。
 */
export default class TransceiverWaitTimer {
  // 一時停止中か
  private waiting = false;
  // 一時停止の解除用タイマー
  private timer: NodeJS.Timeout | null = null;

  /**
   * 送信を一時停止中かを返す
   */
  public isWaiting(): boolean {
    return this.waiting;
  }

  /**
   * 送信の一時停止を開始する
   * 既に一時停止中の場合は、タイマーを再設定する（一時停止の期間が延長される）。
   * @param waitMs 一時停止する時間（ミリ秒）
   */
  public start(waitMs: number): void {
    this.waiting = true;
    AppMainLogger.debug(`無線機への送信を一時停止します（${waitMs}ms）`);

    // 既存のタイマーがあればクリア
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // 指定ミリ秒後、無線機への送信の一時停止を解除する
    this.timer = setTimeout(() => {
      this.waiting = false;
      this.timer = null;
      AppMainLogger.debug(`無線機への送信の一時停止を解除しました`);
    }, waitMs);
  }

  /**
   * 送信の一時停止を解除する（タイマーもクリアする）
   */
  public release(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.waiting = false;
  }
}
