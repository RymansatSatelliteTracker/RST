import Constant from "@/common/Constant";

/**
 * ICOM無線機のコントローラ
 */
export default class TransceiverIcomCmdMaker {
  /**
   * トランシーブモードの設定コマンド
   * @param onOff 0x00: Off, 0x01: On
   */
  public static setTranceive(civAddress: number, onOff: number): Uint8Array {
    const data = new Uint8Array(11);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = 0x1a;
    data[5] = 0x05;
    data[6] = 0x01;
    data[7] = 0x27;
    data[8] = onOff;
    data[9] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[10] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * VFO Aに切り替える
   */
  public static switchVfo(civAddress: number): Uint8Array {
    const data = new Uint8Array(8);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = 0x07;
    data[5] = 0x00;
    data[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機をメインバンドに切り替える
   */
  public static switchToMainBand(civAddress: number): Uint8Array {
    // シリアル送信のデータ作成
    const data = new Uint8Array(8);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = Constant.Transceiver.CivCommand.SWITCH_BAND;
    data[5] = Constant.Transceiver.CivCommand.MAIN_BAND;
    data[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機をサブバンドに切り替える
   */
  public static switchToSubBand(civAddress: number): Uint8Array {
    // シリアル送信のデータ作成
    const data = new Uint8Array(8);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = Constant.Transceiver.CivCommand.SWITCH_BAND;
    data[5] = Constant.Transceiver.CivCommand.SUB_BAND;
    data[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * メインバンドとサブバンドを入れ替える
   */
  public static setInvertBand(civAddress: number): Uint8Array {
    // シリアル送信のデータ作成
    const data = new Uint8Array(8);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = Constant.Transceiver.CivCommand.SWITCH_BAND;
    data[5] = Constant.Transceiver.CivCommand.INVERT_BAND;
    data[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機に周波数を設定するコマンドを送信する
   */
  public static setFreq(civAddress: number, freq: string): Uint8Array {
    // 周波数を10桁の文字列に変換
    const freqs = freq.padStart(10, "0").split("");
    // シリアル送信用のデータを作成する
    const data = new Uint8Array(12);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = Constant.Transceiver.CivCommand.SET_FREQUENCY;
    data[5] = parseInt(freqs[8] + freqs[9], 16);
    data[6] = parseInt(freqs[6] + freqs[7], 16);
    data[7] = parseInt(freqs[4] + freqs[5], 16);
    data[8] = parseInt(freqs[2] + freqs[3], 16);
    data[9] = parseInt(freqs[0] + freqs[1], 16);
    data[10] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[11] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機に運用モードを設定するコマンドを送信する
   */
  public static setMode(civAddress: number, mode: string): Uint8Array {
    // シリアル送信用のデータを作成する
    const data = new Uint8Array(8);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = Constant.Transceiver.CivCommand.SET_MODE;
    data[5] = parseInt(mode, 16);
    data[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * サテライトモードの設定コマンド
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public static setSatelliteMode(civAddress: number, isSatelliteMode: boolean): Uint8Array {
    const data = new Uint8Array(9);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = 0x16;
    data[5] = 0x5a;
    data[6] = isSatelliteMode ? 0x01 : 0x00;
    data[7] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[8] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * サテライトモードの取得コマンド
   */
  public static getSatelliteMode(civAddress: number): Uint8Array {
    const data = new Uint8Array(8);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = 0x16;
    data[5] = 0x5a;
    data[6] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[7] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機から現在の周波数を読み取るコマンドを送信する
   */
  public static getFreq(civAddress: number): Uint8Array {
    // シリアル送信用のデータを作成する
    const data = new Uint8Array(7);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = Constant.Transceiver.CivCommand.GET_FREQUENCY;
    data[5] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[6] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機から現在のモードを読み取るコマンドを送信する
   */
  public static getMode(civAddress: number): Uint8Array {
    // シリアル送信用のデータを作成する
    const data = new Uint8Array(7);
    data[0] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[1] = Constant.Transceiver.CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = Constant.Transceiver.CivCommand.PC_ADDRESS;
    data[4] = Constant.Transceiver.CivCommand.GET_MODE;
    data[5] = Constant.Transceiver.CivCommand.POSTAMBLE;
    data[6] = Constant.Transceiver.CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }
}
