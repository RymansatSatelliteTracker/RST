import Constant from "@/common/Constant";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";
import TransceiverUtil from "@/common/util/TransceiverUtil";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/TransceiverBaseFreqMgr";
import TransceiverFreqCoordinator from "@/renderer/components/organisms/TransceiverCtrl/TransceiverFreqCoordinator";
import TransceiverModeCoordinator from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeCoordinator";
import TransceiverModeSettingResolver from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeSettingResolver";
import TransceiverModeStateResolver from "@/renderer/components/organisms/TransceiverCtrl/TransceiverModeStateResolver";
import TransceiverOpeModeResolver from "@/renderer/components/organisms/TransceiverCtrl/TransceiverOpeModeResolver";
import TransceiverRecvFreqResolver from "@/renderer/components/organisms/TransceiverCtrl/TransceiverRecvFreqResolver";
import { useModeStateManager } from "@/renderer/components/organisms/TransceiverCtrl/useSatelliteModeStateManager";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
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
  // Tx周波数補正値
  const txFrequencyAdjustment = ref<string>("+000.000");
  // Rx周波数補正値
  const rxFrequencyAdjustment = ref<string>("+000.000");
  // Tx、Rx基準周波数（補正値反映）
  const txBaseFreq = ref<number>(0.0);
  const rxBaseFreq = ref<number>(0.0);
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
  // ビーコンモード
  const isBeaconMode = ref<boolean>(false);
  // ビーコンモードが利用可能かどうか
  const isBeaconModeAvailable = ref<boolean>(false);
  // BeaconモードのTx運用モード
  const savedTxOpeMode = ref<string>("");
  // BeaconモードのRx運用モード
  const savedRxOpeMode = ref<string>("");
  // ドップラーシフトモード（衛星固定、受信固定、送信固定）
  const dopplerShiftMode = ref<string>(Constant.Transceiver.DopplerShiftMode.FIXED_SAT);
  // Txをドップラー補正するか
  const execTxDopplerShiftCorrection = ref<boolean>(false);
  // Rxをドップラー補正するか
  const execRxDopplerShiftCorrection = ref<boolean>(false);

  // AutoモードのOnOff管理
  const autoStore = useStoreAutoState();
  // サテライトモード切替時の状態保存/復元管理
  const { save, load } = useModeStateManager();
  const modeStateResolver = new TransceiverModeStateResolver(
    {
      rxFrequency,
      rxOpeMode,
      txOpeMode,
      isSatTrackingModeNormal,
      isSatelliteMode,
    },
    autoStore,
    save,
    load
  );
  // 無線機からの運用モード受信値を画面状態へ反映
  const opeModeResolver = new TransceiverOpeModeResolver({
    txOpeMode,
    rxOpeMode,
  });
  // 基準周波数（補正値なし）の管理
  const baseFreqMgr = new TransceiverBaseFreqMgr();
  // モードごとの周波数・運用モード解決
  const modeSettingResolver = new TransceiverModeSettingResolver();
  // 周波数の初期化・送信・ドップラー補正更新
  const freqCoordinator = new TransceiverFreqCoordinator(
    {
      txFrequency,
      rxFrequency,
      txBaseFreq,
      rxBaseFreq,
    },
    currentDate
  );
  // 無線機からの周波数受信値を画面状態と基準周波数へ反映
  const recvFreqResolver = new TransceiverRecvFreqResolver(
    {
      txFrequency,
      rxFrequency,
      txFrequencyAdjustment,
      rxFrequencyAdjustment,
      txBaseFreq,
      rxBaseFreq,
    },
    autoStore,
    baseFreqMgr,
    currentDate,
    () => coordinator.autoTrackingIntervalMsec,
    calcBaseFreqWithAdjust,
    getBaseFreqSum
  );

  // ドップラーシフト待機フラグ
  let isDopplerShiftWaiting = ref<boolean>(false);
  // ドップラーシフト周波数送信の待機タイマ
  let dopplerTimerId: NodeJS.Timeout | null = null;

  /**
   * 周波数更新インターバルを開始する
   * @param {number} intervalMs 時間間隔[単位：ミリ秒]
   */
  function startUpdateFreqInterval(intervalMs: number) {
    coordinator.setTimerId(
      setInterval(async () => {
        await updateFreq();
      }, intervalMs)
    );
  }

  // Auto/Beacon/Satellite モード遷移シーケンスの管理
  const coordinator = new TransceiverModeCoordinator(
    {
      txFrequency,
      rxFrequency,
      txOpeMode,
      rxOpeMode,
      satelliteMode,
      isSatelliteMode,
      isSatTrackingModeNormal,
      savedTxFrequency,
      savedRxFrequency,
      savedTxOpeMode,
      savedRxOpeMode,
      isBeaconMode,
      execTxDopplerShiftCorrection,
      execRxDopplerShiftCorrection,
      txFrequencyAdjustment,
      rxFrequencyAdjustment,
    },
    autoStore,
    modeSettingResolver,
    baseFreqMgr,
    calcBaseFreqWithAdjust,
    startUpdateFreqInterval
  );

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    // 衛星が変更された場合は補正値をリセットする（NoradIdで判定する）
    if (coordinator.syncCurrentNoradIdFromActiveSat()) {
      resetFreqAdj();
    }

    isBeaconModeAvailable.value = await confirmBeaconModeAvailable();

    // Autoモード中の場合は、新しい衛星であらためてAutoモードを開始する
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

    return modeSettingResolver.canUseBeaconMode(transceiverSetting);
  }

  /**
   * Autoモード中はアクティブ衛星で周波数/運用モードを更新する
   */
  async function startAutoMode(): Promise<boolean> {
    return coordinator.startAutoMode();
  }

  /**
   * Autoモードを停止する
   */
  async function stopAutoMode() {
    return coordinator.stopAutoMode();
  }

  /**
   * ビーコンモードを開始する
   */
  async function startBeaconMode() {
    return coordinator.startBeaconMode();
  }

  /**
   * ビーコンモードを停止する
   */
  async function stopBeaconMode() {
    return coordinator.stopBeaconMode();
  }

  /**
   * 無線機の設定を初期化する
   */
  async function initTransceiver() {
    // 無線機のサテライトモードを初期化する
    await ApiTransceiver.setSatelliteMode(false);
  }

  // ──────────────────────────────────────────────
  // モード遷移 watch
  // ──────────────────────────────────────────────

  /**
   * ビーコンモード設定が変更された場合
   */
  watch(isBeaconMode, async (newIsBeaconMode) => {
    if (newIsBeaconMode) {
      // ビーコンモード開始
      await startBeaconMode();
    } else {
      // ビーコンモード終了
      await stopBeaconMode();
    }
  });

  /**
   * サテライトモード設定が変更された場合に、isSatelliteModeを更新する
   */
  watch(
    satelliteMode,
    (newMode, oldMode) => {
      modeStateResolver.onSatelliteModeChanged(newMode, oldMode);
    },
    { immediate: true }
  );

  /**
   * サテライトモード設定が変更された場合
   * TODO: サテライトモードON/OFFのAPIにしているがSPLITが入るのでモード自体を渡すべき？
   */
  watch(isSatelliteMode, async (newIsSatelliteMode) => {
    // 無線機にサテライトモードを設定する
    await ApiTransceiver.setSatelliteMode(newIsSatelliteMode);
  });

  // ──────────────────────────────────────────────
  // Tx I/O送信 watch
  // ──────────────────────────────────────────────

  /**
   * Tx周波数が変更された場合
   */
  watch(txFrequency, async (newFrequency) => {
    await freqCoordinator.sendTxFreq(TransceiverUtil.parseNumber(newFrequency));
  });

  /**
   * 画面でTx補正値が変更された場合
   */
  watch(txFrequencyAdjustment, async (newFreq) => {
    // 基準周波数を更新する
    calcBaseFreqWithAdjust();

    await freqCoordinator.sendTxFreq(TransceiverUtil.parseNumber(txFrequency.value));
  });

  /**
   * 画面でTx周波数が変更された場合
   */
  watch(diffTxFrequency, async (newDiffFrequency) => {
    if (newDiffFrequency === 0.0) {
      // 変化量が0の場合は何もしない
      return;
    }

    // ドップラーシフト基準周波数に画面で変更された変化量を反映する
    txBaseFreq.value = TransceiverUtil.subtractFrequencies(txBaseFreq.value, diffTxFrequency.value);
    // 周波数の変化量を初期化する
    diffTxFrequency.value = 0.0;
  });

  /**
   * Tx運用モードが変更された場合
   */
  watch(txOpeMode, async (newTxOpeMode) => {
    // 無線機にTx運用モードを設定する
    await ApiTransceiver.setTransceiverMode({
      uplinkHz: null,
      uplinkMode: newTxOpeMode,
    });
  });

  // ──────────────────────────────────────────────
  // Rx I/O送信 watch
  // ──────────────────────────────────────────────

  /**
   * Rx周波数が変更された場合
   * TODO: SPLITモードの場合のサーバ処理がないので、今はSPLITモードの時は何もしない
   */
  watch(rxFrequency, async (newFreq) => {
    // サテライトモードがOFFの場合はなにもしない
    if (!isSatelliteMode.value) {
      return;
    }

    await freqCoordinator.sendRxFreq(TransceiverUtil.parseNumber(newFreq));
  });

  /**
   * 画面でRx補正値が変更された場合に、補正値を反映した周波数を無線機に送信する
   */
  watch(rxFrequencyAdjustment, async (newFreq) => {
    // サテライトモードがOFFの場合はなにもしない
    if (!isSatelliteMode.value) {
      return;
    }

    // 基準周波数を更新する
    calcBaseFreqWithAdjust();

    await freqCoordinator.sendRxFreq(TransceiverUtil.parseNumber(rxFrequency.value));
  });

  /**
   * 画面でRx周波数が変更された場合
   */
  watch(diffRxFrequency, async (newDiffFrequency) => {
    // 変化量が0の場合は何もしない
    if (newDiffFrequency === 0.0) {
      return;
    }

    // ドップラーシフト基準周波数に画面で操作した変化量を反映する
    rxBaseFreq.value = TransceiverUtil.subtractFrequencies(rxBaseFreq.value, diffRxFrequency.value);

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
      txBaseFreq.value = TransceiverUtil.subtractFrequencies(txBaseFreq.value, diffRxFrequency.value);
    } else {
      // トラッキングモードがREVERSEの場合、アップリンク周波数とダウンリンク周波数の変化量を逆方向に同じステップで変化させる
      txFrequency.value = TransceiverUtil.formatWithDot(
        TransceiverUtil.addFrequencies(TransceiverUtil.parseNumber(txFrequency.value), diffRxFrequency.value)
      );
      // ドップラーシフトの基準周波数に画面で操作した変化量を反映する
      txBaseFreq.value = TransceiverUtil.addFrequencies(txBaseFreq.value, diffRxFrequency.value);
    }
    // 周波数の変化量を初期化する
    diffRxFrequency.value = 0.0;
  });

  /**
   * Rx運用モードが変更された場合
   * TODO: SPLITモードの場合のサーバ処理がないので、今はSPLITモードの時も何もしない
   */
  watch(rxOpeMode, async (newRxOpeMode) => {
    // サテライトモードがOFFの場合はなにもしない
    if (!isSatelliteMode.value) {
      return;
    }

    // 無線機にRx運用モードを設定する
    await ApiTransceiver.setTransceiverMode({
      downlinkHz: null,
      downlinkMode: newRxOpeMode,
    });
  });

  // ──────────────────────────────────────────────
  // Tx/Rx 同期 watch
  // ──────────────────────────────────────────────

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
    if (!(await freqCoordinator.isWithinDopplerShiftActiveRange())) {
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
      await freqCoordinator.updateRxFreqWithDopplerShift(coordinator.autoTrackingIntervalMsec);
    }

    // アップリンク周波数をドップラーシフト補正して更新する
    if (execTxDopplerShiftCorrection.value) {
      await freqCoordinator.updateTxFreqByInvertingHeterodyne(coordinator.autoTrackingIntervalMsec);
    }

    // 以下は、コメントアウトしても良い。2025年11月時点ではデバッグログとして出力しておく。
    // デバッグログ
    const nowRxFreq = TransceiverUtil.parseNumber(rxFrequency.value);
    const nowTxFreq = TransceiverUtil.parseNumber(txFrequency.value);
    const adjustRxFreq = TransceiverUtil.parseNumber(rxFrequencyAdjustment.value);
    const adjustTxFreq = TransceiverUtil.parseNumber(txFrequencyAdjustment.value);
    const shiftRx = rxBaseFreq.value - nowRxFreq;
    const shiftTx = txBaseFreq.value - nowTxFreq;
    AppRendererLogger.debug(
      `ドップラーシフト補正後:Rx=${nowRxFreq} Tx=${nowTxFreq}` +
        ` シフト値：Rx=${shiftRx} Tx=${shiftTx}` +
        ` 補正値：Rx=${adjustRxFreq} Tx=${adjustTxFreq}` +
        ` 基準周波数:${getBaseFreqSum()}=${rxBaseFreq.value}+${txBaseFreq.value}`
    );
  }

  /**
   * ドップラーシフトの待機を設定する
   */
  async function setupDopplerShiftWaiting(res: ApiResponse<boolean>) {
    if (!res.data) {
      return;
    }

    // Autoモード中でない場合は何もしない
    // MEMO: 無線機で周波数を変更した直後にAutoOnとした場合に、その周波数を元に一定時間待機後の基準周波数の更新が走ってしまうため、
    //       AutoOnでない場合は処理を終了する
    if (!autoStore.tranceiverAuto) {
      return;
    }

    // ドップラーシフト待機タイマが既に存在する場合はクリアする
    if (dopplerTimerId) {
      clearTimeout(dopplerTimerId);
    }

    // ドップラーシフト待機フラグを有効にする
    isDopplerShiftWaiting.value = true;

    // 一定時間待機後にドップラーシフトの基準周波数を変更する
    dopplerTimerId = setTimeout(async () => {
      // ドップラーシフト待機フラグを無効に戻す
      isDopplerShiftWaiting.value = false;

      AppRendererLogger.info(`ダイヤル操作N秒経過したため待機を解除しました`);
    }, Constant.Transceiver.TRANSCEIVE_WAIT_MS);
  }

  onMounted(async () => {
    // 無線機の設定を初期化する
    await initTransceiver();

    // 初期表示時にAppConfigから無線機周波数を取得する
    await freqCoordinator.initFreq();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    await onChangeSatGrp();
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 無線機からの周波数データ(トランシーブ)受信があった場合はドップラーシフトを待機する
    ApiTransceiver.dopplerShiftWaitingCallback(async (res: ApiResponse<boolean>) => {
      await setupDopplerShiftWaiting(res);
    });

    // 無線機で周波数が変更された場合
    ApiTransceiver.onChangeTransceiverFrequency(async (res: ApiResponse<UplinkType | DownlinkType>) => {
      // Tx、またはRxの周波数をRST側に反映する
      await recvFreqResolver.applyFromTransceiver(res);
    });

    // 無線機の運用モードのイベントハンドラ
    // 受信した無線機の運用モードでtxOpeMode,rxOpeModeを更新する
    ApiTransceiver.onChangeTransceiverMode((res: ApiResponse<UplinkType | DownlinkType>) => {
      // 受信処理スキップ状態の場合は処理を終了する（AutoOn処理中のモード変更などにおける無線機からの不要なデータ受信を無視する）
      if (coordinator.isRecvProcSkip) {
        return;
      }

      opeModeResolver.applyFromTransceiver(res);
    });

    // 無線機周波数保存イベントを受けて設定ファイルに現在の無線機周波数を保存する
    ApiTransceiver.onSaveTransceiverFrequency(async () => {
      const config = await ApiAppConfig.getAppConfig();
      config.transceiver.txFrequency = txFrequency.value;
      config.transceiver.rxFrequency = rxFrequency.value;
      await ApiAppConfig.storeAppConfig(config);
    });
  });

  /**
   * 現在の衛星の送受信周波数の和を取得する（逆ヘテロダインの計算用、補正値が反映されたもの）
   */
  function getBaseFreqSum(): number {
    return baseFreqSum.value;
  }

  /**
   * 基準周波数に補正値を反映する
   */
  function calcBaseFreqWithAdjust() {
    // 画面で設定された補正値を反映した周波数を基準周波数に設定
    const calculated = baseFreqMgr.calcBaseFreqWithAdjust(txFrequencyAdjustment.value, rxFrequencyAdjustment.value);
    txBaseFreq.value = calculated.txBaseFreq;
    rxBaseFreq.value = calculated.rxBaseFreq;
    baseFreqSum.value = calculated.baseFreqSum;
  }

  /**
   * 周波数の補正値をリセットする
   */
  function resetFreqAdj() {
    txFrequencyAdjustment.value = "+000.000";
    rxFrequencyAdjustment.value = "+000.000";
  }

  return {
    startAutoMode,
    stopAutoMode,
    txFrequency,
    rxFrequency,
    diffTxFrequency,
    diffRxFrequency,
    txFrequencyAdjustment,
    rxFrequencyAdjustment,
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
