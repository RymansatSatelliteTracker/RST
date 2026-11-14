import Constant from "@/common/Constant.js";
import type { ApiResponse } from "@/common/types/types.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import type { useStoreAutoState } from "@/renderer/store/useStoreAutoState.js";
import AppRendererLogger from "@/renderer/util/AppRendererLogger.js";

/**
 * ドップラーシフト待機状態と待機タイマを管理するクラス
 */
export default class TransceiverDopplerWaitCoordinator {
  /** ドップラーシフト待機中かどうか */
  private _isWaiting = false;

  /** ドップラーシフト待機タイマID */
  private timerId: NodeJS.Timeout | null = null;

  /** 非同期処理の競合を避けるためのリクエストID */
  private waitingRequestId = 0;

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
  public async setupWaiting(res: ApiResponse<boolean>): Promise<void> {
    if (!res.data) {
      return;
    }

    // Autoモード中でない場合は何もしない
    // MEMO: 無線機で周波数を変更した直後にAutoOnとした場合に、その周波数を元に一定時間待機後の基準周波数の更新が走ってしまうため、
    //       AutoOnでない場合は処理を終了する
    if (!this.autoStore.tranceiverAuto) {
      return;
    }

    const requestId = ++this.waitingRequestId;

    // 既存タイマが存在する場合はクリアする
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    // ドップラーシフト待機フラグを有効にする
    this._isWaiting = true;

    const waitMs = await this.getResumeDelayMs();

    // 設定値取得中に再呼び出しされた場合は新しい要求を優先する
    if (requestId !== this.waitingRequestId) {
      return;
    }

    // 一定時間待機後にドップラーシフト待機を解除する
    this.timerId = setTimeout(() => {
      // 古いタイマが遅れて発火して待機解除してしまうのを防ぐため、リクエストIDが一致しない場合は処理を終了する
      if (requestId !== this.waitingRequestId) {
        return;
      }

      this._isWaiting = false;
      this.timerId = null;
      AppRendererLogger.info(`ダイヤル操作${waitMs / 1000}秒経過したため待機を解除しました`);
    }, waitMs);
  }

  /**
   * AppConfigの再開待機時間(秒)をミリ秒で返す
   */
  private async getResumeDelayMs(): Promise<number> {
    const config = await ApiAppConfig.getAppConfig();
    const sec = Number.parseFloat(config.transceiver.dopplerResumeDelaySec);

    // 設定値が不正な場合は定数のデフォルト値を返す
    if (!Number.isFinite(sec) || sec <= 0) {
      return Constant.Transceiver.DEFAULT_DOPPLER_SHIFT_RESUME_MS;
    }

    return sec * 1000;
  }
}
