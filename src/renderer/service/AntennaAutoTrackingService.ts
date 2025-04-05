import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigModel } from "@/common/model/AppConfigModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper";
import GroundStationHelper from "@/renderer/common/util/GroundStationHelper";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import RotatorControllerBase from "@/renderer/service/rotator/RotatorControllerBase";
import RotatorControllerFactory from "@/renderer/service/rotator/RotatorControllerFactory";
import { AppConfigUtil } from "@/renderer/util/AppConfigUtil";
import emitter from "@/renderer/util/EventBus";
import { Ref } from "vue";

/**
 * アンテナ（ローテータ）の自動衛星追尾サービス
 */
export default class AntennaAutoTrackingService {
  private timerId: NodeJS.Timeout | null = null;

  /**
   * 自動追尾を開始する
   */
  public async start(date: Ref<Date>): Promise<boolean> {
    // アンテナ追尾を開始（アプリ起動時に実行されているが、シリアルが切断されている可能性があるので再度実施する）
    const res = await ApiAntennaTracking.startCtrl();
    if (!res.status) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
      return false;
    }

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(this.onChangeActiveSat);

    const rotDevice = await AppConfigUtil.getCurrentRotatorDevice();
    if (!rotDevice) {
      // ローテータが未設定の場合
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.SYSTEM_YET_ROTATOR_CONFIG));
      return false;
    }

    const controller = await RotatorControllerFactory.getController(rotDevice);

    // 1秒ごとにローテータ位置の更新を要求する
    this.timerId = setInterval(async () => {
      this.doTracking(controller, date);
    }, 1000);

    return true;
  }

  /**
   * 自動追尾を行う
   */
  private async doTracking(controller: RotatorControllerBase, date: Ref<Date>) {
    const baseDate = date.value;

    // 自動追尾の開始時刻か判定する
    const appConfig = await ApiAppConfig.getAppConfig();

    // 自動追尾の時間帯でない場合は、アンテナをパークポジションに設定する
    if (!(await AutoTrackingHelper.isRotatorTrackingTimeRange(appConfig, baseDate))) {
      this.moveParkPosition(appConfig, controller);
      return;
    }

    // 衛星位置データを取得
    const pos = await this.getSatPos(baseDate);
    if (!pos) {
      return;
    }

    // アンテナを衛星位置に向ける
    controller.setPosition(pos);
  }

  /**
   * 要求すべきローテータの位置を返す
   */
  private async getSatPos(baseDate: Date): Promise<AntennaPositionModel | null> {
    const satService = ActiveSatServiceHub.getInstance().getSatService();
    if (!satService) {
      return null;
    }

    // 衛星位置データを取得
    const groundStationLocation = await GroundStationHelper.getEcefLocation();
    const pos: AntennaPositionModel = {
      azimuth: satService.getSatelliteAzimuthAngle(baseDate, groundStationLocation) ?? 0,
      elevation: satService.getSatelliteElevationAngle(baseDate, groundStationLocation) ?? 0,
    };

    // 位置の範囲を調整
    if (pos.elevation < 0) {
      pos.elevation = 0;
    }

    return pos;
  }

  /**
   * アンテナをパークポジションに設定する
   */
  private moveParkPosition(appConfig: AppConfigModel, controller: RotatorControllerBase) {
    const pos: AntennaPositionModel = {
      azimuth: appConfig.rotator.parkPosAz,
      elevation: appConfig.rotator.parkPosEl,
    };
    controller.setPosition(pos);
  }

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  public onChangeActiveSat(satGrp: ActiveSatelliteGroupModel) {
    this.stop();
  }

  /**
   * 自動追尾を停止する
   */
  public stop() {
    if (!this.timerId) {
      return;
    }
    clearInterval(this.timerId);
  }
}
