import TransceiverUtil from "@/common/util/TransceiverUtil";

describe("TransceiverUtil.analizeAmateurBandRangeのテスト", () => {
  test("null_undefined系", () => {
    expect(TransceiverUtil.analizeAmateurBandRange(null!)).toBe("");
    expect(TransceiverUtil.analizeAmateurBandRange(undefined!)).toBe("");
  });

  test("144MHz帯", () => {
    expect(TransceiverUtil.analizeAmateurBandRange(143999999)).toBe("");
    expect(TransceiverUtil.analizeAmateurBandRange(144000000)).toBe("144");
    expect(TransceiverUtil.analizeAmateurBandRange(144000001)).toBe("144");

    expect(TransceiverUtil.analizeAmateurBandRange(145999999)).toBe("144");
    expect(TransceiverUtil.analizeAmateurBandRange(146000000)).toBe("144");
    expect(TransceiverUtil.analizeAmateurBandRange(146000001)).toBe("");
  });

  test("430MHz帯", () => {
    expect(TransceiverUtil.analizeAmateurBandRange(429999999)).toBe("");
    expect(TransceiverUtil.analizeAmateurBandRange(430000000)).toBe("430");
    expect(TransceiverUtil.analizeAmateurBandRange(430000001)).toBe("430");

    expect(TransceiverUtil.analizeAmateurBandRange(439999999)).toBe("430");
    expect(TransceiverUtil.analizeAmateurBandRange(440000000)).toBe("430");
    expect(TransceiverUtil.analizeAmateurBandRange(440000001)).toBe("");
  });

  test("1.2GHz帯", () => {
    expect(TransceiverUtil.analizeAmateurBandRange(1259999999)).toBe("");
    expect(TransceiverUtil.analizeAmateurBandRange(1260000000)).toBe("1200");
    expect(TransceiverUtil.analizeAmateurBandRange(1260000001)).toBe("1200");

    expect(TransceiverUtil.analizeAmateurBandRange(1299999999)).toBe("1200");
    expect(TransceiverUtil.analizeAmateurBandRange(1300000000)).toBe("1200");
    expect(TransceiverUtil.analizeAmateurBandRange(1300000001)).toBe("");
  });

  test("小さい、大きい", () => {
    expect(TransceiverUtil.analizeAmateurBandRange(-1)).toBe("");
    expect(TransceiverUtil.analizeAmateurBandRange(0)).toBe("");
    expect(TransceiverUtil.analizeAmateurBandRange(Number.MAX_SAFE_INTEGER)).toBe("");
  });
});
