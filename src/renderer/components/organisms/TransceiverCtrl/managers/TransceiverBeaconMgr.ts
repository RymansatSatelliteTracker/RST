import TransceiverUtil from "@/common/util/TransceiverUtil.js";

/**
 * Beacon ON 前の状態（Beacon OFF 時の戻り先）
 */
export interface BeaconSavedState {
  /** Beacon ON 前の固定モード */
  dopplerShiftMode: string;
  /** Beacon ON 前の画面のTx周波数（送信固定の固定値、Auto OFF 時の戻り先） */
  txFrequency: string;
  /** Beacon ON 前の画面のRx周波数（受信固定の固定値、Auto OFF 時の戻り先） */
  rxFrequency: string;
  /** Beacon ON 前のRx運用モード */
  rxOpeMode: string;
  /** Beacon ON 前のTx基準周波数（補正値なし。Auto ON 時のみ有効） */
  plainTxBaseFreq: number;
  /** Beacon ON 前のRx基準周波数（補正値なし。Auto ON 時のみ有効） */
  plainRxBaseFreq: number;
}

/**
 * Beacon ON 前の状態と、ビーコンのRx基準周波数を管理する
 * MEMO: ビーコンは送受信周波数の和（Sum）の関係にないため、通常の基準周波数（TransceiverBaseFreqMgr）とは別に持つ
 */
export default class TransceiverBeaconMgr {
  // Beacon ON 前の状態
  private saved: BeaconSavedState | null = null;

  // ビーコンのRx基準周波数（補正値なし、ドップラーシフトなし）
  private beaconRxBaseFreq = 0;

  /**
   * Beacon ON 前の状態を記録する
   * @param state Beacon ON 前の状態
   */
  public save(state: BeaconSavedState): void {
    this.saved = { ...state };
  }

  /**
   * Beacon ON 前の状態を取得する
   * @returns Beacon ON 前の状態（未記録の場合はnull）
   */
  public getSaved(): BeaconSavedState | null {
    return this.saved ? { ...this.saved } : null;
  }

  /**
   * ビーコンのRx基準周波数を設定する
   * @param hz ビーコンのRx基準周波数
   */
  public setBeaconRxBaseFreq(hz: number): void {
    this.beaconRxBaseFreq = hz;
  }

  /**
   * ビーコンのRx基準周波数を取得する
   * @returns ビーコンのRx基準周波数
   */
  public getBeaconRxBaseFreq(): number {
    return this.beaconRxBaseFreq;
  }

  /**
   * 画面のホイール操作による変化量をビーコンのRx基準周波数に反映する
   * MEMO: 通常のRx基準周波数への反映（rxBaseFreq - diff）と同じ向きで反映する
   * @param diff 周波数の変化量
   */
  public shiftBeaconRxBaseFreq(diff: number): void {
    this.beaconRxBaseFreq = TransceiverUtil.subtractFrequencies(this.beaconRxBaseFreq, diff);
  }

  /**
   * 記録をすべて破棄する
   */
  public clear(): void {
    this.saved = null;
    this.beaconRxBaseFreq = 0;
  }
}
