import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import GroundStationHelper from "@/renderer/common/util/GroundStationHelper";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import RotatorControllerBase from "@/renderer/service/rotator/RotatorControllerBase";
import RotatorControllerFactory from "@/renderer/service/rotator/RotatorControllerFactory";
import { AppConfigUtil } from "@/renderer/util/AppConfigUtil";
import DateUtil from "@/renderer/util/DateUtil";
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
    // const now = new Date();
    const baseDate = date.value;

    // 自動追尾の開始時刻か判定する
    if (!(await this.isAosTimeRange(baseDate))) {
      this.setInitPosition(controller);
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
   * アンテナを初期位置に設定する
   */
  private setInitPosition(controller: RotatorControllerBase) {
    const pos: AntennaPositionModel = {
      azimuth: 0,
      elevation: 90,
    };
    controller.setPosition(pos);
  }

  /**
   * 自動追尾の時間帯か判定する
   * @param baseDate 基準時間
   */
  private async isAosTimeRange(baseDate: Date): Promise<boolean> {
    // AOS情報を取得
    const pass = await ActiveSatServiceHub.getInstance().getOrbitPassAsync(baseDate);
    if (!pass || !pass.aos || !pass.los) {
      return false;
    }

    // 自動追尾の開始時刻を取得
    const appConfig = await ApiAppConfig.getAppConfig();
    const addMinute = appConfig.rotator.startAgoMinute ?? 0;
    const trackingStartDate = DateUtil.addMinute(pass.aos.date, addMinute * -1);

    // 自動追尾の時間範囲内
    if (trackingStartDate.getTime() <= baseDate.getTime() && baseDate.getTime() <= pass.los.date.getTime()) {
      return true;
    }

    return false;
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
