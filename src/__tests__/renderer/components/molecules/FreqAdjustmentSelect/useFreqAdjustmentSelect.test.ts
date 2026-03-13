import useFrequencySelect from "@/renderer/components/molecules/FreqAdjustmentSelect/useFreqAdjustmentSelect";
import { ref } from "vue";

describe("useFrequencySelect", () => {
  function createSut(frequency: string) {
    const frequencyRef = ref(frequency);
    const controller = useFrequencySelect(frequencyRef);
    return { frequencyRef, controller };
  }

  describe("digit split", () => {
    it.each([
      { frequency: "+800.000", expectedKHz: [8, 0, 0], expectedHz: [0, 0, 0] },
      { frequency: "-700.000", expectedKHz: [7, 0, 0], expectedHz: [0, 0, 0] },
    ])("符号付き周波数文字列をkHz/Hzの桁配列へ分割できる: $frequency", ({ frequency, expectedKHz, expectedHz }) => {
      // Arrange
      const { controller } = createSut(frequency);

      // Act

      // Assert
      expect(controller.kHzDigits.value).toEqual(expectedKHz);
      expect(controller.hzDigits.value).toEqual(expectedHz);
    });
  });

  describe("onClick", () => {
    it.each([
      { frequency: "+899.000", digit: 2, expected: "+900.000" },
      { frequency: "-899.000", digit: 2, expected: "-900.000" },
    ])("指定桁を+1し、必要なら繰り上がる: $frequency / digit=$digit", ({ frequency, digit, expected }) => {
      // Arrange
      const { controller } = createSut(frequency);

      // Act
      const newFrequency = controller.onClick(digit);

      // Assert
      expect(newFrequency).toBe(expected);
    });
  });

  describe("onWheel", () => {
    it.each([
      { frequency: "+800.000", digit: 3, expected: "+800.100" },
      { frequency: "-800.000", digit: 3, expected: "-799.900" },
    ])("上回転(deltaY<0)で値をプラス方向へ変化させる: $frequency / digit=$digit", ({ frequency, digit, expected }) => {
      // Arrange
      const { controller } = createSut(frequency);

      // Act
      const newFrequency = controller.onWheel({ deltaY: -1 } as WheelEvent, digit);

      // Assert
      expect(newFrequency).toBe(expected);
    });

    it.each([
      { frequency: "+800.000", digit: 2, expected: "+799.000" },
      { frequency: "-800.000", digit: 2, expected: "-801.000" },
    ])(
      "下回転(deltaY>0)で値をマイナス方向へ変化させる: $frequency / digit=$digit",
      ({ frequency, digit, expected }) => {
        // Arrange
        const { controller } = createSut(frequency);

        // Act
        const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, digit);

        // Assert
        expect(newFrequency).toBe(expected);
      }
    );

    it("0跨ぎ時は正規化された+000.000を返す", () => {
      // Arrange
      const { controller } = createSut("-000.001");

      // Act
      const newFrequency = controller.onWheel({ deltaY: -1 } as WheelEvent, 5);

      // Assert
      expect(newFrequency).toBe("+000.000");
    });

    it("ゼロから下回転すると負方向へ進む", () => {
      // Arrange
      const { controller } = createSut("+000.000");

      // Act
      const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, 5);

      // Assert
      expect(newFrequency).toBe("-000.001");
    });

    it.each([
      {
        frequency: "+001.000",
        digit: 1,
        event: { deltaY: 1 } as WheelEvent,
        expected: "-011.000",
      },
      {
        frequency: "-001.000",
        digit: 1,
        event: { deltaY: -1 } as WheelEvent,
        expected: "+011.000",
      },
    ])(
      "ゼロ跨ぎ時は桁編集を優先し、操作桁を1に立てて符号を反転する: $frequency / digit=$digit",
      ({ frequency, digit, event, expected }) => {
        // Arrange
        const { controller } = createSut(frequency);

        // Act
        const newFrequency = controller.onWheel(event, digit);

        // Assert
        expect(newFrequency).toBe(expected);
      }
    );
  });

  describe("onRightClick", () => {
    it.each([
      { frequency: "+876.543", digit: 1, expected: "+800.000" },
      { frequency: "+876.543", digit: 0, expected: "+000.000" },
      { frequency: "+006.543", digit: 1, expected: "+000.000" },
      { frequency: "-876.543", digit: 1, expected: "-800.000" },
      { frequency: "-876.543", digit: 0, expected: "+000.000" },
      { frequency: "-006.543", digit: 1, expected: "+000.000" },
    ])("任意桁の右クリックで指定桁以降を0化する: $frequency / digit=$digit", ({ frequency, digit, expected }) => {
      // Arrange
      const { controller } = createSut(frequency);

      // Act
      const newFrequency = controller.onRightClick(digit);

      // Assert
      expect(newFrequency).toBe(expected);
    });
  });

  describe("isGrayed", () => {
    it.each(["+000.120", "-000.120"])("先頭の非0桁より左側だけtrueを返す: %s", (frequency) => {
      // Arrange
      const { controller } = createSut(frequency);

      // Act
      const isGrayedAt0 = controller.isGrayed(0);
      const isGrayedAt2 = controller.isGrayed(2);
      const isGrayedAt3 = controller.isGrayed(3);

      // Assert
      expect(isGrayedAt0).toBe(true);
      expect(isGrayedAt2).toBe(true);
      expect(isGrayedAt3).toBe(false);
    });
  });
});
