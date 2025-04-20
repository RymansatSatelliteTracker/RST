/**
 * CI-Vコマンド
 */
const CivCommand = class {
  // プリアンプル
  static readonly PREAMBLE = 0xfe;
  // ポストアンプル
  static readonly POSTAMBLE = 0xfd;
  // PCの送受信時アドレス
  static readonly PC_ADDRESS = 0xe0;

  // 周波数の設定(トランシーブ)
  static readonly SET_FREQUENCY = 0x00; //0x05;
  // 周波数の読み込み
  static readonly GET_FREQUENCY = 0x03;
  // モードの設定(非トランシーブ)
  static readonly SET_MODE = 0x06; // 0x01;
  // モードの読み込み
  static readonly GET_MODE = 0x04;

  // MAIN/SUBバンドの切り替え
  static readonly SWITCH_BAND = 0x07;
  // メインバンド
  static readonly MAIN_BAND = 0xd0;
  // サブバンド
  static readonly SUB_BAND = 0xd1;
  // メインバンドとサブバンドを入れ替える
  static readonly INVERT_BAND = 0xb0;

  // 連続するコマンドの結合を回避するためのパディング
  static readonly PADDING = 0x00;
};

/**
 * ICOM無線機のコマンド生成クラス
 */
export default class TransceiverIcomCmdMaker {
  /**
   * トランシーブモードの設定コマンド
   * @param onOff 0x00: Off, 0x01: On
   */
  public static setTranceive(civAddress: number, onOff: number): Uint8Array {
    const data = new Uint8Array(11);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = 0x1a;
    data[5] = 0x05;
    data[6] = 0x01;
    data[7] = 0x27;
    data[8] = onOff;
    data[9] = CivCommand.POSTAMBLE;
    data[10] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * VFO Aに切り替える
   */
  public static switchVfo(civAddress: number): Uint8Array {
    const data = new Uint8Array(8);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = 0x07;
    data[5] = 0x00;
    data[6] = CivCommand.POSTAMBLE;
    data[7] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機をメインバンドに切り替える
   */
  public static switchToMainBand(civAddress: number): Uint8Array {
    // シリアル送信のデータ作成
    const data = new Uint8Array(8);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = CivCommand.SWITCH_BAND;
    data[5] = CivCommand.MAIN_BAND;
    data[6] = CivCommand.POSTAMBLE;
    data[7] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機をサブバンドに切り替える
   */
  public static switchToSubBand(civAddress: number): Uint8Array {
    // シリアル送信のデータ作成
    const data = new Uint8Array(8);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = CivCommand.SWITCH_BAND;
    data[5] = CivCommand.SUB_BAND;
    data[6] = CivCommand.POSTAMBLE;
    data[7] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * メインバンドとサブバンドを入れ替える
   */
  public static setInvertBand(civAddress: number): Uint8Array {
    // シリアル送信のデータ作成
    const data = new Uint8Array(8);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = CivCommand.SWITCH_BAND;
    data[5] = CivCommand.INVERT_BAND;
    data[6] = CivCommand.POSTAMBLE;
    data[7] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

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
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = CivCommand.SET_FREQUENCY;
    data[5] = parseInt(freqs[8] + freqs[9], 16);
    data[6] = parseInt(freqs[6] + freqs[7], 16);
    data[7] = parseInt(freqs[4] + freqs[5], 16);
    data[8] = parseInt(freqs[2] + freqs[3], 16);
    data[9] = parseInt(freqs[0] + freqs[1], 16);
    data[10] = CivCommand.POSTAMBLE;
    data[11] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機に運用モードを設定するコマンドを送信する
   */
  public static setMode(civAddress: number, mode: string): Uint8Array {
    // シリアル送信用のデータを作成する
    const data = new Uint8Array(8);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = CivCommand.SET_MODE;
    data[5] = parseInt(mode, 16);
    data[6] = CivCommand.POSTAMBLE;
    data[7] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * サテライトモードの設定コマンド
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public static setSatelliteMode(civAddress: number, isSatelliteMode: boolean): Uint8Array {
    const data = new Uint8Array(9);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = 0x16;
    data[5] = 0x5a;
    data[6] = isSatelliteMode ? 0x01 : 0x00;
    data[7] = CivCommand.POSTAMBLE;
    data[8] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * サテライトモードの取得コマンド
   */
  public static getSatelliteMode(civAddress: number): Uint8Array {
    const data = new Uint8Array(8);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = 0x16;
    data[5] = 0x5a;
    data[6] = CivCommand.POSTAMBLE;
    data[7] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機から現在の周波数を読み取るコマンドを送信する
   */
  public static getFreq(civAddress: number): Uint8Array {
    // シリアル送信用のデータを作成する
    const data = new Uint8Array(7);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = CivCommand.GET_FREQUENCY;
    data[5] = CivCommand.POSTAMBLE;
    data[6] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }

  /**
   * 無線機から現在のモードを読み取るコマンドを送信する
   */
  public static getMode(civAddress: number): Uint8Array {
    // シリアル送信用のデータを作成する
    const data = new Uint8Array(7);
    data[0] = CivCommand.PREAMBLE;
    data[1] = CivCommand.PREAMBLE;
    data[2] = civAddress;
    data[3] = CivCommand.PC_ADDRESS;
    data[4] = CivCommand.GET_MODE;
    data[5] = CivCommand.POSTAMBLE;
    data[6] = CivCommand.PADDING; // 後続コマンドとの結合を回避するためのパディング

    return data;
  }
}
