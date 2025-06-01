import Constant from "@/common/Constant";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { ApiResponse } from "@/common/types/types";
import RotatorControllerBase from "@/main/service/rotator/controller/RotatorControllerBase";

/**
 * アンテナ（ローテーター）のコントローラ
 * 開発時のシミュレーター向けのコントローラ
 */
export default class RotatorSimController extends RotatorControllerBase {
  // 現在の方位、仰角
  private az = 0;
  private el = 0;

  // 加算方向
  private azPhase = 1;
  private elPhase = 1;

  // setInterval()を制御するためのオブジェクト
  private autoTrackingTimerId: NodeJS.Timeout | null = null;
  private callbackTimerId: NodeJS.Timeout | null = null;

  /**
   * ローテーターの監視、操作を開始する
   */
  public override async start(): Promise<ApiResponse<void>> {
    return new ApiResponse();
  }

  /**
   * ローテーターの監視、操作を終了する
   */
  public override async stop(): Promise<void> {
    this.unsetCallback();
  }

  /**
   * ローテーター位置を設定する
   */
  public override doSetPosition(pos: AntennaPositionModel) {
    this.az = pos.azimuth;
    this.el = pos.elevation;
  }

  /**
   * アンテナ位置の変化を呼び出し側に伝播させるためのコールバックを設定する
   */
  public override setCallback(callback: Function): void {
    this.callback = callback;

    // 既に本メソッドが呼び出されている場合は、コールバックのタイマを解放する
    if (this.callbackTimerId) {
      clearInterval(this.callbackTimerId);
    }

    // 一定時間でコールバックを呼び出す
    this.callbackTimerId = setInterval(() => {
      this.execCallback();
    }, Constant.Rotator.UPDATE_INTERVAL_MS);
  }

  /**
   * アンテナ位置の変化を呼び出し側に伝播させるためのコールバック設定を解除する
   */
  public unsetCallback(): void {
    this.callback = null;
  }

  /**
   * 衛星の自動追尾を開始する
   */
  public startAutoTracking() {
    // 既に自動追尾Onの場合は処理終了
    if (this.autoTrackingTimerId) {
      return;
    }

    // 一定時間でAZ、ELを更新
    this.autoTrackingTimerId = setInterval(() => {
      this.rotate();
    }, Constant.Rotator.UPDATE_INTERVAL_MS);
  }

  /**
   * 衛星の自動追尾を停止する
   */
  public stopAutoTracking() {
    if (!this.autoTrackingTimerId) {
      return;
    }
    clearInterval(this.autoTrackingTimerId);
    this.autoTrackingTimerId = null;
  }

  /**
   * アンテナ位置を変動させる
   */
  private rotate() {
    // 0～360度の間を往復する
    this.az += 5 * this.azPhase;
    if (this.az >= 360 || this.az <= 0) {
      this.azPhase *= -1;
    }

    // 0～90度の間を往復する
    this.el += 5 * this.elPhase;
    if (this.el >= 90 || this.el <= 0) {
      this.elPhase *= -1;
    }
  }

  /**
   * コールバックを呼び出す
   * @returns
   */
  private execCallback() {
    if (!this.callback) {
      return;
    }

    const res = new ApiResponse<AntennaPositionModel>(true);
    res.data = new AntennaPositionModel(this.az, this.el);
    this.callback(res);
  }
}
