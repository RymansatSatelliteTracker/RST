import Constant from "@/common/Constant";
import { ApiResponse } from "@/common/types/types";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";

/**
 * ドップラーシフト待機状態と待機タイマを管理するクラス
 */
export default class TransceiverDopplerWaitCoordinator {
  /** ドップラーシフト待機中かどうか */
  private _isWaiting = false;

  /** ドップラーシフト待機タイマID */
  private timerId: NodeJS.Timeout | null = null;

  /**
   * @param autoStore - AutoモードのON/OFF管理ストア
   */
  public constructor(private autoStore: ReturnType<typeof useStoreAutoState>) {}

  /**
   * ドップラーシフト待機状態かどうかを返す
   */
  public get isWaiting(): boolean {
    return this._isWaiting;
  }

  /**
   * ドップラーシフト待機を設定する
   */
  public setupWaiting(res: ApiResponse<boolean>): void {
    if (!res.data) {
      return;
    }

    // Autoモード中でない場合は何もしない
    // MEMO: 無線機で周波数を変更した直後にAutoOnとした場合に、その周波数を元に一定時間待機後の基準周波数の更新が走ってしまうため、
    //       AutoOnでない場合は処理を終了する
    if (!this.autoStore.tranceiverAuto) {
      return;
    }

    // 既存タイマが存在する場合はクリアする
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    // ドップラーシフト待機フラグを有効にする
    this._isWaiting = true;

    // 一定時間待機後にドップラーシフト待機を解除する
    this.timerId = setTimeout(() => {
      this._isWaiting = false;
      AppRendererLogger.info("ダイヤル操作N秒経過したため待機を解除しました");
    }, Constant.Transceiver.TRANSCEIVE_WAIT_MS);
  }
}
