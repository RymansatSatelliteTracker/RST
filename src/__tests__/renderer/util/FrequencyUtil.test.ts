import { FrequencyUtil } from "@/renderer/util/FrequencyUtil";

describe("FrequencyUtil", () => {
  describe("parseSignedFrequency", () => {
    it.each([
      [
        "正符号",
        "+243.000.000",
        1,
        [
          [2, 4, 3],
          [0, 0, 0],
          [0, 0, 0],
        ],
      ],
      [
        "負符号",
        "-145.800.000",
        -1,
        [
          [1, 4, 5],
          [8, 0, 0],
          [0, 0, 0],
        ],
      ],
      [
        "符号省略",
        "145.800.000",
        1,
        [
          [1, 4, 5],
          [8, 0, 0],
          [0, 0, 0],
        ],
      ],
    ])("(%s)符号と周波数digit配列に分割できる", (_caseName, input, expectedSign, expectedDigits) => {
      // Arrange

      // Act
      const [sign, digits] = FrequencyUtil.parseSignedFrequency(input);

      // Assert
      expect(sign).toBe(expectedSign);
      expect(digits).toEqual(expectedDigits);
    });
  });

  describe("parseFrequency", () => {
    it("周波数文字列をMHz/kHz/Hzのdigit配列に変換できる", () => {
      // Arrange
      const input = "243.001.090";

      // Act
      const digits = FrequencyUtil.parseFrequency(input);

      // Assert
      expect(digits).toEqual([
        [2, 4, 3],
        [0, 0, 1],
        [0, 9, 0],
      ]);
    });

    it("数値以外の文字を含む場合は0として扱う", () => {
      // Arrange
      const input = "24a.0b1.0-0";

      // Act
      const digits = FrequencyUtil.parseFrequency(input);

      // Assert
      expect(digits).toEqual([
        [2, 4, 0],
        [0, 0, 1],
        [0, 0, 0],
      ]);
    });
  });

  describe("formatSignedFrequency", () => {
    it.each([
      { caseName: "正符号", digits: [2, 4, 3, 0, 0, 0], sign: 1 as const, expected: "+243.000" },
      { caseName: "負符号", digits: [1, 4, 5, 8, 0, 0], sign: -1 as const, expected: "-145.800" },
    ])("$caseName: 符号付き周波数文字列を生成できる", ({ digits, sign, expected }) => {
      // Arrange

      // Act
      const formatted = FrequencyUtil.formatSignedFrequency(digits, sign);

      // Assert
      expect(formatted).toBe(expected);
    });
  });

  describe("formatFrequency", () => {
    it.each([
      [[2, 4, 3], "243"],
      [[2, 4, 3, 0, 0, 0], "243.000"],
      [[1, 4, 5, 8, 0, 0, 0, 0, 0], "145.800.000"],
    ])("digit配列を周波数文字列へ変換できる", (digits, expected) => {
      // Arrange

      // Act
      const formatted = FrequencyUtil.formatFrequency(digits);

      // Assert
      expect(formatted).toBe(expected);
    });

    it("digit数が3の倍数でない場合は例外を投げる", () => {
      // Arrange
      const digits = [1, 2, 3, 4];

      // Act
      const action = () => FrequencyUtil.formatFrequency(digits);

      // Assert
      expect(action).toThrow("digits length must be a multiple of 3");
    });
  });

  describe("isCarryable", () => {
    it.each([
      { caseName: "指定桁が9未満", digits: [2, 4, 3, 0, 0, 0], index: 2, expected: true },
      { caseName: "9が連続しても上位桁で繰り上がれる", digits: [2, 9, 9], index: 2, expected: true },
      { caseName: "全桁9で最上位まで繰り上がる", digits: [9, 9, 9], index: 2, expected: false },
      { caseName: "最上位桁が9", digits: [9, 0, 0], index: 0, expected: false },
    ])("$caseName のとき繰り上がり可否を判定できる", ({ digits, index, expected }) => {
      // Arrange

      // Act
      const carryable = FrequencyUtil.isCarryable(digits, index);

      // Assert
      expect(carryable).toBe(expected);
    });

    it("indexが負数の場合は例外を投げる", () => {
      // Arrange
      const digits = [2, 4, 3];

      // Act
      const action = () => FrequencyUtil.isCarryable(digits, -1);

      // Assert
      expect(action).toThrow("Index must be non-negative");
    });

    it.each([
      { caseName: "NaN", index: Number.NaN },
      { caseName: "Infinity", index: Number.POSITIVE_INFINITY },
      { caseName: "小数", index: 1.5 },
    ])("indexが$caseNameの場合は例外を投げる", ({ index }) => {
      // Arrange
      const digits = [2, 4, 3];

      // Act
      const action = () => FrequencyUtil.isCarryable(digits, index);

      // Assert
      expect(action).toThrow("Index must be a finite integer");
    });

    it("indexが配列範囲外の場合は例外を投げる", () => {
      // Arrange
      const digits = [2, 4, 3];

      // Act
      const action = () => FrequencyUtil.isCarryable(digits, 3);

      // Assert
      expect(action).toThrow("Index must be within digits range");
    });

    it("digitsが空配列の場合は例外を投げる", () => {
      // Arrange
      const digits: number[] = [];

      // Act
      const action = () => FrequencyUtil.isCarryable(digits, 0);

      // Assert
      expect(action).toThrow("Index must be within digits range");
    });
  });
});
