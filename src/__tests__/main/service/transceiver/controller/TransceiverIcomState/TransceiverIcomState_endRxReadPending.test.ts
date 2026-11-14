import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.endRxReadPending", () => {
  it("保留が解除されること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();

    state.endRxReadPending();

    expect(state.isRxReadPending).toBe(false);
  });

  it("保留中に予約されたRxの読み取りも取り消されること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();
    expect(state.isRecvRxFreqUpdate).toBe(true);

    state.endRxReadPending();

    expect(state.isRecvRxFreqUpdate).toBe(false);
  });

  it("保留中でない場合は、通常のトランシーブで立ったRx取得フラグを変更しないこと", () => {
    const state = new TransceiverIcomState();
    state.setRecvRxFreqHz(437800000);
    expect(state.isRecvRxFreqUpdate).toBe(true);

    state.endRxReadPending();

    expect(state.isRecvRxFreqUpdate).toBe(true);
  });
});
