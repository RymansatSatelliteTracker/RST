/**
 * テスト用のICOM無線機（CI-V）の簡易シミュレータ
 * - メイン／サブの各バンドの周波数・運用モード・データモードと、現在のバンド、サテライトモードを保持する
 * - 受信したCI-Vコマンドに対して、実機に近い応答（設定系はFB、取得系は保持している状態）を返す
 * - 周波数の設定（00：トランシーブ形式）は、実機と同様に応答を返さない
 */

// PC（RST）のCI-Vアドレス
const PC_ADDRESS = 0xe0;

/**
 * バンドごとの状態
 */
export type IcomBandState = {
  freqHz: number;
  // 運用モード（CI-Vの値。"00"：LSB、"01"：USB、"05"：FM など）
  mode: string;
  // データモード（"00"：Off、"01"：On）
  dataMode: string;
};

/**
 * 応答の上書き
 * - undefined を返した場合は、通常の応答を返す
 * - 配列を返した場合は、その応答（16進数文字列）を返す（空配列は無応答）
 */
export type IcomReplyOverride = (body: number[]) => string[] | undefined;

export default class IcomRadioSimulator {
  public main: IcomBandState = { freqHz: 435000000, mode: "05", dataMode: "00" };
  public sub: IcomBandState = { freqHz: 145900000, mode: "05", dataMode: "00" };
  public isMain = true;
  public isSatelliteMode = false;
  public isToneOn = false;
  public toneBody: number[] = [];

  // trueの場合は、全てのコマンドに応答しない（無線機の電源断などの再現用）
  public muted = false;
  // 応答の上書き
  public override: IcomReplyOverride | null = null;

  public constructor(public readonly civAddress: number) {}

  /**
   * 現在のバンドの状態を返す
   */
  public get current(): IcomBandState {
    return this.isMain ? this.main : this.sub;
  }

  /**
   * FakeSerialComm の応答生成関数として使用する
   */
  public respond = (sent: Uint8Array): Uint8Array[] => {
    const bytes = Array.from(sent);

    // 自機宛てのコマンドでない場合は応答しない
    if (bytes[0] !== 0xfe || bytes[1] !== 0xfe || bytes[2] !== this.civAddress || bytes[bytes.length - 1] !== 0xfd) {
      return [];
    }

    const body = bytes.slice(4, -1);

    const overridden = this.override?.(body);
    if (overridden !== undefined) {
      return overridden.map((hex) => Uint8Array.from(Buffer.from(hex, "hex")));
    }

    if (this.muted) {
      return [];
    }

    return this.handle(body).map((hex) => Uint8Array.from(Buffer.from(hex, "hex")));
  };

  /**
   * コマンドを処理し、応答（16進数文字列）を返す
   */
  private handle(body: number[]): string[] {
    const [cmd, sub] = body;
    const current = this.current;

    switch (cmd) {
      // 周波数の設定（トランシーブ形式）：実機は応答しない
      case 0x00:
        current.freqHz = IcomRadioSimulator.decodeBcdFreq(body.slice(1, 6));
        return [];
      // 周波数の取得
      case 0x03:
        return [this.frame(`03${IcomRadioSimulator.encodeBcdFreq(current.freqHz)}`)];
      // 運用モードの取得
      case 0x04:
        return [this.frame(`04${current.mode}01`)];
      // 運用モードの設定
      case 0x06:
        current.mode = IcomRadioSimulator.hex(body[1]);
        return [this.ok()];
      case 0x07:
        // 現在のバンドの取得
        if (sub === 0xd2) {
          return [this.frame(`07d2${this.isMain ? "00" : "01"}`)];
        }
        // メインバンドへ切り替え
        if (sub === 0xd0) {
          this.isMain = true;
          return [this.ok()];
        }
        // サブバンドへ切り替え
        if (sub === 0xd1) {
          this.isMain = false;
          return [this.ok()];
        }
        // メイン／サブの入れ替え
        if (sub === 0xb0) {
          const tmp = this.main;
          this.main = this.sub;
          this.sub = tmp;
          return [this.ok()];
        }
        // VFO-Aへ切り替え 等
        return [this.ok()];
      case 0x1a:
        // データモード
        if (sub === 0x06) {
          if (body.length === 2) {
            return [this.frame(`1a06${current.dataMode}01`)];
          }
          current.dataMode = IcomRadioSimulator.hex(body[2]);
          return [this.ok()];
        }
        // サテライトモードの設定（IC-910）
        if (sub === 0x07 && body.length === 3) {
          this.isSatelliteMode = body[2] === 0x01;
          return [this.ok()];
        }
        // トランシーブの設定 等
        return [this.ok()];
      case 0x16:
        // サテライトモード
        if (sub === 0x5a) {
          if (body.length === 2) {
            return [this.frame(`165a${this.isSatelliteMode ? "01" : "00"}`)];
          }
          this.isSatelliteMode = body[2] === 0x01;
          return [this.ok()];
        }
        // TONE On/Off
        if (sub === 0x42) {
          this.isToneOn = body[2] === 0x01;
          return [this.ok()];
        }
        return [this.ng()];
      // TONE周波数
      case 0x1b:
        this.toneBody = body.slice(2);
        return [this.ok()];
      default:
        return [this.ng()];
    }
  }

  /**
   * 無線機起点（トランシーブ）の周波数データのフレームを返す
   */
  public transceiveFreqFrame(freqHz: number): string {
    return `fefe00${IcomRadioSimulator.hex(this.civAddress)}00${IcomRadioSimulator.encodeBcdFreq(freqHz)}fd`;
  }

  /**
   * 無線機起点（トランシーブ）の運用モードデータのフレームを返す
   */
  public transceiveModeFrame(mode: string): string {
    return `fefe00${IcomRadioSimulator.hex(this.civAddress)}01${mode}01fd`;
  }

  /**
   * 無線機→PCの応答フレームを返す
   */
  public frame(bodyHex: string): string {
    return `fefe${IcomRadioSimulator.hex(PC_ADDRESS)}${IcomRadioSimulator.hex(this.civAddress)}${bodyHex}fd`;
  }

  /**
   * OK（FB）応答を返す
   */
  public ok(): string {
    return this.frame("fb");
  }

  /**
   * NG（FA）応答を返す
   */
  public ng(): string {
    return this.frame("fa");
  }

  /**
   * 周波数をCI-VのBCD（下位桁から順の5バイト）の16進数文字列に変換する
   */
  public static encodeBcdFreq(freqHz: number): string {
    const s = Math.floor(freqHz).toString().padStart(10, "0");
    return s.slice(8, 10) + s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4) + s.slice(0, 2);
  }

  /**
   * CI-VのBCD（下位桁から順の5バイト）を周波数に変換する
   */
  public static decodeBcdFreq(bytes: number[]): number {
    const s = bytes
      .slice()
      .reverse()
      .map((b) => IcomRadioSimulator.hex(b))
      .join("");
    return parseInt(s, 10);
  }

  public static hex(value: number): string {
    return value.toString(16).padStart(2, "0");
  }
}
