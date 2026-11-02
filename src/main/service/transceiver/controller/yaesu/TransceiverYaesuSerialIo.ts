import CommonUtil from "@/common/CommonUtil.js";
import type { ApiResponse } from "@/common/types/types.js";
import { Mutex } from "@/common/util/Mutex.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

/**
 * 応答の待ち受け条件
 * expectBytes、expectPrefix のどちらかを指定する。
 */
export type YaesuRecvMatcher = {
  // 応答の長さ（バイト数）。固定長の応答（FT-897など）の場合に指定する
  expectBytes?: number;
  // 応答フレームの先頭文字列。終端文字で区切られる応答（FT-991：`IF`、`TX`など）の場合に指定する
  expectPrefix?: string;
  // 応答のタイムアウト（ミリ秒）
  timeoutMs: number;
};

/**
 * TransceiverYaesuSerialIoの生成オプション
 */
export type YaesuSerialIoOptions = {
  // シリアル送信
  send: (bytes: Uint8Array) => Promise<ApiResponse<void>>;
  // 受信バッファからのフレームの切り出し（機種ごと）
  extractFrames: (buffer: Buffer) => { frames: Buffer[]; rest: Buffer };
  // 応答待ちではないフレーム（自動通知など）を受信した場合のコールバック
  onNotify: (frame: Buffer) => void;
  // コマンド間の最小間隔（ミリ秒）。省略時は0
  interCommandDelayMs?: number;
};

/**
 * YAESU無線機との送受信（排他制御、応答待ち、フレームの切り出し）を行うクラス
 * - 送信は1件ずつ行う（応答待ちのコマンドが完了するまで、次の送信は待機する）。
 * - 応答待ちのフレーム以外（自動通知など）は、onNotifyへ渡す。
 */
export default class TransceiverYaesuSerialIo {
  private readonly options: YaesuSerialIoOptions;
  // 送信の排他制御用（インスタンスごと）
  private readonly mutex = new Mutex();
  // 受信バッファ
  private recvBuffer: Buffer = Buffer.alloc(0);
  // 応答待ち（応答待ちのコマンドを送信中のみ設定される）
  private pending: { matcher: YaesuRecvMatcher; resolve: (res: Buffer | null) => void } | null = null;
  // 無線機から1バイトでも受信したか
  private received = false;
  // 最後にコマンドを送信した時刻
  private lastSendAt = 0;

  public constructor(options: YaesuSerialIoOptions) {
    this.options = options;
  }

  /**
   * 無線機からデータを受信済みかを返す（起動時の応答タイムアウトの判定用）
   */
  public hasReceived(): boolean {
    return this.received;
  }

  /**
   * 受信状態を初期化する（接続の開始時に呼ぶ）
   */
  public reset(): void {
    this.received = false;
    this.recvBuffer = Buffer.alloc(0);
    this.pending = null;
    this.lastSendAt = 0;
  }

  /**
   * シリアルから受信したデータを処理する
   */
  public onRecv(data: Buffer): void {
    this.received = true;
    this.recvBuffer = Buffer.concat([this.recvBuffer, data]);

    // 固定長の応答を待っている場合は、指定のバイト数が揃うまで蓄積する
    const expectBytes = this.pending?.matcher.expectBytes;
    if (this.pending && expectBytes) {
      if (this.recvBuffer.length >= expectBytes) {
        const res = Buffer.from(this.recvBuffer.subarray(0, expectBytes));
        this.recvBuffer = Buffer.alloc(0);
        this.pending.resolve(res);
      }
      return;
    }

    // 上記以外は、機種ごとの規則でフレームを切り出し、応答待ちのフレームか、自動通知かを判定する
    const { frames, rest } = this.options.extractFrames(this.recvBuffer);
    this.recvBuffer = rest;
    for (const frame of frames) {
      const prefix = this.pending?.matcher.expectPrefix;
      if (this.pending && prefix && frame.toString("ascii").startsWith(prefix)) {
        this.pending.resolve(frame);
        continue;
      }
      this.options.onNotify(frame);
    }
  }

  /**
   * 応答を待たずに送信する
   * @returns 送信できた場合はtrue
   */
  public async send(bytes: Uint8Array): Promise<boolean> {
    await this.mutex.lock();
    try {
      return await this.doSend(bytes);
    } finally {
      this.mutex.unlock();
    }
  }

  /**
   * 送信し、応答を待つ
   * @returns 応答（バイト列）。送信に失敗した場合、およびタイムアウトした場合はnull
   */
  public async sendAndRecv(bytes: Uint8Array, matcher: YaesuRecvMatcher): Promise<Buffer | null> {
    await this.mutex.lock();
    try {
      // 固定長の応答の場合は、前回の取りこぼしが混在しないよう、受信バッファをクリアする
      if (matcher.expectBytes) {
        this.recvBuffer = Buffer.alloc(0);
      }

      // 応答待ちを設定してから送信する（送信直後の受信を取りこぼさないため）
      const received = new Promise<Buffer | null>((resolve) => {
        const timer = setTimeout(() => {
          this.pending = null;
          resolve(null);
        }, matcher.timeoutMs);
        this.pending = {
          matcher,
          resolve: (res) => {
            clearTimeout(timer);
            this.pending = null;
            resolve(res);
          },
        };
      });

      const isSent = await this.doSend(bytes);
      if (!isSent) {
        // 送信に失敗した場合は、応答待ちを取り消す
        this.pending?.resolve(null);
        return null;
      }

      return await received;
    } finally {
      this.mutex.unlock();
    }
  }

  /**
   * コマンド間隔を確保した上で、シリアル送信を行う
   */
  private async doSend(bytes: Uint8Array): Promise<boolean> {
    const delayMs = this.options.interCommandDelayMs ?? 0;
    if (delayMs > 0) {
      const waitMs = delayMs - (Date.now() - this.lastSendAt);
      if (waitMs > 0) {
        await CommonUtil.sleep(waitMs);
      }
    }

    try {
      const res = await this.options.send(bytes);
      this.lastSendAt = Date.now();
      return res.status;
    } catch (e) {
      AppMainLogger.warn(`無線機へのデータ送信に失敗しました。 ${String(e)}`);
      return false;
    }
  }
}
