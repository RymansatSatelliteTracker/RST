import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.setReqRxFreqHz", () => {
  it("現在保持している値と異なる場合、更新フラグを立てること", () => {
    const state = new TransceiverIcomState();

    state.setReqRxFreqHz(480000000);

    expect(state.getReqRxFreqHz()).toBe(480000000);
    expect(state.isReqRxFreqUpdate).toBe(true);
  });

  it("現在保持している値と同一の場合、更新フラグを立てないこと（不要なバンド切り替えの抑止）", () => {
    const state = new TransceiverIcomState();
    state.setReqRxFreqHz(480000000);
    state.isReqRxFreqUpdate = false;

    state.setReqRxFreqHz(480000000);

    expect(state.isReqRxFreqUpdate).toBe(false);
  });

  it("isForceにtrueを指定した場合、値が同一でも更新フラグを立てること（固定側周波数の無線機への再送信用）", () => {
    const state = new TransceiverIcomState();
    state.setReqRxFreqHz(480000000);
    state.isReqRxFreqUpdate = false;

    state.setReqRxFreqHz(480000000, true);

    expect(state.getReqRxFreqHz()).toBe(480000000);
    expect(state.isReqRxFreqUpdate).toBe(true);
  });
});
