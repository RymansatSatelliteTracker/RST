import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigRotator } from "@/common/model/AppConfigModel";
import { ApiResponse } from "@/common/types/types";

export type AntennaTrackingItem = {
  trackedAt: string;
  azimuth: number;
  elevation: number;
};

export type AntennaTracking = {
  id: number;
  startedAt: string;
  finishedAt: string;
  interval: number;
  items: AntennaTrackingItem[];
};

/**
 * ローテーター関係のレンダラ側API
 */
export default class ApiAntennaTracking {
  /**
   * ローテーターの監視を開始する
   * @param rotConfig ローテーター設定（テストモード向け。省略時はAppConfigの設定値で起動される）
   */
  public static async startCtrl(rotConfig: AppConfigRotator | null = null): Promise<ApiResponse<void>> {
    return await window.rstApi.startAntennaCtrl(rotConfig);
  }

  /**
   * ローテーターの監視を終了する
   */
  public static async stopCtrl(): Promise<void> {
    await window.rstApi.stopAntennaCtrl();
  }

  /**
   * アンテナ位置の変更イベント
   */
  public static async onChangeAntennaPosition(callback: Function) {
    await window.rstApi.onChangeAntennaPosition(callback);
  }

  /**
   * 指定の位置にアンテナを移動する
   */
  public static async setAntennaPosition(pos: AntennaPositionModel) {
    await window.rstApi.setAntennaPosition(pos);
  }

  /**
   * ローテータのデバイスが切断された際のイベント
   */
  public static async onRoratorDisconnect(callback: Function) {
    await window.rstApi.onRoratorDisconnect(callback);
  }
}
