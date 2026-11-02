import TransceiverLock from "@/main/service/transceiver/controller/TransceiverLock.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockWarn = vi.hoisted(() => vi.fn());
vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: mockWarn, error: vi.fn() },
}));

describe("TransceiverLock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockWarn.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期状態ではロックされていないこと", () => {
    expect(new TransceiverLock().isLocked()).toBe(false);
  });

  it("ロックされていない場合は、待機せずにロックを取得できること", async () => {
    const lock = new TransceiverLock();

    await lock.acquire(1);

    expect(lock.isLocked()).toBe(true);
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it("releaseでロックを解放できること", async () => {
    const lock = new TransceiverLock();
    await lock.acquire(1);

    lock.release();

    expect(lock.isLocked()).toBe(false);
  });

  it("ロック中の再取得は、解放されるまで待機し、解放後にロックを取得すること", async () => {
    const lock = new TransceiverLock();
    await lock.acquire(1);

    let acquired = false;
    const second = lock.acquire(2).then(() => {
      acquired = true;
    });

    // 解放前は待機している
    await vi.advanceTimersByTimeAsync(500);
    expect(acquired).toBe(false);

    // 解放すると、次の待機間隔（10ms）の後に取得される
    lock.release();
    await vi.advanceTimersByTimeAsync(20);
    await second;

    expect(acquired).toBe(true);
    expect(lock.isLocked()).toBe(true);
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it("3秒待っても解放されない場合は、警告ログを出力した上で、ロックを取得すること", async () => {
    const lock = new TransceiverLock();
    await lock.acquire(1);

    let acquired = false;
    const second = lock.acquire(2).then(() => {
      acquired = true;
    });

    await vi.advanceTimersByTimeAsync(2900);
    expect(acquired).toBe(false);

    await vi.advanceTimersByTimeAsync(200);
    await second;

    expect(acquired).toBe(true);
    expect(lock.isLocked()).toBe(true);
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn).toHaveBeenCalledWith("2: ロック取得タイムアウト");
  });

  it("複数の取得要求が重なった場合でも、取得処理自体は1件ずつ順に行われること", async () => {
    const lock = new TransceiverLock();
    const order: number[] = [];

    const first = lock.acquire(1).then(() => order.push(1));
    const second = lock.acquire(2).then(() => order.push(2));
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual([1]);

    lock.release();
    await vi.advanceTimersByTimeAsync(20);
    await Promise.all([first, second]);

    expect(order).toEqual([1, 2]);
  });
});
