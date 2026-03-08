import useFrequencySelect from "@/renderer/components/molecules/FreqAdjustmentSelect/useFreqAdjustmentSelect";
import { ref } from "vue";

describe("useFrequencySelect", () => {
  function createSut(frequency: string) {
    const frequencyRef = ref(frequency);
    const controller = useFrequencySelect(frequencyRef);
    return { frequencyRef, controller };
  }

  it("周波数文字列をMHz/kHz/Hzの桁配列へ分割できる", () => {
    // Arrange
    const { controller } = createSut("145.800.000");

    // Act

    // Assert
    expect(controller.mHzDigits.value).toEqual([1, 4, 5]);
    expect(controller.kHzDigits.value).toEqual([8, 0, 0]);
    expect(controller.hzDigits.value).toEqual([0, 0, 0]);
  });

  it("onClickで指定桁を+1し、必要なら繰り上がる", () => {
    // Arrange
    const { controller } = createSut("145.899.000");

    // Act
    const newFrequency = controller.onClick(5);

    // Assert
    expect(newFrequency).toBe("145.900.000");
  });

  it("onWheelの上回転で指定桁を+1できる", () => {
    // Arrange
    const { controller } = createSut("145.800.000");

    // Act
    const newFrequency = controller.onWheel({ deltaY: -1 } as WheelEvent, 5);

    // Assert
    expect(newFrequency).toBe("145.801.000");
  });

  it("onWheelの下回転で指定桁を-1し、必要なら繰り下がる", () => {
    // Arrange
    const { controller } = createSut("145.800.000");

    // Act
    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, 4);

    // Assert
    expect(newFrequency).toBe("145.790.000");
  });

  it("onWheelの下回転で先頭ゼロ領域を変更しようとするとnullを返す", () => {
    // Arrange
    const { controller } = createSut("000.100.000");

    // Act
    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, 2);

    // Assert
    expect(newFrequency).toBeNull();
  });

  it("onWheelの下回転で全桁0になる場合はnullを返す", () => {
    // Arrange
    const { controller } = createSut("000.000.001");

    // Act
    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, 8);

    // Assert
    expect(newFrequency).toBeNull();
  });

  it("onRightClickで指定桁以降を0にできる", () => {
    // Arrange
    const { controller } = createSut("145.876.543");

    // Act
    const newFrequency = controller.onRightClick(4);

    // Assert
    expect(newFrequency).toBe("145.800.000");
  });

  it("onRightClickで最大桁を指定した場合はnullを返す", () => {
    // Arrange
    const { controller } = createSut("145.876.543");

    // Act
    const newFrequency = controller.onRightClick(0);

    // Assert
    expect(newFrequency).toBeNull();
  });

  it("onRightClickで変更対象より上位桁が全て0の場合はnullを返す", () => {
    // Arrange
    const { controller } = createSut("000.120.340");

    // Act
    const newFrequency = controller.onRightClick(3);

    // Assert
    expect(newFrequency).toBeNull();
  });

  it("isGrayedは先頭の非0桁より左側だけtrueを返す", () => {
    // Arrange
    const { controller } = createSut("000.120.000");

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
