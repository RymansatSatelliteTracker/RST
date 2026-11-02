import Constant from "@/common/Constant.js";

// コマンドの終端
const TERMINATOR = 0x3b; // ";"

/**
 * FT-991の応答データのパーサ
 */
export default class TransceiverYaesuFt991RecvParser {
  /**
   * 受信バッファから、終端（;）までの完結したフレームを切り出す
   * 終端のない（未完結の）データは、rest に返す。
   */
  public static extractFrames(buffer: Buffer): { frames: Buffer[]; rest: Buffer } {
    const frames: Buffer[] = [];
    let start = 0;
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === TERMINATOR) {
        frames.push(Buffer.from(buffer.subarray(start, i + 1)));
        start = i + 1;
      }
    }
    return { frames, rest: Buffer.from(buffer.subarray(start)) };
  }

  /**
   * フレームがエラー応答（?;）かを返す
   */
  public static isError(frame: Buffer): boolean {
    return frame.toString("ascii").trim() === "?;";
  }

  /**
   * IF（VFO-Aの状態）の応答から、周波数（Hz）と運用モード（RSTの運用モード）を解析する
   * 応答の形式（28文字）：IF + P1(3桁：メモリCH) + P2(9桁：周波数) + P3(5桁：クラリファイア) + P4〜P5(各1桁)
   *                      + P6(1桁：運用モード) + P7〜P8(各1桁) + P9(2桁) + P10(1桁) + ;
   * @returns 解析できない場合はnull。RSTで扱えない運用モードの場合は、modeTextがnull
   */
  public static parseInfo(frame: Buffer): { freqHz: number; modeText: string | null } | null {
    const s = frame.toString("ascii");
    if (s.length !== 28 || !s.startsWith("IF") || !s.endsWith(";")) {
      return null;
    }

    const freqHz = this.parseDigits(s.substring(5, 14));
    if (freqHz === null) {
      return null;
    }

    return { freqHz, modeText: this.codeToModeText(s.charAt(21)) };
  }

  /**
   * FA（VFO-Aの周波数）の応答、または通知から、周波数（Hz）を解析する
   * @returns 解析できない場合はnull
   */
  public static parseFreqA(frame: Buffer): number | null {
    const s = frame.toString("ascii");
    if (s.length !== 12 || !s.startsWith("FA") || !s.endsWith(";")) {
      return null;
    }
    return this.parseDigits(s.substring(2, 11));
  }

  /**
   * MD0（運用モード）の応答、または通知から、運用モードを解析する
   * @returns 解析できない場合はundefined、RSTで扱えない運用モードの場合はnull
   */
  public static parseMode(frame: Buffer): string | null | undefined {
    const s = frame.toString("ascii");
    if (s.length !== 5 || !s.startsWith("MD0") || !s.endsWith(";")) {
      return undefined;
    }
    return this.codeToModeText(s.charAt(3));
  }

  /**
   * TX（送信状態）の応答から、送信中かを解析する
   * P1：0=受信、1=CATによる送信中、2=無線機本体による送信中
   * @returns 解析できない場合はnull
   */
  public static parseIsTransmitting(frame: Buffer): boolean | null {
    const s = frame.toString("ascii");
    if (s.length !== 4 || !s.startsWith("TX") || !s.endsWith(";")) {
      return null;
    }
    const p1 = s.charAt(2);
    if (p1 === "0") {
      return false;
    }
    if (p1 === "1" || p1 === "2") {
      return true;
    }
    return null;
  }

  /**
   * FT-991の運用モードのコードを、RSTの運用モードに変換する
   * @returns RSTで扱えない運用モードの場合はnull
   */
  public static codeToModeText(code: string): string | null {
    switch (code) {
      case "1":
        return Constant.Transceiver.OpeMode.LSB;
      case "2":
        return Constant.Transceiver.OpeMode.USB;
      // CW-U、CW-L
      case "3":
      case "7":
        return Constant.Transceiver.OpeMode.CW;
      // FM、FM-N
      case "4":
      case "B":
        return Constant.Transceiver.OpeMode.FM;
      // AM、AM-N
      case "5":
      case "D":
        return Constant.Transceiver.OpeMode.AM;
      // RTTY-LSB、RTTY-USB
      case "6":
      case "9":
        return Constant.Transceiver.OpeMode.RTTY;
      case "8":
        return Constant.Transceiver.OpeMode.LSB_D;
      case "A":
        return Constant.Transceiver.OpeMode.FM_D;
      case "C":
        return Constant.Transceiver.OpeMode.USB_D;
      // C4FM
      case "E":
        return Constant.Transceiver.OpeMode.DV;
      default:
        return null;
    }
  }

  /**
   * 数字のみの文字列を数値に変換する
   * @returns 数字以外が含まれる場合はnull
   */
  private static parseDigits(s: string): number | null {
    if (!/^\d+$/.test(s)) {
      return null;
    }
    return parseInt(s, 10);
  }
}
