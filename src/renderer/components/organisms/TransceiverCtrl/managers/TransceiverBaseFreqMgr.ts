import TransceiverUtil from "@/common/util/TransceiverUtil";

/**
 * 無線機制御で使用する基準周波数（補正値なし）を管理する
 */
export default class TransceiverBaseFreqMgr {
  // Tx基準周波数（補正値なし）
  private plainTxBaseFreq = 0;

  // Rx基準周波数（補正値なし）
  private plainRxBaseFreq = 0;

  /**
   * 補正値なしのTx/Rx基準周波数を現在の画面周波数で更新する
   * @param txFreq 画面表示中のアップリンク周波数文字列
   * @param rxFreq 画面表示中のダウンリンク周波数文字列
   */
  public updatePlainBaseFreq(txFreq: string, rxFreq: string): void {
    // 文字列形式の周波数を数値に変換して保持する
    this.plainTxBaseFreq = TransceiverUtil.parseNumber(txFreq);
    this.plainRxBaseFreq = TransceiverUtil.parseNumber(rxFreq);
  }

  /**
   * 補正値なしのTx/Rx基準周波数を直接設定する
   * 無線機からの受信周波数を元に再算出した際に使用する
   * @param plainRxBaseFreq 新しいRx基準周波数（補正値なし）
   * @param plainTxBaseFreq 新しいTx基準周波数（補正値なし）
   */
  public setPlainBaseFreqs(plainRxBaseFreq: number, plainTxBaseFreq: number): void {
    this.plainRxBaseFreq = plainRxBaseFreq;
    this.plainTxBaseFreq = plainTxBaseFreq;
  }

  /**
   * 補正値なしのTx/Rx基準周波数を取得する
   * @returns Rx・Tx基準周波数のオブジェクト（補正値なし）
   */
  public getPlainBaseFreqs(): { plainRxBaseFreq: number; plainTxBaseFreq: number } {
    return {
      plainRxBaseFreq: this.plainRxBaseFreq,
      plainTxBaseFreq: this.plainTxBaseFreq,
    };
  }

  /**
   * 補正値なしの送受信基準周波数の和を取得する
   * 逆ヘテロダイン計算の入力値として使用する
   * @returns Tx基準周波数 + Rx基準周波数（補正値なし）
   */
  public getPlainBaseFreqSum(): number {
    return this.plainTxBaseFreq + this.plainRxBaseFreq;
  }

  /**
   * 補正値を反映した基準周波数を算出する
   * ドップラーシフト補正の乗算基準として使用する
   * @param txFrequencyAdjustment 画面で設定されたTx周波数補正値文字列
   * @param rxFrequencyAdjustment 画面で設定されたRx周波数補正値文字列
   * @returns 補正後のTx・Rx基準周波数と和
   */
  public calcBaseFreqWithAdjust(
    txFrequencyAdjustment: string,
    rxFrequencyAdjustment: string
  ): { txBaseFreq: number; rxBaseFreq: number; baseFreqSum: number } {
    // 補正値なし基準周波数に画面の補正値を加算して補正後の基準周波数を算出する
    const txBaseFreq = this.plainTxBaseFreq + TransceiverUtil.parseNumber(txFrequencyAdjustment);
    const rxBaseFreq = this.plainRxBaseFreq + TransceiverUtil.parseNumber(rxFrequencyAdjustment);

    return {
      txBaseFreq,
      rxBaseFreq,
      // 逆ヘテロダイン計算では送受信周波数の和が一定であることを利用するため、和も保持する
      baseFreqSum: txBaseFreq + rxBaseFreq,
    };
  }
}
