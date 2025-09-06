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
  public isTxSendFreqUpdate = false;
  public isRxSendFreqUpdate = false;
  public isRxSendModeUpdate = false;
  public isTxSendModeUpdate = false;
  public isTxRecvFreqUpdate = false;
  public isRxRecvFreqUpdate = false;

  /**
   * Rx（メインバンド）の周波数、モードが更新されているかを返す
   */
  public isRxUpdate(): boolean {
    return this.isRxSendFreqUpdate || this.isRxSendModeUpdate || this.isRxRecvFreqUpdate;
  }

  /**
   * Tx（サブバンド）の周波数、モードが更新されているかを返す
   */
  public isTxUpdate(): boolean {
    return this.isTxSendFreqUpdate || this.isTxSendModeUpdate || this.isTxRecvFreqUpdate;
  }

  /**
   * RSTから無線機に設定したいRx周波数をセットする
   */
  public setReqRxFreqHz(freqHz: number): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (this.reqRxFreqHz === freqHz) {
      return;
    }
    this.reqRxFreqHz = freqHz;
    this.isRxSendFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTx周波数をセットする
   */
  public setReqTxFreqHz(freq: number): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (this.reqTxFreqHz === freq) {
      return;
    }
    this.reqTxFreqHz = freq;
    this.isTxSendFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいRxモードをセットする
   */
  public setReqRxMode(mode: string): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (this.reqRxMode === mode) {
      return;
    }
    this.reqRxMode = mode;
    this.isRxSendModeUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTxモードをセットする
   */
  public setReqTxMode(mode: string): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (this.reqTxMode === mode) {
      return;
    }
    this.reqTxMode = mode;
    this.isTxSendModeUpdate = true;
  }

  /**
   * 無線機から取得したRx周波数をセットする
   */
  public setRecvRxFreqHz(freq: number): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (this.recvRxFreqHz === freq) {
      return;
    }
    this.recvRxFreqHz = freq;
    this.isRxRecvFreqUpdate = true;
    // 無線機での周波数変更は片側の変更のみが通知されるため、Tx側の周波数も更新されたものとして、データ取得対象としておく
    this.isTxRecvFreqUpdate = true;
  }

  /**
   * 無線機から取得したTx周波数をセットする
   */
  public setRecvTxFreqHz(freq: number): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (this.recvTxFreqHz === freq) {
      return;
    }
    this.recvTxFreqHz = freq;
    this.isTxRecvFreqUpdate = true;
    // 無線機での周波数変更は片側の変更のみが通知されるため、Rx側の周波数も更新されたものとして、データ取得対象としておく
    this.isRxRecvFreqUpdate = true;
  }

  /**
   * Rx（メインバンド）の周波数、モードの更新状態をリセットする
   */
  public resetRx(): void {
    this.isRxSendFreqUpdate = false;
    this.isRxSendModeUpdate = false;
    this.isRxRecvFreqUpdate = false;
    this.isTxRecvFreqUpdate = false;
  }

  /**
   * Tx（サブバンド）の周波数、モードの更新状態をリセットする
   */
  public resetTx(): void {
    this.reqTxMode = "";
    this.isTxSendFreqUpdate = false;
    this.isTxSendModeUpdate = false;
    this.isTxRecvFreqUpdate = false;
    this.isRxRecvFreqUpdate = false;
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
