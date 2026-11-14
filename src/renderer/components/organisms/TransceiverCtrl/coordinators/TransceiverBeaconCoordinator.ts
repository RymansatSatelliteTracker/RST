import Constant from "@/common/Constant.js";
import TransceiverUtil from "@/common/util/TransceiverUtil.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import type TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import type TransceiverBeaconMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBeaconMgr.js";
import type { BeaconSavedState } from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBeaconMgr.js";
import type TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import type { useStoreAutoState } from "@/renderer/store/useStoreAutoState.js";
import AppRendererLogger from "@/renderer/util/AppRendererLogger.js";
import emitter from "@/renderer/util/EventBus.js";
import type { Ref } from "vue";

/**
 * BeaconCoordinatorが操作するリアクティブ状態（useTransceiverCtrlのRef群）
 */
export interface BeaconCoordinatorState {
  /** アップリンク周波数 */
  txFrequency: Ref<string>;
  /** ダウンリンク周波数 */
  rxFrequency: Ref<string>;
  /** Rx運用モード */
  rxOpeMode: Ref<string>;
  /** ドップラーシフトモード（衛星固定/受信固定/送信固定） */
  dopplerShiftMode: Ref<string>;
  /** ビーコンモードフラグ */
  isBeaconMode: Ref<boolean>;
  /** サテライトモード判定フラグ */
  isSatelliteMode: Ref<boolean>;
  /** 補正値反映済みのTx基準周波数 */
  txBaseFreq: Ref<number>;
  /** 補正値反映済みのRx基準周波数 */
  rxBaseFreq: Ref<number>;
  /** Tx周波数補正値 */
  txFrequencyAdjustment: Ref<string>;
  /** Rx周波数補正値 */
  rxFrequencyAdjustment: Ref<string>;
}

/**
 * BeaconCoordinatorから呼び出す、useTransceiverCtrl側の処理
 */
export interface BeaconCoordinatorCallbacks {
  /** Autoモードの周波数更新（周期処理）を停止する */
  stopTracking: () => Promise<unknown>;
  /** Autoモードの周波数更新（周期処理）を再開する */
  restartTracking: () => Promise<void> | void;
  /** 補正値を反映した基準周波数を再算出する */
  calcBaseFreqWithAdjust: () => void;
  /** ドップラーシフト補正を1回実行する（補正要否フラグの更新を含む） */
  applyDopplerShiftNow: () => Promise<void>;
  /** ドップラーシフト自動追尾インターバル（ミリ秒）を取得する */
  getAutoTrackingIntervalMsec: () => number;
}

/**
 * Beacon OFF のオプション
 */
export interface StopBeaconOptions {
  /**
   * Auto ON の場合に周期処理を再開するか（既定：true）
   * 直後にAutoの停止・再開始を行う場合（強制OFF）はfalseを指定する
   */
  restartTracking?: boolean;
}

/**
 * Beaconモードの開始・停止と、Auto開始時のBeaconの引き継ぎを管理するクラス
 */
export default class TransceiverBeaconCoordinator {
  // ドップラーシフト計算用インスタンス
  private dopplerCalc = new TransceiverDopplerCalc();

  /**
   * @param state - useTransceiverCtrlのリアクティブ状態
   * @param autoStore - AutoモードのON/OFF管理ストア
   * @param beaconMgr - Beacon ON 前の状態とビーコンのRx基準周波数の管理
   * @param baseFreqMgr - 基準周波数（補正値なし）の管理
   * @param modeSettingResolver - 衛星設定から周波数・運用モードを解決するクラス
   * @param currentDate - 現在日時
   * @param callbacks - useTransceiverCtrl側の処理
   */
  public constructor(
    private state: BeaconCoordinatorState,
    private autoStore: ReturnType<typeof useStoreAutoState>,
    private beaconMgr: TransceiverBeaconMgr,
    private baseFreqMgr: TransceiverBaseFreqMgr,
    private modeSettingResolver: TransceiverModeSettingResolver,
    private currentDate: Ref<Date>,
    private callbacks: BeaconCoordinatorCallbacks
  ) {}

  /**
   * Beaconを利用できるか判定する（ビーコン設定あり、かつサテライトモードON）
   */
  public canUseBeacon(): boolean {
    const transceiverSetting = ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();
    return this.state.isSatelliteMode.value && this.modeSettingResolver.canUseBeaconMode(transceiverSetting);
  }

  /**
   * Beaconモードを開始する
   * @returns 開始した場合はtrue
   */
  public async start(): Promise<boolean> {
    if (this.state.isBeaconMode.value) {
      return true;
    }

    // ビーコン設定を解決する（未設定の場合は通知して終了）
    const transceiverSetting = ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();
    const resolved = this.modeSettingResolver.resolveBeaconModeSetting(transceiverSetting);
    resolved.noticeMessageKeys.forEach((messageKey) => {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(messageKey));
    });
    const beaconHz = transceiverSetting.beacon?.beaconHz;
    if (resolved.rxOpeMode === undefined || beaconHz == null || !this.state.isSatelliteMode.value) {
      return false;
    }

    const isAuto = this.autoStore.tranceiverAuto;

    // 周期処理が古い基準周波数で周波数を上書きしないよう、切替中は停止する
    if (isAuto) {
      await this.callbacks.stopTracking();
    }

    // Beacon ON 前の状態を記録する
    this.beaconMgr.save(this.captureCurrentState());

    // 固定モードを衛星固定にして、Rxをビーコンへ切り替える
    this.state.isBeaconMode.value = true;
    this.state.dopplerShiftMode.value = Constant.Transceiver.DopplerShiftMode.FIXED_SAT;
    await this.switchRxToBeacon(beaconHz, resolved.rxOpeMode, isAuto);

    AppRendererLogger.info(`Beacon ON Rx=${this.state.rxFrequency.value} Mode=${this.state.rxOpeMode.value}`);

    if (isAuto) {
      await this.callbacks.restartTracking();
    }

    return true;
  }

  /**
   * Beaconモードを停止し、Beacon ON 前の状態に戻す
   * @param options Beacon OFF のオプション
   */
  public async stop(options: StopBeaconOptions = {}): Promise<void> {
    if (!this.state.isBeaconMode.value) {
      return;
    }

    const { restartTracking = true } = options;
    const isAuto = this.autoStore.tranceiverAuto;
    const saved = this.beaconMgr.getSaved();

    if (isAuto) {
      await this.callbacks.stopTracking();
    }

    this.state.isBeaconMode.value = false;

    if (saved) {
      // 固定モードとRx運用モードを戻す
      this.state.dopplerShiftMode.value = saved.dopplerShiftMode;
      this.state.rxOpeMode.value = saved.rxOpeMode;

      // 周波数を戻す
      if (isAuto) {
        await this.restoreFreqInAuto(saved);
      } else {
        this.state.rxFrequency.value = saved.rxFrequency;
      }
    }

    // ビーコンの記録を破棄する（Beacon中のダイヤル・ホイールによる調整もここで破棄される）
    this.beaconMgr.clear();

    AppRendererLogger.info(`Beacon OFF Rx=${this.state.rxFrequency.value} Tx=${this.state.txFrequency.value}`);

    if (isAuto && restartTracking) {
      await this.callbacks.restartTracking();
    }
  }

  /**
   * Beacon中にAutoを開始する場合に、Beaconを引き継ぐ
   * Autoモード開始処理で衛星設定の周波数・運用モードが設定され、基準周波数が更新された後に呼ぶ
   */
  public async resumeOnAutoStart(): Promise<void> {
    const saved = this.beaconMgr.getSaved();
    if (!this.state.isBeaconMode.value || !saved) {
      return;
    }

    // Beacon OFF 時の戻り先を、Auto側の値（衛星設定の周波数・運用モード）で更新する
    // MEMO: 固定モードは Beacon ON 時に記録した値のままとする
    const { plainRxBaseFreq, plainTxBaseFreq } = this.baseFreqMgr.getPlainBaseFreqs();
    this.beaconMgr.save({
      ...saved,
      txFrequency: this.state.txFrequency.value,
      rxFrequency: this.state.rxFrequency.value,
      rxOpeMode: this.state.rxOpeMode.value,
      plainTxBaseFreq,
      plainRxBaseFreq,
    });

    // Rxをビーコンへ切り替える（固定モードは衛星固定のまま）
    const transceiverSetting = ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();
    const resolved = this.modeSettingResolver.resolveBeaconModeSetting(transceiverSetting);
    const beaconHz = transceiverSetting.beacon?.beaconHz;
    if (resolved.rxOpeMode === undefined || beaconHz == null) {
      return;
    }
    this.state.dopplerShiftMode.value = Constant.Transceiver.DopplerShiftMode.FIXED_SAT;
    await this.switchRxToBeacon(beaconHz, resolved.rxOpeMode, true);

    AppRendererLogger.info(`Beacon継続でAuto開始 Rx=${this.state.rxFrequency.value}`);
  }

  /**
   * 現在の状態をBeacon ON 前の状態として取得する
   */
  private captureCurrentState(): BeaconSavedState {
    // 画面のホイール操作による調整は rxBaseFreq/txBaseFreq にのみ反映されるため、画面の基準周波数から補正値を除いて求める
    const adjustRx = TransceiverUtil.parseNumber(this.state.rxFrequencyAdjustment.value);
    const adjustTx = TransceiverUtil.parseNumber(this.state.txFrequencyAdjustment.value);

    return {
      dopplerShiftMode: this.state.dopplerShiftMode.value,
      txFrequency: this.state.txFrequency.value,
      rxFrequency: this.state.rxFrequency.value,
      rxOpeMode: this.state.rxOpeMode.value,
      plainTxBaseFreq: TransceiverUtil.subtractFrequencies(this.state.txBaseFreq.value, adjustTx),
      plainRxBaseFreq: TransceiverUtil.subtractFrequencies(this.state.rxBaseFreq.value, adjustRx),
    };
  }

  /**
   * Rx周波数・運用モードをビーコンへ切り替える
   * @param beaconHz ビーコン周波数
   * @param beaconMode ビーコン運用モード
   * @param withDoppler ドップラーシフトを加味するか（Auto ON 時）
   */
  private async switchRxToBeacon(beaconHz: number, beaconMode: string, withDoppler: boolean): Promise<void> {
    // ビーコンのRx基準周波数は、Rx補正値を加えずにビーコン周波数そのものとする
    this.beaconMgr.setBeaconRxBaseFreq(beaconHz);

    let rxFreq = TransceiverUtil.formatWithDot(beaconHz);
    if (withDoppler && (await this.isWithinDopplerShiftActiveRange())) {
      const shifted = await this.dopplerCalc.calcNewRxFreqWithDoppler(
        this.currentDate.value,
        beaconHz,
        this.callbacks.getAutoTrackingIntervalMsec()
      );
      if (shifted !== null) {
        rxFreq = shifted;
      }
    }

    this.state.rxOpeMode.value = beaconMode;
    this.state.rxFrequency.value = rxFreq;
  }

  /**
   * Auto ON 時に、Beacon ON 前の基準周波数・固定周波数へ戻す
   * @param saved Beacon ON 前の状態
   */
  private async restoreFreqInAuto(saved: BeaconSavedState): Promise<void> {
    // 基準周波数を戻し、現在の補正値で計算し直す
    this.baseFreqMgr.setPlainBaseFreqs(saved.plainRxBaseFreq, saved.plainTxBaseFreq);
    this.callbacks.calcBaseFreqWithAdjust();

    // 固定側の周波数を戻す
    const isFixedRx = saved.dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_RX;
    const isFixedTx = saved.dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_TX;
    if (isFixedRx) {
      this.state.rxFrequency.value = saved.rxFrequency;
    }
    if (isFixedTx) {
      this.state.txFrequency.value = saved.txFrequency;
    }

    // ドップラーシフトの有効範囲内なら、戻した時点のドップラーシフトを加味して固定側以外を算出する
    if (await this.isWithinDopplerShiftActiveRange()) {
      await this.callbacks.applyDopplerShiftNow();
      return;
    }

    // 範囲外の場合は、固定側以外を基準周波数（ドップラーシフトなし）にする
    if (!isFixedRx) {
      this.state.rxFrequency.value = TransceiverUtil.formatWithDot(this.state.rxBaseFreq.value);
    }
    if (!isFixedTx) {
      this.state.txFrequency.value = TransceiverUtil.formatWithDot(this.state.txBaseFreq.value);
    }
  }

  /**
   * 人工衛星がドップラーシフトの有効範囲内にいるか判定する
   */
  private async isWithinDopplerShiftActiveRange(): Promise<boolean> {
    const appConfig = await ApiAppConfig.getAppConfig();
    return await this.dopplerCalc.isWithinDopplerShiftActiveRange(appConfig, this.currentDate.value);
  }
}
