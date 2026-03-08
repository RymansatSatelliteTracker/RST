import useFrequencySelect from "@/renderer/components/molecules/FreqAdjustmentSelect/useFreqAdjustmentSelect";
import { ref } from "vue";

describe("useFrequencySelect", () => {
  function createSut(frequency: string) {
    const frequencyRef = ref(frequency);
    const controller = useFrequencySelect(frequencyRef);
    return { frequencyRef, controller };
  }

  it("周波数文字列をMHz/kHz/Hzの桁配列へ分割できる", () => {
    const { controller } = createSut("145.800.000");

    expect(controller.mHzDigits.value).toEqual([1, 4, 5]);
    expect(controller.kHzDigits.value).toEqual([8, 0, 0]);
    expect(controller.hzDigits.value).toEqual([0, 0, 0]);
  });

  it("onClickで指定桁を+1し、必要なら繰り上がる", () => {
    const { controller } = createSut("145.899.000");

    const newFrequency = controller.onClick(5);

    expect(newFrequency).toBe("145.900.000");
  });

  it("onWheelの上回転で指定桁を+1できる", () => {
    const { controller } = createSut("145.800.000");

    const newFrequency = controller.onWheel({ deltaY: -1 } as WheelEvent, 5);

    expect(newFrequency).toBe("145.801.000");
  });

  it("onWheelの下回転で指定桁を-1し、必要なら繰り下がる", () => {
    const { controller } = createSut("145.800.000");

    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, 4);

    expect(newFrequency).toBe("145.790.000");
  });

  it("onWheelの下回転で先頭ゼロ領域を変更しようとするとnullを返す", () => {
    const { controller } = createSut("000.100.000");

    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, 2);

    expect(newFrequency).toBeNull();
  });

  it("onWheelの下回転で全桁0になる場合はnullを返す", () => {
    const { controller } = createSut("000.000.001");

    const newFrequency = controller.onWheel({ deltaY: 1 } as WheelEvent, 8);

    expect(newFrequency).toBeNull();
  });

  it("onRightClickで指定桁以降を0にできる", () => {
    const { controller } = createSut("145.876.543");

    const newFrequency = controller.onRightClick(4);

    expect(newFrequency).toBe("145.800.000");
  });

  it("onRightClickで最大桁を指定した場合はnullを返す", () => {
    const { controller } = createSut("145.876.543");

    const newFrequency = controller.onRightClick(0);

    expect(newFrequency).toBeNull();
  });

  it("onRightClickで変更対象より上位桁が全て0の場合はnullを返す", () => {
    const { controller } = createSut("000.120.340");

    const newFrequency = controller.onRightClick(3);

    expect(newFrequency).toBeNull();
  });

  it("isGrayedは先頭の非0桁より左側だけtrueを返す", () => {
    const { controller } = createSut("000.120.000");

    expect(controller.isGrayed(0)).toBe(true);
    expect(controller.isGrayed(2)).toBe(true);
    expect(controller.isGrayed(3)).toBe(false);
  });
});
