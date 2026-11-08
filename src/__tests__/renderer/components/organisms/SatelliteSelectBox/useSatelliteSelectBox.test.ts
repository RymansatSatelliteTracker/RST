import { ActiveSatelliteGroupModel, ActiveSatelliteModel } from "@/common/model/ActiveSatModel.js";
import type { AppConfigModel } from "@/common/model/AppConfigModel.js";
import type { OmmItem } from "@/common/model/OmmModel.js";
import ApiActiveSat from "@/renderer/api/ApiActiveSat.js";
import ApiAppConfig from "@/renderer/api/ApiAppConfig.js";
import ActiveSatHelper from "@/renderer/common/util/ActiveSatHelper.js";
import useSatelliteSelectBox from "@/renderer/components/organisms/SatelliteSelectBox/useSatelliteSelectBox.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import type { SelectOption } from "@/renderer/types/vue-types.js";
import { createPinia } from "pinia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, ref, type App, type Ref } from "vue";

const GROUP_ID = 1;

/**
 * 衛星グループ情報を生成する
 */
function createSatGrp(mainSatId: number): ActiveSatelliteGroupModel {
  const grp = new ActiveSatelliteGroupModel();
  grp.activeSatelliteGroupId = GROUP_ID;
  grp.mainSatelliteId = mainSatId;
  grp.mainSatelliteOmm = {} as OmmItem;
  return grp;
}

/**
 * 衛星リストを生成する
 */
function createSats(satIds: number[]): ActiveSatelliteModel[] {
  return satIds.map((satId) => {
    const sat = new ActiveSatelliteModel();
    sat.satelliteId = satId;
    sat.satelliteName = `SAT${satId}`;
    return sat;
  });
}

let app: App | null = null;

/**
 * フックをマウントする
 */
function mountHook(): { items: Ref<SelectOption[]>; selectedSatId: Ref<number | undefined> } {
  const items = ref<SelectOption[]>([]);
  const holder: { selectedSatId?: Ref<number | undefined> } = {};
  app = createApp({
    setup() {
      holder.selectedSatId = useSatelliteSelectBox(items).selectedSatId;
      return () => null;
    },
  });
  app.use(createPinia());
  app.mount(document.createElement("div"));
  return { items, selectedSatId: holder.selectedSatId! };
}

/**
 * フックが依存するAPIをモックする
 */
function mockEnvironment(mainSatId: number, satIds: number[]) {
  vi.spyOn(ActiveSatServiceHub.getInstance(), "addOnChangeActiveSat").mockImplementation(() => {});
  vi.spyOn(ApiActiveSat, "getActiveSatelliteGroup").mockResolvedValue(createSatGrp(mainSatId));
  vi.spyOn(ActiveSatHelper, "fetchActiveSats").mockResolvedValue(createSats(satIds));
  const appConfig = { mainDisplay: { activeSatelliteId: mainSatId } } as unknown as AppConfigModel;
  vi.spyOn(ApiAppConfig, "getAppConfig").mockResolvedValue(appConfig);
  const storeSpy = vi.spyOn(ApiAppConfig, "storeAppConfig").mockResolvedValue(undefined as never);
  const refreshSpy = vi.spyOn(ApiActiveSat, "refreshAppConfig").mockResolvedValue();
  return { appConfig, storeSpy, refreshSpy };
}

describe("useSatelliteSelectBox 起動時の選択復元", () => {
  afterEach(() => {
    app?.unmount();
    app = null;
    vi.restoreAllMocks();
  });

  it("保存済みのアクティブ衛星（2つ目）を選択し、AppConfigを更新しないこと", async () => {
    const { storeSpy, refreshSpy } = mockEnvironment(20, [10, 20, 30]);

    const { items, selectedSatId } = mountHook();
    await vi.waitFor(() => expect(items.value).toHaveLength(3));
    await vi.waitFor(() => expect(selectedSatId.value).toBe(20));

    expect(storeSpy).not.toHaveBeenCalled();
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it("保存済みのアクティブ衛星が選択肢にない場合は先頭を選択し、AppConfigを更新すること", async () => {
    const { appConfig, storeSpy, refreshSpy } = mockEnvironment(99, [10, 20, 30]);

    const { items, selectedSatId } = mountHook();
    await vi.waitFor(() => expect(items.value).toHaveLength(3));
    await vi.waitFor(() => expect(refreshSpy).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(selectedSatId.value).toBe(10));

    expect(storeSpy).toHaveBeenCalledTimes(1);
    expect(appConfig.mainDisplay.activeSatelliteId).toBe(10);
  });
});
