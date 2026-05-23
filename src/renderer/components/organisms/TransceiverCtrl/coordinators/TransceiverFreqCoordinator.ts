import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import ApiTransceiver from "@/renderer/api/ApiTransceiver.js";
import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import type { Ref } from "vue";

/**
 * Coordinatorが操作する周波数関連のリアクティブ状態
 */
export interface FreqCoordinatorState {
  /** アップリンク周波数 */
  txFrequency: Ref<string>;
  /** ダウンリンク周波数 */
  rxFrequency: Ref<string>;
  /** 補正値反映済みのTx基準周波数 */
  txBaseFreq: Ref<number>;
  /** 補正値反映済みのRx基準周波数 */
  rxBaseFreq: Ref<number>;
}

/**
 * 周波数の初期化・送信・ドップラー補正更新を扱うクラス
 */
export default class TransceiverFreqCoordinator {
  private dopplerCalc: TransceiverDopplerCalc;

  public constructor(
    private state: FreqCoordinatorState,
    private currentDate: Ref<Date>
  ) {
    this.dopplerCalc = new TransceiverDopplerCalc();
  }

  /**
   * 無線機周波数を初期化する
   */
  public async initFreq(): Promise<void> {
    const config = await ApiAppConfig.getAppConfig();
    this.state.txFrequency.value = config.transceiver.txFrequency;
    this.state.rxFrequency.value = config.transceiver.rxFrequency;
  }

  /**
   * アップリンク周波数を無線機へ送信する
   */
  public async sendTxFreq(newTxFrequency: number): Promise<void> {
    await ApiTransceiver.setTransceiverFrequency({
      uplinkHz: newTxFrequency,
      uplinkMode: "",
    });
  }

  /**
   * ダウンリンク周波数を無線機へ送信する
   */
  public async sendRxFreq(newRxFreq: number): Promise<void> {
    await ApiTransceiver.setTransceiverFrequency({
      downlinkHz: newRxFreq,
      downlinkMode: "",
    });
  }

  /**
   * アップリンク周波数をドップラーシフト補正して更新する
   */
  public async updateTxFreqByInvertingHeterodyne(intervalMs: number): Promise<void> {
    const newTxFreq = await this.dopplerCalc.calcNewTxFreqWithDoppler(
      this.currentDate.value,
      this.state.txBaseFreq.value,
      intervalMs
    );
    if (newTxFreq !== null) {
      this.state.txFrequency.value = newTxFreq;
    }
  }

  /**
   * ダウンリンク周波数をドップラーシフト補正して更新する
   */
  public async updateRxFreqWithDopplerShift(intervalMs: number): Promise<void> {
    const newRxFreq = await this.dopplerCalc.calcNewRxFreqWithDoppler(
      this.currentDate.value,
      this.state.rxBaseFreq.value,
      intervalMs
    );
    if (newRxFreq !== null) {
      this.state.rxFrequency.value = newRxFreq;
    }
  }

  /**
   * 人工衛星がドップラーシフト有効範囲内にいるか判定する
   */
  public async isWithinDopplerShiftActiveRange(appConfig: AppConfigModel): Promise<boolean> {
    return await this.dopplerCalc.isWithinDopplerShiftActiveRange(appConfig, this.currentDate.value);
  }
}
