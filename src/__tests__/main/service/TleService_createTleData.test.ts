import { TleItemMap } from "@/common/model/TleModel";
import TleService from "@/main/service/TleService";

/**
 * TleService_createTleData のテスト
 */
describe("TleService - createTleData", () => {
  /**
   * TLEがブランク
   * 保持TLEもブランク
   */
  test("empty_tle", () => {
    const tleService = new TleService();
    let result = tleService["createTleData"]("", {});
    expect(result).toEqual({});

    result = tleService["createTleData"](undefined!, {});
    expect(result).toEqual({});

    result = tleService["createTleData"](null!, {});
    expect(result).toEqual({});
  });

  /**
   * TLEがブランク
   * 保持TLEあり
   */
  test("add_tle", () => {
    const tleService = new TleService();
    const tleText = "";
    const tleItemMap: TleItemMap = {};
    tleItemMap["1"] = { id: "1", name: "name1", epoch: 111, line1: "line1", line2: "line2", isInLatestTLE: false };

    const resultTleItemMap = tleService["createTleData"](tleText, tleItemMap);
    expect(resultTleItemMap).toEqual(tleItemMap);
  });

  /**
   * TLEが１つ（追加）
   * 保持TLEあり
   */
  test("add_tle", () => {
    const tleService = new TleService();
    const tleText = `name2
1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN
line2-2
`;
    const tleTextRn = tleText.replace(/\n/g, "\r\n");

    const tleItemMap: TleItemMap = {};
    tleItemMap["1"] = { id: "1", name: "name1", epoch: 111, line1: "line1", line2: "line2", isInLatestTLE: true };

    const resultTleItemMap = tleService["createTleData"](tleTextRn, tleItemMap);
    expect(resultTleItemMap).toEqual({
      "1": { id: "1", name: "name1", epoch: 111, line1: "line1", line2: "line2", isInLatestTLE: false },
      B2BBB: {
        id: "B2BBB",
        name: "name2",
        epoch: 21211.11111111,
        line1: "1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN",
        line2: "line2-2",
        isInLatestTLE: true,
      },
    });
  });

  /**
   * TLEが２つ（追加）
   * 保持TLEあり
   */
  test("add_tle", () => {
    const tleService = new TleService();
    const tleText = `name2
1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN
line2-2
name3
1 B3BBBC DDEEEFFF 31311.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN
line3-2
`;
    const tleTextRn = tleText.replace(/\n/g, "\r\n");

    const tleItemMap: TleItemMap = {};
    tleItemMap["1"] = { id: "1", name: "name1", epoch: 111, line1: "line1", line2: "line2", isInLatestTLE: true };

    const resultTleItemMap = tleService["createTleData"](tleTextRn, tleItemMap);
    expect(resultTleItemMap).toEqual({
      "1": { id: "1", name: "name1", epoch: 111, line1: "line1", line2: "line2", isInLatestTLE: false },
      B2BBB: {
        id: "B2BBB",
        name: "name2",
        epoch: 21211.11111111,
        line1: "1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN",
        line2: "line2-2",
        isInLatestTLE: true,
      },
      B3BBB: {
        id: "B3BBB",
        name: "name3",
        epoch: 31311.11111111,
        line1: "1 B3BBBC DDEEEFFF 31311.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN",
        line2: "line3-2",
        isInLatestTLE: true,
      },
    });
  });

  /**
   * TLEが１つ（変更）
   * 保持TLEあり
   */
  test("add_tle", () => {
    const tleService = new TleService();
    const tleText = `name2
1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN
line2-2
`;
    const tleTextRn = tleText.replace(/\n/g, "\r\n");

    const tleItemMap: TleItemMap = {};
    tleItemMap["B2BBB"] = {
      id: "B2BBB",
      name: "oldname1",
      epoch: 999,
      line1: "line1-999",
      line2: "line2-999",
      isInLatestTLE: true,
    };

    const resultTleItemMap = tleService["createTleData"](tleTextRn, tleItemMap);
    expect(resultTleItemMap).toEqual({
      B2BBB: {
        id: "B2BBB",
        name: "name2",
        epoch: 21211.11111111,
        line1: "1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN",
        line2: "line2-2",
        isInLatestTLE: true,
      },
    });
  });

  /**
   * TLEが２つ（変更、追加）
   * 保持TLEあり
   */
  test("add_tle", () => {
    const tleService = new TleService();
    const tleText = `name2
1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN
line2-2
name3
1 B3BBBC DDEEEFFF 31311.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN
line3-2
`;
    const tleTextRn = tleText.replace(/\n/g, "\r\n");

    const tleItemMap: TleItemMap = {};
    tleItemMap["B2BBB"] = {
      id: "B2BBB",
      name: "oldname1",
      epoch: 999,
      line1: "line1-999",
      line2: "line2-999",
      isInLatestTLE: true,
    };

    const resultTleItemMap = tleService["createTleData"](tleTextRn, tleItemMap);
    expect(resultTleItemMap).toEqual({
      B2BBB: {
        id: "B2BBB",
        name: "name2",
        epoch: 21211.11111111,
        line1: "1 B2BBBC DDEEEFFF 21211.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN",
        line2: "line2-2",
        isInLatestTLE: true,
      },
      B3BBB: {
        id: "B3BBB",
        name: "name3",
        epoch: 31311.11111111,
        line1: "1 B3BBBC DDEEEFFF 31311.11111111 +.IIIIIIII +JJJJJ-J +KKKKK-K L MMMMN",
        line2: "line3-2",
        isInLatestTLE: true,
      },
    });
  });
});
