import Constant from "@/common/Constant.js";

// FT-897が周波数を設定できる範囲（Hz）
const MIN_FREQ_HZ = 30000;
const MAX_FREQ_HZ = 470000000;

/**
 * CATコマンドのコマンド部（5バイト目）
 */
const Cmd = {
  SET_FREQ: 0x01,
  SPLIT_ON: 0x02,
  SET_MODE: 0x07,
  SPLIT_OFF: 0x82,
  GET_FREQ_MODE: 0x03,
  SET_TONE_MODE: 0x0a,
  SET_TONE_FREQ: 0x0b,
  TOGGLE_VFO: 0x81,
  GET_TX_STATUS: 0xf7,
} as const;

/**
 * FT-897のコマンド生成クラス
 * コマンドは、パラメータ（P1〜P4）の4バイト＋コマンドの1バイトの計5バイトのバイナリ。
 * （FT-897D 取扱説明書「CAT運用」のコマンド一覧表に基づく）
 */
export default class TransceiverYaesuFt897CmdMaker {
  /**
   * 周波数が、FT-897で設定できる範囲内かを返す
   */
  public static isFreqInRange(freqHz: number): boolean {
    return Number.isFinite(freqHz) && MIN_FREQ_HZ <= freqHz && freqHz <= MAX_FREQ_HZ;
  }

  /**
   * 周波数の設定コマンドを返す
   * 周波数は、10Hz単位のBCD（8桁）で、上位桁から順にP1〜P4へ設定する（例：21.17500MHz → 02 11 75 00）。
   */
  public makeSetFreq(freqHz: number): Uint8Array {
    const digits = Math.round(freqHz / 10)
      .toString()
      .padStart(8, "0");
    return this.makeCmd(Cmd.SET_FREQ, this.bcd(digits));
  }

  /**
   * 運用モードの設定コマンドを返す
   * @param modeCode 運用モードのコード（P1）
   */
  public makeSetMode(modeCode: number): Uint8Array {
    return this.makeCmd(Cmd.SET_MODE, [modeCode, 0x00, 0x00, 0x00]);
  }

  /**
   * VFO A/Bの切り替えコマンド（トグル）を返す
   */
  public makeToggleVfo(): Uint8Array {
    return this.makeCmd(Cmd.TOGGLE_VFO);
  }

  /**
   * SPLITのOn/Offの設定コマンドを返す
   */
  public makeSetSplit(isOn: boolean): Uint8Array {
    return this.makeCmd(isOn ? Cmd.SPLIT_ON : Cmd.SPLIT_OFF);
  }

  /**
   * トーン（CTCSS）の動作の設定コマンドを返す
   * @param isOn true：CTCSS ENC（送信時のみ）On、false：Off
   */
  public makeSetToneMode(isOn: boolean): Uint8Array {
    return this.makeCmd(Cmd.SET_TONE_MODE, [isOn ? 0x4a : 0x8a, 0x00, 0x00, 0x00]);
  }

  /**
   * トーン周波数の設定コマンドを返す
   * 周波数は、0.1Hz単位のBCD（4桁）で、送信用（P1P2）、受信用（P3P4）の順に設定する（例：88.5Hz → 08 85）。
   * 受信用（デコーダ）は使用しないため、送信用と同じ値を設定する。
   * @throws {Error} 設定できないトーン周波数の場合
   */
  public makeSetToneFreq(toneHz: number): Uint8Array {
    // memo: 設定ファイルでは文字列で保持されるため、実行時は文字列が渡される場合がある
    const tone01Hz = Math.round(Number(toneHz) * 10);
    if (!Number.isFinite(tone01Hz) || tone01Hz <= 0 || tone01Hz > 9999) {
      throw new Error(`設定できないトーン周波数が指定されました。toneHz=${toneHz}`);
    }
    const bytes = this.bcd(tone01Hz.toString().padStart(4, "0"));
    return this.makeCmd(Cmd.SET_TONE_FREQ, [...bytes.slice(0, 2), ...bytes.slice(0, 2)]);
  }

  /**
   * 周波数・運用モードの読み取りコマンドを返す（現在表示中のVFOの値が返る。応答は5バイト）
   */
  public makeGetFreqMode(): Uint8Array {
    return this.makeCmd(Cmd.GET_FREQ_MODE);
  }

  /**
   * 送信ステータスの読み取りコマンドを返す（応答は1バイト）
   */
  public makeGetTxStatus(): Uint8Array {
    return this.makeCmd(Cmd.GET_TX_STATUS);
  }

  /**
   * RSTの運用モードを、FT-897の運用モードのコード（P1）に変換する
   * FT-897には、DATA-USB/DATA-LSB/DATA-FMの区別がなく、デジタル系はDIG、PKTで表される。
   * - LSB-D、USB-D → DIG（側波帯は、無線機のメニューNo-038 DIG MODEの設定による）
   * - FM-D → PKT
   * @returns 設定できない運用モード（RTTY、DV）の場合はnull
   */
  public static modeTextToCode(modeText: string): number | null {
    switch (modeText) {
      case Constant.Transceiver.OpeMode.LSB:
        return 0x00;
      case Constant.Transceiver.OpeMode.USB:
        return 0x01;
      case Constant.Transceiver.OpeMode.CW:
        return 0x02;
      case Constant.Transceiver.OpeMode.AM:
        return 0x04;
      case Constant.Transceiver.OpeMode.FM:
        return 0x08;
      case Constant.Transceiver.OpeMode.LSB_D:
      case Constant.Transceiver.OpeMode.USB_D:
        return 0x0a;
      case Constant.Transceiver.OpeMode.FM_D:
        return 0x0c;
      default:
        return null;
    }
  }

  /**
   * 数字のみの文字列を、2桁ずつのBCDのバイト列に変換する（上位桁が先頭）
   */
  private bcd(digits: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < digits.length; i += 2) {
      bytes.push(parseInt(digits.substring(i, i + 2), 16));
    }
    return bytes;
  }

  /**
   * パラメータ（P1〜P4）とコマンドから、5バイトのコマンドを生成する
   */
  private makeCmd(cmd: number, params: number[] = [0x00, 0x00, 0x00, 0x00]): Uint8Array {
    return new Uint8Array([...params, cmd]);
  }
}
