// Rx周波数の読み取りに失敗した場合に再試行する上限回数（超えた場合は保留を解除し、RSTからの要求を再開する）
const MAX_RX_READ_RETRY_COUNT = 3;

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

  // サブバンド（Tx）のトランシーブ受信後、連動して変化したRx周波数を無線機から読み取るまでの間はtrue
  public isRxReadPending = false;
  private rxReadFailCount = 0;

  // 現在の運用モード
  public currentTxOpeMode = "";
  public currentRxOpeMode = "";
  // 現在のデータモード（運用モードとセットで画面側へ送るために状態を保持する必要がある）
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
   * @param isForce 強制設定（同一周波数でも強制的に無線機へ送信する場合はtrueを指定する）
   */
  public setReqRxFreqHz(freqHz: number, isForce: boolean = false): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (!isForce && this.reqRxFreqHz === freqHz) {
      return;
    }
    this.reqRxFreqHz = freqHz;
    this.isReqRxFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTx周波数をセットする
   * @param isForce 強制設定（同一周波数でも強制的に無線機へ送信する場合はtrueを指定する）
   */
  public setReqTxFreqHz(freq: number, isForce: boolean = false): void {
    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (!isForce && this.reqTxFreqHz === freq) {
      return;
    }
    this.reqTxFreqHz = freq;
    this.isReqTxFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいRx運用モード、データモードをセットする
   * @param isForce 強制設定（同一モードでも強制的に設定する場合はtrueを指定する）
   */
  public setReqRxMode(mode: string | null, dataMode: string, isForce: boolean = false): void {
    if (!mode) {
      return;
    }

    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (!isForce && this.reqRxMode === mode && this.reqRxDataMode === dataMode) {
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
   * @param isForce 強制設定（同一モードでも強制的に設定する場合はtrueを指定する）
   */
  public setReqTxMode(mode: string | null, dataMode: string, isForce: boolean = false): void {
    if (!mode) {
      return;
    }

    // 現在保持している値と同一の場合は何もしない（不要なバンド切り替えを抑止する）
    if (!isForce && this.reqTxMode === mode && this.reqTxDataMode === dataMode) {
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
  }

  /**
   * Tx（サブバンド）の周波数、モードの更新状態をリセットする
   */
  public resetTx(): void {
    this.reqTxMode = "";
    this.isReqTxFreqUpdate = false;
    this.isReqTxModeUpdate = false;
    this.isRecvTxFreqUpdate = false;
  }

  /**
   * Rx周波数の読み取り待ちを開始する
   * 無線機側のTxダイヤル操作に連動してRxが変化しているため、RST側の古い周波数要求を破棄し、Rxの読み取りを予約する。
   * 要求値も未設定に戻し、解除後に同じ値が再要求されても重複判定でスキップされないようにする。
   */
  public startRxReadPending(): void {
    this.isRxReadPending = true;
    this.rxReadFailCount = 0;
    this.isReqTxFreqUpdate = false;
    this.isReqRxFreqUpdate = false;
    this.reqTxFreqHz = 0;
    this.reqRxFreqHz = 0;
    // 受信したTx周波数が前回と同一でも、Rxの読み取りが必ず行われるようにする
    this.isRecvRxFreqUpdate = true;
  }

  /**
   * Rx周波数の読み取り待ちを解除する
   */
  public endRxReadPending(): void {
    this.isRxReadPending = false;
    this.rxReadFailCount = 0;
  }

  /**
   * Rx周波数の読み取り失敗を記録する
   * 上限回数に達するまでは読み取り待ちを維持し、次の周期で再試行する。上限に達した場合は、RSTからの要求を
   * 破棄し続けないよう読み取り待ちを解除する。
   * @returns 上限に達して読み取り待ちを解除した場合はtrue
   */
  public failRxRead(): boolean {
    if (!this.isRxReadPending) {
      return false;
    }

    // 再試行のため、Rxの読み取りを再度予約する
    this.isRecvRxFreqUpdate = true;
    this.rxReadFailCount += 1;
    if (this.rxReadFailCount < MAX_RX_READ_RETRY_COUNT) {
      return false;
    }

    this.endRxReadPending();
    return true;
  }

  /**
   * 周波数、モードの更新状態をリセットする
   */
  public resetAll(): void {
    this.resetRx();
    this.resetTx();
    this.endRxReadPending();
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
