/**
 * テスト用のSerialCommの代替クラス
 * - 送信データを履歴として記録する
 * - 送信時に応答生成関数（無線機シミュレータ）を呼び出し、応答を受信データとして非同期（マイクロタスク）で注入する
 * - テストから任意の受信データを注入できる（無線機起点のデータ（トランシーブ）の再現用）
 *
 * 使い方：テストファイルで vi.mock("@/main/common/SerialComm.js", ...) により、本クラスに差し替える。
 */
export type FakeResponder = (sent: Uint8Array) => Uint8Array[];

export default class FakeSerialComm {
  // 生成されたインスタンス（最後に生成されたものが、テスト対象のコントローラが使用中のもの）
  public static instances: FakeSerialComm[] = [];
  // 送信データに対する応答生成関数
  public static responder: FakeResponder | null = null;
  // open() の結果
  public static openResult = true;

  // 送信データの履歴
  public sent: Uint8Array[] = [];

  private opened = false;

  public constructor(
    public comName: string,
    public baudRate: number,
    public useReadlineParsar: boolean = false,
    private recvCallback: ((data: Buffer) => void | Promise<void>) | null = null,
    private closeCallback: (() => void) | null = null,
    public options?: { stopBits?: 1 | 2 }
  ) {
    FakeSerialComm.instances.push(this);
  }

  /**
   * 静的な状態をリセットする（各テストの開始時に呼ぶ）
   */
  public static reset() {
    FakeSerialComm.instances = [];
    FakeSerialComm.responder = null;
    FakeSerialComm.openResult = true;
  }

  /**
   * 最後に生成されたインスタンスを返す
   */
  public static last(): FakeSerialComm {
    const inst = FakeSerialComm.instances[FakeSerialComm.instances.length - 1];
    if (!inst) {
      throw new Error("FakeSerialCommのインスタンスが生成されていません。");
    }
    return inst;
  }

  public open(): Promise<boolean> {
    this.opened = FakeSerialComm.openResult;
    return Promise.resolve(this.opened);
  }

  public isOpen(): boolean {
    return this.opened;
  }

  public close(): Promise<boolean> {
    if (!this.opened) {
      return Promise.resolve(false);
    }
    this.opened = false;
    this.closeCallback?.();
    return Promise.resolve(true);
  }

  /**
   * テストからシリアルの切断を再現する（closeCallbackは呼ばない）
   */
  public simulateDisconnect() {
    this.opened = false;
  }

  public send(data: Buffer): Promise<boolean> {
    if (!this.opened) {
      return Promise.reject(new Error("シリアルポートがオープンされていません。"));
    }

    const bytes = new Uint8Array(data);
    this.sent.push(bytes);

    // 応答はマイクロタスクで注入する（実機と同様に、送信処理の完了後に受信する）
    const replies = FakeSerialComm.responder ? FakeSerialComm.responder(bytes) : [];
    for (const reply of replies) {
      void Promise.resolve().then(() => this.emitRecv(reply));
    }

    return Promise.resolve(true);
  }

  /**
   * 受信データを注入する
   * @param data バイト列、または16進数文字列（例："fefee0a2fbfd"）
   */
  public async emitRecv(data: Uint8Array | string): Promise<void> {
    if (!this.recvCallback) {
      return;
    }
    const buf = typeof data === "string" ? Buffer.from(data, "hex") : Buffer.from(data);
    await this.recvCallback(buf);
  }

  /**
   * 受信データを、ASCII文字列として注入する（FT-991など、ASCIIのコマンド体系の無線機向け）
   */
  public async emitRecvAscii(data: string): Promise<void> {
    await this.emitRecv(Uint8Array.from(Buffer.from(data, "ascii")));
  }

  /**
   * 送信データの履歴を16進数文字列（小文字）の配列で返す
   */
  public sentHex(): string[] {
    return this.sent.map((bytes) => Buffer.from(bytes).toString("hex"));
  }

  /**
   * 送信データの履歴をクリアする
   */
  public clearSent() {
    this.sent = [];
  }
}
