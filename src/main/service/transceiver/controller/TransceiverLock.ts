import CommonUtil from "@/common/CommonUtil.js";
import { synchronized } from "@/common/decorator/synchronized.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

// ロック取得の最大待機時間（ミリ秒）
const MAX_WAIT_MS = 3000;
// ロック取得の待機間隔（ミリ秒）
const WAIT_INTERVAL_MS = 10;

/**
 * 無線機との送受信の排他制御用ロック
 * 定期処理と、RSTからの操作（AutoOn/AutoOffなど）が、無線機との送受信を同時に行わないようにする。
 */
export default class TransceiverLock {
  private locked = false;

  /**
   * ロック中かを返す（定期処理の「前回処理が終わっていない」判定用）
   */
  public isLocked(): boolean {
    return this.locked;
  }

  /**
   * ロックを取得する
   * 他の処理がロック中の場合は、解放されるまで最大3秒待機する。
   * 待機がタイムアウトした場合は、警告ログを出力した上で、ロックを取得する。
   * @param comId 通信管理ID（ログ出力用）
   */
  @synchronized()
  public async acquire(comId: number): Promise<void> {
    // 最大待機時間を超過するまで待機する
    const startDate = new Date();
    while (this.locked) {
      const elapsedMs = new Date().getTime() - startDate.getTime();
      if (elapsedMs >= MAX_WAIT_MS) {
        break;
      }
      await CommonUtil.sleep(WAIT_INTERVAL_MS);
    }

    // 待機完了後、ロックが解放されていない場合はタイムアウトとして警告ログを出力する
    if (this.locked) {
      AppMainLogger.warn(`${comId}: ロック取得タイムアウト`);
    }

    // タイムアウトの有無に関わらずロックを取得する
    this.locked = true;
  }

  /**
   * ロックを解放する
   */
  public release(): void {
    this.locked = false;
  }
}
