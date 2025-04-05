import Constant from "@/common/Constant";
import { DefaultSatelliteModel } from "@/common/model/DefaultSatelliteModel";
import { TleItemMap } from "@/common/model/TleModel";
import { DefaultSatelliteType } from "@/common/types/satelliteSettingTypes";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import FileUtil from "@/main/util/FileUtil";
import * as path from "path";

describe("DefaultSatelliteModel", () => {
  function getLatestTLE(): TleItemMap {
    const savePathTle = AppConfigUtil.getTlePath();
    const tleData = FileUtil.readJson(savePathTle);

    const tleItemMap: TleItemMap = tleData.tleItemMap;
    const retTleItemMap: TleItemMap = {};
    Object.values(tleItemMap).forEach((tleItem) => {
      if (tleItem.isInLatestTLE) {
        retTleItemMap[tleItem.id] = tleItem;
      }
    });
    return retTleItemMap;
  }

  beforeAll(() => {
    const TEST_HOME_DIR = path.resolve(__dirname, "data_DefaultSatelliteModel");
    // 設定ファイルが扱えないため
    jest.spyOn(AppConfigUtil, "getTlePath").mockImplementation(() => {
      return path.join(TEST_HOME_DIR, Constant.Tle.TLE_FILENAME);
    });
  });
  /**
   * 正常系:引数1つ
   */
  test("デフォルト衛星定義追加(NORADIDなし)", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    // Act
    const ret = defSatModel.addSatellite("test");
    // Assert
    expect(ret).not.toBe(-1);
  });

  /**
   * 正常系:引数2つ
   */
  test("デフォルト衛星定義追加(NORADIDあり)", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    // Act
    const ret = defSatModel.addSatellite("test", "1");
    // Assert
    expect(ret).not.toBe(-1);
  });

  /**
   * 正常系:登録済み
   */
  test("デフォルト衛星定義登録済みの場合更新しない", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    defSatModel.addSatellite("test", "1");
    // Act
    const ret = defSatModel.addSatellite("test", "1");
    // Assert
    expect(ret).toBe(-1);
  });

  /**
   * 正常系:JSON取得
   */
  test("JSON形式で取得", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    defSatModel.addSatellite("test", "00001");
    // Act
    const ret = defSatModel.getJsonString();
    // Assert
    const json = JSON.parse(ret);
    expect(json).toHaveProperty("defaultSatellite");
    expect(json).toHaveProperty("defaultSatellite.defaultSatellites");
    expect(json).toHaveProperty("defaultSatellite.maxSatelliteId");
    expect(json).toHaveProperty("defaultSatellite.registeredNoradIds");
  });

  /**
   * 正常系:getSatelliteIdenfier
   */
  test("SatelliteIdenfierの取得", () => {
    // Arrange
    const tle = getLatestTLE();
    const defSatModel = new DefaultSatelliteModel();
    defSatModel.addSatellite("test", "00001");
    // Act
    const satId = defSatModel.getSatelliteIdentifer(tle);
    // Assert
    expect(satId.length).toBe(1);
    expect(satId[0]).toHaveProperty("satelliteId");
    expect(satId[0]).toHaveProperty("satelliteName");
  });

  /**
   * 正常系:getDefaultSatelliteBySatelliteId
   */
  test("衛星IDを指定してデフォルト衛星定義が取得できる", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    defSatModel.addSatellite("test", "1");
    // Act
    const ret = defSatModel.getDefaultSatelliteBySatelliteId(0);
    // Assert
    expect(ret?.satelliteName).toBe("test");
  });

  /**
   * 異常系:getDefaultSatelliteBySatelliteId
   * 存在しない衛星ID
   */
  test("衛星IDが存在しない場合デフォルト衛星定義は取得できない", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    defSatModel.addSatellite("test", "1");
    // Act
    const ret = defSatModel.getDefaultSatelliteBySatelliteId(1);
    // Assert
    expect(ret).toBe(null);
  });

  /**
   * 正常系:ユーザ定義なし
   * ユーザ定義がないものはデフォルト衛星が削除される
   */
  test("ユーザ定義がないものはデフォルト衛星が削除される", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    defSatModel.addSatellite("test", "1");
    // Act
    defSatModel.refreshDefaultSatelliteModel([]);
    // Assert
    expect(defSatModel.getDefaultSatelliteBySatelliteId(1)).toBe(null);
  });

  /**
   * 正常系:ユーザ定義あり
   * ユーザ定義があるものはデフォルト衛星が保持される
   * ユーザ定義がないものはデフォルト衛星が削除される
   */
  test("ユーザ定義があるものはデフォルト衛星が保持される", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    defSatModel.addSatellite("test", "0");
    // Act
    defSatModel.refreshDefaultSatelliteModel([0, 2]);
    // Assert
    // ユーザ定義があるものはデフォルト衛星が保持される
    expect(defSatModel.getDefaultSatelliteBySatelliteId(0)?.noradId).toBe("0");
  });

  /**
   * デフォルト衛星情報を上書きする
   */
  test("デフォルト衛星情報を上書きする", () => {
    // Arrange
    const defSatModel = new DefaultSatelliteModel();
    // 先に追加しておく
    defSatModel.addSatellite("test", "10");
    // 上書き用のデータ
    const overwriteDefSat: DefaultSatelliteType = {
      satelliteId: 0,
      satelliteName: "overwrite",
      noradId: "10",
      uplink1: { uplinkHz: null, uplinkMode: "" },
      uplink2: { uplinkHz: null, uplinkMode: "" },
      downlink1: { downlinkHz: null, downlinkMode: "" },
      downlink2: { downlinkHz: null, downlinkMode: "" },
      toneMhz: null,
      outline: "",
    };
    // Act
    defSatModel.updateSatellites([overwriteDefSat]);
    // Assert
    expect(defSatModel.getDefaultSatelliteBySatelliteId(0)?.satelliteName).toBe("overwrite");
  });
});
