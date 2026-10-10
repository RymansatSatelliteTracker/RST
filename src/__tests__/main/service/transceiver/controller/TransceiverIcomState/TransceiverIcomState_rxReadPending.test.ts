import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.startRxReadPending / endRxReadPending", () => {
  it("startRxReadPendingで保留フラグが立ち、保留中の周波数要求と要求値が初期化されること", () => {
    const state = new TransceiverIcomState();
    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);

    state.startRxReadPending();

    expect(state.isRxReadPending).toBe(true);
    expect(state.isReqRxFreqUpdate).toBe(false);
    expect(state.isReqTxFreqUpdate).toBe(false);
    expect(state.getReqRxFreqHz()).toBe(0);
    expect(state.getReqTxFreqHz()).toBe(0);
  });

  it("startRxReadPending後に同じ値で再要求した場合も、重複判定でスキップされず更新フラグが立つこと", () => {
    const state = new TransceiverIcomState();
    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);
    state.startRxReadPending();

    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);

    expect(state.isReqRxFreqUpdate).toBe(true);
    expect(state.isReqTxFreqUpdate).toBe(true);
  });

  it("startRxReadPendingは、無線機から取得済みの周波数の更新フラグを変更しないこと（読み取り対象を維持する）", () => {
    const state = new TransceiverIcomState();
    state.setRecvTxFreqHz(145992640);
    expect(state.isRecvRxFreqUpdate).toBe(true);

    state.startRxReadPending();

    expect(state.isRecvRxFreqUpdate).toBe(true);
    expect(state.isRecvTxFreqUpdate).toBe(true);
  });

  it("endRxReadPendingで保留が解除されること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();

    state.endRxReadPending();

    expect(state.isRxReadPending).toBe(false);
  });

  it("resetAllで保留が解除されること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();

    state.resetAll();

    expect(state.isRxReadPending).toBe(false);
  });
});
