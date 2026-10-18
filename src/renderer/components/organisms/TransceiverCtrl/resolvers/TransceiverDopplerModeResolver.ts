import Constant from "@/common/Constant.js";

/**
 * ドップラーシフト補正の要否を表すフラグ
 */
export interface DopplerShiftCorrectionFlags {
  /** Txをドップラー補正するか */
  execTxDopplerShiftCorrection: boolean;
  /** Rxをドップラー補正するか */
  execRxDopplerShiftCorrection: boolean;
}

/**
 * ドップラーシフトモード（衛星固定/受信固定/送信固定）から、Tx/Rxそれぞれの
 * ドップラーシフト補正要否を解決するクラス
 */
export default class TransceiverDopplerModeResolver {
  /**
   * ドップラーシフトモードから補正要否フラグを解決する
   * - 衛星固定：Tx/Rx双方を補正する
   * - 受信固定：Txのみ補正する（Rxは選択中衛星の周波数に固定）
   * - 送信固定：Rxのみ補正する（Txは選択中衛星の周波数に固定）
   */
  public resolveCorrectionFlags(dopplerShiftMode: string): DopplerShiftCorrectionFlags {
    return {
      execTxDopplerShiftCorrection:
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_RX,
      execRxDopplerShiftCorrection:
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_SAT ||
        dopplerShiftMode === Constant.Transceiver.DopplerShiftMode.FIXED_TX,
    };
  }
}
