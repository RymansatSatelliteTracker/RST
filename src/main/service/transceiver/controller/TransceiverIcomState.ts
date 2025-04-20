/**
 * RSTとICOM無線機の周波数とモードの値と更新状態を保持するクラス
 */
export default class TransceiverIcomState {
  // バンドの状態
  public isMain = true;
  // サテライトモード
  public isSatelliteMode = false;

  // 無線機に設定したい周波数、モード
  private reqRxFreqHz = 0;
  private reqTxFreqHz = 0;
  private reqRxMode = "";
  private reqTxMode = "";

  // 無線機から取得した周波数
  private recvTxFreqHz = 0;
  private recvRxFreqHz = 0;

  // 更新フラグ
  public isTxFreqUpdate = false;
  public isRxFreqUpdate = false;
  public isRxModeUpdate = false;
  public isTxModeUpdate = false;
  public isRecvTxFreqUpdate = false;
  public isRecvRxFreqUpdate = false;

  /**
   * Rx（メインバンド）の周波数、モードが更新されているかを返す
   */
  public isRxUpdate(): boolean {
    return this.isRxFreqUpdate || this.isRxModeUpdate || this.isRecvRxFreqUpdate;
  }

  /**
   * Tx（サブバンド）の周波数、モードが更新されているかを返す
   */
  public isTxUpdate(): boolean {
    return this.isTxFreqUpdate || this.isTxModeUpdate || this.isRecvTxFreqUpdate;
  }

  /**
   * RSTから無線機に設定したいRx周波数をセットする
   */
  public setReqRxFreqHz(freqHz: number): void {
    // 現在保持している値と同一の場合は何もしない
    if (this.reqRxFreqHz === freqHz) {
      return;
    }
    this.reqRxFreqHz = freqHz;
    this.isRxFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTx周波数をセットする
   */
  public setReqTxFreqHz(freq: number): void {
    // 現在保持している値と同一の場合は何もしない
    if (this.reqTxFreqHz === freq) {
      return;
    }
    this.reqTxFreqHz = freq;
    this.isTxFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいRxモードをセットする
   */
  public setReqRxMode(mode: string): void {
    // 現在保持している値と同一の場合は何もしない
    if (this.reqRxMode === mode) {
      return;
    }
    this.reqRxMode = mode;
    this.isRxModeUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTxモードをセットする
   */
  public setReqTxMode(mode: string): void {
    // 現在保持している値と同一の場合は何もしない
    if (this.reqTxMode === mode) {
      return;
    }
    this.reqTxMode = mode;
    this.isTxModeUpdate = true;
  }

  /**
   * 無線機から取得したRx周波数をセットする
   */
  public setRecvRxFreqHz(freq: number): void {
    // 現在保持している値と同一の場合は何もしない
    if (this.recvRxFreqHz === freq) {
      return;
    }
    this.recvRxFreqHz = freq;
    this.isRecvRxFreqUpdate = true;
    // 無線機での周波数変更は片側の変更のみが通知されるため、Tx側の周波数も更新されたものとして、データ取得対象としておく
    this.isRecvTxFreqUpdate = true;
  }

  /**
   * 無線機から取得したTx周波数をセットする
   */
  public setRecvTxFreqHz(freq: number): void {
    // 現在保持している値と同一の場合は何もしない
    if (this.recvTxFreqHz === freq) {
      return;
    }
    this.recvTxFreqHz = freq;
    this.isRecvTxFreqUpdate = true;
    // 無線機での周波数変更は片側の変更のみが通知されるため、Rx側の周波数も更新されたものとして、データ取得対象としておく
    this.isRecvRxFreqUpdate = true;
  }

  /**
   * Rx（メインバンド）の周波数、モードの更新状態をリセットする
   */
  public resetRx(): void {
    this.isRxFreqUpdate = false;
    this.isRxModeUpdate = false;
    this.isRecvRxFreqUpdate = false;
    this.isRecvTxFreqUpdate = false;
  }

  /**
   * Tx（サブバンド）の周波数、モードの更新状態をリセットする
   */
  public resetTx(): void {
    this.reqTxMode = "";
    this.isTxFreqUpdate = false;
    this.isTxModeUpdate = false;
    this.isRecvTxFreqUpdate = false;
    this.isRecvRxFreqUpdate = false;
  }

  /**
   * 周波数、モードの更新状態をリセットする
   */
  public resetAll(): void {
    this.resetRx();
    this.resetTx();
  }

  // Getter
  public getRecvRxFreqHz(): number {
    return this.recvRxFreqHz;
  }
  public getRecvTxFreqHz(): number {
    return this.recvTxFreqHz;
  }
  public getReqRxFreqHz(): number {
    return this.reqRxFreqHz;
  }
  public getReqTxFreqHz(): number {
    return this.reqTxFreqHz;
  }
  public getReqRxMode(): string {
    return this.reqRxMode;
  }
  public getReqTxMode(): string {
    return this.reqTxMode;
  }
}
