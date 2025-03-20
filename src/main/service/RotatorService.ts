import CommonUtil from "@/common/CommonUtil";
import I18nMsgs from "@/common/I18nMsgs";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigRotator } from "@/common/model/AppConfigModel";
import { AppConfigRotatorDevice } from "@/common/model/AppConfigRotatorModel";
import { ApiResponse } from "@/common/types/types";
import { getMainWindow } from "@/main/main";
import RotatorControllerBase from "@/main/service/rotator/controller/RotatorControllerBase";
import RotatorControllerFactory from "@/main/service/rotator/controller/RotatorControllerFactory";
import RotatorSerialHelper from "@/main/service/rotator/RotatorSerialHelper";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";

/**
 * ローテーターサービス
 * 例外的にシングルトンです。
 */
export default class RotatorService {
  // シングルトンインスタンス
  private static instance: RotatorService;

  // 現在のRotatorController
  private controller: RotatorControllerBase | null = null;

  /**
   * シングルトンのため、コンストラクタは隠蔽
   */
  private constructor() {}

  /**
   * シングルトンインタンスを返す
   * @returns
   */
  public static getInstance() {
    // 複数スレッドでの同時呼び出しは考慮しない
    // memo: 初回呼び出しはアプリ起動時の想定。単一スレッドからの呼び出しとなるため考慮不要
    if (!RotatorService.instance) {
      RotatorService.instance = new RotatorService();
    }
    return RotatorService.instance;
  }

  /**
   * 最新の設定ファイルをもとに起動処理などを行う
   * @param reqRotConfig ローテーター設定（テストモード向け。省略時はAppConfigの設定値を参照数する）
   */
  public async restart(reqRotConfig: AppConfigRotator | null = null): Promise<ApiResponse<void>> {
    let rotatorConfig;
    let deviceConfig;

    // 引数でローテーター設定が指定されている場合は、その設定を使用
    // memo: ローテータ設定画面のテストモード向け
    if (reqRotConfig) {
      rotatorConfig = reqRotConfig;
      deviceConfig = AppConfigUtil.findRotatorDeviceById(rotatorConfig.rotatorId);
    }
    // 引数でローテーター設定が指定されいない場合は、AppConfigで設定されているローテーター設定を使用する
    else {
      rotatorConfig = AppConfigUtil.getConfig().rotator;

      // ローテーターIDが未設定の場合は何もしない
      if (CommonUtil.isEmpty(rotatorConfig.rotatorId)) {
        // ローテータ接続なしもコールバック
        RotatorSerialHelper.fireSerialDisConnect();

        return new ApiResponse();
      }

      deviceConfig = AppConfigUtil.getCurrentRotatorDevice();
    }

    // ローテーター機器を変更
    await this.changeDevice(rotatorConfig, deviceConfig);

    if (!this.controller) {
      return new ApiResponse(false, I18nMsgs.SYSTEM_UNEXPECTED_ERROR);
    }

    this.controller.setCallback(this.onPosChange);
    return await this.controller.start();
  }

  /**
   * ローテーターの接続を終了する
   */
  public async stop() {
    if (!this.controller) {
      return;
    }
    await this.controller.stop();

    // ローテータ接続なしをコールバック
    RotatorSerialHelper.fireSerialDisConnect();
  }

  /**
   * ローテーター機器を変更する
   * @param rotatorCmdType
   */
  public async changeDevice(rotatorConfig: AppConfigRotator, deviceConfig: AppConfigRotatorDevice) {
    // デバイスの切断、コールバックの解除
    await this.resetDevice();

    // コントローラを設定し直す
    this.controller = await RotatorControllerFactory.getController(rotatorConfig, deviceConfig);
  }

  /**
   * データ受信ハンドラ
   */
  private onPosChange(res: ApiResponse<AntennaPositionModel>) {
    getMainWindow().webContents.send("onChangeAntennaPosition", res);
  }

  /**
   * アンテナ位置の変動コールバックを設定する
   */
  public setCallback(callback: Function) {
    if (!this.isReady()) {
      return;
    }

    this.controller?.setCallback(callback);
  }

  /**
   * ローテーター機器の制御を解除する
   */
  public async resetDevice() {
    if (!this.isReady()) {
      return;
    }

    this.controller?.unsetCallback();
    await this.controller?.stop();
  }

  /**
   * アンテナ位置を変更する
   */
  public setAntennaPosition(antennaPositionModel: AntennaPositionModel) {
    if (!this.isReady()) {
      return;
    }

    // AppMainLogger.debug(
    //   `アンテナ位置を変更します。az=${antennaPositionModel.azimuth} el=${antennaPositionModel.elevation}`
    // );
    this.controller?.setPosition(antennaPositionModel);
  }

  /**
   * ローテーター制御が可能な状態か判定する
   */
  private isReady() {
    // AntennaControllerが設定されているか？のみで判定
    return this.controller;
  }
}
