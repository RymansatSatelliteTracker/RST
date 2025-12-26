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
  private reqRxMode = ""; // Rx運用モード
  private reqTxMode = ""; // Tx運用モード
  private reqRxDataMode = ""; // Rxデータモード
  private reqTxDataMode = ""; // Txデータモード

  // 無線機から取得した周波数
  private recvTxFreqHz = 0;
  private recvRxFreqHz = 0;

  // 更新フラグ
  public isReqTxFreqUpdate = false;
  public isReqRxFreqUpdate = false;
  public isReqTxModeUpdate = false;
  public isReqRxModeUpdate = false;
  public isRecvTxFreqUpdate = false;
  public isRecvRxFreqUpdate = false;

  // 現在の運用モード
  public currentTxOpeMode = "";
  public currentRxOpeMode = "";
  // 現在のデータモード
  public currentTxDataMode = "";
  public currentRxDataMode = "";

  /**
   * Rx（メインバンド）の周波数、モードが更新されているかを返す
   */
  public isRxUpdate(): boolean {
    return this.isReqRxFreqUpdate || this.isReqRxModeUpdate || this.isRecvRxFreqUpdate;
  }

  /**
   * Tx（サブバンド）の周波数、モードが更新されているかを返す
   */
  public isTxUpdate(): boolean {
    return this.isReqTxFreqUpdate || this.isReqTxModeUpdate || this.isRecvTxFreqUpdate;
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
    this.isReqRxFreqUpdate = true;
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
    this.isReqTxFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいRx運用モード、データモードをセットする
   */
  public setReqRxMode(mode: string | null, dataMode: string, isForce: boolean = false): void {
    if (!mode) {
      return;
    }

    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (!isForce && this.reqRxMode === mode) {
      return;
    }

    // 設定したいモードを保存する
    this.reqRxMode = mode;
    this.reqRxDataMode = dataMode;

    // 現在のモードも更新しておく
    this.currentRxOpeMode = mode;
    this.currentRxDataMode = dataMode;

    this.isReqRxModeUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTx運用モード、データモードをセットする
   */
  public setReqTxMode(mode: string | null, dataMode: string, isForce: boolean = false): void {
    if (!mode) {
      return;
    }

    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (!isForce && this.reqTxMode === mode) {
      return;
    }

    // 設定したいモードを保存する
    this.reqTxMode = mode;
    this.reqTxDataMode = dataMode;

    // 現在のモードも更新しておく
    this.currentTxOpeMode = mode;
    this.currentTxDataMode = dataMode;

    this.isReqTxModeUpdate = true;
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
    this.isRecvRxFreqUpdate = true;
    // 無線機での周波数変更は片側の変更のみが通知されるため、Tx側の周波数も更新されたものとして、データ取得対象としておく
    this.isRecvTxFreqUpdate = true;
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
    this.isRecvTxFreqUpdate = true;
    // 無線機での周波数変更は片側の変更のみが通知されるため、Rx側の周波数も更新されたものとして、データ取得対象としておく
    this.isRecvRxFreqUpdate = true;
  }

  /**
   * Rx（メインバンド）の周波数、モードの更新状態をリセットする
   */
  public resetRx(): void {
    this.isReqRxFreqUpdate = false;
    this.isReqRxModeUpdate = false;
    this.isRecvRxFreqUpdate = false;
    this.isRecvTxFreqUpdate = false;
  }

  /**
   * Tx（サブバンド）の周波数、モードの更新状態をリセットする
   */
  public resetTx(): void {
    this.reqTxMode = "";
    this.isReqTxFreqUpdate = false;
    this.isReqTxModeUpdate = false;
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
  public getReqRxDataMode(): string {
    return this.reqRxDataMode;
  }
  public getReqTxDataMode(): string {
    return this.reqTxDataMode;
  }
}
