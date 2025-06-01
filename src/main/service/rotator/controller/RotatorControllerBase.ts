import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { ApiResponse } from "@/common/types/types";
import RotatorHelper from "@/common/util/RotatorHelper";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

/**
 * ローテーターのコントローラ親クラス
 */
export default abstract class RotatorControllerBase {
  protected callback: Function | null = null;

  /**
   * ローテーターの監視、操作を開始する
   */
  public abstract start(): Promise<ApiResponse<void>>;

  /**
   * ローテーターの監視、操作を終了する
   */
  public abstract stop(): Promise<void>;

  /**
   * ローテーター位置を設定する
   */
  public setPosition(pos: AntennaPositionModel): void {
    // 指定のローテータ設定が範囲外の場合は何もしない
    const rotatorConfig = AppConfigUtil.getConfig().rotator;
    if (!RotatorHelper.isWithinRange(rotatorConfig, pos)) {
      return;
    }

    this.doSetPosition(pos);
  }

  /**
   * ローテーター位置を設定する
   * MEMO: 子クラスでローテーター位置をシリアル送信するなどの実行を行う
   */
  public abstract doSetPosition(pos: AntennaPositionModel): void;

  /**
   * アンテナ位置の変化を呼び出し側に伝播させるためのコールバックを設定する
   */
  public setCallback(callback: Function): void {
    this.callback = callback;
  }

  /**
   * コールバックを解除する
   */
  public unsetCallback(): void {
    this.callback = null;
  }
}
