import useFrequencySelect from "@/renderer/components/molecules/FreqAdjustmentSelect/useFreqAdjustmentSelect";
import { ref } from "vue";

describe("useFrequencySelect", () => {
  function createSut(frequency: string) {
    const frequencyRef = ref(frequency);
    const controller = useFrequencySelect(frequencyRef);
    return { frequencyRef, controller };
  }

  it.each([
    ["プラス", "+800.000", [8, 0, 0], [0, 0, 0]],
    ["マイナス", "-700.000", [7, 0, 0], [0, 0, 0]],
  ])("(%s)符号付き周波数文字列をkHz/Hzの桁配列へ分割できる", (name, frequency, expectedkHz, expectedHz) => {
    // Arrange
    const { controller } = createSut(frequency);

    // Act

    // Assert
    expect(controller.kHzDigits.value).toEqual(expectedkHz);
    expect(controller.hzDigits.value).toEqual(expectedHz);
  });

  it.each([
    ["プラス", "+899.000", 2, "+900.000"],
    ["マイナス", "-899.000", 2, "-900.000"],
  ])("(%s)符号付き周波数文字列の指定桁を+1し、必要なら繰り上がる", (name, frequency, digit, expected) => {
    // Arrange
    const { controller } = createSut(frequency);

    // Act
    const newFrequency = controller.onClick(digit);

    // Assert
    expect(newFrequency).toBe(expected);
  });

  it.each([
    ["プラス", "+800.000", 3, "+800.100"],
    ["マイナス", "-800.000", 3, "-799.900"],
  ])("(%s)onWheelの上回転で指定桁を+1できる", (name, frequency, digit, expected) => {
    // Arrange
    const { controller } = createSut(frequency);

    // Act
    const newFrequency = controller.onWheel({ deltaY: -1 } as WheelEvent, digit);

    // Assert
    expect(newFrequency).toBe(expected);
  });

  it.each([
    ["プラス", "+800.000", 2, "+799.000"],
    ["マイナス", "-800.000", 2, "-801.000"],
  ])("(%s)onWheelの下回転で指定桁を-1し、必要なら繰り下がる", (name, frequency, digit, expected) => {
    // Arrange
    const { controller } = createSut(frequency);

    // Act
    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, digit);

    // Assert
    expect(newFrequency).toBe(expected);
  });

  it.each([
    ["プラス", "+000.100", 2],
    ["マイナス", "-000.100", 2],
  ])("(%s)onWheelの下回転で先頭ゼロ領域を変更しようとするとnullを返す", (name, frequency, digit) => {
    // Arrange
    const { controller } = createSut(frequency);

    // Act
    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, digit);

    // Assert
    expect(newFrequency).toBeNull();
  });

  it.each([
    ["プラス", "+000.001", 1, 8],
    ["マイナス", "-000.001", -1, 8],
  ])("(%s)onWheelで全桁0になる場合は0を返す", (name, frequency, wheelDirection, digit) => {
    // Arrange
    const { controller } = createSut(frequency);

    // Act
    const newFrequency = controller.onWheel({ deltaY: wheelDirection } as WheelEvent, digit);

    // Assert
    expect(newFrequency).toBe("+000.000");
  });

  it.each([
    ["+876.543", 1, "+800.000"],
    ["+876.543", 0, "+000.000"],
    ["+006.543", 1, "+000.000"],
    ["-876.543", 1, "-800.000"],
    ["-876.543", 0, "+000.000"],
    ["-006.543", 1, "+000.000"],
  ])("onRightClickで指定桁以降を0にできる", (frequency, digit, expected) => {
    // Arrange
    const { controller } = createSut(frequency);

    // Act
    const newFrequency = controller.onRightClick(digit);

    // Assert
    expect(newFrequency).toBe(expected);
  });

  it("isGrayedは先頭の非0桁より左側だけtrueを返す", () => {
    // Arrange
    const { controller } = createSut("000.120");

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
