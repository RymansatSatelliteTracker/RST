import { OmmItem } from "@/common/model/OmmModel.js";
import type { OmmItemMap } from "@/common/model/OmmModel.js";
import OmmService from "@/main/service/OmmService.js";

/**
 * 試験用のOmmItemを生成する
 */
function makeOmmItem(noradCatId: string, epoch: string, isInLatestOmm: boolean): OmmItem {
  const item = new OmmItem();
  item.noradCatId = noradCatId;
  item.objectName = `name-${noradCatId}`;
  item.epoch = epoch;
  item.isInLatestOmm = isInLatestOmm;
  return item;
}

/**
 * OmmService - mergeOmmData のテスト
 */
describe("OmmService - mergeOmmData", () => {
  /**
   * 取得データなし
   * 保持データなし
   */
  it("empty_omm", () => {
    const ommService = new OmmService();
    const result = ommService["mergeOmmData"]([], {});
    expect(result).toEqual({});
  });

  /**
   * 取得データなし
   * 保持データあり
   * memo: 取得データがなければ既存データのisInLatestOmmフラグは一旦falseに落とされる
   */
  it("既存データのみの場合、フラグが落ちる", () => {
    const ommService = new OmmService();
    const baseMap: OmmItemMap = { "1": makeOmmItem("1", "2024-01-01T00:00:00.000Z", true) };

    const result = ommService["mergeOmmData"]([], baseMap);

    expect(result["1"].isInLatestOmm).toBe(false);
  });

  /**
   * 取得データが1件(新規追加)
   * 保持データあり
   */
  it("新規のNoradIDが追加される", () => {
    const ommService = new OmmService();
    const baseMap: OmmItemMap = { "1": makeOmmItem("1", "2024-01-01T00:00:00.000Z", true) };
    const newItem = makeOmmItem("2", "2024-02-01T00:00:00.000Z", true);

    const result = ommService["mergeOmmData"]([[newItem]], baseMap);

    expect(result["1"].isInLatestOmm).toBe(false);
    expect(result["2"]).toEqual(newItem);
  });

  /**
   * 取得データが既存より新しいエポック(更新)
   */
  it("エポックが新しい場合は上書きされる", () => {
    const ommService = new OmmService();
    const baseMap: OmmItemMap = { "1": makeOmmItem("1", "2024-01-01T00:00:00.000Z", true) };
    const newItem = makeOmmItem("1", "2024-06-01T00:00:00.000Z", true);

    const result = ommService["mergeOmmData"]([[newItem]], baseMap);

    expect(result["1"].epoch).toBe("2024-06-01T00:00:00.000Z");
    expect(result["1"].isInLatestOmm).toBe(true);
  });

  /**
   * 取得データが既存より古いエポック(更新しない、フラグのみ立つ)
   */
  it("エポックが古い場合は上書きされないがフラグは立つ", () => {
    const ommService = new OmmService();
    const baseMap: OmmItemMap = { "1": makeOmmItem("1", "2024-06-01T00:00:00.000Z", false) };
    const oldItem = makeOmmItem("1", "2024-01-01T00:00:00.000Z", true);

    const result = ommService["mergeOmmData"]([[oldItem]], baseMap);

    expect(result["1"].epoch).toBe("2024-06-01T00:00:00.000Z");
    expect(result["1"].isInLatestOmm).toBe(true);
  });

  /**
   * 複数URL(複数グループ)分のデータがマージされる
   */
  it("複数URL分のデータがすべてマージされる", () => {
    const ommService = new OmmService();
    const itemsUrl1 = [makeOmmItem("1", "2024-01-01T00:00:00.000Z", true)];
    const itemsUrl2 = [makeOmmItem("2", "2024-02-01T00:00:00.000Z", true)];

    const result = ommService["mergeOmmData"]([itemsUrl1, itemsUrl2], {});

    expect(Object.keys(result).sort()).toEqual(["1", "2"]);
  });

  /**
   * noradCatIdが空の場合は無視される
   */
  it("noradCatIdが空の場合は無視される", () => {
    const ommService = new OmmService();
    const invalidItem = makeOmmItem("", "2024-01-01T00:00:00.000Z", true);

    const result = ommService["mergeOmmData"]([[invalidItem]], {});

    expect(result).toEqual({});
  });
});
