import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { AppConfigModel } from "@/common/model/AppConfigModel";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";
import TransceiverUtil from "@/common/util/TransceiverUtil";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import { useModeStateManager } from "@/renderer/components/organisms/TransceiverCtrl/useSatelliteModeStateManager";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
import emitter from "@/renderer/util/EventBus";
import { onMounted, ref, Ref, watch } from "vue";

/**
 * 無線機を制御する
 * @param {Ref<Date>} currentDate 現在日時
 * @returns {*} 無線機制御設定
 */
const useTransceiverCtrl = (currentDate: Ref<Date>) => {
  // アップリンク周波数
  const txFrequency = ref<string>("2430.000.000");
  // ダウンリンク周波数
  const rxFrequency = ref<string>("0480.000.000");
  // 基準送受信周波数の和
  const baseFreqSum = ref<number>(0.0);
  // アップリンク周波数の変化量
  const diffTxFrequency = ref<number>(0.0);
  // ダウンリンク周波数の変化量
  const diffRxFrequency = ref<number>(0.0);
  // アップリンク運用モード
  const txOpeMode = ref<string>(Constant.Transceiver.OpeMode.UNSET);
  // ダウンリンク運用モード
  const rxOpeMode = ref<string>(Constant.Transceiver.OpeMode.UNSET);
  // サテライトモード
  const satelliteMode = ref<string>(Constant.Transceiver.SatelliteMode.UNSET);
  // サテライトモード判定
  const isSatelliteMode = ref<boolean>(false);
  // サテライトモードのトラッキングモード
  const isSatTrackingModeNormal = ref<boolean>(true);
  // Auto/Beaconモード移行前のTx周波数を保持する変数
  const savedTxFrequency = ref<string>("");
  // Auto/Beaconモード移行前のRx周波数を保持する変数
  const savedRxFrequency = ref<string>("");
  // ドップラーシフトのアップリンク基準周波数
  const dopplerTxBaseFreq = ref<number>(0.0);
  // ドップラーシフトのダウンリンク基準周波数
  const dopplerRxBaseFreq = ref<number>(0.0);
  // ビーコンモード
  const isBeaconMode = ref<boolean>(false);
  // ビーコンモードが利用可能かどうか
  const isBeaconModeAvailable = ref<boolean>(false);
  // BeaconモードのTx運用モード
  const savedTxOpeMode = ref<string>("");
  // BeaconモードのRx運用モード
  const savedRxOpeMode = ref<string>("");
  // ドップラーシフトモード
  const dopplerShiftMode = ref<string>(Constant.Transceiver.DopplerShiftMode.FIXED_SAT);
  // Txをドップラー補正するか
  const execTxDopplerShiftCorrection = ref<boolean>(false);
  // Rxをドップラー補正するか
  const execRxDopplerShiftCorrection = ref<boolean>(false);

  // AutoモードのOnOff管理
  const autoStore = useStoreAutoState();

  // 周波数の更新タイマ
  let timerId: NodeJS.Timeout | null = null;
  // ドップラーシフト待機フラグ
  let isDopplerShiftWaiting = ref<boolean>(false);
  // ドップラーシフト周波数送信の待機タイマ
  let dopplerTimerId: NodeJS.Timeout | null = null;

  // 周波数の更新インターバル（ミリ秒）
  let autoTrackingIntervalMsec = 1000;

  // 無線機からの受信処理をスキップするか
  let isRecvProcSkip = false;

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    isBeaconModeAvailable.value = await confirmBeaconModeAvailable();
    if (autoStore.tranceiverAuto) {
      await startAutoMode();
    }
  }

  /**
   * ビーコンモードが利用可能かどうかを確認する
   * @returns {Promise<boolean>} ビーコンモードが利用可能かどうか
   */
  async function confirmBeaconModeAvailable(): Promise<boolean> {
    // アクティブ衛星の周波数/運用モードを取得
    const transceiverSetting = ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();

    return !!(transceiverSetting.beacon && transceiverSetting.beacon.beaconHz && transceiverSetting.beacon.beaconMode);
  }

  /**
   * Autoモード中はアクティブ衛星で周波数/運用モードを更新する
   */
  async function startAutoMode(): Promise<boolean> {
    // AutoOnにできない状態の場合（無線機設定に未設定項目がある場合など）はトーストを表示して処理終了
    const appConfig = await ApiAppConfig.getAppConfig();
    if (!isValidTransceiverSetting(appConfig)) {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.SYSTEM_YET_TRANSCEIVER_CONFIG));
      return false;
    }

    // 無線機接続が準備完了か確認する
    const isReady = await ApiTransceiver.isReady();
    if (!isReady.status) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(I18nMsgs.SERIAL_NOT_CONNECTED_TRANSCEIVER));
      return false;
    }

    // AutoOn時は受信処理をスキップする（AutoOn処理中のモード変更などにおける無線機からの不要なデータ受信を無視する）
    isRecvProcSkip = true;

    // Autoモード移行前の周波数を保持する
    savedTxFrequency.value = txFrequency.value;
    savedRxFrequency.value = rxFrequency.value;

    // アクティブ衛星の周波数/運用モード/サテライトモード/トラッキングモードを取得
    const transceiverSetting = ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();

    // 有効だったらサテライトモードを設定する
    satelliteMode.value = transceiverSetting.satelliteMode
      ? Constant.Transceiver.SatelliteMode.SATELLITE
      : Constant.Transceiver.SatelliteMode.UNSET;

    // 無線機にサテライトモードを設定する
    // memo: satelliteMode.valueの更新時にwatchで isSatelliteMode.value が更新されるが、非同期でAPI呼び出しが行われる。
    //       サテライトモードの変更時に無線機のモード取得が行われるが、
    //       AutoOn時の無線機へのモード設定と同期が取れず、AutoOn時のモード設定が反映されない場合がある為、
    //       ここで明示的、同期的にサテライトモードを設定する。
    const result = await ApiTransceiver.setSatelliteMode(
      satelliteMode.value === Constant.Transceiver.SatelliteMode.SATELLITE
    );
    if (!result) {
      return false;
    }

    // 周波数と運用モードを設定、保存する
    setFrequencyAndOpeModeInModeStart();
    saveFrequencyAndOpeModeInModeStart();

    // サテライトモードのトラッキングモードをアクティブ衛星の設定で更新する
    // Reverseを明示的に指定している場合以外はNormal
    if (isSatelliteMode.value && transceiverSetting.satTrackMode === Constant.Transceiver.TrackingMode.REVERSE) {
      isSatTrackingModeNormal.value = false;
    } else {
      isSatTrackingModeNormal.value = true;
    }

    // Auto開始をメイン側に連携する
    await ApiTransceiver.transceiverInitAutoOn(
      TransceiverUtil.parseNumber(txFrequency.value),
      TransceiverUtil.parseNumber(rxFrequency.value),
      txOpeMode.value,
      rxOpeMode.value,
      transceiverSetting.toneHz
    );

    // ドップラーシフトの基準周波数を設定する
    dopplerTxBaseFreq.value = TransceiverUtil.parseNumber(txFrequency.value);
    dopplerRxBaseFreq.value = TransceiverUtil.parseNumber(rxFrequency.value);

    // 基準周波数の和を更新する（逆ヘテロダインの計算用）
    baseFreqSum.value = getBaseFreqSum();

    // 周波数の更新インターバルを取得
    autoTrackingIntervalMsec = parseFloat(appConfig.transceiver.autoTrackingIntervalSec) * 1000;

    // 周波数の更新を停止（停止されていない場合があるので、複数のタイマが発動することをガード）
    stopUpdateFreq();

    // ドップラーシフトのフラグを初期化
    execRxDopplerShiftCorrection.value = false;
    execTxDopplerShiftCorrection.value = false;

    // 更新インターバルごとに周波数の更新する
    timerId = setInterval(async () => {
      updateFreq();
    }, autoTrackingIntervalMsec);

    // AutoOn時は受信処理をスキップを解除
    isRecvProcSkip = false;

    return true;
  }

  /**
   * Autoモードを停止する
   */
  async function stopAutoMode() {
    // Auto終了をメイン側に連携する
    await ApiTransceiver.transceiverAutoOff();

    // Autoモードの周波数更新を停止する
    if (!stopUpdateFreq()) {
      return;
    }

    // Autoモード移行前の周波数を復元する
    txFrequency.value = savedTxFrequency.value;
    rxFrequency.value = savedRxFrequency.value;
  }

  /**
   * Autoモードの周波数更新を停止する
   */
  function stopUpdateFreq() {
    if (!timerId) {
      return false;
    }

    clearInterval(timerId);
    timerId = null;

    return true;
  }

  /**
   * ビーコンモードを開始する
   */
  async function startBeaconMode() {
    // 周波数と運用モードを設定、保存する
    setFrequencyAndOpeModeInModeStart();
    saveFrequencyAndOpeModeInModeStart();
  }

  /**
   * ビーコンモードを停止する
   */
  async function stopBeaconMode() {
    // アクティブ衛星の周波数/運用モードを取得
    const transceiverSetting = ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();

    // 周波数と運用モードを設定する
    // Autoモード中じゃない場合は移行前の周波数と運用モードを復元して抜ける
    if (!autoStore.tranceiverAuto) {
      txFrequency.value = savedTxFrequency.value;
      rxFrequency.value = savedRxFrequency.value;
      txOpeMode.value = savedTxOpeMode.value;
      rxOpeMode.value = savedRxOpeMode.value;
      return;
    }

    // Autoモード中の場合
    // Autoモードの周波数/運用モードを優先して設定する

    if (transceiverSetting.uplink && transceiverSetting.uplink.uplinkHz) {
      // アップリンク周波数/運用モードをアクティブ衛星の設定で更新する
      txFrequency.value = TransceiverUtil.formatWithDot(transceiverSetting.uplink.uplinkHz);
      txOpeMode.value = transceiverSetting.uplink.uplinkMode;
    }
    if (transceiverSetting.downlink && transceiverSetting.downlink.downlinkHz) {
      // ダウンリンク周波数/運用モードをアクティブ衛星の設定で更新する
      rxFrequency.value = TransceiverUtil.formatWithDot(transceiverSetting.downlink.downlinkHz);
      rxOpeMode.value = transceiverSetting.downlink.downlinkMode;
    }
  }

  /**
   * ビーコンもしくはAutoのモード開始時に状態に応じて周波数と運用モードを設定する
   */
  async function setFrequencyAndOpeModeInModeStart() {
    // アクティブ衛星の周波数/運用モードを取得
    const transceiverSetting = ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();

    // 周波数と運用モードを設定する
    // ここにはAutoもしくはBeaconの状態変更後に来る
    if (isBeaconMode.value) {
      if (!(transceiverSetting.beacon && transceiverSetting.beacon.beaconHz)) {
        emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.CHK_ERR_NO_BEACON_FREQ));
        return;
      }
      // BeaconModeがONということは
      // - BeaconモードをONにした
      // - BeaconモードONの状態でAutoモードを開始した
      // その場合は、ビーコンモードの周波数/運用モードを優先して設定する
      // ダウンリンクの周波数/運用モードをアクティブ衛星の設定で更新する
      rxFrequency.value = TransceiverUtil.formatWithDot(transceiverSetting.beacon.beaconHz);
      rxOpeMode.value = transceiverSetting.beacon.beaconMode;
      return;
    }

    // BeaconModeがOFFということは
    // - BeaconモードOFFの状態でAutoモードを開始した
    // その場合は、Autoモードの周波数/運用モードを優先して設定する

    // アップリンクもダウンリンクも設定がない場合はトーストを表示して抜ける
    if (!transceiverSetting?.uplink?.uplinkHz && !transceiverSetting?.downlink?.downlinkHz) {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.CHK_ERR_NO_FREQ));
      return;
    }

    // アップリンク周波数/運用モードをアクティブ衛星の設定で更新する
    // 型チェックで引っかかるので説明変数ではなく元のチェックを使う
    if (transceiverSetting?.uplink?.uplinkHz) {
      txFrequency.value = TransceiverUtil.formatWithDot(transceiverSetting.uplink.uplinkHz);
      txOpeMode.value = transceiverSetting.uplink.uplinkMode;
    } else {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.CHK_ERR_NO_UPLINK_FREQ));
    }

    // ダウンリンク周波数/運用モードをアクティブ衛星の設定で更新する
    // 型チェックで引っかかるので説明変数ではなく元のチェックを使う
    if (transceiverSetting?.downlink?.downlinkHz) {
      rxFrequency.value = TransceiverUtil.formatWithDot(transceiverSetting.downlink.downlinkHz);
      rxOpeMode.value = transceiverSetting.downlink.downlinkMode;
    } else {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.CHK_ERR_NO_DOWNLINK_FREQ));
    }
  }

  /**
   * ビーコンもしくはAutoのモード開始時に現在の周波数と運用モードを保存する
   */
  async function saveFrequencyAndOpeModeInModeStart() {
    // 何もONにしていない状態でここに来たときは周波数と運用モードを保存する
    // BeaconモードがONの状態でBeaconを開始はできない、Autoも同様、
    // なので、どちらかがOFFということは事前状態は何もONにしていない状態
    if (!(isBeaconMode.value && autoStore.tranceiverAuto)) {
      // 事前状態が何もONにしていない状態であれば、現在の周波数と運用モードを保存する
      savedTxFrequency.value = txFrequency.value;
      savedRxFrequency.value = rxFrequency.value;
      savedTxOpeMode.value = txOpeMode.value;
      savedRxOpeMode.value = rxOpeMode.value;
    }
  }

  /**
   * 無線機の設定を初期化する
   */
  async function initTransceiver() {
    // 無線機のサテライトモードを初期化する
    await ApiTransceiver.setSatelliteMode(false);
  }

  /**
   * 無線機周波数初期化処理
   */
  async function initFrequency() {
    // AppConfig.transceiverからtxFrequency,rxFrequencyを取得する
    const config = await ApiAppConfig.getAppConfig();
    txFrequency.value = config.transceiver.txFrequency;
    rxFrequency.value = config.transceiver.rxFrequency;
  }

  /**
   * アップリンク周波数を更新する
   * @param {number} newTxFrequency アップリンク周波数
   */
  async function updateTxFrequency(newTxFrequency: number) {
    await ApiTransceiver.setTransceiverFrequency({
      uplinkHz: newTxFrequency,
      uplinkMode: "",
    });
  }

  /**
   * ダウンリンク周波数を更新する
   * @param {number} newRxFrequency ダウンリンク周波数
   */
  async function updateRxFrequency(newRxFrequency: number) {
    await ApiTransceiver.setTransceiverFrequency({
      downlinkHz: newRxFrequency,
      downlinkMode: "",
    });
  }

  /**
   * アップリンク周波数をドップラーシフト補正して更新する
   * @param {number} intervalMs 時間間隔[単位：ミリ秒]
   */
  async function updateTxFreqByInvertingHeterodyne(intervalMs: number) {
    const frequencyTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!frequencyTrackService) {
      return;
    }

    // ドップラーファクターを一時アップリンク周波数に適用して、アップリンク周波数とする
    const txDopplerFactor = await frequencyTrackService.calcUplinkDopplerFactor(currentDate.value, intervalMs);
    const txFreq = dopplerTxBaseFreq.value * txDopplerFactor;

    // 画面のアップリンク周波数を更新する
    txFrequency.value = TransceiverUtil.formatWithDot(txFreq);
  }

  /**
   * ダウンリンク周波数をドップラーシフト補正して更新する
   * @param {number} intervalMs 時間間隔[単位：ミリ秒]
   */
  async function updateRxFrequencyWithDopplerShift(intervalMs: number) {
    const frequencyTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!frequencyTrackService) {
      return;
    }

    // ドップラーファクターを計算する
    const rxDopplerFactor = await frequencyTrackService.calcDownlinkDopplerFactor(currentDate.value, intervalMs);
    const rxFreq = dopplerRxBaseFreq.value * rxDopplerFactor;

    // 画面のダウンリンク周波数を更新する
    rxFrequency.value = TransceiverUtil.formatWithDot(rxFreq);
  }

  /**
   * 人工衛星がドップラーシフトが有効となる範囲にいるか判定する
   * @returns {boolean}
   */
  async function isWithinDopplerShiftActiveRange(): Promise<boolean> {
    // 指定した日時から最も近いパスを取得する
    const orbitPass = await ActiveSatServiceHub.getInstance().getOrbitPassAsync(currentDate.value);
    if (!orbitPass || !orbitPass.aos || !orbitPass.los) {
      // パスが取得できない場合はfalseで返す
      return false;
    }

    // ドップラーシフトが有効な範囲にいるか判定する
    const passAos = orbitPass.aos.date.getTime() - Constant.Transceiver.DOPPLER_SHIFT_RANGE_SEC * 1000;
    const passLos = orbitPass.los.date.getTime() + Constant.Transceiver.DOPPLER_SHIFT_RANGE_SEC * 1000;
    if (currentDate.value.getTime() >= passAos && currentDate.value.getTime() <= passLos) {
      return true;
    }

    return false;
  }

  watch(isBeaconMode, async (newIsBeaconMode) => {
    if (newIsBeaconMode) {
      // ビーコンモード開始
      await startBeaconMode();
    } else {
      // ビーコンモード終了
      await stopBeaconMode();
    }
  });

  // サテライトモード設定が変更された場合に、isSatelliteModeを更新する
  watch(
    satelliteMode,
    (newMode, oldMode) => {
      if (oldMode === undefined) return;
      saveState(oldMode);

      // UNSETモードに遷移する場合は過去状態をロードする
      if (newMode === Constant.Transceiver.SatelliteMode.UNSET) {
        loadState(newMode);
      }

      isSatelliteMode.value = newMode === Constant.Transceiver.SatelliteMode.SATELLITE;
    },
    { immediate: true }
  );

  // サテライトモード設定が変更された場合にAPIを呼び出す
  // TODO: サテライトモードON/OFFのAPIにしているがSPLITが入るのでモード自体を渡すべき？
  watch(isSatelliteMode, async (newIsSatelliteMode) => {
    await ApiTransceiver.setSatelliteMode(newIsSatelliteMode);
  });

  // アップリンク周波数が変更された場合にAPIを呼び出す
  watch(txFrequency, async (newFrequency) => {
    // アップリンク周波数を更新する
    await updateTxFrequency(TransceiverUtil.parseNumber(newFrequency));
  });

  // 画面でアップリンク周波数が変更された場合に変化量を反映する
  watch(diffTxFrequency, async (newDiffFrequency) => {
    if (newDiffFrequency === 0.0) {
      // 変化量が0の場合は何もしない
      return;
    }

    // ドップラーシフトの基準周波数に画面で変更された変化量を反映する
    dopplerTxBaseFreq.value = TransceiverUtil.subtractFrequencies(dopplerTxBaseFreq.value, diffTxFrequency.value);
    // 周波数の変化量を初期化する
    diffTxFrequency.value = 0.0;
  });

  // アップリンクの運用モードが変更された場合にAPIを呼び出す
  watch(txOpeMode, async (newTxOpeMode) => {
    await ApiTransceiver.setTransceiverMode({
      uplinkHz: null,
      uplinkMode: newTxOpeMode,
    });
  });

  // サテライトモードがONで、個別でダウンリンク周波数が変更された場合にAPIを呼び出す
  // TODO: SPLITモードの場合のサーバ処理がないので、今はSPLITモードの時は何もしない
  watch(rxFrequency, async (newFrequency) => {
    if (!isSatelliteMode.value) {
      return;
    }

    // ダウンリンク周波数を更新する
    await updateRxFrequency(TransceiverUtil.parseNumber(newFrequency));
  });

  // 画面でダウンリンク周波数が変更された場合に変化量を反映する
  watch(diffRxFrequency, async (newDiffFrequency) => {
    if (newDiffFrequency === 0.0) {
      // 変化量が0の場合は何もしない
      return;
    }

    // ドップラーシフトの基準周波数に画面で操作した変化量を反映する
    dopplerRxBaseFreq.value = TransceiverUtil.subtractFrequencies(dopplerRxBaseFreq.value, diffRxFrequency.value);

    if (!isSatelliteMode.value) {
      // サテライトモードがOFFの場合は中断する
      // TODO: SPLITモードの場合のサーバ処理がないので、今はSPLITモードの時も何もしない
      diffRxFrequency.value = 0.0;
      return;
    }

    if (isSatTrackingModeNormal.value) {
      // トラッキングモードがNORMALの場合、アップリンク周波数とダウンリンク周波数の変化量を同一方向に同じステップで変化させる
      txFrequency.value = TransceiverUtil.formatWithDot(
        TransceiverUtil.subtractFrequencies(TransceiverUtil.parseNumber(txFrequency.value), diffRxFrequency.value)
      );
      // ドップラーシフトの基準周波数に画面で操作した変化量を反映する
      dopplerTxBaseFreq.value = TransceiverUtil.subtractFrequencies(dopplerTxBaseFreq.value, diffRxFrequency.value);
    } else {
      // トラッキングモードがREVERSEの場合、アップリンク周波数とダウンリンク周波数の変化量を逆方向に同じステップで変化させる
      txFrequency.value = TransceiverUtil.formatWithDot(
        TransceiverUtil.addFrequencies(TransceiverUtil.parseNumber(txFrequency.value), diffRxFrequency.value)
      );
      // ドップラーシフトの基準周波数に画面で操作した変化量を反映する
      dopplerTxBaseFreq.value = TransceiverUtil.addFrequencies(dopplerTxBaseFreq.value, diffRxFrequency.value);
    }
    // 周波数の変化量を初期化する
    diffRxFrequency.value = 0.0;
  });

  // サテライトモードがONで、個別でダウンリンクの運用モードが変更された場合にAPIを呼び出す
  // TODO: SPLITモードの場合のサーバ処理がないので、今はSPLITモードの時も何もしない
  watch(rxOpeMode, async (newRxOpeMode) => {
    if (!isSatelliteMode.value) {
      return;
    }

    await ApiTransceiver.setTransceiverMode({
      downlinkHz: null,
      downlinkMode: newRxOpeMode,
    });
  });

  /**
   * Rx周波数を同期する
   * サテライトモードがONの場合はTx周波数を同期しない
   * サテライトモードがOFFの場合はTx周波数を同期する
   * Rxから先に更新する
   */
  watch([satelliteMode, txFrequency] as const, ([newSatelliteMode, newTxFrequency]) => {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) return;
    // 無限更新防止
    if (rxFrequency.value === newTxFrequency) return;
    rxFrequency.value = newTxFrequency;
  });
  watch([satelliteMode, rxFrequency] as const, ([newSatelliteMode, newRxFrequency]) => {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) return;
    // 無限更新防止
    if (txFrequency.value === newRxFrequency) return;
    txFrequency.value = newRxFrequency;
  });

  /**
   * Rx運用モードを同期する
   * サテライトモードがONの場合はTx運用モードを同期しない
   * サテライトモードがOFFの場合はTx運用モードを同期する
   * Rxから先に更新する
   */
  watch([satelliteMode, txOpeMode] as const, ([newSatelliteMode, newTxOpeMode]) => {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) return;
    // 無限更新防止
    if (rxOpeMode.value === newTxOpeMode) return;
    rxOpeMode.value = newTxOpeMode;
  });
  watch([satelliteMode, rxOpeMode] as const, ([newSatelliteMode, newRxOpeMode]) => {
    if (newSatelliteMode === Constant.Transceiver.SatelliteMode.SATELLITE) return;
    // 無限更新防止
    if (txOpeMode.value === newRxOpeMode) return;
    txOpeMode.value = newRxOpeMode;
  });

  /**
   * 周波数の更新を行う
   */
  async function updateFreq() {
    // Autoモード中でない場合は何もしない
    if (!autoStore.tranceiverAuto) {
      return;
    }

    // 人工衛星がドップラーシフトが有効となる範囲外の場合は処理終了
    if (!(await isWithinDopplerShiftActiveRange())) {
      return;
    }

    // ドップラーシフト待機フラグが有効の場合は処理を中断する
    if (isDopplerShiftWaiting.value) {
      return;
    }

    // ドップラーシフト補正を実行するかどうかを判定する
    execTxDopplerShiftCorrection.value =
      dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
      dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_RX;
    execRxDopplerShiftCorrection.value =
      dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
      dopplerShiftMode.value === Constant.Transceiver.DopplerShiftMode.FIXED_TX;

    // サテライトモードがONの場合、ダウンリンク周波数をドップラーシフト補正して更新する
    // TODO: SPLITモードの場合のサーバ処理がないので、今はSPLITモードの時も何もしない
    if (isSatelliteMode.value && execRxDopplerShiftCorrection.value) {
      await updateRxFrequencyWithDopplerShift(autoTrackingIntervalMsec);
    }

    // アップリンク周波数をドップラーシフト補正して更新する
    if (execTxDopplerShiftCorrection.value) {
      await updateTxFreqByInvertingHeterodyne(autoTrackingIntervalMsec);
    }

    // 以下は、コメントアウトしても良い。2025年11月時点ではデバッグログとして出力しておく。
    // デバッグログ
    const nowRxFreq = TransceiverUtil.parseNumber(rxFrequency.value);
    const nowTxFreq = TransceiverUtil.parseNumber(txFrequency.value);
    const shiftRx = dopplerRxBaseFreq.value - nowRxFreq;
    const shiftTx = dopplerTxBaseFreq.value - nowTxFreq;
    const baseSum = dopplerRxBaseFreq.value + dopplerTxBaseFreq.value;
    AppRendererLogger.debug(
      `ドップラーシフト補正後: ${nowRxFreq} ${nowTxFreq}` +
        ` シフト補正値： ${shiftRx} ${shiftTx}` +
        ` 基準周波数: ${dopplerRxBaseFreq.value} ${dopplerTxBaseFreq.value} = ${baseSum}`
    );
  }

  onMounted(async () => {
    // 無線機の設定を初期化する
    await initTransceiver();

    // 初期表示時にAppConfigから無線機周波数を取得する
    await initFrequency();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    await onChangeSatGrp();
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 無線機からの周波数データ(トランシーブ)受信があった場合はドップラーシフトを待機する
    ApiTransceiver.dopplerShiftWaitingCallback(async (res: ApiResponse<boolean>) => {
      if (!res.data) {
        return;
      }

      // Autoモード中でない場合は何もしない
      // memo: 無線機で周波数を変更した直後にAutoOnとした場合に、その周波数を元に一定時間待機後の基準周波数の更新が走ってしまうため、
      //       AutoOnでない場合は処理を終了する
      if (!autoStore.tranceiverAuto) {
        return;
      }

      // ドップラーシフト待機タイマが既に存在する場合は初期化する
      if (dopplerTimerId) {
        clearTimeout(dopplerTimerId);
      }

      // ドップラーシフト待機フラグを有効にする
      isDopplerShiftWaiting.value = true;

      // 一定時間待機後にドップラーシフトの基準周波数を変更する
      dopplerTimerId = setTimeout(async () => {
        // ドップラーシフト待機フラグを無効に戻す
        isDopplerShiftWaiting.value = false;

        AppRendererLogger.info(`ダイヤル操作N秒経過 待機解除`);
      }, Constant.Transceiver.TRANSCEIVE_WAIT_MS);
    });

    // 無線機の周波数を取得し、txFrequency,rxFrequencyを更新する
    ApiTransceiver.onChangeTransceiverFrequency(async (res: ApiResponse<UplinkType | DownlinkType>) => {
      if (!res.status) {
        emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
        return;
      }

      const freqData = res.data;
      if (!freqData) return;

      if ("uplinkHz" in freqData && freqData.uplinkHz) {
        const recvTxFreq = freqData.uplinkHz;
        AppRendererLogger.info(`トランシーブ Tx周波数 Tx:${recvTxFreq}`);

        // 画面のアップリンク周波数と無線機からトランシーブした周波数が同じ場合は処理終了
        // MEMO: 無線機にて操作対象のバンドの変更などを行うと、周波数を変更せずとも周波数のトランシーブが発生する。
        //       その場合に基準周波数の更新を行うと意図しない基準周波数の変更が発生するため、同じ場合は処理を終了する。
        AppRendererLogger.info(`RST Tx周波数 Tx:${txFrequency.value}`);
        const formattedRecvTxFreq = TransceiverUtil.formatWithDot(recvTxFreq);
        if (txFrequency.value === formattedRecvTxFreq) {
          AppRendererLogger.info(`RSTのTx周波数と同一のため基準周波数の更新をスキップします。`);
          AppRendererLogger.info(
            `基準周波数 Rx:${dopplerRxBaseFreq.value} Tx:${dopplerTxBaseFreq.value} Sum:${baseFreqSum.value}`
          );
          return;
        }

        // 画面のアップリンク周波数を更新
        txFrequency.value = TransceiverUtil.formatWithDot(recvTxFreq);

        // AutoOff時は処理終了
        if (!autoStore.tranceiverAuto) {
          return;
        }
        // 以降、AutoOn時の基準周波数更新処理

        // ドップラーシフトの基準周波数を再算出する
        const { rxBaseFreq, txBaseFreq } = await calcBaseFreqByShiftedTxFreq(baseFreqSum.value, recvTxFreq);
        dopplerRxBaseFreq.value = rxBaseFreq;
        dopplerTxBaseFreq.value = txBaseFreq;

        AppRendererLogger.info(
          `基準周波数を更新しました。 Rx:${dopplerRxBaseFreq.value} Tx:${dopplerTxBaseFreq.value} Sum:${baseFreqSum.value}`
        );

        // ダウンリンク周波数を更新する
      } else if ("downlinkHz" in freqData && freqData.downlinkHz) {
        const recvRxFreq = freqData.downlinkHz;
        AppRendererLogger.info(`トランシーブ Rx周波数 Rx:${recvRxFreq}`);

        // 画面のアップリンク周波数と無線機からトランシーブした周波数が同じ場合は処理終了
        // MEMO: 無線機にて操作対象のバンドの変更などを行うと、周波数を変更せずとも周波数のトランシーブが発生する。
        //       その場合に基準周波数の更新を行うと意図しない基準周波数の変更が発生するため、同じ場合は処理を終了する。
        const formattedRecvRxFreq = TransceiverUtil.formatWithDot(recvRxFreq);
        AppRendererLogger.info(`RST Rx周波数 Rx:${rxFrequency.value} 受信：${formattedRecvRxFreq}`);
        if (rxFrequency.value === formattedRecvRxFreq) {
          AppRendererLogger.info(`RSTのRx周波数と同一のため基準周波数の更新をスキップします。`);
          AppRendererLogger.info(
            `基準周波数 Rx:${dopplerRxBaseFreq.value} Tx:${dopplerTxBaseFreq.value} Sum:${baseFreqSum.value}`
          );
          return;
        }

        // 画面のダウンリンク周波数を更新
        rxFrequency.value = TransceiverUtil.formatWithDot(recvRxFreq);

        // AutoOff時は処理終了
        if (!autoStore.tranceiverAuto) {
          return;
        }
        // 以降、AutoOn時の基準周波数更新処理

        // ドップラーシフトの基準周波数を再算出する
        const { rxBaseFreq, txBaseFreq } = await calcBaseFreqByShiftedRxFreq(baseFreqSum.value, recvRxFreq);
        dopplerRxBaseFreq.value = rxBaseFreq;
        dopplerTxBaseFreq.value = txBaseFreq;

        AppRendererLogger.info(
          `基準周波数（更新） Rx:${dopplerRxBaseFreq.value} Tx:${dopplerTxBaseFreq.value} Sum:${baseFreqSum.value}`
        );
      }
    });

    // 無線機の運用モードのイベントハンドラ
    // 受信した無線機の運用モードでtxOpeMode,rxOpeModeを更新する
    ApiTransceiver.onChangeTransceiverMode(async (res: ApiResponse<UplinkType | DownlinkType>) => {
      // 受信処理スキップ状態の場合は処理を終了する（AutoOn処理中のモード変更などにおける無線機からの不要なデータ受信を無視する）
      if (isRecvProcSkip) {
        return;
      }

      if (!res.status) {
        emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
        // 運用モードが取得できない場合はUNSETにする
        txOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
        rxOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
        return;
      }

      const opeMode = res.data;
      if (!opeMode) {
        // 運用モードが取得できない場合はUNSETにする
        txOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
        rxOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
        return;
      }

      if ("uplinkMode" in opeMode && opeMode.uplinkMode) {
        if (!CommonUtil.isEmpty(opeMode.uplinkMode)) {
          // アップリンク運用モードを更新する
          txOpeMode.value = opeMode.uplinkMode;
        } else {
          // 運用モードが取得できない場合はUNSETにする
          txOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
        }
      } else if ("downlinkMode" in opeMode && opeMode.downlinkMode) {
        if (!CommonUtil.isEmpty(opeMode.downlinkMode)) {
          // ダウンリンク運用モードを更新する
          rxOpeMode.value = opeMode.downlinkMode;
        } else {
          // 運用モードが取得できない場合はUNSETにする
          rxOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
        }
      }
    });

    // 無線機周波数保存イベントを受けて設定ファイルに現在の無線機周波数を保存する
    ApiTransceiver.onSaveTransceiverFrequency(async () => {
      const config = await ApiAppConfig.getAppConfig();
      config.transceiver.txFrequency = txFrequency.value;
      config.transceiver.rxFrequency = rxFrequency.value;
      await ApiAppConfig.storeAppConfig(config);
    });
  });

  const { save, load } = useModeStateManager();

  /**
   * モードごとの状態を保存する
   * @param mode モード名（サテライトモードやSPLITなど）
   */
  function saveState(mode: string) {
    // Autoモード中は状態を保存しない
    if (autoStore.tranceiverAuto) return;

    const state = {
      rxFrequency: rxFrequency.value,
      rxOpeMode: rxOpeMode.value,
      isSatTrackingModeNormal: isSatTrackingModeNormal.value,
    };
    save(mode, state);
  }

  /**
   * モードごとの状態を呼び出す
   * @param mode モード名（サテライトモードやSPLITなど）
   */
  function loadState(mode: string) {
    // Autoモード中は状態を読み込まない
    if (autoStore.tranceiverAuto) return;

    const state = load(mode);
    rxFrequency.value = state.rxFrequency;
    rxOpeMode.value = state.rxOpeMode;
    switch (mode) {
      case Constant.Transceiver.SatelliteMode.SATELLITE:
        isSatTrackingModeNormal.value = state.isSatTrackingModeNormal;
        // このモード以外はtx/rxが同期している
        // モードを切り替えるとsatelliteにしたときにrx設定あり->rxが空欄という挙動になる
        // tx入力してるのにrxを空欄にしたいというケースはないので、txをrxに合わせる
        const isRxOpeModeUNSET: boolean = rxOpeMode.value === Constant.Transceiver.OpeMode.UNSET;
        const isTxOpeModeUNSET: boolean = txOpeMode.value === Constant.Transceiver.OpeMode.UNSET;
        if (isRxOpeModeUNSET && !isTxOpeModeUNSET) rxOpeMode.value = txOpeMode.value;
        break;
      case Constant.Transceiver.SatelliteMode.SPLIT:
        isSatTrackingModeNormal.value = true; // SPLITモードではトラッキングモードは常にNORMAL
        break;
      default:
        isSatTrackingModeNormal.value = false; // その他のモードではトラッキングモードは無効
        break;
    }
  }

  /**
   * ドップラーシフトされたRx周波数を元に、Rx、Tx基準周波数を算出する
   */
  async function calcBaseFreqByShiftedRxFreq(
    baseFreqNum: number,
    shiftedRxFreq: number
  ): Promise<{ rxBaseFreq: number; txBaseFreq: number }> {
    const activeSatHubService = ActiveSatServiceHub.getInstance();
    const frequencyTrackService = activeSatHubService.getFrequencyTrackService();
    if (!frequencyTrackService) {
      return { rxBaseFreq: 0, txBaseFreq: 0 };
    }

    // Rxのドップラーファクターを計算
    const rxDopplerFactor = await frequencyTrackService.calcDownlinkDopplerFactor(
      currentDate.value,
      autoTrackingIntervalMsec
    );

    // Rx、Txの基準周波数を更新する
    const { rxBaseFreq, txBaseFreq } = frequencyTrackService.calcInvHeteroBaseFreqByRxFreq(
      baseFreqNum,
      // nowRxFreq,
      shiftedRxFreq,
      rxDopplerFactor
    );

    return { rxBaseFreq, txBaseFreq };
  }

  /**
   * ドップラーシフトされたTx周波数を元に、Rx、Tx基準周波数を算出する
   */
  async function calcBaseFreqByShiftedTxFreq(
    baseFreqNum: number,
    shiftedTxFreq: number
  ): Promise<{ rxBaseFreq: number; txBaseFreq: number }> {
    const activeSatHubService = ActiveSatServiceHub.getInstance();

    const frequencyTrackService = activeSatHubService.getFrequencyTrackService();
    if (!frequencyTrackService) {
      return { rxBaseFreq: 0, txBaseFreq: 0 };
    }

    // Txのドップラーファクターを計算
    const txDopplerFactor = await frequencyTrackService.calcUplinkDopplerFactor(
      currentDate.value,
      autoTrackingIntervalMsec
    );

    // Rx、Txの基準周波数を更新する
    const { rxBaseFreq, txBaseFreq } = frequencyTrackService.calcInvHeteroBaseFreqByTxFreq(
      baseFreqNum,
      shiftedTxFreq,
      txDopplerFactor
    );

    return { rxBaseFreq, txBaseFreq };
  }

  /**
   * 現在の衛星の送受信周波数の和を取得する（逆ヘテロダインの計算用）
   */
  function getBaseFreqSum(): number {
    const activeSatHubService = ActiveSatServiceHub.getInstance();

    const setting = activeSatHubService.getActiveSatTransceiverSetting();
    if (!setting || !setting.downlink || !setting.uplink) {
      return 0;
    }

    return setting.downlink.downlinkHz! + setting.uplink.uplinkHz!;
  }

  function isValidTransceiverSetting(appConfig: AppConfigModel): boolean {
    const invalid =
      // シリアルポートが未設定の場合
      CommonUtil.isEmpty(appConfig.transceiver.port) ||
      // 機種が未設定の場合
      CommonUtil.isEmpty(appConfig.transceiver.transceiverId) ||
      // ボーレートが未設定の場合
      CommonUtil.isEmpty(appConfig.transceiver.baudrateBps);

    return !invalid;
  }

  return {
    startAutoMode,
    stopAutoMode,
    txFrequency,
    rxFrequency,
    diffTxFrequency,
    diffRxFrequency,
    txOpeMode,
    rxOpeMode,
    satelliteMode,
    isSatelliteMode,
    isSatTrackingModeNormal,
    isBeaconMode,
    isBeaconModeAvailable,
    dopplerShiftMode,
    execTxDopplerShiftCorrection,
    execRxDopplerShiftCorrection,
  };
};

export default useTransceiverCtrl;
