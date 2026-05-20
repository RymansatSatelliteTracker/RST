import { AppConfigModel } from "@/common/model/AppConfigModel.js";
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

  /**
   * 無線機で変更されたTx周波数を元に、補正値なしのRx・Tx基準周波数を再算出する
   * @param plainRxBaseFreq 現在のRx基準周波数（補正値なし）
   * @param plainTxBaseFreq 現在のTx基準周波数（補正値なし）
   * @param txAdjustFreq Tx周波数補正値
   * @param txFreq 無線機から受信したTx周波数（補正値・ドップラーシフト適用済み）
   * @param currentDate 現在日時
   * @param intervalMs 計算に使用する時間間隔（ミリ秒）
   * @returns 再算出されたRx・Tx基準周波数（FrequencyTrackService未取得の場合は両方0）
   */
  public async calcBaseFreqByShiftedTxFreq(
    plainRxBaseFreq: number,
    plainTxBaseFreq: number,
    txAdjustFreq: number,
    txFreq: number,
    currentDate: Date,
    intervalMs: number
  ): Promise<{ newRxBaseFreq: number; newTxBaseFreq: number }> {
    const frequencyTrackService = ActiveSatServiceHub.getInstance().getFrequencyTrackService();
    if (!frequencyTrackService) {
      return { newRxBaseFreq: 0, newTxBaseFreq: 0 };
    }

    // Txのドップラーファクターを計算する
    const txDopplerFactor = await frequencyTrackService.calcUplinkDopplerFactor(currentDate, intervalMs);

    // 逆ヘテロダイン方式でRx・Tx基準周波数を再算出する
    const { rxBaseFreq, txBaseFreq } = frequencyTrackService.calcInvHeteroBaseFreqByTxFreq(
      plainRxBaseFreq + plainTxBaseFreq,
      txAdjustFreq,
      txFreq,
      txDopplerFactor
    );

    return { newRxBaseFreq: rxBaseFreq, newTxBaseFreq: txBaseFreq };
  }
}
