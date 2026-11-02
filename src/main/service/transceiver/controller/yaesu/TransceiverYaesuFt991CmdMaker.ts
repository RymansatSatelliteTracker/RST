import Constant from "@/common/Constant.js";

// FT-991が周波数を設定できる範囲（Hz）（範囲外の値は、無線機側で無効になる）
const MIN_FREQ_HZ = 30000;
const MAX_FREQ_HZ = 470000000;

/**
 * FT-991のコマンド生成クラス
 * コマンドは、英字2文字＋固定桁数の数字パラメータ＋終端（;）のASCII文字列。
 * （FT-991 CAT Operation Manual のコマンドテーブルに基づく）
 */
export default class TransceiverYaesuFt991CmdMaker {
  /**
   * 周波数が、FT-991で設定できる範囲内かを返す
   */
  public static isFreqInRange(freqHz: number): boolean {
    return Number.isFinite(freqHz) && MIN_FREQ_HZ <= freqHz && freqHz <= MAX_FREQ_HZ;
  }

  /**
   * VFO-Aの周波数の設定コマンド（FA）を返す
   */
  public makeSetFreqA(freqHz: number): Uint8Array {
    return this.toBytes(`FA${this.freqToStr(freqHz)};`);
  }

  /**
   * VFO-Bの周波数の設定コマンド（FB）を返す
   */
  public makeSetFreqB(freqHz: number): Uint8Array {
    return this.toBytes(`FB${this.freqToStr(freqHz)};`);
  }

  /**
   * 運用モードの設定コマンド（MD0）を返す
   * memo: MD0は、メイン（VFO-A）の運用モードのみ設定できる。
   * @param modeCode 運用モードのコード（1桁）
   */
  public makeSetMode(modeCode: string): Uint8Array {
    return this.toBytes(`MD0${modeCode};`);
  }

  /**
   * VFO-A、VFO-Bの入れ替えコマンド（SV）を返す
   */
  public makeSwapVfo(): Uint8Array {
    return this.toBytes("SV;");
  }

  /**
   * 送信VFOの設定コマンド（FT）を返す
   * @param isSplit true：VFO-Bで送信（SPLIT）、false：VFO-Aで送信
   */
  public makeSetSplit(isSplit: boolean): Uint8Array {
    return this.toBytes(isSplit ? "FT3;" : "FT2;");
  }

  /**
   * 無線機の状態（VFO-Aの周波数、運用モード）の読み取りコマンド（IF）を返す
   */
  public makeGetInfo(): Uint8Array {
    return this.toBytes("IF;");
  }

  /**
   * 送信状態の読み取りコマンド（TX）を返す
   */
  public makeGetTxState(): Uint8Array {
    return this.toBytes("TX;");
  }

  /**
   * 自動通知（AI）の設定コマンドを返す
   */
  public makeSetAutoInfo(isOn: boolean): Uint8Array {
    return this.toBytes(isOn ? "AI1;" : "AI0;");
  }

  /**
   * CTCSSの動作の設定コマンド（CT0）を返す
   * @param isOn true：CTCSS ENC（送信時のみ）、false：OFF
   */
  public makeSetCtcss(isOn: boolean): Uint8Array {
    return this.toBytes(isOn ? "CT02;" : "CT00;");
  }

  /**
   * CTCSSのトーン番号の設定コマンド（CN00）を返す
   * @param toneHz トーン周波数（Hz）。Constant.Transceiver.ToneFrequency のいずれか
   * @throws {Error} 設定できないトーン周波数の場合
   */
  public makeSetCtcssTone(toneHz: number): Uint8Array {
    const toneNo = TransceiverYaesuFt991CmdMaker.toneHzToNo(toneHz);
    return this.toBytes(`CN00${toneNo.toString().padStart(3, "0")};`);
  }

  /**
   * トーン周波数を、CTCSSトーン番号（000〜049）に変換する
   * @throws {Error} 設定できないトーン周波数の場合
   */
  public static toneHzToNo(toneHz: number): number {
    // memo: 設定ファイルでは文字列で保持されるため、実行時は文字列が渡される場合がある
    const toneNum = Number(toneHz);
    const idx = Constant.Transceiver.ToneFrequency.findIndex((hz) => hz === toneNum);
    if (idx < 0) {
      throw new Error(`設定できないトーン周波数が指定されました。toneHz=${toneHz}`);
    }
    return idx;
  }

  /**
   * RSTの運用モードを、FT-991の運用モードのコード（MD0のP2）に変換する
   * @returns 設定できない運用モードの場合はnull
   */
  public static modeTextToCode(modeText: string): string | null {
    switch (modeText) {
      case Constant.Transceiver.OpeMode.LSB:
        return "1";
      case Constant.Transceiver.OpeMode.USB:
        return "2";
      case Constant.Transceiver.OpeMode.CW:
        return "3";
      case Constant.Transceiver.OpeMode.FM:
        return "4";
      case Constant.Transceiver.OpeMode.AM:
        return "5";
      case Constant.Transceiver.OpeMode.RTTY:
        return "6";
      case Constant.Transceiver.OpeMode.LSB_D:
        return "8";
      case Constant.Transceiver.OpeMode.FM_D:
        return "A";
      case Constant.Transceiver.OpeMode.USB_D:
        return "C";
      default:
        return null;
    }
  }

  /**
   * 周波数を、9桁のゼロ詰めの文字列に変換する
   */
  private freqToStr(freqHz: number): string {
    return Math.round(freqHz).toString().padStart(9, "0");
  }

  /**
   * 文字列を、送信用のバイト列に変換する
   */
  private toBytes(cmd: string): Uint8Array {
    return new Uint8Array(Buffer.from(cmd, "ascii"));
  }
}
