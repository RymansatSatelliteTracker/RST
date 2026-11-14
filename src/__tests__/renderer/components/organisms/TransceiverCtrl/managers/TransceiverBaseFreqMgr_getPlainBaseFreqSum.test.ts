import TransceiverBaseFreqMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBaseFreqMgr.js";
import { describe, expect, it } from "vitest";

describe("TransceiverBaseFreqMgr.getPlainBaseFreqSum", () => {
  it("初期状態では基準周波数の和が0であること", () => {
    const mgr = new TransceiverBaseFreqMgr();

    expect(mgr.getPlainBaseFreqSum()).toBe(0);
  });
});
