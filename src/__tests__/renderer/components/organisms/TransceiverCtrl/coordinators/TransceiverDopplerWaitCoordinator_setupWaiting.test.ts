import Constant from "@/common/Constant";
import type { ApiResponse } from "@/common/types/types";
import TransceiverDopplerWaitCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverDopplerWaitCoordinator";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("TransceiverDopplerWaitCoordinator.setupWaiting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("受信データがfalseの場合は待機状態にしないこと", () => {
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: true } as never);

    coordinator.setupWaiting({ data: false } as ApiResponse<boolean>);

    expect(coordinator.isWaiting).toBe(false);
  });

  it("AutoOff時は待機状態にしないこと", () => {
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: false } as never);

    coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);

    expect(coordinator.isWaiting).toBe(false);
  });

  it("AutoOn時は待機状態にして待機時間後に解除すること", () => {
    const infoSpy = vi.spyOn(AppRendererLogger, "info").mockImplementation(() => {});
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: true } as never);

    coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);

    expect(coordinator.isWaiting).toBe(true);

    vi.advanceTimersByTime(Constant.Transceiver.TRANSCEIVE_WAIT_MS);

    expect(coordinator.isWaiting).toBe(false);
    expect(infoSpy).toHaveBeenCalledWith("ダイヤル操作N秒経過したため待機を解除しました");
  });

  it("待機中に再度呼ばれた場合は旧タイマを破棄して待機を延長すること", () => {
    const infoSpy = vi.spyOn(AppRendererLogger, "info").mockImplementation(() => {});
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: true } as never);

    coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);
    vi.advanceTimersByTime(Constant.Transceiver.TRANSCEIVE_WAIT_MS - 1);
    coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);

    expect(infoSpy).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(infoSpy).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(Constant.Transceiver.TRANSCEIVE_WAIT_MS - 1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(coordinator.isWaiting).toBe(false);
  });
});
