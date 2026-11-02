import TransceiverWaitTimer from "@/main/service/transceiver/controller/TransceiverWaitTimer.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("TransceiverWaitTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期状態では一時停止していないこと", () => {
    expect(new TransceiverWaitTimer().isWaiting()).toBe(false);
  });

  it("startで一時停止状態になり、指定時間が経過すると解除されること", async () => {
    const timer = new TransceiverWaitTimer();

    timer.start(2000);
    expect(timer.isWaiting()).toBe(true);

    await vi.advanceTimersByTimeAsync(1999);
    expect(timer.isWaiting()).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    expect(timer.isWaiting()).toBe(false);
  });

  it("一時停止中に再度startした場合は、再度startした時点から数え直して延長されること", async () => {
    const timer = new TransceiverWaitTimer();
    timer.start(2000);
    await vi.advanceTimersByTimeAsync(1500);

    timer.start(2000);
    // 最初のstartからは2000msを過ぎるが、再startから数えると待機中
    await vi.advanceTimersByTimeAsync(1500);
    expect(timer.isWaiting()).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    expect(timer.isWaiting()).toBe(false);
  });

  it("再startで短い時間を指定した場合は、短い時間で解除されること", async () => {
    const timer = new TransceiverWaitTimer();
    timer.start(5000);

    timer.start(1000);
    await vi.advanceTimersByTimeAsync(1000);

    expect(timer.isWaiting()).toBe(false);
  });

  it("releaseで一時停止が即時に解除されること", () => {
    const timer = new TransceiverWaitTimer();
    timer.start(2000);

    timer.release();

    expect(timer.isWaiting()).toBe(false);
  });

  it("release後は、元のタイマーが満了しても、その後にstartした一時停止を解除しないこと", async () => {
    const timer = new TransceiverWaitTimer();
    timer.start(1000);
    timer.release();

    await vi.advanceTimersByTimeAsync(500);
    timer.start(1000);
    // 最初のstartの満了時刻（1000ms）を過ぎても、再startの一時停止は継続している
    await vi.advanceTimersByTimeAsync(700);

    expect(timer.isWaiting()).toBe(true);
  });

  it("一時停止していない状態でreleaseしても問題ないこと", () => {
    const timer = new TransceiverWaitTimer();

    expect(() => timer.release()).not.toThrow();
    expect(timer.isWaiting()).toBe(false);
  });
});
