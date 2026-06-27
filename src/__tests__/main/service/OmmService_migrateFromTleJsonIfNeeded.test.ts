import OmmService from "@/main/service/OmmService.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import FileUtil from "@/main/util/FileUtil.js";
import fs from "fs";
import os from "os";
import * as path from "path";

/**
 * OmmService - migrateFromTleJsonIfNeeded のテスト
 * tle.json -> omm.json への一度限りの移行処理を検証する
 */
describe("OmmService - migrateFromTleJsonIfNeeded", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "rst-omm-migrate-"));
    vi.spyOn(AppConfigUtil, "getTlePath").mockImplementation(() => path.join(workDir, "tle.json"));
    vi.spyOn(AppConfigUtil, "getOmmPath").mockImplementation(() => path.join(workDir, "omm.json"));
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("tle.jsonが存在し、omm.jsonが存在しない場合はomm.jsonに変換して保存する", () => {
    // Arrange
    const tleJson = {
      tleItemMap: {
        "25544": {
          id: "25544",
          name: "ISS (ZARYA)",
          epoch: 26171.41461525,
          line1: "1 25544U 98067A   26171.41461525  .00008813  00000+0  16600-3 0  9990",
          line2: "2 25544  51.6327 284.1189 0004557 208.5194 151.5545 15.49333088572250",
          isInLatestTLE: true,
        },
      },
    };
    fs.writeFileSync(path.join(workDir, "tle.json"), JSON.stringify(tleJson));

    // Act
    new OmmService().migrateFromTleJsonIfNeeded();

    // Assert
    const ommPath = path.join(workDir, "omm.json");
    expect(FileUtil.exists(ommPath)).toBe(true);
    const ommJson = FileUtil.readJson(ommPath);
    expect(ommJson.ommItemMap["25544"].objectName).toBe("ISS (ZARYA)");
    expect(ommJson.ommItemMap["25544"].noradCatId).toBe("25544");
    expect(ommJson.ommItemMap["25544"].meanMotion).toBeCloseTo(15.49333088, 8);
    expect(ommJson.ommItemMap["25544"].isInLatestOmm).toBe(true);
  });

  it("tle.jsonが存在しない場合は何もしない", () => {
    // Act
    new OmmService().migrateFromTleJsonIfNeeded();

    // Assert
    expect(FileUtil.exists(path.join(workDir, "omm.json"))).toBe(false);
  });

  it("omm.jsonが既に存在する場合は上書きしない", () => {
    // Arrange
    const tleJson = {
      tleItemMap: {
        "25544": {
          id: "25544",
          name: "ISS (ZARYA)",
          epoch: 26171.41461525,
          line1: "1 25544U 98067A   26171.41461525  .00008813  00000+0  16600-3 0  9990",
          line2: "2 25544  51.6327 284.1189 0004557 208.5194 151.5545 15.49333088572250",
          isInLatestTLE: true,
        },
      },
    };
    fs.writeFileSync(path.join(workDir, "tle.json"), JSON.stringify(tleJson));
    const existingOmm = { ommItemMap: {} };
    fs.writeFileSync(path.join(workDir, "omm.json"), JSON.stringify(existingOmm));

    // Act
    new OmmService().migrateFromTleJsonIfNeeded();

    // Assert
    const ommJson = FileUtil.readJson(path.join(workDir, "omm.json"));
    expect(ommJson).toEqual(existingOmm);
  });
});
