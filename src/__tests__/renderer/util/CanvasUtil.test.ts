import CanvasUtil from "@/renderer/util/CanvasUtil";
import { createPinia, setActivePinia } from "pinia";

describe("[正常系]人工衛星マーカーの色コードを取得を取得できる", () => {
  it("インデックスに対応する色コードを返す", () => {
    // given
    const index = 3;
    // when
    const colorCode = CanvasUtil.getSatelliteColorCode(index);
    // then
    expect(colorCode).toBe("#FF0000");
  });

  it("インデックスが10以上でも循環して色コードを返す", () => {
    // given
    const index = 12;
    // when
    const colorCode = CanvasUtil.getSatelliteColorCode(index);
    // then
    expect(colorCode).toBe("#FFA500");
  });
});

describe("[正常系]角度を単位付き文字列に変換できる", () => {
  beforeEach(() => {
    // Piniaのモックをセットアップ
    setActivePinia(createPinia());
  });

  afterEach(() => {
    // 必要に応じてクリーンアップ
    setActivePinia(undefined);
  });

  it("角度を文字列にフォーマットできる", () => {
    // given
    const angle = 45.678;
    // when
    const formatted = CanvasUtil.formatAngle(angle);
    // then
    expect(formatted).toBe("45.7°");
  });

  it("undefinedを渡すと'―'を返す", () => {
    // when
    const formatted = CanvasUtil.formatAngle(undefined);
    // then
    expect(formatted).toBe("―");
  });
});

describe("[正常系]文字列がブランクの場合に'―'に変換できる", () => {
  beforeEach(() => {
    // Piniaのモックをセットアップ
    setActivePinia(createPinia());
  });

  afterEach(() => {
    // 必要に応じてクリーンアップ
    setActivePinia(undefined);
  });

  it("値が空でない場合その値を返す", () => {
    // given
    const value = "test";
    // when
    const formatted = CanvasUtil.formatNullValue(value);
    // then
    expect(formatted).toBe("test");
  });

  it("値がnullの場合'―'を返す", () => {
    // when
    const formatted = CanvasUtil.formatNullValue(null);
    // then
    expect(formatted).toBe("―");
  });

  it("値がundefinedの場合'―'を返す", () => {
    // when
    const formatted = CanvasUtil.formatNullValue(undefined);
    // then
    expect(formatted).toBe("―");
  });
});
