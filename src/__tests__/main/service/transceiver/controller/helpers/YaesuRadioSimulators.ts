/**
 * テスト用のYAESU無線機（FT-897、FT-991）の簡易シミュレータ
 * FakeSerialComm の応答生成関数（respond）として使用する。
 */

/**
 * FT-897のシミュレータ
 * - VFO-A、VFO-Bの状態と、表示中のVFOを保持する。
 * - 設定系コマンドには応答しない。周波数・モードの読み取り（03）は表示中のVFOの値、送信ステータス（F7）は受信中を返す。
 */
export class Ft897Simulator {
  // VFOごとの周波数（Hz）、運用モードのコード
  public vfos = [
    { freqHz: 145800000, mode: 0x08 },
    { freqHz: 435000000, mode: 0x08 },
  ];
  // 表示中のVFO（0：VFO-A、1：VFO-B）
  public displayed = 0;
  public isSplit = false;
  // trueの場合は、送信中として応答する
  public isTransmitting = false;
  // trueの場合は、全てのコマンドに応答しない
  public muted = false;
  // 設定されたトーンの動作、トーン周波数（16進数文字列）
  public toneMode = "";
  public toneFreq = "";

  /**
   * 表示中のVFOの状態を返す
   */
  public get current() {
    return this.vfos[this.displayed];
  }

  public respond = (sent: Uint8Array): Uint8Array[] => {
    if (this.muted || sent.length !== 5) {
      return [];
    }

    const b = Array.from(sent);
    switch (b[4]) {
      // 周波数の設定
      case 0x01:
        this.current.freqHz =
          parseInt(
            b
              .slice(0, 4)
              .map((x) => x.toString(16).padStart(2, "0"))
              .join(""),
            10
          ) * 10;
        return [];
      // 運用モードの設定
      case 0x07:
        this.current.mode = b[0];
        return [];
      // VFOの切り替え
      case 0x81:
        this.displayed = this.displayed === 0 ? 1 : 0;
        return [];
      case 0x02:
        this.isSplit = true;
        return [];
      case 0x82:
        this.isSplit = false;
        return [];
      case 0x0a:
        this.toneMode = b[0].toString(16);
        return [];
      case 0x0b:
        this.toneFreq = b
          .slice(0, 4)
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
        return [];
      // 周波数・モードの読み取り
      case 0x03:
        return [Ft897Simulator.freqModeResponse(this.current.freqHz, this.current.mode)];
      // 送信ステータスの読み取り
      case 0xf7:
        return [Uint8Array.from([this.isTransmitting ? 0x00 : 0x80])];
      default:
        return [];
    }
  };

  /**
   * 周波数・モードの読み取りの応答（5バイト）を返す
   */
  public static freqModeResponse(freqHz: number, mode: number): Uint8Array {
    const digits = Math.round(freqHz / 10)
      .toString()
      .padStart(8, "0");
    const bytes = [0, 2, 4, 6].map((i) => parseInt(digits.substring(i, i + 2), 16));
    return Uint8Array.from([...bytes, mode]);
  }
}

/**
 * FT-991のシミュレータ
 * - VFO-A、VFO-Bの状態を保持する（運用モードはVFOごと）。VFOの入れ替え（SV）を再現する。
 * - 設定系コマンドには応答しない。読み取り（IF、TX）には応答する。
 */
export class Ft991Simulator {
  public a = { freqHz: 145800000, mode: "4" };
  public b = { freqHz: 435000000, mode: "4" };
  public isAutoInfo = false;
  public isSplit = false;
  // 送信状態（0：受信、1：CATによる送信中、2：無線機本体による送信中）
  public txState = "0";
  // trueの場合は、全てのコマンドに応答しない
  public muted = false;
  // CTCSSの動作（P2）、トーン番号
  public ctcss = "";
  public toneNo = "";
  // CTCSSを設定した時点の、VFO-Aの運用モード（VFOを入れ替えた状態での設定の確認用）
  public ctcssSetOnModeOfA = "";

  public respond = (sent: Uint8Array): Uint8Array[] => {
    if (this.muted) {
      return [];
    }

    const cmd = Buffer.from(sent).toString("ascii");
    const code = cmd.substring(0, 2);
    const param = cmd.substring(2, cmd.length - 1);

    switch (code) {
      case "FA":
        this.a.freqHz = parseInt(param, 10);
        return [];
      case "FB":
        this.b.freqHz = parseInt(param, 10);
        return [];
      case "MD":
        // MD0 + モード
        this.a.mode = param.substring(1);
        return [];
      case "SV": {
        const tmp = this.a;
        this.a = this.b;
        this.b = tmp;
        return [];
      }
      case "FT":
        this.isSplit = param === "3";
        return [];
      case "AI":
        this.isAutoInfo = param === "1";
        return [];
      case "CT":
        this.ctcss = param.substring(1);
        this.ctcssSetOnModeOfA = this.a.mode;
        return [];
      case "CN":
        this.toneNo = param.substring(2);
        return [];
      case "IF":
        return [this.toBytes(this.ifResponse())];
      case "TX":
        return [this.toBytes(`TX${this.txState};`)];
      default:
        return [];
    }
  };

  /**
   * IFの応答（28文字）を返す（VFO-Aの周波数、運用モード）
   */
  public ifResponse(): string {
    return `IF001${this.a.freqHz.toString().padStart(9, "0")}+0000` + `00${this.a.mode}` + `00000;`;
  }

  /**
   * 無線機側の操作による自動通知（FA）のフレームを返す
   */
  public notifyFreqA(freqHz: number): string {
    return `FA${freqHz.toString().padStart(9, "0")};`;
  }

  private toBytes(s: string): Uint8Array {
    return Uint8Array.from(Buffer.from(s, "ascii"));
  }
}
