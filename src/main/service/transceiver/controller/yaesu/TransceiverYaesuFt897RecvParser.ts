import Constant from "@/common/Constant.js";

/**
 * FT-897の応答データのパーサ
 */
export default class TransceiverYaesuFt897RecvParser {
  /**
   * 受信バッファから、フレームを切り出す
   * FT-897は自動通知がなく、応答は固定長で、応答待ちの処理（TransceiverYaesuSerialIo）が直接受け取るため、
   * 応答待ちではない受信データは、全て破棄する。
   */
  public static extractFrames(_buffer: Buffer): { frames: Buffer[]; rest: Buffer } {
    return { frames: [], rest: Buffer.alloc(0) };
  }

  /**
   * 周波数・運用モードの読み取りの応答（5バイト）から、周波数（Hz）と運用モード（RSTの運用モード）を解析する
   * DATA1〜DATA4：周波数（10Hz単位のBCD、上位桁から順）、DATA5：運用モード
   * @returns 解析できない場合はnull。RSTで扱えない運用モードの場合は、modeTextがnull
   */
  public static parseFreqAndMode(buf: Buffer): { freqHz: number; modeText: string | null } | null {
    if (buf.length !== 5) {
      return null;
    }

    let digits = "";
    for (let i = 0; i < 4; i++) {
      const hi = buf[i] >> 4;
      const lo = buf[i] & 0x0f;
      // BCDではない値
      if (hi > 9 || lo > 9) {
        return null;
      }
      digits += `${hi}${lo}`;
    }

    return { freqHz: parseInt(digits, 10) * 10, modeText: this.codeToModeText(buf[4]) };
  }

  /**
   * 送信ステータスの読み取りの応答（1バイト）から、送信中かを解析する
   * bit7：PTT（0：送信中、1：受信中）
   * @returns 解析できない場合はnull
   */
  public static parseIsTransmitting(buf: Buffer): boolean | null {
    if (buf.length !== 1) {
      return null;
    }
    return (buf[0] & 0x80) === 0;
  }

  /**
   * FT-897の運用モードのコードを、RSTの運用モードに変換する
   * - DIG → USB-D（側波帯は判別できないため。RSTが直前に要求したモードの維持は、コントローラ側で行う）
   * - PKT → FM-D
   * @returns RSTで扱えない運用モードの場合はnull
   */
  public static codeToModeText(code: number): string | null {
    switch (code) {
      case 0x00:
        return Constant.Transceiver.OpeMode.LSB;
      case 0x01:
        return Constant.Transceiver.OpeMode.USB;
      // CW、CWR
      case 0x02:
      case 0x03:
        return Constant.Transceiver.OpeMode.CW;
      case 0x04:
        return Constant.Transceiver.OpeMode.AM;
      // WFM、FM、FMN
      case 0x06:
      case 0x08:
      case 0x88:
        return Constant.Transceiver.OpeMode.FM;
      case 0x0a:
        return Constant.Transceiver.OpeMode.USB_D;
      case 0x0c:
        return Constant.Transceiver.OpeMode.FM_D;
      default:
        return null;
    }
  }
}
