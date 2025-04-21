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

  // // 連続するコマンドの結合を回避するためのパディング
  // static readonly PADDING = 0x00;
};

/**
 * ICOM無線機のコマンド生成クラス
 */
export default class TransceiverIcomCmdMaker {
  private civAddress: number = 0x0;

  public constructor(civAddress: number) {
    this.civAddress = civAddress;
  }

  /**
   * コマンド共通のプレフィックスを返す
   */
  private makePrefix(): Uint8Array {
    return new Uint8Array([CivCommand.PREAMBLE, CivCommand.PREAMBLE, this.civAddress, CivCommand.PC_ADDRESS]);
  }

  /**
   * コマンド共通のサフィックスを返す
   */
  private makeSuffix(): Uint8Array {
    return new Uint8Array([
      CivCommand.POSTAMBLE,
      // memo: 現状はパディングがなくても問題なく動作するのでコメントアウト。そのうち削除する
      // CivCommand.PADDING, // 後続コマンドとの結合を回避するためのパディング
    ]);
  }

  /**
   * トランシーブモードの設定コマンド
   * @param onOff 0x00: Off, 0x01: On
   */
  public setTranceive(onOff: number): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      0x1a, // セット ― 外部端子 ― CI-V ― CI-Vトランシーブの設定
      0x05,
      0x01,
      0x27,
      onOff,
      ...this.makeSuffix(),
    ]);
  }

  /**
   * VFO Aに切り替える
   */
  public switchVfoA(): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.SWITCH_BAND,
      0x00, // VFO Aにする
      ...this.makeSuffix(),
    ]);
  }

  /**
   * 無線機をメインバンドに切り替える
   */
  public switchToMainBand(): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.SWITCH_BAND,
      CivCommand.MAIN_BAND,
      ...this.makeSuffix(),
    ]);
  }

  /**
   * 無線機をサブバンドに切り替える
   */
  public switchToSubBand(): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.SWITCH_BAND,
      CivCommand.SUB_BAND,
      ...this.makeSuffix(),
    ]);
  }

  /**
   * メインバンドとサブバンドを入れ替える
   */
  public setInvertBand(): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.SWITCH_BAND,
      CivCommand.INVERT_BAND,
      ...this.makeSuffix(),
    ]);
  }

  /**
   * 無線機に周波数を設定するコマンドを送信する
   */
  public setFreq(freq: number): Uint8Array {
    // 周波数を10桁の文字列に変換
    const freqStr = Math.floor(freq).toString();
    const freqs = freqStr.padStart(10, "0").split("");

    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.SET_FREQUENCY,
      parseInt(freqs[8] + freqs[9], 16),
      parseInt(freqs[6] + freqs[7], 16),
      parseInt(freqs[4] + freqs[5], 16),
      parseInt(freqs[2] + freqs[3], 16),
      parseInt(freqs[0] + freqs[1], 16),
      ...this.makeSuffix(),
    ]);
  }

  /**
   * 無線機に運用モードを設定するコマンドを送信する
   */
  public setMode(mode: string): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.SET_MODE,
      parseInt(mode, 16),
      ...this.makeSuffix(),
    ]);
  }

  /**
   * サテライトモードの設定コマンド
   * @param {boolean} isSatelliteMode サテライトモード設定
   */
  public setSatelliteMode(isSatelliteMode: boolean): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      0x16, // サテライトモードの設定
      0x5a,
      isSatelliteMode ? 0x01 : 0x00,
      ...this.makeSuffix(),
    ]);
  }

  /**
   * サテライトモードの取得コマンド
   */
  public getSatelliteMode(): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      0x16, // サテライトモードの設定
      0x5a,
      ...this.makeSuffix(),
    ]);
  }

  /**
   * 無線機から現在の周波数を読み取るコマンドを送信する
   */
  public getFreq(): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.GET_FREQUENCY,
      ...this.makeSuffix(),
    ]);
  }

  /**
   * 無線機から現在のモードを読み取るコマンドを送信する
   */
  public getMode(): Uint8Array {
    return new Uint8Array([
      ...this.makePrefix(),
      // コマンド部
      CivCommand.GET_MODE,
      ...this.makeSuffix(),
    ]);
  }
}
