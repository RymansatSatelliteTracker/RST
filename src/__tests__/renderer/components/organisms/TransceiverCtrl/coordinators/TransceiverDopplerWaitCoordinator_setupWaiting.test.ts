import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import type { ApiResponse } from "@/common/types/types.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import TransceiverDopplerWaitCoordinator from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverDopplerWaitCoordinator.js";
import AppRendererLogger from "@/renderer/util/AppRendererLogger.js";
import type { MockInstance } from "vitest";

describe("TransceiverDopplerWaitCoordinator.setupWaiting", () => {
  let getAppConfigSpy: MockInstance<() => Promise<AppConfigModel>>;

  function mockAppConfig(dopplerResumeDelaySec: string = "2"): AppConfigModel {
    const appConfig = new AppConfigModel();
    appConfig.transceiver.dopplerResumeDelaySec = dopplerResumeDelaySec;
    return appConfig;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    getAppConfigSpy = vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(mockAppConfig());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("受信データがfalseの場合は待機状態にしないこと", async () => {
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: true } as never);

    await coordinator.setupWaiting({ data: false } as ApiResponse<boolean>);

    expect(coordinator.isWaiting).toBe(false);
  });

  it("AutoOff時は待機状態にしないこと", async () => {
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: false } as never);

    await coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);

    expect(coordinator.isWaiting).toBe(false);
  });

  it("AutoOn時は待機状態にして設定秒数経過後に解除すること", async () => {
    getAppConfigSpy.mockResolvedValue(mockAppConfig("3"));
    const infoSpy = vi.spyOn(AppRendererLogger, "info").mockImplementation(() => {});
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: true } as never);

    await coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);

    expect(coordinator.isWaiting).toBe(true);

    vi.advanceTimersByTime(3000);

    expect(coordinator.isWaiting).toBe(false);
    expect(infoSpy).toHaveBeenCalledWith("ダイヤル操作3秒経過したため待機を解除しました");
  });

  it("待機中に再度呼ばれた場合は旧タイマを破棄して待機を延長すること", async () => {
    const infoSpy = vi.spyOn(AppRendererLogger, "info").mockImplementation(() => {});
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: true } as never);

    await coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);
    vi.advanceTimersByTime(1999);
    await coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);

    expect(infoSpy).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(infoSpy).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1999);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(coordinator.isWaiting).toBe(false);
  });

  it("設定値が不正な場合は既定値2秒を使用すること", async () => {
    getAppConfigSpy.mockResolvedValue(mockAppConfig("abc"));
    const coordinator = new TransceiverDopplerWaitCoordinator({ tranceiverAuto: true } as never);

    await coordinator.setupWaiting({ data: true } as ApiResponse<boolean>);
    expect(coordinator.isWaiting).toBe(true);

    vi.advanceTimersByTime(1999);
    expect(coordinator.isWaiting).toBe(true);

    vi.advanceTimersByTime(1);
    expect(coordinator.isWaiting).toBe(false);
  });
});
