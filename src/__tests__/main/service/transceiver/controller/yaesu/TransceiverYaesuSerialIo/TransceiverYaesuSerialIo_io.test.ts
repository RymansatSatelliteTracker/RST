import { ApiResponse } from "@/common/types/types.js";
import TransceiverYaesuFt991RecvParser from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991RecvParser.js";
import TransceiverYaesuSerialIo from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuSerialIo.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

/**
 * テスト用のIOを生成する
 * @param extractFrames フレームの切り出し（省略時はFT-991（;区切り））
 */
function createIo(
  opts: {
    interCommandDelayMs?: number;
    sendResult?: boolean;
    extractFrames?: (b: Buffer) => { frames: Buffer[]; rest: Buffer };
  } = {}
) {
  const sent: Buffer[] = [];
  const notified: string[] = [];
  const io = new TransceiverYaesuSerialIo({
    send: (bytes) => {
      sent.push(Buffer.from(bytes));
      return Promise.resolve(new ApiResponse<void>(opts.sendResult ?? true));
    },
    extractFrames: opts.extractFrames ?? ((b) => TransceiverYaesuFt991RecvParser.extractFrames(b)),
    onNotify: (frame) => notified.push(frame.toString("ascii")),
    interCommandDelayMs: opts.interCommandDelayMs,
  });
  return { io, sent, notified };
}

describe("TransceiverYaesuSerialIo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("send", () => {
    it("応答を待たずに送信し、送信できた場合はtrueを返すこと", async () => {
      const { io, sent } = createIo();

      const res = await io.send(Buffer.from("AI1;"));

      expect(res).toBe(true);
      expect(sent.map((b) => b.toString("ascii"))).toEqual(["AI1;"]);
    });

    it("送信に失敗した場合は、falseを返すこと", async () => {
      const { io } = createIo({ sendResult: false });

      expect(await io.send(Buffer.from("AI1;"))).toBe(false);
    });
  });

  describe("sendAndRecv（応答の先頭文字列で待ち受け）", () => {
    it("先頭が一致するフレームを受信した場合は、そのフレームを返すこと", async () => {
      const { io, sent } = createIo();

      const promise = io.sendAndRecv(Buffer.from("TX;"), { expectPrefix: "TX", timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      io.onRecv(Buffer.from("TX0;"));
      const res = await promise;

      expect(sent.map((b) => b.toString("ascii"))).toEqual(["TX;"]);
      expect(res?.toString("ascii")).toBe("TX0;");
    });

    it("応答が分割して受信された場合は、終端まで蓄積してから返すこと", async () => {
      const { io } = createIo();

      const promise = io.sendAndRecv(Buffer.from("TX;"), { expectPrefix: "TX", timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      io.onRecv(Buffer.from("T"));
      io.onRecv(Buffer.from("X"));
      io.onRecv(Buffer.from("1;"));

      expect((await promise)?.toString("ascii")).toBe("TX1;");
    });

    it("先頭が一致しないフレーム（自動通知）は、onNotifyへ渡し、目的の応答を待ち続けること", async () => {
      const { io, notified } = createIo();

      const promise = io.sendAndRecv(Buffer.from("IF;"), { expectPrefix: "IF", timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      io.onRecv(Buffer.from("FA145800000;MD02;"));
      io.onRecv(Buffer.from("IF001145800000+000000040000;"));
      const res = await promise;

      expect(notified).toEqual(["FA145800000;", "MD02;"]);
      expect(res?.toString("ascii")).toBe("IF001145800000+000000040000;");
    });

    it("応答がない場合は、タイムアウト時間の経過後にnullを返すこと", async () => {
      const { io } = createIo();

      const promise = io.sendAndRecv(Buffer.from("TX;"), { expectPrefix: "TX", timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(299);
      let isResolved = false;
      void promise.then(() => {
        isResolved = true;
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(isResolved).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(await promise).toBeNull();
    });

    it("送信に失敗した場合は、応答を待たずにnullを返すこと", async () => {
      const { io } = createIo({ sendResult: false });

      expect(await io.sendAndRecv(Buffer.from("TX;"), { expectPrefix: "TX", timeoutMs: 300 })).toBeNull();
    });

    it("応答待ちではない状態で受信したフレームは、onNotifyへ渡すこと", () => {
      const { io, notified } = createIo();

      io.onRecv(Buffer.from("FA145800000;?;"));

      expect(notified).toEqual(["FA145800000;", "?;"]);
    });
  });

  describe("sendAndRecv（応答の長さで待ち受け）", () => {
    it("指定のバイト数が揃った場合は、その長さの応答を返すこと", async () => {
      const { io } = createIo({ extractFrames: () => ({ frames: [], rest: Buffer.alloc(0) }) });

      const promise = io.sendAndRecv(Buffer.from([0, 0, 0, 0, 3]), { expectBytes: 5, timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      io.onRecv(Buffer.from([0x14, 0x58]));
      io.onRecv(Buffer.from([0x00, 0x00, 0x08]));

      expect(Array.from((await promise) ?? [])).toEqual([0x14, 0x58, 0x00, 0x00, 0x08]);
    });

    it("指定のバイト数を超えて受信した場合は、先頭から指定のバイト数のみを返すこと", async () => {
      const { io } = createIo({ extractFrames: () => ({ frames: [], rest: Buffer.alloc(0) }) });

      const promise = io.sendAndRecv(Buffer.from([0, 0, 0, 0, 0xf7]), { expectBytes: 1, timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      io.onRecv(Buffer.from([0x80, 0xff]));

      expect(Array.from((await promise) ?? [])).toEqual([0x80]);
    });

    it("前回の取りこぼしが受信バッファに残っていても、送信前にクリアして混在させないこと", async () => {
      const { io } = createIo({ extractFrames: () => ({ frames: [], rest: Buffer.alloc(0) }) });
      // 応答待ちではない状態で、中途半端なデータを受信しておく
      io.onRecv(Buffer.from([0x99]));

      const promise = io.sendAndRecv(Buffer.from([0, 0, 0, 0, 3]), { expectBytes: 2, timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      io.onRecv(Buffer.from([0x01, 0x02]));

      expect(Array.from((await promise) ?? [])).toEqual([0x01, 0x02]);
    });

    it("バイト数が揃わないまま、タイムアウトした場合は、nullを返すこと", async () => {
      const { io } = createIo({ extractFrames: () => ({ frames: [], rest: Buffer.alloc(0) }) });

      const promise = io.sendAndRecv(Buffer.from([0, 0, 0, 0, 3]), { expectBytes: 5, timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      io.onRecv(Buffer.from([0x14, 0x58]));
      await vi.advanceTimersByTimeAsync(300);

      expect(await promise).toBeNull();
    });
  });

  describe("排他制御・コマンド間隔・受信状態", () => {
    it("応答待ちのコマンドの完了前に、別の送信を呼び出した場合は、完了まで待機してから送信すること", async () => {
      const { io, sent } = createIo();

      const first = io.sendAndRecv(Buffer.from("TX;"), { expectPrefix: "TX", timeoutMs: 300 });
      await vi.advanceTimersByTimeAsync(0);
      const second = io.send(Buffer.from("AI1;"));
      await vi.advanceTimersByTimeAsync(100);
      expect(sent.map((b) => b.toString("ascii"))).toEqual(["TX;"]);

      io.onRecv(Buffer.from("TX0;"));
      await first;
      await second;

      expect(sent.map((b) => b.toString("ascii"))).toEqual(["TX;", "AI1;"]);
    });

    it("コマンド間隔が指定されている場合は、前回の送信から指定時間が経過するまで待機して送信すること", async () => {
      const { io, sent } = createIo({ interCommandDelayMs: 50 });

      await io.send(Buffer.from("A;"));
      const promise = io.send(Buffer.from("B;"));
      await vi.advanceTimersByTimeAsync(49);
      expect(sent).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1);
      await promise;
      expect(sent).toHaveLength(2);
    });

    it("hasReceived：データを受信するまではfalse、受信後はtrueを返し、resetで初期化されること", () => {
      const { io } = createIo();
      expect(io.hasReceived()).toBe(false);

      io.onRecv(Buffer.from("FA145800000;"));
      expect(io.hasReceived()).toBe(true);

      io.reset();
      expect(io.hasReceived()).toBe(false);
    });
  });
});
