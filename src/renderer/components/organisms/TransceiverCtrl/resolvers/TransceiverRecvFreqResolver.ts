import Constant from "@/common/Constant.js";
import { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import { ApiResponse } from "@/common/types/types.js";
import TransceiverUtil from "@/common/util/TransceiverUtil.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import { useStoreAutoState } from "@/renderer/store/useStoreAutoState.js";
import AppRendererLogger from "@/renderer/util/AppRendererLogger.js";
import emitter from "@/renderer/util/EventBus.js";
import { Ref } from "vue";

/**
 * 無線機からの周波数受信時の画面状態
 */
export interface RecvFreqResolverState {
  /** アップリンク周波数 */
  txFrequency: Ref<string>;
  /** ダウンリンク周波数 */
  rxFrequency: Ref<string>;
  /** Tx周波数補正値 */
  txFrequencyAdjustment: Ref<string>;
  /** Rx周波数補正値 */
  rxFrequencyAdjustment: Ref<string>;
  /** Tx基準周波数 */
  txBaseFreq: Ref<number>;
  /** Rx基準周波数 */
  rxBaseFreq: Ref<number>;
}

/**
 * 無線機から受信した周波数を画面状態と基準周波数へ反映するクラス
 */
export default class TransceiverRecvFreqResolver {
  private dopplerCalc: TransceiverDopplerCalc;

  /**
   * @param state - 画面状態のRef群
   * @param autoStore - AutoモードのON/OFF管理ストア
   * @param baseFreqMgr - 基準周波数（補正値なし）管理
   * @param currentDate - 現在日時
   * @param getAutoTrackingIntervalMsec - 自動追尾更新間隔を返す関数
   * @param calcBaseFreqWithAdjust - 補正値反映後の基準周波数算出関数
   * @param getBaseFreqSum - 補正値反映後の基準周波数和を返す関数
   */
  public constructor(
    private state: RecvFreqResolverState,
    private autoStore: ReturnType<typeof useStoreAutoState>,
    private baseFreqMgr: TransceiverBaseFreqMgr,
    private currentDate: Ref<Date>,
    private getAutoTrackingIntervalMsec: () => number,
    private calcBaseFreqWithAdjust: () => void,
    private getBaseFreqSum: () => number
  ) {
    this.dopplerCalc = new TransceiverDopplerCalc();
  }

  /**
   * 無線機から受信した周波数を反映する
   */
  public async applyFromTransceiver(res: ApiResponse<UplinkType | DownlinkType>): Promise<void> {
    if (!res.status) {
      emitter.emit(Constant.GlobalEvent.NOTICE_ERR, I18nUtil.getMsg(res.message));
      return;
    }

    const freqData = res.data;
    if (!freqData) {
      return;
    }

    if ("uplinkHz" in freqData && freqData.uplinkHz != null) {
      await this.applyTxFromTransceiver(freqData.uplinkHz);
      return;
    }

    if ("downlinkHz" in freqData && freqData.downlinkHz != null) {
      await this.applyRxFromTransceiver(freqData.downlinkHz);
    }
  }

  /**
   * 無線機から受信したTx周波数を反映する
   */
  private async applyTxFromTransceiver(recvTxFreq: number): Promise<void> {
    AppRendererLogger.debug(`Tx周波数（無線機→RST） ${recvTxFreq}`);

    const recvTxFreqFmt = TransceiverUtil.formatWithDot(recvTxFreq);
    if (this.state.txFrequency.value === recvTxFreqFmt) {
      this.logSkipBaseFreqUpdate("Tx");
      return;
    }

    this.state.txFrequency.value = recvTxFreqFmt;

    // AutoOff時は基準周波数を再算出しない
    if (!this.autoStore.tranceiverAuto) {
      return;
    }

    const adjustTxFreq = TransceiverUtil.parseNumber(this.state.txFrequencyAdjustment.value);
    const { plainRxBaseFreq, plainTxBaseFreq } = this.baseFreqMgr.getPlainBaseFreqs();
    const { newRxBaseFreq, newTxBaseFreq } = await this.dopplerCalc.calcBaseFreqByShiftedTxFreq(
      plainRxBaseFreq,
      plainTxBaseFreq,
      adjustTxFreq,
      recvTxFreq,
      this.currentDate.value,
      this.getAutoTrackingIntervalMsec()
    );
    this.baseFreqMgr.setPlainBaseFreqs(newRxBaseFreq, newTxBaseFreq);

    this.calcBaseFreqWithAdjust();
    this.logUpdatedBaseFreq();
  }

  /**
   * 無線機から受信したRx周波数を反映する
   */
  private async applyRxFromTransceiver(recvRxFreq: number): Promise<void> {
    AppRendererLogger.debug(`Rx周波数（無線機→RST） ${recvRxFreq}`);

    const recvRxFreqFmt = TransceiverUtil.formatWithDot(recvRxFreq);
    if (this.state.rxFrequency.value === recvRxFreqFmt) {
      this.logSkipBaseFreqUpdate("Rx");
      return;
    }

    this.state.rxFrequency.value = recvRxFreqFmt;

    // AutoOff時は基準周波数を再算出しない
    if (!this.autoStore.tranceiverAuto) {
      return;
    }

    const adjustRxFreq = TransceiverUtil.parseNumber(this.state.rxFrequencyAdjustment.value);
    const { plainRxBaseFreq, plainTxBaseFreq } = this.baseFreqMgr.getPlainBaseFreqs();
    const { newRxBaseFreq, newTxBaseFreq } = await this.dopplerCalc.calcBaseFreqByShiftedRxFreq(
      plainRxBaseFreq,
      plainTxBaseFreq,
      adjustRxFreq,
      recvRxFreq,
      this.currentDate.value,
      this.getAutoTrackingIntervalMsec()
    );
    this.baseFreqMgr.setPlainBaseFreqs(newRxBaseFreq, newTxBaseFreq);

    this.calcBaseFreqWithAdjust();
    this.logUpdatedBaseFreq();
  }

  /**
   * 基準周波数更新をスキップした理由をログ出力する
   */
  private logSkipBaseFreqUpdate(freqLabel: "Tx" | "Rx"): void {
    AppRendererLogger.debug(`RSTの${freqLabel}周波数と同一のため基準周波数の更新をスキップします。`);
    AppRendererLogger.debug(
      `基準周波数 Rx:${this.state.rxBaseFreq.value} Tx:${this.state.txBaseFreq.value} Sum:${this.getBaseFreqSum()}`
    );
  }

  /**
   * 基準周波数更新後の値をログ出力する
   */
  private logUpdatedBaseFreq(): void {
    const plainBaseFreqs = this.baseFreqMgr.getPlainBaseFreqs();

    AppRendererLogger.debug(
      `基準周波数（更新） Rx:${this.state.rxBaseFreq.value} Tx:${this.state.txBaseFreq.value} Sum:${this.getBaseFreqSum()}`
    );
    AppRendererLogger.debug(
      `補正なし Rx:${plainBaseFreqs.plainRxBaseFreq} Tx:${plainBaseFreqs.plainTxBaseFreq}` +
        ` Sum:${plainBaseFreqs.plainRxBaseFreq + plainBaseFreqs.plainTxBaseFreq}`
    );
  }
}
