import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes";
import { ApiResponse } from "@/common/types/types";
import TransceiverUtil from "@/common/util/TransceiverUtil";
import ApiAppConfig from "@/renderer/api/ApiAppConfig";
import ApiTransceiver from "@/renderer/api/ApiTransceiver";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
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
  // アップリンク周波数の変化量
  const diffTxFrequency = ref<number>(0.0);
  // ダウンリンク周波数の変化量
  const diffRxFrequency = ref<number>(0.0);
  // アップリンク運用モード
  const txOpeMode = ref<string>(Constant.Transceiver.OpeMode.UNSET);
  // アップリンクUSBモード判定
  const isTxUsbMode = ref<boolean>(true);
  // アップリンクFMモード判定
  const isTxAmMode = ref<boolean>(true);
  // ダウンリンク運用モード
  const rxOpeMode = ref<string>(Constant.Transceiver.OpeMode.UNSET);
  // ダウンリンクUSBモード判定
  const isRxUsbMode = ref<boolean>(true);
  // ダウンリンクFMモード判定
  const isRxAmMode = ref<boolean>(true);
  // サテライトモード判定
  const isSatelliteMode = ref<boolean>(false);
  // サテライトモードのトラッキングモード
  const isSatTrackingModeNormal = ref<boolean>(true);
  // Autoモード移行前のTx周波数を保持する変数
  const savedTxFrequency = ref<string>("");
  // Autoモード移行前のRx周波数を保持する変数
  const savedRxFrequency = ref<string>("");
  // ドップラーシフトのアップリンク基準周波数
  const dopplerTxBaseFrequency = ref<number>(0.0);
  // ドップラーシフトのダウンリンク基準周波数
  const dopplerRxBaseFrequency = ref<number>(0.0);

  // AutoモードのOnOff管理
  const autoStore = useStoreAutoState();

  // 周波数の更新タイマ
  let timerId: NodeJS.Timeout | null = null;

  // 周波数の更新インターバル（ミリ秒）
  let autoTrackingIntervalMsec = 1000;

  /**
   * 表示中の衛星グループが変更された場合のイベントハンドラ
   */
  async function onChangeSatGrp() {
    if (autoStore.tranceiverAuto) {
      await startAutoMode();
    }
  }

  /**
   * Autoモード中はアクティブ衛星で周波数/運用モードを更新する
   */
  async function startAutoMode(): Promise<boolean> {
    // 無線機が未設定の場合はトーストを表示して処理終了
    const appConfig = await ApiAppConfig.getAppConfig();
    if (CommonUtil.isEmpty(appConfig.transceiver.transceiverId)) {
      emitter.emit(Constant.GlobalEvent.NOTICE_INFO, I18nUtil.getMsg(I18nMsgs.SYSTEM_YET_TRANSCEIVER_CONFIG));
      return false;
    }

    // Autoモード移行前の周波数を保持する
    savedTxFrequency.value = txFrequency.value;
    savedRxFrequency.value = rxFrequency.value;

    // アクティブ衛星の周波数/運用モードを取得
    const transceiverSetting = await ActiveSatServiceHub.getInstance().getActiveSatTransceiverSetting();
    if (transceiverSetting.uplink && transceiverSetting.uplink.uplinkHz) {
      // アップリンク周波数/運用モードをアクティブ衛星の設定で更新する
      txFrequency.value = TransceiverUtil.formatWithDot(transceiverSetting.uplink.uplinkHz);
      txOpeMode.value = transceiverSetting.uplink.uplinkMode;

      // 運用モードによってUSB/LSBモード判定、AM/FMモード判定を更新する
      await updateTxModeFlags(rxOpeMode.value);
    }
    if (transceiverSetting.downlink && transceiverSetting.downlink.downlinkHz) {
      // ダウンリンク周波数/運用モードをアクティブ衛星の設定で更新する
      rxFrequency.value = TransceiverUtil.formatWithDot(transceiverSetting.downlink.downlinkHz);
      rxOpeMode.value = transceiverSetting.downlink.downlinkMode;

      // 運用モードによってUSB/LSBモード判定、AM/FMモード判定を更新する
      await updateRxModeFlags(rxOpeMode.value);
    }

    // Auto開始をメイン側に連携する
    await ApiTransceiver.initAutoOn(
      TransceiverUtil.parseNumber(txFrequency.value),
      TransceiverUtil.parseNumber(rxFrequency.value)
    );

    // ドップラーシフトの基準周波数を設定する
    dopplerTxBaseFrequency.value = TransceiverUtil.parseNumber(txFrequency.value);
    dopplerRxBaseFrequency.value = TransceiverUtil.parseNumber(rxFrequency.value);

    // 周波数の更新インターバルを取得
    autoTrackingIntervalMsec = parseFloat(appConfig.transceiver.autoTrackingIntervalSec) * 1000;

    // 周波数の更新を停止（停止されていない場合があるので、複数のタイマが発動することをガード）
    stopUpdateFreq();

    // 更新インターバルごとに周波数の更新する
    timerId = setInterval(async () => {
      updateFreq();
    }, autoTrackingIntervalMsec);

    return true;
  }

  /**
   * Autoモードを停止する
   */
  async function stopAutoMode() {
    if (!stopUpdateFreq()) {
      return;
    }

    // Autoモード移行前の周波数を復元する
    txFrequency.value = savedTxFrequency.value;
    rxFrequency.value = savedRxFrequency.value;

    // 運用モードによってUSB/LSBモード判定、AM/FMモード判定を更新する
    await updateTxModeFlags(txOpeMode.value);
    await updateRxModeFlags(rxOpeMode.value);
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
   * アップリンク運用モードのUSB/LSB、AM/FM判定フラグを更新する
   * @param {string} txMode アップリンク運用モード
   */
  async function updateTxModeFlags(txMode: string) {
    if (txMode === Constant.Transceiver.OpeMode.UNSET || CommonUtil.isEmpty(txMode)) {
      isTxUsbMode.value = true;
    } else if (txMode === Constant.Transceiver.OpeMode.USB) {
      isTxUsbMode.value = true;
    } else if (txMode === Constant.Transceiver.OpeMode.LSB) {
      isTxUsbMode.value = false;
    }

    if (txMode === Constant.Transceiver.OpeMode.UNSET || CommonUtil.isEmpty(txMode)) {
      isTxAmMode.value = true;
    } else if (txMode === Constant.Transceiver.OpeMode.AM) {
      isTxAmMode.value = true;
    } else if (txMode === Constant.Transceiver.OpeMode.FM) {
      isTxAmMode.value = false;
    }
  }

  /**
   * ダウンリンク運用モードのUSB/LSB、AM/FM判定フラグを更新する
   * @param {string} rxMode ダウンリンク運用モード
   */
  async function updateRxModeFlags(rxMode: string) {
    if (rxMode === Constant.Transceiver.OpeMode.UNSET || CommonUtil.isEmpty(rxMode)) {
      isRxUsbMode.value = true;
    } else if (rxMode === Constant.Transceiver.OpeMode.USB) {
      isRxUsbMode.value = true;
    } else if (rxMode === Constant.Transceiver.OpeMode.LSB) {
      isRxUsbMode.value = false;
    }

    if (rxMode === Constant.Transceiver.OpeMode.UNSET || CommonUtil.isEmpty(rxMode)) {
      isRxAmMode.value = true;
    } else if (rxMode === Constant.Transceiver.OpeMode.AM) {
      isRxAmMode.value = true;
    } else if (rxMode === Constant.Transceiver.OpeMode.FM) {
      isRxAmMode.value = false;
    }
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
  async function updateTxFrequencyWithDopplerShift(intervalMs: number) {
    const frequencyTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!frequencyTrackService) {
      return;
    }

    // ドップラーファクターを計算する
    const txDopplerFactor = await frequencyTrackService.calcUplinkDopplerFactor(currentDate.value, intervalMs);
    // 無線機のアップリンク周波数を更新する
    await updateTxFrequency(dopplerTxBaseFrequency.value * txDopplerFactor);
    // 画面のアップリンク周波数を更新する
    txFrequency.value = TransceiverUtil.formatWithDot(dopplerTxBaseFrequency.value * txDopplerFactor);
    // AppMainLogger.debug(
    //   "ドップラーシフト補正値(Tx): " +
    //     TransceiverUtil.subtractFrequencies(
    //       dopplerTxBaseFrequency.value * txDopplerFactor * 1000,
    //       dopplerTxBaseFrequency.value * 1000
    //     ).toFixed(3) +
    //     "kHz"
    // );
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
    // 無線機のダウンリンク周波数を更新する
    await updateRxFrequency(dopplerRxBaseFrequency.value * rxDopplerFactor);
    // 画面のダウンリンク周波数を更新する
    rxFrequency.value = TransceiverUtil.formatWithDot(dopplerRxBaseFrequency.value * rxDopplerFactor);
    // AppMainLogger.debug(
    //   "ドップラーシフト補正値(Rx): " +
    //     TransceiverUtil.subtractFrequencies(
    //       dopplerRxBaseFrequency.value * rxDopplerFactor * 1000,
    //       dopplerRxBaseFrequency.value * 1000
    //     ).toFixed(3) +
    //     "kHz"
    // );
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

  // サテライトモード設定が変更された場合にAPIを呼び出す
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
    dopplerTxBaseFrequency.value = TransceiverUtil.subtractFrequencies(
      dopplerTxBaseFrequency.value,
      diffTxFrequency.value
    );
    // 周波数の変化量を初期化する
    diffTxFrequency.value = 0.0;
  });

  // アップリンクの運用モードが変更された場合にAPIを呼び出す
  watch(txOpeMode, async (newTxOpeMode) => {
    await ApiTransceiver.setTransceiverMode({
      uplinkHz: null,
      uplinkMode: newTxOpeMode,
    });

    // 運用モードによってUSB/LSBモード判定、AM/FMモード判定を更新する
    await updateTxModeFlags(newTxOpeMode);
  });

  // サテライトモードがONで、個別でダウンリンク周波数が変更された場合にAPIを呼び出す
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
    dopplerRxBaseFrequency.value = TransceiverUtil.subtractFrequencies(
      dopplerRxBaseFrequency.value,
      diffRxFrequency.value
    );

    if (!isSatelliteMode.value) {
      // サテライトモードがOFFの場合は中断する
      diffRxFrequency.value = 0.0;
      return;
    }

    if (isSatTrackingModeNormal.value) {
      // トラッキングモードがNORMALの場合、アップリンク周波数とダウンリンク周波数の変化量を同一方向に同じステップで変化させる
      txFrequency.value = TransceiverUtil.formatWithDot(
        TransceiverUtil.subtractFrequencies(TransceiverUtil.parseNumber(txFrequency.value), diffRxFrequency.value)
      );
      // ドップラーシフトの基準周波数に画面で操作した変化量を反映する
      dopplerTxBaseFrequency.value = TransceiverUtil.subtractFrequencies(
        dopplerTxBaseFrequency.value,
        diffRxFrequency.value
      );
    } else {
      // トラッキングモードがREVERSEの場合、アップリンク周波数とダウンリンク周波数の変化量を逆方向に同じステップで変化させる
      txFrequency.value = TransceiverUtil.formatWithDot(
        TransceiverUtil.addFrequencies(TransceiverUtil.parseNumber(txFrequency.value), diffRxFrequency.value)
      );
      // ドップラーシフトの基準周波数に画面で操作した変化量を反映する
      dopplerTxBaseFrequency.value = TransceiverUtil.addFrequencies(
        dopplerTxBaseFrequency.value,
        diffRxFrequency.value
      );
    }
    // 周波数の変化量を初期化する
    diffRxFrequency.value = 0.0;
  });

  // サテライトモードがONで、個別でダウンリンクの運用モードが変更された場合にAPIを呼び出す
  watch(rxOpeMode, async (newRxOpeMode) => {
    if (!isSatelliteMode.value) {
      return;
    }

    await ApiTransceiver.setTransceiverMode({
      downlinkHz: null,
      downlinkMode: newRxOpeMode,
    });
    // 運用モードによってUSB/LSBモード判定、AM/FMモード判定を更新する
    await updateRxModeFlags(newRxOpeMode);
  });

  /**
   * 周波数の更新を行う
   */
  async function updateFreq() {
    if (!autoStore.tranceiverAuto) {
      // Autoモード中でない場合は何もしない
      return;
    }

    // memo: Auto時は、手動の日時更新は無効にしているので、以下処理はデッドコードと思われる（コメントアウトした）
    // if (newDate.getTime() - oldDate.getTime() < 0 || newDate.getTime() - oldDate.getTime() >= 1500) {
    //   // 手動による日時操作があった場合は何もしない
    //   return;
    // }

    // 人工衛星がドップラーシフトが有効となる範囲にいるか判定する
    const isActive = await isWithinDopplerShiftActiveRange();
    if (!isActive) {
      return;
    }

    // アップリンク周波数をドップラーシフト補正して更新する
    await updateTxFrequencyWithDopplerShift(autoTrackingIntervalMsec);
    if (isSatelliteMode.value) {
      // サテライトモードがONの場合、ダウンリンク周波数をドップラーシフト補正して更新する
      await updateRxFrequencyWithDopplerShift(autoTrackingIntervalMsec);
    }
  }

  onMounted(async () => {
    // 無線機の設定を初期化する
    await initTransceiver();

    // 初期表示時にAppConfigから無線機周波数を取得する
    await initFrequency();

    // 表示中の衛星グループが変更された場合のコールバックを設定
    await onChangeSatGrp();
    ActiveSatServiceHub.getInstance().addOnChangeActiveSat(onChangeSatGrp);

    // 無線機の周波数を取得し、txFrequency,rxFrequencyを更新する
    ApiTransceiver.onChangeTransceiverFrequency(async (res: ApiResponse<UplinkType | DownlinkType>) => {
      if (!res.status) {
        emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
        return;
      }

      const frequency = res.data;
      if (!frequency) return;

      if ("uplinkHz" in frequency && frequency.uplinkHz) {
        // アップリンク周波数を更新する
        txFrequency.value = TransceiverUtil.formatWithDot(frequency.uplinkHz);
        // ドップラーシフトの基準周波数を更新する
        dopplerTxBaseFrequency.value = frequency.uplinkHz;
      } else if ("downlinkHz" in frequency && frequency.downlinkHz) {
        // ダウンリンク周波数を更新する
        rxFrequency.value = TransceiverUtil.formatWithDot(frequency.downlinkHz);
        // ドップラーシフトの基準周波数を更新する
        dopplerRxBaseFrequency.value = frequency.downlinkHz;
      }
    });

    // 無線機の運用モードを取得し、txOpeMode,rxOpeModeを更新する
    ApiTransceiver.onChangeTransceiverMode(async (res: ApiResponse<UplinkType | DownlinkType>) => {
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
          // 運用モードによってUSB/LSBモード判定、AM/FMモード判定を更新する
          await updateTxModeFlags(txOpeMode.value);
        } else {
          // 運用モードが取得できない場合はUNSETにする
          txOpeMode.value = Constant.Transceiver.OpeMode.UNSET;
        }
      } else if ("downlinkMode" in opeMode && opeMode.downlinkMode) {
        if (!CommonUtil.isEmpty(opeMode.downlinkMode)) {
          // ダウンリンク運用モードを更新する
          rxOpeMode.value = opeMode.downlinkMode;
          // 運用モードによってUSB/LSBモード判定、AM/FMモード判定を更新する
          await updateRxModeFlags(rxOpeMode.value);
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

  return {
    startAutoMode,
    stopAutoMode,
    txFrequency,
    rxFrequency,
    diffTxFrequency,
    diffRxFrequency,
    txOpeMode,
    rxOpeMode,
    isTxUsbMode,
    isTxAmMode,
    isRxUsbMode,
    isRxAmMode,
    isSatelliteMode,
    isSatTrackingModeNormal,
  };
};

export default useTransceiverCtrl;
