import { ActiveSatelliteGroupModel } from "@/common/model/ActiveSatModel.js";
import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import ApiActiveSat from "@/renderer/api/ApiActiveSat.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import GroundStationServiceFactory from "@/renderer/common/util/GroundStationServiceFactory.js";
import OrbitLineServiceFactory from "@/renderer/common/util/OrbitLineServiceFactory.js";
import SatelliteServiceFactory from "@/renderer/common/util/SatelliteServiceFactory.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import type GroundStationService from "@/renderer/service/GroundStationService.js";
import type OrbitLineService from "@/renderer/service/OrbitLineService.js";
import type SatelliteService from "@/renderer/service/SatelliteService.js";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * テスト用の偽SatelliteServiceを生成する
 */
function fakeSat(name: string): SatelliteService {
  return { name } as unknown as SatelliteService;
}

/**
 * Hubが依存するAPI・ファクトリをモックする
 */
function mockEnvironment() {
  // IPCの変更通知コールバックを捕捉する
  let ipcCallback: (() => void) | null = null;
  const onChangeSpy = vi.spyOn(ApiActiveSat, "onChangeActiveSatelliteGroup").mockImplementation((cb) => {
    ipcCallback = cb as () => void;
  });
  // getSatIndex / getTransceiverSetting は早期returnさせる
  vi.spyOn(ApiActiveSat, "getActiveSatelliteGroup").mockResolvedValue(new ActiveSatelliteGroupModel());
  vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue({
    groundStation: { lat: 0, lon: 0, height: 0 },
    groundStation2: { enable: false, lat: 0, lon: 0, height: 0 },
  } as unknown as AppConfigModel);
  vi.spyOn(SatelliteServiceFactory, "createBySatGroup").mockResolvedValue([]);
  vi.spyOn(OrbitLineServiceFactory, "create").mockImplementation((sat) =>
    Promise.resolve({ sat } as unknown as OrbitLineService)
  );
  vi.spyOn(GroundStationServiceFactory, "create").mockResolvedValue({} as unknown as GroundStationService);

  return { onChangeSpy, fireIpc: () => ipcCallback?.() };
}

describe("ActiveSatServiceHub.start", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初回取得より前にIPCの変更通知リスナを登録すること", async () => {
    const { onChangeSpy } = mockEnvironment();
    const createSpy = vi.spyOn(SatelliteServiceFactory, "createByActiveSat").mockResolvedValue(fakeSat("sat1"));

    await ActiveSatServiceHub.getInstance().start();

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy.mock.invocationCallOrder[0]).toBeLessThan(createSpy.mock.invocationCallOrder[0]);
  });

  it("初回取得中に変更通知が来ても直列に処理し、最後の通知時点の衛星が最終状態になること", async () => {
    const { fireIpc } = mockEnvironment();
    const sat1 = fakeSat("sat1");
    const sat2 = fakeSat("sat2");

    // 初回取得（変更前の2つ目の衛星）は、変更通知の後に解決させる
    let resolveFirst: (sat: SatelliteService) => void = () => {};
    const first = new Promise<SatelliteService>((resolve) => {
      resolveFirst = resolve;
    });
    const createSpy = vi
      .spyOn(SatelliteServiceFactory, "createByActiveSat")
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(sat1);

    const hub = ActiveSatServiceHub.getInstance();
    const callback = vi.fn();
    hub.addOnChangeActiveSat(callback);

    const startPromise = hub.start();
    await vi.waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));

    // 初回取得中に、他コンポーネントがアクティブ衛星を1つ目に変更した通知が届く
    fireIpc();
    await Promise.resolve();

    // 初回取得が完了するまで2回目は開始しない（直列）
    expect(createSpy).toHaveBeenCalledTimes(1);

    resolveFirst(sat2);
    await startPromise;
    await vi.waitFor(() => expect(createSpy).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));

    // 最終状態は変更後の1つ目の衛星
    expect(hub.getSatService()).toBe(sat1);
    expect(hub.getOrbitLineService()).toEqual({ sat: sat1 });
  });
});
