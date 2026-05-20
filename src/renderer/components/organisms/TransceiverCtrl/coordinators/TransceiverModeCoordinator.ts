import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import I18nMsgs from "@/common/I18nMsgs.js";
import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import TransceiverUtil from "@/common/util/TransceiverUtil.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import ApiTransceiver from "@/renderer/api/ApiTransceiver.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import TransceiverModeSettingResolver, {
  ModeResolvedState,
} from "@/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverModeSettingResolver.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState.js";
import emitter from "@/renderer/util/EventBus.js";
import { Ref } from "vue";

/**
 * Coordinatorが操作するリアクティブ状態（useTransceiverCtrlのRef群）
 */
export interface ModeCoordinatorState {
  /** アップリンク周波数 */
  txFrequency: Ref<string>;
  /** ダウンリンク周波数 */
  rxFrequency: Ref<string>;
  /** Tx運用モード */
  txOpeMode: Ref<string>;
  /** Rx運用モード */
  rxOpeMode: Ref<string>;
  /** サテライトモード */
  satelliteMode: Ref<string>;
  /** サテライトモード判定フラグ */
  isSatelliteMode: Ref<boolean>;
  /** サテライトモードのトラッキングモード（true=NORMAL） */
  isSatTrackingModeNormal: Ref<boolean>;
  /** モード移行前のTx周波数退避 */
  savedTxFrequency: Ref<string>;
  /** モード移行前のRx周波数退避 */
  savedRxFrequency: Ref<string>;
  /** モード移行前のTx運用モード退避 */
  savedTxOpeMode: Ref<string>;
  /** モード移行前のRx運用モード退避 */
  savedRxOpeMode: Ref<string>;
  /** ビーコンモードフラグ */
  isBeaconMode: Ref<boolean>;
  /** TxドップラーシフトONフラグ */
  execTxDopplerShiftCorrection: Ref<boolean>;
  /** RxドップラーシフトONフラグ */
  execRxDopplerShiftCorrection: Ref<boolean>;
  /** Tx周波数補正値 */
  txFrequencyAdjustment: Ref<string>;
  /** Rx周波数補正値 */
  rxFrequencyAdjustment: Ref<string>;
}

/**
 * Auto/Beacon/Satellite モード遷移シーケンスを管理するクラス。
 * start/stop処理・タイマー管理・受信スキップフラグを集約し、useTransceiverCtrl から遷移ロジックを分離する。
 */
export default class TransceiverModeCoordinator {
  /** 周波数更新タイマID */
  private timerId: NodeJS.Timeout | null = null;

  /** 無線機からの受信処理をスキップするか */
  private _isRecvProcSkip = false;

  /** ドップラーシフト自動追尾インターバル（ミリ秒） */
  private _autoTrackingIntervalMsec = 1000;

  /** アクティブ衛星のNoradId */
  private _currentNoradId = "";

  /**
   * @param state - useTransceiverCtrlのリアクティブ状態オブジェクト
   * @param autoStore - AutoモードのON/OFF管理ストア
   * @param modeSettingResolver - 周波数・運用モード解決クラス
   * @param baseFreqMgr - 基準周波数管理クラス
   * @param onCalcBaseFreqWithAdjust - 補正値を反映した基準周波数を再算出するコールバック
   * @param onStartUpdateFreqInterval - 周波数更新インターバルを開始するコールバック
   */
  public constructor(
    private state: ModeCoordinatorState,
    private autoStore: ReturnType<typeof useStoreAutoState>,
    private modeSettingResolver: TransceiverModeSettingResolver,
    private baseFreqMgr: TransceiverBaseFreqMgr,
    private onCalcBaseFreqWithAdjust: () => void,
    private onStartUpdateFreqInterval: (intervalMs: number) => void
  ) {}

  /**
   * 無線機からの受信処理スキップフラグを取得する
   */
  get isRecvProcSkip(): boolean {
    return this._isRecvProcSkip;
  }

  /**
   * ドップラーシフト自動追尾インターバル（ミリ秒）を取得する
   */
  get autoTrackingIntervalMsec(): number {
    return this._autoTrackingIntervalMsec;
  }

  /**
   * NoradIdを更新し、変更があったかを返す
   * @param newNoradId 新しいNoradId
   * @returns 変更があればtrue
   */
  public updateCurrentNoradId(newNoradId: string): boolean {
    const isChanged = this._currentNoradId !== newNoradId;
    this._currentNoradId = newNoradId;
    return isChanged;
  }

  /**
   * アクティブ衛星のNoradIdを同期し、変更があったかを返す
   * @returns 変更があればtrue
   */
  public syncCurrentNoradIdFromActiveSat(): boolean {
    const currentNoradId = this.getActiveSatNorad();
    return this.updateCurrentNoradId(currentNoradId);
  }

  /**
   * 周波数更新タイマIDを設定する（useTransceiverCtrl側からsetIntervalの結果を渡す）
   */
  public setTimerId(id: NodeJS.Timeout | null): void {
    this.timerId = id;
  }

  /**
   * Autoモードを開始する
   * @returns {Promise<boolean>} 成功した場合はtrue
   */
  public async startAutoMode(): Promise<boolean> {
    // Autoモード開始の事前条件をチェック
    if (!(await this.validateAutoModeStart())) {
      return false;
    }

    // 周波数更新準備を行う（更新間隔の取得と既存タイマ停止）
    await this.prepareAutoTracking();

    // AutoOn時は受信処理をスキップする（AutoOn処理中のモード変更などにおける無線機からの不要なデータ受信を無視する）
    this._isRecvProcSkip = true;

    // アクティブ衛星のNoradIdを保持する
    this._currentNoradId = this.getActiveSatNorad();

    // Autoモード移行前の周波数を保持する
    this.saveFreqInAutoModeStart();

    // アクティブ衛星の周波数/運用モード/サテライトモード/トラッキングモードを取得
    const transceiverSetting = this.getActiveSatTransceiverSetting();

    // サテライトモードを設定して無線機へ反映する
    const result = await this.applySatelliteModeAtAutoStart(transceiverSetting.satelliteMode);
    if (!result) {
      return false;
    }

    // サテライトモードのトラッキングモードを更新する
    this.applyTrackingModeAtAutoStart(transceiverSetting.satTrackMode);

    // 周波数と運用モードを設定、保存する
    this.setFreqAndOpeModeInModeStart();
    this.saveFreqAndOpeModeInModeStart();

    // 基準周波数更新とドップラーシフトフラグ初期化を行う
    this.prepareBaseFreqAndDopplerFlagsAtAutoStart();

    // Auto開始をメイン側に連携する
    await ApiTransceiver.transceiverInitAutoOn(
      TransceiverUtil.parseNumber(this.state.txFrequency.value),
      TransceiverUtil.parseNumber(this.state.rxFrequency.value),
      this.state.txOpeMode.value,
      this.state.rxOpeMode.value,
      transceiverSetting.toneHz
    );

    // 更新インターバルごとに周波数を更新するタイマを開始する
    this.onStartUpdateFreqInterval(this._autoTrackingIntervalMsec);

    // AutoOn時の受信処理スキップを解除
    this._isRecvProcSkip = false;

    return true;
  }

  /**
   * Autoモード開始の事前条件を検証する
   */
  private async validateAutoModeStart(): Promise<boolean> {
    // AutoOnにできない状態の場合（無線機設定に未設定項目がある場合など）はトーストを表示して処理終了
    const appConfig = await ApiAppConfig.getAppConfig();
    if (!this.isValidTransceiverSetting(appConfig)) {
      return this.emitNoticeAndFail(Constant.GlobalEvent.NOTICE_INFO, I18nMsgs.SYSTEM_YET_TRANSCEIVER_CONFIG);
    }

    // 無線機接続が準備完了か確認する
    const isReady = await ApiTransceiver.isReady();
    if (!isReady.status) {
      return this.emitNoticeAndFail(Constant.GlobalEvent.NOTICE_ERR, I18nMsgs.SERIAL_NOT_CONNECTED_TRANSCEIVER);
    }

    return true;
  }

  /**
   * 通知を表示して失敗を返す
   */
  private emitNoticeAndFail(eventType: "NOTICE_INFO" | "NOTICE_ERR", messageKey: any): false {
    emitter.emit(eventType, I18nUtil.getMsg(messageKey));
    return false;
  }

  /**
   * 周波数追尾の事前準備を行う
   */
  private async prepareAutoTracking(): Promise<void> {
    // 周波数の更新インターバルを取得
    this._autoTrackingIntervalMsec = await this.fetchAutoTrackingIntervalMsec();

    // 周波数の更新を停止
    // MEMO: 停止されていない場合があるので、複数のタイマが発動することをガード
    // MEMO: AutoOn時の周波数の初期設定中に、ドップラーシフトの周波数更新が競合するため、停止後に以降の処理を行う必要がある
    await this.stopUpdateFreq();
  }

  /**
   * Autoモード移行前の周波数を保持する
   */
  private saveFreqInAutoModeStart(): void {
    this.state.savedTxFrequency.value = this.state.txFrequency.value;
    this.state.savedRxFrequency.value = this.state.rxFrequency.value;
  }

  /**
   * Auto開始時にサテライトモードを更新し、無線機へ反映する
   */
  private async applySatelliteModeAtAutoStart(enableSatelliteMode: boolean): Promise<boolean> {
    // 有効だったらサテライトモードを設定する
    this.state.satelliteMode.value = enableSatelliteMode
      ? Constant.Transceiver.SatelliteMode.SATELLITE
      : Constant.Transceiver.SatelliteMode.UNSET;

    // 無線機にサテライトモードを設定する
    // MEMO: satelliteMode.valueの更新時にwatchで isSatelliteMode.value が更新されるが、非同期でAPI呼び出しが行われる。
    //       サテライトモードの変更時に無線機のモード取得が行われるが、
    //       AutoOn時の無線機へのモード設定と同期が取れず、AutoOn時のモード設定が反映されない場合がある為、
    //       ここで明示的、同期的にサテライトモードを設定する。
    return await ApiTransceiver.setSatelliteMode(
      this.state.satelliteMode.value === Constant.Transceiver.SatelliteMode.SATELLITE
    );
  }

  /**
   * Auto開始時にサテライトのトラッキングモードを更新する
   */
  private applyTrackingModeAtAutoStart(satTrackMode: string | null): void {
    // Reverseを明示的に指定している場合以外はNormal
    if (this.state.isSatelliteMode.value && satTrackMode === Constant.Transceiver.TrackingMode.REVERSE) {
      this.state.isSatTrackingModeNormal.value = false;
    } else {
      this.state.isSatTrackingModeNormal.value = true;
    }
  }

  /**
   * Auto開始時の基準周波数更新とドップラーシフトフラグ初期化を行う
   */
  private prepareBaseFreqAndDopplerFlagsAtAutoStart(): void {
    // 周波数の基準値を保持する（補正値を加味しない周波数）
    this.baseFreqMgr.updatePlainBaseFreq(this.state.txFrequency.value, this.state.rxFrequency.value);

    // 基準周波数を更新する（逆ヘテロダインの計算用、補正値を反映したもの）
    this.onCalcBaseFreqWithAdjust();

    // ドップラーシフトのフラグを初期化
    this.state.execRxDopplerShiftCorrection.value = false;
    this.state.execTxDopplerShiftCorrection.value = false;
  }

  /**
   * Autoモードを停止する
   */
  public async stopAutoMode(): Promise<void> {
    // AutoOnでない場合は何もしない
    if (!this.autoStore.tranceiverAuto) {
      return;
    }

    // Auto終了をメイン側に連携する
    await ApiTransceiver.transceiverAutoOff();

    // Autoモードの周波数更新を停止する
    await this.stopUpdateFreq();

    // Autoモード移行前の周波数を復元する
    this.restoreSavedFreq();
  }

  /**
   * Autoモードの周波数更新タイマを停止する
   */
  public async stopUpdateFreq(): Promise<boolean> {
    if (!this.timerId) {
      return false;
    }

    clearInterval(this.timerId);
    this.timerId = null;

    // 本メソッド呼び出し後に周波数更新が動かないことを保証するため、周波数更新のインターバルと同じ時間だけ待機する
    await CommonUtil.sleep(this._autoTrackingIntervalMsec);

    return true;
  }

  /**
   * ビーコンモードを開始する
   */
  public async startBeaconMode(): Promise<void> {
    // 周波数と運用モードを設定、保存する
    this.setFreqAndOpeModeInModeStart();
    this.saveFreqAndOpeModeInModeStart();
  }

  /**
   * ビーコンモードを停止する
   */
  public async stopBeaconMode(): Promise<void> {
    // アクティブ衛星の周波数/運用モードを取得
    const transceiverSetting = this.getActiveSatTransceiverSetting();

    // Autoモード中じゃない場合は移行前の周波数と運用モードを復元して抜ける
    if (!this.autoStore.tranceiverAuto) {
      this.restoreSavedFreqAndOpeMode();
      return;
    }

    // Autoモード中の場合は、Autoモードの周波数/運用モードを優先して設定する
    const resolved = this.modeSettingResolver.resolveWhenBeaconOffInAuto(transceiverSetting);
    this.applyResolvedModeState(resolved);
  }

  /**
   * ビーコンもしくはAutoのモード開始時に状態に応じて周波数と運用モードを設定する
   */
  private setFreqAndOpeModeInModeStart(): void {
    // アクティブ衛星の周波数/運用モードを取得
    const transceiverSetting = this.getActiveSatTransceiverSetting();

    const resolved = this.modeSettingResolver.resolveOnModeStart(this.state.isBeaconMode.value, transceiverSetting);
    this.applyResolvedModeState(resolved);
  }

  /**
   * モード解決結果を画面状態に反映し、必要な通知をトーストで表示する
   */
  private applyResolvedModeState(resolved: ModeResolvedState): void {
    // 解決結果に含まれる通知メッセージをすべてトーストで表示する
    resolved.noticeMessageKeys.forEach((messageKey) => {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(messageKey));
    });

    // undefinedの場合は変更不要のため現状維持とする
    if (resolved.txFreq !== undefined) this.state.txFrequency.value = resolved.txFreq;
    if (resolved.rxFreq !== undefined) this.state.rxFrequency.value = resolved.rxFreq;
    if (resolved.txOpeMode !== undefined) this.state.txOpeMode.value = resolved.txOpeMode;
    if (resolved.rxOpeMode !== undefined) this.state.rxOpeMode.value = resolved.rxOpeMode;
  }

  /**
   * ビーコンもしくはAutoのモード開始時に現在の周波数と運用モードを保存する
   */
  private saveFreqAndOpeModeInModeStart(): void {
    // 何もONにしていない状態でここに来たときは周波数と運用モードを保存する
    // BeaconモードがONの状態でBeaconを開始はできない、Autoも同様、
    // なので、どちらかがOFFということは事前状態は何もONにしていない状態
    if (!(this.state.isBeaconMode.value && this.autoStore.tranceiverAuto)) {
      // 事前状態が何もONにしていない状態であれば、現在の周波数と運用モードを保存する
      this.state.savedTxFrequency.value = this.state.txFrequency.value;
      this.state.savedRxFrequency.value = this.state.rxFrequency.value;
      this.state.savedTxOpeMode.value = this.state.txOpeMode.value;
      this.state.savedRxOpeMode.value = this.state.rxOpeMode.value;
    }
  }

  /**
   * 保存済みの周波数を復元する
   */
  private restoreSavedFreq(): void {
    this.state.txFrequency.value = this.state.savedTxFrequency.value;
    this.state.rxFrequency.value = this.state.savedRxFrequency.value;
  }

  /**
   * 保存済みの周波数と運用モードを復元する
   */
  private restoreSavedFreqAndOpeMode(): void {
    this.restoreSavedFreq();
    this.state.txOpeMode.value = this.state.savedTxOpeMode.value;
    this.state.rxOpeMode.value = this.state.savedRxOpeMode.value;
  }

  /**
   * 無線機の設定が完了しているか判定する
   */
  private isValidTransceiverSetting(appConfig: AppConfigModel): boolean {
    const invalid =
      // シリアルポートが未設定の場合
      CommonUtil.isEmpty(appConfig.transceiver.port) ||
      // 機種が未設定の場合
      CommonUtil.isEmpty(appConfig.transceiver.transceiverId) ||
      // ボーレートが未設定の場合
      CommonUtil.isEmpty(appConfig.transceiver.baudrateBps);

    return !invalid;
  }

  /**
   * ドップラーシフトの自動追尾の更新間隔を取得する
   */
  private async fetchAutoTrackingIntervalMsec(): Promise<number> {
    const appConfig = await ApiAppConfig.getAppConfig();
    return parseFloat(appConfig.transceiver.autoTrackingIntervalSec) * 1000;
  }

  /**
   * アクティブ衛星の無線設定を取得する
   */
  private getActiveSatTransceiverSetting() {
    return ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();
  }

  /**
   * アクティブ衛星のNoradIDを取得する
   */
  private getActiveSatNorad(): string {
    const satelliteService = ActiveSatServiceHub.getInstance().getSatService();
    if (!satelliteService) {
      return "";
    }
    return satelliteService.getNoradId();
  }
}
