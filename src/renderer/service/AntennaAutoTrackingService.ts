import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import type { AntennaPositionModel } from "@/common/model/AntennaPositionModel.js";
import RotatorHelper from "@/common/util/RotatorHelper.js";
import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper.js";
import GroundStationHelper from "@/renderer/common/util/GroundStationHelper.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import type RotatorControllerBase from "@/renderer/service/rotator/RotatorControllerBase.js";
import RotatorControllerFactory from "@/renderer/service/rotator/RotatorControllerFactory.js";
import { AppConfigUtil } from "@/renderer/util/AppConfigUtil.js";
import emitter from "@/renderer/util/EventBus.js";
import type { Ref } from "vue";

/**
 * アンテナ（ローテータ）の自動衛星追尾サービス
 */
export default class AntennaAutoTrackingService {
  private timerId: NodeJS.Timeout | null = null;
  private moveMode: string = Constant.Config.Rotator.MOVE_MODE_NORMAL;
  private passKey: string | null = null;

  /** 方位角を0以上360未満に正規化する。 */
  private normalizeAzimuth(azimuth: number): number {
    return ((azimuth % 360) + 360) % 360;
  }

  /**
   * 指定された境界方位を跨ぐか判定する。
   * 仕様に従い、2地点間は短い方の方位角経路で判定する。
   */
  private crossesAzimuth(a: number, b: number, alpha: number): boolean {
    const A = this.normalizeAzimuth(a - alpha);
    const B = this.normalizeAzimuth(b - alpha);
    return Math.abs(A - B) > 180;
  }

  /** AOS/MEL/LOS の方位から、パス単位で動作モードを決定する。 */
  private async updateMoveMode(baseDate: Date, appConfig: AppConfigModel): Promise<boolean> {
    const pass = await ActiveSatServiceHub.getInstance().getOrbitPassAsync(baseDate);
    if (!pass?.aos || !pass.maxEl || !pass.los) {
      return false;
    }

    const key = `${pass.aos.date.getTime()}:${pass.los.date.getTime()}`;
    if (this.passKey === key) {
      return true;
    }

    const azimuths = [pass.aos, pass.maxEl, pass.los].map((point) => point.lookAngles.azimuth);
    const [aosAz, melAz, losAz] = azimuths;
    const maxRange = appConfig.rotator.rangeAzMax;
    if (maxRange < 360 || maxRange >= 720) {
      console.warn("ローテータ最大方位角は360以上720未満である必要があります", maxRange);
      return false;
    }

    const boundaryAz = this.normalizeAzimuth(maxRange);
    // ① 最大方位角境界、② 真北を、各区間で跨ぐか判定する。
    const crossesMax = this.crossesAzimuth(aosAz, melAz, boundaryAz) ||
      this.crossesAzimuth(melAz, losAz, boundaryAz);
    const crossesNorth = this.crossesAzimuth(aosAz, melAz, 0) ||
      this.crossesAzimuth(melAz, losAz, 0);

    const normal = Constant.Config.Rotator.MOVE_MODE_NORMAL;
    const flip = Constant.Config.Rotator.MOVE_MODE_FLIP;
    const shift = Constant.Config.Rotator.MOVE_MODE_SHIFT;
    // 既存の設定画面の「flip」をFlip許可として扱う。
    const flipAllowed = appConfig.rotator.moveMode === flip;
    let mode: string = normal;
    if (crossesMax && crossesNorth) {
      if (!flipAllowed) {
        console.warn("両方の境界を跨ぎますが、Flipが許可されていません");
        return false;
      }
      mode = flip;
    } else if (!crossesMax && crossesNorth && maxRange > 360) {
      mode = shift;
    }

    // AOS/MEL/LOS の指令値が可動範囲内か検証する。
    const valid = [pass.aos, pass.maxEl, pass.los].every((point) => {
      const position: AntennaPositionModel = {
        azimuth: point.lookAngles.azimuth,
        elevation: Math.max(0, point.lookAngles.elevation),
      };
      return RotatorHelper.isWithinRange(appConfig.rotator, this.convertPosition(position, mode, maxRange));
    });
    if (!valid) {
      console.warn("選択した追従モードでは AOS/MEL/LOS のいずれかが可動範囲外です", { mode, azimuths });
      return false;
    }

    this.moveMode = mode;
    this.passKey = key;
    // 設定値はFlip許可を表すため、判定結果で上書きしない。
    console.info("Rotator moveMode", { mode, azimuths, crossesMax, crossesNorth, maxRange });
    return true;
  }

  /** 衛星の水平座標をローテータ指令座標に変換する。 */
  private convertPosition(pos: AntennaPositionModel, mode: string, maxRange: number): AntennaPositionModel {
    if (mode === Constant.Config.Rotator.MOVE_MODE_FLIP) {
      return {
        azimuth: this.normalizeAzimuth(pos.azimuth + 180),
        elevation: 180 - pos.elevation,
      };
    }
    if (mode === Constant.Config.Rotator.MOVE_MODE_SHIFT) {
      const azimuth = this.normalizeAzimuth(pos.azimuth);
      const boundaryAz = this.normalizeAzimuth(maxRange);
      return { ...pos, azimuth: azimuth <= boundaryAz ? azimuth + 360 : azimuth };
    }
    return { ...pos };
  }

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

    // ローテータが未設定の場合はトーストを表示して終了
    const rotDevice = await AppConfigUtil.getCurrentRotatorDevice();
    if (!rotDevice) {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.SYSTEM_YET_ROTATOR_CONFIG));
      return false;
    }

    // 表示中の衛星グループが変更された場合のコールバックを設定
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(this.onChangeActiveSat.bind(this));

    const controller = await RotatorControllerFactory.getController(rotDevice);

    // 追従開始前にパスを取得して動作モードを確定する。
    const appConfig = await ApiAppConfig.getAppConfig();
    if (!(await this.updateMoveMode(date.value, appConfig))) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, "ローテータの追従モードを決定できませんでした");
      return false;
    }

    // 1秒ごとにローテータ位置の更新を要求する
    this.timerId = setInterval(() => {
      void this.doTracking(controller, date);
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

    // 次のパスに移った場合は、そのパスのモードを再決定する。
    if (!(await this.updateMoveMode(baseDate, appConfig))) {
      return;
    }

    const target = this.convertPosition(pos, this.moveMode, appConfig.rotator.rangeAzMax);
    if (!RotatorHelper.isWithinRange(appConfig.rotator, target)) {
      console.warn("ローテータ指令値が可動範囲外です", target);
      return;
    }

    // アンテナを変換後の衛星位置に向ける
    void controller.setPosition(target);
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
    void controller.setPosition(pos);
  }

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  public onChangeActiveSat() {
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
    this.timerId = null;
    this.passKey = null;
  }
}
