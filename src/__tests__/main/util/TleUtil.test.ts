import TleUtil from "@/main/util/TleUtil";

/**
 * [正常系]
 * TLEの1行目からNoradIDが取得できる
 */
describe("[正常系]TLEの1行目からNoradIDが取得できる", () => {
  it("TLEの1行目からNoradIDが取得できる", () => {
    // given 前提条件
    const line1 = "1 25544U 98067A   24274.40627631  .00013723  00000-0  24831-3 0  9995";
    // when 実行
    const noradId = TleUtil.getNoradId(line1);
    // then 結果
    expect(noradId).toBe("25544");
  });
});

/**
 * [正常系]
 * TLEの1行目からエポック日時が取得できる
 */
describe("[正常系]TLEの1行目からエポック日時が取得できる", () => {
  it("TLEの1行目からエポック日時が取得できる", () => {
    // given 前提条件
    const line1 = "1 25544U 98067A   24274.40627631  .00013723  00000-0  24831-3 0  9995";
    // when 実行
    const epochDate = TleUtil.getEpochDate(line1);
    // then 結果
    expect(epochDate).toBeCloseTo(24274.40627631, 8);
  });
});

/**
 * [正常系]
 * 軌道長半径から平均運動を計算できる
 */
describe("[正常系]軌道長半径から平均運動を計算できる", () => {
  it("軌道長半径から平均運動を計算できる", () => {
    // given 前提条件
    const semiMajorAxisKm = 6780;
    // when 実行
    const meanMotion = TleUtil.calculateMeanMotion(semiMajorAxisKm);
    // then 結果
    expect(meanMotion).toBe("15.55101413");
  });
});

/**
 * [正常系]
 * TLEの0行目から人工衛星の名称が取得できる
 */
describe("[正常系]TLEの0行目から人工衛星の名称が取得できる", () => {
  it("TLEの0行目から人工衛星の名称が取得できる", () => {
    // given 前提条件
    const line0 = "ISS (ZARYA)";
    // when 実行
    const name = TleUtil.getName(line0);
    // then 結果
    expect(name).toBe("ISS (ZARYA)");
  });
});

/**
 * [正常系]
 * 軌道要素の元期がTLEのフォーマットに変換できる
 */
describe("[正常系]軌道要素の元期がTLEのフォーマットに変換できる", () => {
  it("軌道要素の元期がTLEのフォーマットに変換できる", () => {
    // given 前提条件
    const date = new Date(Date.UTC(2021, 9, 2, 14, 15, 16)); // 2021年10月2日14:15:16 UTC
    // when 実行
    const formattedEpoch = TleUtil.formatEpoch(date);
    // then 結果
    expect(formattedEpoch).toBe("21275.59393519");
  });
});

/**
 * [正常系]
 * B*抗力項がTLEのフォーマットに変換できる
 */
describe("[正常系]B*抗力項がTLEのフォーマットに変換できる", () => {
  it("B*抗力項が0の場合に'00000+0'を返す", () => {
    // given 前提条件
    const bStar = 0;
    // when 実行
    const result = TleUtil.formatBStar(bStar);
    // then 結果
    expect(result).toBe("00000+0");
  });

  it("B*抗力項が正の場合にTLEのフォーマットを返す", () => {
    // given 前提条件
    const bStar = 0.00012345;
    // when 実行
    const result = TleUtil.formatBStar(bStar);
    // then 結果
    expect(result).toBe("12345-4");
  });
});

/**
 * [正常系]
 * TLE文字列のチェックサムを計算できる
 */
describe("[正常系]TLE文字列のチェックサムを計算できる", () => {
  it("TLE文字列のチェックサムを計算できる", () => {
    // given 前提条件
    const line = "1 25544U 98067A   24274.40627631  .00013723  00000-0  24831-3 0   999";
    // when 実行
    const checksum = TleUtil.calculateChecksum(line);
    // then 結果
    expect(checksum).toBe("5");
  });
});

/**
 * [正常系]
 * 軌道要素からTLE文字列が生成できる
 */
describe("[正常系]軌道要素からTLE文字列が生成できる", () => {
  it("軌道要素からTLE文字列が生成できる", () => {
    // given 前提条件
    const orbitElement = {
      satelliteName: "ISS (ZARYA)",
      noradId: "25544",
      epochUtcDate: new Date(Date.UTC(2021, 9, 2, 14, 15, 16)),
      semiMajorAxisKm: 6780,
      inclinationDeg: 51.6442,
      raanDeg: 247.4627,
      eccentricity: 0.0006703,
      argumentOfPerigeeDeg: 130.536,
      meanAnomalyDeg: 325.0288,
      bStar: 0.00012345,
    };
    // when 実行
    const tle = TleUtil.orbitElementsToTLE(orbitElement);
    // then 結果
    expect(tle.satelliteName).toBe("ISS (ZARYA)");
    expect(tle.tleLine1).toMatch("1 25544U 00000A   21275.59393519  .00000000  00000-0  12345-4 0  0003");
    expect(tle.tleLine2).toMatch("2 25544  51.6442 247.4627 0006703 130.5360 325.0288 15.55101413000004");
  });
});
