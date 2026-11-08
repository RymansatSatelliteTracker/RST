import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import TransceiverUtil from "@/common/util/TransceiverUtil.js";
import AutoTrackingHelper from "@/renderer/common/util/AutoTrackingHelper.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";

/**
 * ドップラーシフト補正に関する計算を担うクラス
 * ActiveSatServiceHub 経由で FrequencyTrackService を取得し、
 * 計算結果を値として返す（Refへの書き込みは行わない）
 */
export default class TransceiverDopplerCalc {
  /**
   * 人工衛星がドップラーシフト補正を有効にする範囲内にいるか判定する
   * @param currentDate 現在日時
   * @returns 有効範囲内の場合はtrue
   */
  public async isWithinDopplerShiftActiveRange(appConfig: AppConfigModel, currentDate: Date): Promise<boolean> {
    return await AutoTrackingHelper.isTransceiverTrackingTimeRange(appConfig, currentDate);
  }

  /**
   * アップリンク周波数をドップラーシフト補正して算出する
   * 逆ヘテロダイン方式でTxドップラーファクターを適用する
   * @param currentDate 現在日時
   * @param txBaseFreq 補正値反映済みのTx基準周波数
   * @param intervalMs 計算に使用する時間間隔（ミリ秒）
   * @returns 補正後のTx周波数文字列（FrequencyTrackService未取得の場合はnull）
   */
  public async calcNewTxFreqWithDoppler(
    currentDate: Date,
    txBaseFreq: number,
    intervalMs: number
  ): Promise<string | null> {
    const freqTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!freqTrackService) {
      return null;
    }

    // ドップラーファクターをTx基準周波数に適用してアップリンク周波数を算出する
    const txDopplerFactor = await freqTrackService.calcUplinkDopplerFactor(currentDate, intervalMs);
    const txFreq = txBaseFreq * txDopplerFactor;

    return TransceiverUtil.formatWithDot(txFreq);
  }

  /**
   * ダウンリンク周波数をドップラーシフト補正して算出する
   * @param currentDate 現在日時
   * @param rxBaseFreq 補正値反映済みのRx基準周波数
   * @param intervalMs 計算に使用する時間間隔（ミリ秒）
   * @returns 補正後のRx周波数文字列（FrequencyTrackService未取得の場合はnull）
   */
  public async calcNewRxFreqWithDoppler(
    currentDate: Date,
    rxBaseFreq: number,
    intervalMs: number
  ): Promise<string | null> {
    const freqTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!freqTrackService) {
      return null;
    }

    // ドップラーファクターを計算してRx基準周波数に適用する
    const rxDopplerFactor = await freqTrackService.calcDownlinkDopplerFactor(currentDate, intervalMs);
    const rxFreq = rxBaseFreq * rxDopplerFactor;

    return TransceiverUtil.formatWithDot(rxFreq);
  }

  /**
   * ドップラーシフト済みのRx周波数から、ドップラーシフトを除いたRx基準周波数を算出する
   * ビーコンのRx基準周波数のように、送受信周波数の和（Sum）の関係にない基準周波数の算出に使用する
   * @param rxFreq ドップラーシフト済みのRx周波数（無線機から受信した値など）
   * @param currentDate 現在日時
   * @param intervalMs 計算に使用する時間間隔（ミリ秒）
   * @returns Rx基準周波数（FrequencyTrackService未取得の場合はnull）
   */
  public async calcRxBaseFreqByShiftedRxFreq(
    rxFreq: number,
    currentDate: Date,
    intervalMs: number
  ): Promise<number | null> {
    const freqTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!freqTrackService) {
      return null;
    }

    // 下りドップラーファクターで割り戻して基準周波数を求める
    const rxDopplerFactor = await freqTrackService.calcDownlinkDopplerFactor(currentDate, intervalMs);
    return rxFreq / rxDopplerFactor;
  }

  /**
   * 受信固定モード用：固定Rx周波数を維持するためのアップリンク周波数を算出する
   * 固定Rxから下りドップラー分を割り戻してRx基準周波数を求め、Sum維持でTx基準周波数を再導出し、
   * Txドップラーファクターを適用する（下りのドップラー変化分も見越してTxを動かす）
   * 算出した基準周波数は一時値であり、基準周波数の管理には書き戻さない
   * @param plainRxBaseFreq Rx基準周波数（補正値なし）
   * @param plainTxBaseFreq Tx基準周波数（補正値なし）
   * @param rxAdjustFreq Rx周波数補正値
   * @param txAdjustFreq Tx周波数補正値
   * @param fixedRxFreq 固定しているRx周波数
   * @param currentDate 現在日時
   * @param intervalMs 計算に使用する時間間隔（ミリ秒）
   * @returns Tx周波数文字列（FrequencyTrackService未取得の場合はnull）
   */
  public async calcTxFreqKeepingRxFixed(
    plainRxBaseFreq: number,
    plainTxBaseFreq: number,
    rxAdjustFreq: number,
    txAdjustFreq: number,
    fixedRxFreq: number,
    currentDate: Date,
    intervalMs: number
  ): Promise<string | null> {
    const freqTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!freqTrackService) {
      return null;
    }

    const rxDopplerFactor = await freqTrackService.calcDownlinkDopplerFactor(currentDate, intervalMs);
    const { txBaseFreq } = freqTrackService.calcInvHeteroBaseFreqByRxFreq(
      plainRxBaseFreq + plainTxBaseFreq,
      rxAdjustFreq,
      fixedRxFreq,
      rxDopplerFactor
    );

    const txDopplerFactor = await freqTrackService.calcUplinkDopplerFactor(currentDate, intervalMs);
    return TransceiverUtil.formatWithDot((txBaseFreq + txAdjustFreq) * txDopplerFactor);
  }

  /**
   * 送信固定モード用：固定Tx周波数を維持するためのダウンリンク周波数を算出する
   * 固定Txから上りドップラー分を割り戻してTx基準周波数を求め、Sum維持でRx基準周波数を再導出し、
   * Rxドップラーファクターを適用する（上りのドップラー変化分も加味してRxを動かす）
   * 算出した基準周波数は一時値であり、基準周波数の管理には書き戻さない
   * @param plainRxBaseFreq Rx基準周波数（補正値なし）
   * @param plainTxBaseFreq Tx基準周波数（補正値なし）
   * @param rxAdjustFreq Rx周波数補正値
   * @param txAdjustFreq Tx周波数補正値
   * @param fixedTxFreq 固定しているTx周波数
   * @param currentDate 現在日時
   * @param intervalMs 計算に使用する時間間隔（ミリ秒）
   * @returns Rx周波数文字列（FrequencyTrackService未取得の場合はnull）
   */
  public async calcRxFreqKeepingTxFixed(
    plainRxBaseFreq: number,
    plainTxBaseFreq: number,
    rxAdjustFreq: number,
    txAdjustFreq: number,
    fixedTxFreq: number,
    currentDate: Date,
    intervalMs: number
  ): Promise<string | null> {
    const freqTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!freqTrackService) {
      return null;
    }

    const txDopplerFactor = await freqTrackService.calcUplinkDopplerFactor(currentDate, intervalMs);
    const { rxBaseFreq } = freqTrackService.calcInvHeteroBaseFreqByTxFreq(
      plainRxBaseFreq + plainTxBaseFreq,
      txAdjustFreq,
      fixedTxFreq,
      txDopplerFactor
    );

    const rxDopplerFactor = await freqTrackService.calcDownlinkDopplerFactor(currentDate, intervalMs);
    return TransceiverUtil.formatWithDot((rxBaseFreq + rxAdjustFreq) * rxDopplerFactor);
  }

  /**
   * 無線機で変更されたRx周波数を元に、補正値なしのRx・Tx基準周波数を再算出する
   * @param plainRxBaseFreq 現在のRx基準周波数（補正値なし）
   * @param plainTxBaseFreq 現在のTx基準周波数（補正値なし）
   * @param rxAdjustFreq Rx周波数補正値
   * @param rxFreq 無線機から受信したRx周波数（補正値・ドップラーシフト適用済み）
   * @param currentDate 現在日時
   * @param intervalMs 計算に使用する時間間隔（ミリ秒）
   * @returns 再算出されたRx・Tx基準周波数（FrequencyTrackService未取得の場合は両方0）
   */
  public async calcBaseFreqByShiftedRxFreq(
    plainRxBaseFreq: number,
    plainTxBaseFreq: number,
    rxAdjustFreq: number,
    rxFreq: number,
    currentDate: Date,
    intervalMs: number
  ): Promise<{ newRxBaseFreq: number; newTxBaseFreq: number }> {
    const frequencyTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!frequencyTrackService) {
      return { newRxBaseFreq: 0, newTxBaseFreq: 0 };
    }

    // Rxのドップラーファクターを計算する
    const rxDopplerFactor = await frequencyTrackService.calcDownlinkDopplerFactor(currentDate, intervalMs);

    // 逆ヘテロダイン方式でRx・Tx基準周波数を再算出する
    const { rxBaseFreq, txBaseFreq } = frequencyTrackService.calcInvHeteroBaseFreqByRxFreq(
      plainRxBaseFreq + plainTxBaseFreq,
      rxAdjustFreq,
      rxFreq,
      rxDopplerFactor
    );

    return { newRxBaseFreq: rxBaseFreq, newTxBaseFreq: txBaseFreq };
  }
}
