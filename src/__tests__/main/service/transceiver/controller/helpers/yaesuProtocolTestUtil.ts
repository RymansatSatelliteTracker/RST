import { ApiResponse } from "@/common/types/types.js";
import type { TransceiverYaesuProtocol } from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuProtocol.js";
import TransceiverYaesuSerialIo from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuSerialIo.js";
import { vi } from "vitest";

/**
 * 送信データに対する、無線機の応答を返す関数（応答がない場合は空配列）
 */
export type YaesuResponder = (sent: Buffer) => Buffer[];

/**
 * Protocolのテスト用のIO（送信履歴を記録し、無線機の応答を模擬する）
 * - コマンド間隔は設けない（Protocolのシーケンスのみを検証するため）。
 * - 応答は、送信の直後（マイクロタスク）に受信データとして注入する。
 */
export function createProtocolIo(protocol: TransceiverYaesuProtocol, responder: YaesuResponder = () => []) {
  const sent: Buffer[] = [];
  const notified: Buffer[] = [];

  const io: TransceiverYaesuSerialIo = new TransceiverYaesuSerialIo({
    send: (bytes) => {
      const buf = Buffer.from(bytes);
      sent.push(buf);
      for (const reply of responder(buf)) {
        void Promise.resolve().then(() => io.onRecv(reply));
      }
      return Promise.resolve(new ApiResponse<void>(true));
    },
    extractFrames: (buffer) => protocol.extractFrames(buffer),
    onNotify: (frame) => notified.push(frame),
    interCommandDelayMs: 0,
  });

  return {
    io,
    sent,
    notified,
    /** 送信履歴を、ASCII文字列の配列で返す（FT-991用） */
    sentAscii: () => sent.map((b) => b.toString("ascii")),
    /** 送信履歴を、16進数文字列の配列で返す（FT-897用） */
    sentHex: () => sent.map((b) => b.toString("hex")),
    /** 送信履歴をクリアする */
    clearSent: () => {
      sent.length = 0;
    },
  };
}

/**
 * 保留中のタイマー（応答待ちのタイムアウト、待ち時間）を進めながら、処理の完了を待つ
 * @param promise 完了を待つ処理
 * @param stepMs 1回に進める時間（ミリ秒）
 */
export async function runWithTimers<T>(promise: Promise<T>, stepMs = 100): Promise<T> {
  let isDone = false;
  // 時間を進めている間に、処理が失敗しても、未処理の拒否とならないよう、結果を受け取っておく
  const settled = promise.then(
    (value) => ({ isOk: true as const, value }),
    (error: unknown) => ({ isOk: false as const, error })
  );
  void settled.then(() => {
    isDone = true;
  });
  // 完了するまで、時間を進める（無限ループを避けるため、上限を設ける）
  for (let i = 0; i < 100 && !isDone; i++) {
    await vi.advanceTimersByTimeAsync(stepMs);
  }

  const result = await settled;
  if (!result.isOk) {
    throw result.error;
  }
  return result.value;
}
