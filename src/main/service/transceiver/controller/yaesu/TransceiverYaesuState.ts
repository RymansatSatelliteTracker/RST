// RSTが無線機へ設定した値と同一の自動通知（AI）を、無線機側の操作と誤認しないために無視する時間（ミリ秒）
const ECHO_IGNORE_MS = 500;

/**
 * RSTとYAESU無線機の周波数とモードの値と更新状態を保持するクラス
 * （ICOM用の TransceiverIcomState から、YAESUでは不要な概念（メイン/サブ切替、データモード、Rx読み取り待ち）を除いたもの）
 */
export default class TransceiverYaesuState {
  // サテライトモード（SPLIT）
  public isSatelliteMode = false;

  // 無線機に設定したい周波数、モード
  private reqRxFreqHz = 0;
  private reqTxFreqHz = 0;
  private reqRxMode = "";
  private reqTxMode = "";

  // 更新フラグ
  public isReqRxFreqUpdate = false;
  public isReqTxFreqUpdate = false;
  public isReqRxModeUpdate = false;
  public isReqTxModeUpdate = false;

  // Tx周波数を、送信間引き（前回送信値との差の判定）によらず、必ず送信するか
  private isReqTxFreqForce = false;
  // 無線機へ最後に送信したTx周波数（0は未送信）
  private lastSentTxFreqHz = 0;

  // 無線機から取得したRx周波数（0は未取得）
  private recvRxFreqHz = 0;
  // 現在の運用モード（RSTが保持しているもの）
  public currentRxMode = "";
  public currentTxMode = "";

  // RSTが無線機へ最後に送信したRxの周波数・モードと、その送信時刻（自動通知の除外判定用）
  private sentRxFreqHz = 0;
  private sentRxMode = "";
  private sentRxAt = 0;

  /**
   * Rxの要求（周波数、モード）があるかを返す
   */
  public isRxUpdate(): boolean {
    return this.isReqRxFreqUpdate || this.isReqRxModeUpdate;
  }

  /**
   * Txの要求（周波数、モード）があるかを返す
   */
  public isTxUpdate(): boolean {
    return this.isReqTxFreqUpdate || this.isReqTxModeUpdate;
  }

  /**
   * RSTから無線機に設定したいRx周波数をセットする
   * @param isForce 強制設定（同一周波数でも強制的に無線機へ送信する場合はtrueを指定する）
   */
  public setReqRxFreqHz(freqHz: number, isForce: boolean = false): void {
    if (!isForce && this.reqRxFreqHz === freqHz) {
      return;
    }
    this.reqRxFreqHz = freqHz;
    this.isReqRxFreqUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTx周波数をセットする
   * @param isForce 強制設定（同一周波数でも、送信間引きによらず強制的に無線機へ送信する場合はtrueを指定する）
   */
  public setReqTxFreqHz(freqHz: number, isForce: boolean = false): void {
    if (!isForce && this.reqTxFreqHz === freqHz) {
      return;
    }
    this.reqTxFreqHz = freqHz;
    this.isReqTxFreqUpdate = true;
    if (isForce) {
      this.isReqTxFreqForce = true;
    }
  }

  /**
   * RSTから無線機に設定したいRx運用モードをセットする
   * @param isForce 強制設定（同一モードでも強制的に設定する場合はtrueを指定する）
   */
  public setReqRxMode(mode: string | null, isForce: boolean = false): void {
    if (!mode) {
      return;
    }
    if (!isForce && this.reqRxMode === mode) {
      return;
    }
    this.reqRxMode = mode;
    // 現在のモードも更新しておく
    this.currentRxMode = mode;
    this.isReqRxModeUpdate = true;
  }

  /**
   * RSTから無線機に設定したいTx運用モードをセットする
   * Txのモードが変わった場合は、Tx周波数も必ず送信する（モードによって送信間引きの閾値が異なるため）。
   * @param isForce 強制設定（同一モードでも強制的に設定する場合はtrueを指定する）
   */
  public setReqTxMode(mode: string | null, isForce: boolean = false): void {
    if (!mode) {
      return;
    }
    if (!isForce && this.reqTxMode === mode) {
      return;
    }
    this.reqTxMode = mode;
    this.currentTxMode = mode;
    this.isReqTxModeUpdate = true;
    this.lastSentTxFreqHz = 0;
  }

  /**
   * Tx周波数を、今回、無線機へ送信すべきかを返す
   * 以下の場合は送信する：強制設定、前回送信値が未設定、前回送信値との差が閾値以上。
   * @param thresholdHz 送信間引きの閾値（Hz）
   */
  public shouldSendTxFreq(thresholdHz: number): boolean {
    if (this.isReqTxFreqForce || this.lastSentTxFreqHz === 0) {
      return true;
    }
    return Math.abs(this.reqTxFreqHz - this.lastSentTxFreqHz) >= thresholdHz;
  }

  /**
   * Tx周波数を無線機へ送信したことを記録する
   */
  public markTxFreqSent(freqHz: number): void {
    this.lastSentTxFreqHz = freqHz;
    this.isReqTxFreqForce = false;
    this.isReqTxFreqUpdate = false;
  }

  /**
   * 最後に送信したTx周波数の記録を消去する（次回のTx周波数を、送信間引きによらず必ず送信させる）
   */
  public resetLastSentTxFreqHz(): void {
    this.lastSentTxFreqHz = 0;
  }

  /**
   * Tx周波数の要求を、送信せずに取り下げる（送信間引き、または送信しない値のため）
   */
  public skipTxFreq(): void {
    this.isReqTxFreqUpdate = false;
  }

  /**
   * 無線機から取得したRx周波数をセットする
   */
  public setRecvRxFreqHz(freqHz: number): void {
    this.recvRxFreqHz = freqHz;
  }

  /**
   * RSTが無線機へRxの周波数・モードを送信したことを記録する（自動通知の除外判定用）
   */
  public markRxSent(freqHz: number | null, mode: string | null): void {
    this.sentRxAt = Date.now();
    if (freqHz !== null) {
      this.sentRxFreqHz = freqHz;
    }
    if (mode !== null) {
      this.sentRxMode = mode;
    }
  }

  /**
   * 指定のRx周波数が、RSTが直近に送信した値と同一か（自動通知の除外対象か）を返す
   */
  public isEchoOfSentRxFreq(freqHz: number): boolean {
    return Date.now() - this.sentRxAt < ECHO_IGNORE_MS && this.sentRxFreqHz === freqHz;
  }

  /**
   * 指定のRx運用モードが、RSTが直近に送信した値と同一か（自動通知の除外対象か）を返す
   */
  public isEchoOfSentRxMode(mode: string): boolean {
    return Date.now() - this.sentRxAt < ECHO_IGNORE_MS && this.sentRxMode === mode;
  }

  /**
   * 周波数、モードの更新状態を含む、全ての状態をリセットする
   */
  public resetAll(): void {
    this.isSatelliteMode = false;
    this.reqRxFreqHz = 0;
    this.reqTxFreqHz = 0;
    this.reqRxMode = "";
    this.reqTxMode = "";
    this.isReqRxFreqUpdate = false;
    this.isReqTxFreqUpdate = false;
    this.isReqRxModeUpdate = false;
    this.isReqTxModeUpdate = false;
    this.isReqTxFreqForce = false;
    this.lastSentTxFreqHz = 0;
    this.recvRxFreqHz = 0;
    this.currentRxMode = "";
    this.currentTxMode = "";
    this.sentRxFreqHz = 0;
    this.sentRxMode = "";
    this.sentRxAt = 0;
  }

  // Getter
  public getRecvRxFreqHz(): number {
    return this.recvRxFreqHz;
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
  public getLastSentTxFreqHz(): number {
    return this.lastSentTxFreqHz;
  }
}
